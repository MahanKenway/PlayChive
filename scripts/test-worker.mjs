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

await test("API catalog (RFC 9727): 200, linkset+json, valid entries, served without hitting the origin", async () => {
  const r = await run("https://playchive.ir/.well-known/api-catalog");
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "application/linkset+json");
  assert.equal(calls.length, 0, "must be answered by the Worker itself");
  const body = await r.json();
  assert.ok(Array.isArray(body.linkset) && body.linkset.length >= 1);
  for (const e of body.linkset) {
    assert.match(e.anchor, /^https:\/\/playchive\.ir\//);
    assert.match(e["service-desc"][0].href, /^https:\/\/playchive\.ir\/openapi\.json$/);
    assert.equal(e["service-desc"][0].type, "application/vnd.oai.openapi+json");
    assert.match(e["service-doc"][0].href, /^https:\/\/playchive\.ir\//);
  }
  assert.equal(new Set(body.linkset.map((e) => e.anchor)).size, body.linkset.length, "anchors must be unique");
});

await test("API catalog: HEAD returns headers with an empty body, CORS is open", async () => {
  const r = await run("https://playchive.ir/.well-known/api-catalog", { method: "HEAD" });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "application/linkset+json");
  assert.equal(r.headers.get("access-control-allow-origin"), "*");
  assert.equal(await r.text(), "");
});

await test("API catalog: www and http still redirect first", async () => {
  const r = await run("http://www.playchive.ir/.well-known/api-catalog");
  assert.equal(r.status, 301);
  assert.equal(r.headers.get("location"), "https://playchive.ir/.well-known/api-catalog");
});

await test("home page advertises the catalog with a Link header; other pages do not", async () => {
  let r = await run("https://playchive.ir/");
  assert.match(r.headers.get("link") ?? "", /<\/\.well-known\/api-catalog>; rel="api-catalog"/);
  r = await run("https://playchive.ir/cdogs.html");
  assert.equal(r.headers.get("link"), null);
});

await test("agent skills: well-known path maps to /agent-skills/, SKILL.md gets text/markdown, CORS open", async () => {
  upstream = () => new Response("---\nname: x\n---\n", { status: 200, headers: { "content-type": "application/octet-stream" } });
  const r = await run("https://playchive.ir/.well-known/agent-skills/browse-playchive-catalog/SKILL.md");
  assert.equal(calls[0].target, `${ORIGIN}/agent-skills/browse-playchive-catalog/SKILL.md`);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "text/markdown; charset=utf-8");
  assert.equal(r.headers.get("access-control-allow-origin"), "*");
});

await test("agent skills: index.json keeps its JSON type and a missing skill stays 404", async () => {
  upstream = () => new Response("{}", { status: 200, headers: { "content-type": "application/json; charset=utf-8" } });
  let r = await run("https://playchive.ir/.well-known/agent-skills/index.json");
  assert.equal(calls[0].target, `${ORIGIN}/agent-skills/index.json`);
  assert.equal(r.headers.get("content-type"), "application/json; charset=utf-8");
  upstream = () => new Response("nope", { status: 404, headers: { "content-type": "text/html" } });
  r = await run("https://playchive.ir/.well-known/agent-skills/missing/SKILL.md");
  assert.equal(r.status, 404);
  assert.notEqual(r.headers.get("content-type"), "text/markdown; charset=utf-8", "404 must not be relabelled");
});

await test("agent skills: path traversal cannot escape /agent-skills/", async () => {
  await run("https://playchive.ir/.well-known/agent-skills/../../data/games.json");
  assert.ok(!calls[0].target.includes("/agent-skills/../"), calls[0].target);
});

