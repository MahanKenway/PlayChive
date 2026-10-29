// worker/index.ts
// Edge proxy for PLAYCHIVE. The static site (including all WebAssembly game
// runtimes) is built by GitHub Actions and published to GitHub Pages. This
// Worker serves that build from Cloudflare so it can be used with a custom
// domain, without needing Emscripten inside Cloudflare's build environment.
//
// NOTE: this file is the source of truth. Cloudflare's Git integration redeploys
// it on every push to main, so edits made only in the dashboard are overwritten.

import { handleMcp, handleCard, CARD_PATHS } from "./mcp";

const ORIGIN = "https://mahankenway.github.io";
const BASE_PATH = "/PlayChive"; // GitHub Pages project path
const MAX_HOPS = 5;

// Agent Skills Discovery: GitHub Pages drops dot-directories, so the files live in /agent-skills/
// and this Worker serves them under the conventional /.well-known/agent-skills/ path.
const SKILLS_WELL_KNOWN = "/.well-known/agent-skills/";
const SKILLS_FILES = "/agent-skills/";

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

// Browser hardening for HTML documents. The CSP is deliberately practical: the games need inline
// bootstrap scripts, WebAssembly, blobs and workers, and the hub embeds third-party game hosts.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob:",
  "connect-src 'self' data: blob: https:",
  "worker-src 'self' blob:",
  "frame-src 'self' https:",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");
const PERMISSIONS_POLICY = "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()";

// Small, safe hardening headers added to every response.
function finalize(upstreamHeaders: Headers, host: string, path = ""): Headers {
  const headers = new Headers(upstreamHeaders);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if ((headers.get("Content-Type") ?? "").toLowerCase().startsWith("text/html")) {
    headers.set("Content-Security-Policy", CSP);
    headers.set("X-Frame-Options", "SAMEORIGIN");
    headers.set("Permissions-Policy", PERMISSIONS_POLICY);
  }
  if (isWorkersDev(host)) headers.set("X-Robots-Tag", "noindex, nofollow");
  if (path === "/") headers.append("Link", '</.well-known/api-catalog>; rel="api-catalog"');
  return headers;
}

// Request headers that are safe and useful to forward upstream.
const FORWARDED_HEADERS = ["accept", "accept-encoding", "range", "if-none-match", "if-modified-since"];

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // One canonical host: send www.* and plain http to https on the apex domain
    // so search engines see a single version of every URL.
    if (url.hostname.startsWith("www.") || (url.protocol === "http:" && !isLocal(url.hostname))) {
      const canonical = new URL(request.url);
      canonical.protocol = "https:";
      canonical.hostname = url.hostname.replace(/^www\./, "");
      // 308 keeps the method and body for POST (MCP clients); 301 stays for pages.
      return Response.redirect(canonical.toString(), request.method === "GET" || request.method === "HEAD" ? 301 : 308);
    }

    // Read-only MCP server (JSON-RPC over POST) and its discovery card.
    if (url.pathname === "/mcp") return handleMcp(request);
    if (CARD_PATHS.includes(url.pathname) && (request.method === "GET" || request.method === "HEAD")) {
      return handleCard(request, url.pathname);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
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

    const isSkills = url.pathname.startsWith(SKILLS_WELL_KNOWN);
    const upstreamPath = isSkills ? SKILLS_FILES + url.pathname.slice(SKILLS_WELL_KNOWN.length) : url.pathname;
    let target = `${ORIGIN}${BASE_PATH}${upstreamPath}${url.search}`;

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
          const headers = finalize(upstream.headers, url.hostname, url.pathname);
          if (isSkills) {
            // Correct media type for SKILL.md and open CORS so browser-based agents can read skills.
            if (upstream.status === 200 && url.pathname.endsWith(".md")) {
              headers.set("Content-Type", "text/markdown; charset=utf-8");
            }
            headers.set("Access-Control-Allow-Origin", "*");
          }
          return new Response(upstream.body, {
            status: upstream.status,
            statusText: upstream.statusText,
            headers,
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
