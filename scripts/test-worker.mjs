// Behavioural tests for worker/index.ts against a mocked GitHub Pages origin.
//
//   npx wrangler deploy --dry-run --outdir .wrangler-test
//   node scripts/test-worker.mjs [path/to/bundled/index.js]
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const bundle = resolve(process.argv[2] ?? ".wrangler-test/index.js");
const worker = (await import(pathToFileURL(bundle).href)).default;
const ORIGIN = "https://mahankenway.github.io/PlayChive";

let calls = [];
let upstream = () => new Response("ok");
globalThis.fetch = async (target, init = {}) => {
  calls.push({ target: String(target), init });
  return upstream(String(target), init);
};

const run = (url, init) => worker.fetch(new Request(url, init));
let passed = 0;
async function test(name, fn) {
  calls = [];
  upstream = () => new Response("ok");
  try {
    await fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}\n       ${e.message}`);
    process.exitCode = 1;
  }
}

await test("serves the home page from the Pages path, with hardening headers", async () => {
  upstream = () => new Response("<h1>hi</h1>", { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
  const r = await run("https://playchive.ir/");
  assert.equal(r.status, 200);
  assert.equal(await r.text(), "<h1>hi</h1>");
  assert.equal(calls[0].target, `${ORIGIN}/`);
  assert.equal(r.headers.get("content-type"), "text/html; charset=utf-8");
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  assert.equal(r.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.equal(r.headers.get("x-robots-tag"), null, "real domain must stay indexable");
});

await test("keeps path and query string", async () => {
  await run("https://playchive.ir/assets/a.png?v=3");
  assert.equal(calls[0].target, `${ORIGIN}/assets/a.png?v=3`);
});

await test("301: www -> apex, keeps path and query", async () => {
  const r = await run("https://www.playchive.ir/cdogs.html?x=1");
  assert.equal(r.status, 301);
  assert.equal(r.headers.get("location"), "https://playchive.ir/cdogs.html?x=1");
  assert.equal(calls.length, 0, "must not hit the origin");
});

await test("301: http -> https", async () => {
  const r = await run("http://playchive.ir/fa/");
  assert.equal(r.status, 301);
  assert.equal(r.headers.get("location"), "https://playchive.ir/fa/");
});

await test("301: www + http combined goes straight to https apex", async () => {
  const r = await run("http://www.playchive.ir/");
  assert.equal(r.status, 301);
  assert.equal(r.headers.get("location"), "https://playchive.ir/");
});

await test("301: /index.html and /dir/index.html -> clean URLs", async () => {
  let r = await run("https://playchive.ir/index.html");
  assert.equal(r.status, 301);
  assert.equal(r.headers.get("location"), "https://playchive.ir/");
  r = await run("https://playchive.ir/fa/index.html?a=b");
  assert.equal(r.headers.get("location"), "https://playchive.ir/fa/?a=b");
});

await test("workers.dev host is noindex", async () => {
  const r = await run("https://playchive.example.workers.dev/");
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("x-robots-tag"), "noindex, nofollow");
});

await test("Pages directory redirect is rewritten to the public host", async () => {
  upstream = () => new Response(null, { status: 301, headers: { location: `${ORIGIN}/fa/` } });
  const r = await run("https://playchive.ir/fa");
  assert.equal(r.status, 301);
  assert.equal(r.headers.get("location"), "https://playchive.ir/fa/");
});

await test("Pages custom-domain redirect to this host is followed internally (no loop)", async () => {
  upstream = (target) =>
    target === `${ORIGIN}/fa`
      ? new Response(null, { status: 301, headers: { location: "https://playchive.ir/fa/" } })
      : new Response("fa page", { status: 200 });
  const r = await run("https://playchive.ir/fa");
  assert.equal(r.status, 200);
  assert.equal(await r.text(), "fa page");
  assert.deepEqual(calls.map((c) => c.target), [`${ORIGIN}/fa`, `${ORIGIN}/fa/`]);
});

await test("a real redirect loop ends in a clear 502 instead of looping the browser", async () => {
  upstream = () => new Response(null, { status: 301, headers: { location: "https://playchive.ir/" } });
  const r = await run("https://playchive.ir/");
  assert.equal(r.status, 502);
  assert.match(await r.text(), /custom domain/i);
  assert.ok(calls.length <= 5);
});

await test("redirect to a foreign host is passed through", async () => {
  upstream = () => new Response(null, { status: 302, headers: { location: "https://example.org/x" } });
  const r = await run("https://playchive.ir/out");
  assert.equal(r.status, 302);
  assert.equal(r.headers.get("location"), "https://example.org/x");
});

await test("404 from Pages stays a 404 with its body", async () => {
  upstream = () => new Response("There isn't a GitHub Pages site here.", { status: 404 });
  const r = await run("https://playchive.ir/nope");
  assert.equal(r.status, 404);
  assert.match(await r.text(), /GitHub Pages/);
});

await test("cache policy: only successful responses are cached, errors are not", async () => {
  await run("https://playchive.ir/");
  const ttl = calls[0].init.cf?.cacheTtlByStatus;
  assert.ok(ttl, "cacheTtlByStatus must be set");
  assert.equal(ttl["200-299"], 300);
  assert.equal(ttl["400-599"], 0);
  assert.equal(calls[0].init.redirect, "manual");
});

await test("forwards Range and conditional headers only", async () => {
  await run("https://playchive.ir/assets/big.wad", {
    headers: { range: "bytes=0-99", cookie: "secret=1", "if-none-match": '"abc"', "x-evil": "1" },
  });
  const h = new Headers(calls[0].init.headers);
  assert.equal(h.get("range"), "bytes=0-99");
  assert.equal(h.get("if-none-match"), '"abc"');
  assert.equal(h.get("cookie"), null);
  assert.equal(h.get("x-evil"), null);
});

await test("passes 206 partial content through", async () => {
  upstream = () => new Response("abc", { status: 206, headers: { "content-range": "bytes 0-2/10" } });
  const r = await run("https://playchive.ir/assets/big.wad", { headers: { range: "bytes=0-2" } });
  assert.equal(r.status, 206);
  assert.equal(r.headers.get("content-range"), "bytes 0-2/10");
});

await test("HEAD is allowed", async () => {
  const r = await run("https://playchive.ir/", { method: "HEAD" });
  assert.equal(r.status, 200);
  assert.equal(calls[0].init.method, "HEAD");
});

await test("POST is rejected with 405 and Allow header", async () => {
  const r = await run("https://playchive.ir/", { method: "POST", body: "x" });
  assert.equal(r.status, 405);
  assert.equal(r.headers.get("allow"), "GET, HEAD");
  assert.equal(calls.length, 0);
});

await test("origin failure becomes 502", async () => {
  upstream = () => {
    throw new Error("boom");
  };
  const origError = console.error;
  console.error = () => {};
  const r = await run("https://playchive.ir/");
  console.error = origError;
  assert.equal(r.status, 502);
});

console.log(`\n${passed} passed${process.exitCode ? ", some FAILED" : ""}`);