const rpc = (body, headers = {}, url = "https://playchive.ir/mcp") =>
  run(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
const call = async (method, params = {}, headers) => (await rpc({ jsonrpc: "2.0", id: 1, method, params }, headers)).json();

await test("MCP: server/discover advertises versions, capabilities and identity, no origin hit", async () => {
  const r = await rpc({ jsonrpc: "2.0", id: 1, method: "server/discover" });
  assert.equal(r.status, 200);
  assert.equal(calls.length, 0);
  const j = await r.json();
  assert.equal(j.id, 1);
  assert.equal(j.result.resultType, "complete");
  assert.ok(j.result.supportedVersions.includes("2026-07-28"));
  assert.ok(j.result.capabilities.tools);
  assert.ok(j.result.serverInfo.name && j.result.serverInfo.version);
  assert.equal(r.headers.get("access-control-allow-origin"), "*");
});

await test("MCP: tools/list is cacheable, deterministic, read-only annotated", async () => {
  const a = await call("tools/list");
  const b = await call("tools/list");
  assert.deepEqual(a, b);
  assert.equal(a.result.resultType, "complete");
  assert.equal(typeof a.result.ttlMs, "number");
  assert.equal(a.result.cacheScope, "public");
  assert.deepEqual(a.result.tools.map((x) => x.name), ["search_games", "get_game", "list_genres"]);
  for (const x of a.result.tools) {
    assert.equal(x.annotations.readOnlyHint, true);
    assert.equal(x.inputSchema.type, "object");
  }
});

await test("MCP: search_games filters, paginates and returns structuredContent", async () => {
  let j = await call("tools/call", { name: "search_games", arguments: { playable: true, limit: 5 } });
  const sc = j.result.structuredContent;
  assert.equal(j.result.isError, false);
  assert.equal(j.result.resultType, "complete");
  assert.equal(sc.games.length, 5);
  assert.ok(sc.total >= 20);
  assert.ok(sc.games.every((g) => g.playable && g.playUrl.startsWith("https://playchive.ir/")));
  assert.deepEqual(JSON.parse(j.result.content[0].text), sc);
  const p2 = (await call("tools/call", { name: "search_games", arguments: { playable: true, limit: 5, offset: 5 } })).result.structuredContent;
  assert.notEqual(p2.games[0].id, sc.games[0].id);
  j = await call("tools/call", { name: "search_games", arguments: { query: "BLASPHEMER" } });
  assert.ok(j.result.structuredContent.games.some((g) => g.id === "blasphemer"));
  j = await call("tools/call", { name: "search_games", arguments: { query: "zzzz-no-such" } });
  assert.equal(j.result.structuredContent.total, 0);
});

await test("MCP: get_game and list_genres", async () => {
  let j = await call("tools/call", { name: "get_game", arguments: { id: "blasphemer" } });
  assert.equal(j.result.structuredContent.name, "Blasphemer");
  assert.equal(j.result.structuredContent.playUrl, "https://playchive.ir/blasphemer.html");
  j = await call("tools/call", { name: "get_game", arguments: { id: "nope" } });
  assert.equal(j.result.isError, true);
  j = await call("tools/call", { name: "list_genres" });
  assert.ok(j.result.structuredContent.genres.length >= 10);
});

await test("MCP: invalid tool arguments are tool errors, unknown tool is a protocol error", async () => {
  for (const args of [{ limit: 0 }, { limit: 51 }, { limit: "x" }, { offset: -1 }, { playable: "yes" }, { query: "x".repeat(101) }, { bogus: 1 }]) {
    const j = await call("tools/call", { name: "search_games", arguments: args });
    assert.equal(j.result.isError, true, JSON.stringify(args));
  }
  assert.equal((await call("tools/call", { name: "get_game", arguments: {} })).result.isError, true);
  assert.equal((await call("tools/call", { name: "delete_everything" })).error.code, -32602);
  assert.equal((await call("tools/call", { name: "search_games", arguments: [] })).error.code, -32602);
});

await test("MCP: protocol version in _meta is checked", async () => {
  const meta = (v) => ({ _meta: { "io.modelcontextprotocol/protocolVersion": v } });
  assert.equal((await call("tools/list", meta("2026-07-28"))).result.tools.length, 3);
  const bad = await call("tools/list", meta("1999-01-01"));
  assert.equal(bad.error.code, -32022);
  assert.ok(bad.error.data.supported.includes("2026-07-28"));
});

await test("MCP: legacy initialize and ping still work; notifications get 202", async () => {
  const j = await call("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } });
  assert.equal(j.result.protocolVersion, "2025-06-18");
  assert.ok(j.result.capabilities.tools);
  assert.deepEqual((await call("ping")).result, {});
  const n = await rpc({ jsonrpc: "2.0", method: "notifications/initialized" });
  assert.equal(n.status, 202);
  assert.equal(await n.text(), "");
});

await test("MCP: JSON-RPC errors (parse, shape, method, headers, size)", async () => {
  let r = await run("https://playchive.ir/mcp", { method: "POST", body: "{nope" });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).error.code, -32700);
  r = await rpc([{ jsonrpc: "2.0", id: 1, method: "tools/list" }]);
  assert.equal(r.status, 400);
  r = await rpc({ id: 1, method: "tools/list" });
  assert.equal(r.status, 400);
  assert.equal((await call("resources/list")).error.code, -32601);
  assert.equal((await call("tools/list", {}, { "mcp-method": "tools/call" })).error.code, -32020);
  assert.equal((await call("tools/call", { name: "list_genres" }, { "mcp-name": "get_game" })).error.code, -32020);
  assert.equal((await call("tools/call", { name: "list_genres" }, { "mcp-method": "tools/call", "mcp-name": "list_genres" })).result.isError, false);
  r = await run("https://playchive.ir/mcp", { method: "POST", body: "x".repeat(40000) });
  assert.equal(r.status, 413);
});

