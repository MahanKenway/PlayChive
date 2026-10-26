// worker/index.ts
// Edge proxy for PLAYCHIVE. The static site (including all WebAssembly game
// runtimes) is built by GitHub Actions and published to GitHub Pages. This
// Worker serves that build from Cloudflare so it can be used with a custom
// domain, without needing Emscripten inside Cloudflare's build environment.

const ORIGIN = "https://mahankenway.github.io";
const BASE_PATH = "/PlayChive"; // GitHub Pages project path

// Request headers that are safe and useful to forward upstream.
const FORWARDED_HEADERS = ["accept", "accept-encoding", "range", "if-none-match", "if-modified-since"];

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }

    const url = new URL(request.url);
    const target = `${ORIGIN}${BASE_PATH}${url.pathname}${url.search}`;

    const upstreamHeaders = new Headers();
    for (const name of FORWARDED_HEADERS) {
      const value = request.headers.get(name);
      if (value) upstreamHeaders.set(name, value);
    }

    try {
      const upstream = await fetch(target, {
        method: request.method,
        headers: upstreamHeaders,
        redirect: "manual", // rewrite redirects ourselves so they stay on this domain
        cf: { cacheEverything: true, cacheTtl: 300 },
      });

      const headers = new Headers(upstream.headers);

      // Keep redirects (e.g. /dir -> /dir/) on the public hostname.
      const location = headers.get("location");
      if (location) {
        const absolute = new URL(location, target).toString();
        const prefix = `${ORIGIN}${BASE_PATH}`;
        if (absolute.startsWith(prefix)) {
          headers.set("location", url.origin + absolute.slice(prefix.length));
        }
      }

      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers,
      });
    } catch (error) {
      console.error("Upstream fetch failed:", error);
      return new Response("Bad Gateway", { status: 502 });
    }
  },
} satisfies ExportedHandler;
