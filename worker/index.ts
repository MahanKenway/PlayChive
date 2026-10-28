// worker/index.ts
// Edge proxy for PLAYCHIVE. The static site (including all WebAssembly game
// runtimes) is built by GitHub Actions and published to GitHub Pages. This
// Worker serves that build from Cloudflare so it can be used with a custom
// domain, without needing Emscripten inside Cloudflare's build environment.
//
// NOTE: this file is the source of truth. Cloudflare's Git integration redeploys
// it on every push to main, so edits made only in the dashboard are overwritten.

const ORIGIN = "https://mahankenway.github.io";
const BASE_PATH = "/PlayChive"; // GitHub Pages project path
const MAX_HOPS = 5;

// Never let the *.workers.dev address compete with the real domain in search results.
const isWorkersDev = (host: string) => host.endsWith(".workers.dev");
const isLocal = (host: string) => host === "localhost" || host === "127.0.0.1";


// RFC 9727 API catalog. Served by the Worker because GitHub Pages artifacts drop dot-directories.
// PLAYCHIVE has no dynamic API; the entries are its static read-only JSON endpoints.
const API_DESC = { href: "https://playchive.ir/openapi.json", type: "application/vnd.oai.openapi+json" };
const API_DOC = { href: "https://playchive.ir/agent/", type: "text/html" };
const API_CATALOG = {
  linkset: [
    "https://playchive.ir/data/games.json",
    "https://playchive.ir/agent/catalog.json",
    "https://playchive.ir/agent-manifest.json",
  ].map((anchor) => ({ anchor, "service-desc": [API_DESC], "service-doc": [API_DOC] })),
};

// Small, safe hardening headers added to every response.
function finalize(upstreamHeaders: Headers, host: string, path = ""): Headers {
  const headers = new Headers(upstreamHeaders);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (isWorkersDev(host)) headers.set("X-Robots-Tag", "noindex, nofollow");
  if (path === "/") headers.append("Link", '</.well-known/api-catalog>; rel="api-catalog"');
  return headers;
}

// Request headers that are safe and useful to forward upstream.
const FORWARDED_HEADERS = ["accept", "accept-encoding", "range", "if-none-match", "if-modified-since"];

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }

    const url = new URL(request.url);

    // One canonical host: send www.* and plain http to https on the apex domain
    // so search engines see a single version of every URL.
    if (url.hostname.startsWith("www.") || (url.protocol === "http:" && !isLocal(url.hostname))) {
      const canonical = new URL(request.url);
      canonical.protocol = "https:";
      canonical.hostname = url.hostname.replace(/^www\./, "");
      return Response.redirect(canonical.toString(), 301);
    }

    if (url.pathname === "/.well-known/api-catalog") {
      return new Response(request.method === "HEAD" ? null : JSON.stringify(API_CATALOG, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/linkset+json",
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // /index.html and /dir/index.html duplicate / and /dir/: redirect to the clean URL.
    if (url.pathname.endsWith("/index.html")) {
      const clean = new URL(request.url);
      clean.pathname = url.pathname.slice(0, -"index.html".length);
      return Response.redirect(clean.toString(), 301);
    }

    const upstreamHeaders = new Headers();
    for (const name of FORWARDED_HEADERS) {
      const value = request.headers.get(name);
      if (value) upstreamHeaders.set(name, value);
    }

    let target = `${ORIGIN}${BASE_PATH}${url.pathname}${url.search}`;

    try {
      for (let hop = 0; hop < MAX_HOPS; hop++) {
        const upstream = await fetch(target, {
          method: request.method,
          headers: upstreamHeaders,
          redirect: "manual", // handle redirects ourselves so they stay on this domain
          // Cache successful responses briefly; never cache errors or 404s.
          cf: { cacheTtlByStatus: { "200-299": 300, "300-399": 0, "400-599": 0 } },
        });

        const location = upstream.headers.get("location");
        if (upstream.status < 300 || upstream.status >= 400 || !location) {
          return new Response(upstream.body, {
            status: upstream.status,
            statusText: upstream.statusText,
            headers: finalize(upstream.headers, url.hostname, url.pathname),
          });
        }

        const next = new URL(location, target);
        const prefix = `${ORIGIN}${BASE_PATH}`;

        // Normal Pages redirect (e.g. /dir -> /dir/): send it to the public hostname.
        if (next.toString().startsWith(prefix)) {
          const headers = finalize(upstream.headers, url.hostname);
          headers.set("location", url.origin + next.toString().slice(prefix.length));
          return new Response(null, { status: upstream.status, headers });
        }

        // GitHub Pages redirects to its configured custom domain. If that is this
        // very hostname, follow the path internally instead of looping the browser.
        if (next.host === url.host) {
          const nextTarget = `${ORIGIN}${BASE_PATH}${next.pathname}${next.search}`;
          if (nextTarget === target) break; // would loop forever
          target = nextTarget;
          continue;
        }

        // Redirect to some other host: pass it through unchanged.
        return new Response(null, { status: upstream.status, headers: { location: next.toString() } });
      }

      return new Response(
        "Redirect loop: GitHub Pages is redirecting to this domain. " +
          "Remove the custom domain in the GitHub repository's Settings > Pages.",
        { status: 502 },
      );
    } catch (error) {
      console.error("Upstream fetch failed:", error);
      return new Response("Bad Gateway", { status: 502 });
    }
  },
} satisfies ExportedHandler;