await test("MCP: GET is 405 with Allow, OPTIONS is a CORS preflight, http POST keeps method via 308", async () => {
  let r = await run("https://playchive.ir/mcp");
  assert.equal(r.status, 405);
  assert.equal(r.headers.get("allow"), "POST, OPTIONS");
  r = await run("https://playchive.ir/mcp", { method: "OPTIONS" });
  assert.equal(r.status, 204);
  assert.match(r.headers.get("access-control-allow-headers"), /Mcp-Method/i);
  r = await rpc({ jsonrpc: "2.0", id: 1, method: "tools/list" }, {}, "http://playchive.ir/mcp");
  assert.equal(r.status, 308);
  assert.equal(r.headers.get("location"), "https://playchive.ir/mcp");
  assert.equal(calls.length, 0);
});

await test("MCP server card: SEP-2127 shape, compat shape, three paths, HEAD, no origin hit", async () => {
  for (const path of ["/.well-known/mcp-server-card", "/mcp/server-card", "/.well-known/mcp/server-card.json"]) {
    const r = await run(`https://playchive.ir${path}`);
    assert.equal(r.status, 200, path);
    assert.equal(r.headers.get("content-type"), "application/json");
    assert.equal(r.headers.get("access-control-allow-origin"), "*");
    const c = await r.json();
    assert.equal(c.$schema, "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json");
    assert.match(c.name, /^[^/]+\/[^/]+$/);
    assert.match(c.version, /^\d+\.\d+\.\d+$/);
    assert.ok(c.description);
    assert.equal(c.remotes[0].type, "streamable-http");
    assert.equal(c.remotes[0].url, "https://playchive.ir/mcp");
    assert.ok(c.remotes[0].supportedProtocolVersions.includes("2026-07-28"));
    assert.equal(c.tools, undefined, "cards must not list tools");
    if (path.endsWith(".json")) {
      assert.equal(c.serverInfo.name, c.name);
      assert.equal(c.transport.endpoint, "/mcp");
      assert.ok(c.capabilities.tools);
    }
  }
  const h = await run("https://playchive.ir/mcp/server-card", { method: "HEAD" });
  assert.equal(h.status, 200);
  assert.equal(await h.text(), "");
  assert.equal(calls.length, 0);
});

await test("MCP card and discover agree on name, version and protocol versions", async () => {
  const card = await (await run("https://playchive.ir/.well-known/mcp-server-card")).json();
  const d = (await call("server/discover")).result;
  assert.equal(d.serverInfo.name, card.name);
  assert.equal(d.serverInfo.version, card.version);
  assert.deepEqual(d.supportedVersions, card.remotes[0].supportedProtocolVersions);
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
