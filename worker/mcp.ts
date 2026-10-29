// worker/mcp.ts
// Read-only MCP server (Streamable HTTP, stateless) over the PLAYCHIVE games catalog.
// Implements MCP 2026-07-28 (no initialize handshake, no sessions, server/discover) and keeps
// answering `initialize` / `ping` so clients that still negotiate 2025 revisions work too.
// No authentication, no writes, no outbound requests: the catalog is bundled from data/games.json.

import catalog from "../data/games.json";

export const SITE = "https://playchive.ir";
export const MCP_URL = `${SITE}/mcp`;
export const SERVER_NAME = "ir.playchive/catalog";
export const SERVER_VERSION = "1.0.0";
export const LATEST = "2026-07-28";
export const SUPPORTED = [LATEST, "2025-11-25", "2025-06-18", "2025-03-26"];
const DESCRIPTION =
  "Read-only search over the PLAYCHIVE retro-game catalog: which games exist, which run in the browser, their genre, controls and licence.";

const META = "io.modelcontextprotocol/";
const MAX_BODY = 32 * 1024;
const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Method, Mcp-Name, MCP-Protocol-Version",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

type Game = {
  id: string;
  name: string;
  description: string;
  genre: string;
  playable: boolean;
  publicUrl: string | null;
  projectUrl: string | null;
  runtimeType: string;
  controls: string[];
  license: string;
  status: string;
  studio: string;
  year: string;
  artwork: string | null;
};
const GAMES: Game[] = (catalog as { games: Game[] }).games;

const abs = (p: string | null) => (p ? (/^https?:\/\//.test(p) ? p : `${SITE}/${p.replace(/^\//, "")}`) : null);
const summary = (g: Game) => ({
  id: g.id,
  name: g.name,
  genre: g.genre,
  playable: g.playable,
  playUrl: g.playable ? abs(g.publicUrl) : null,
  controls: g.controls,
  license: g.license,
  status: g.status,
});
const detail = (g: Game) => ({
  ...summary(g),
  description: g.description,
  studio: g.studio,
  version: g.year,
  runtimeType: g.runtimeType,
  projectUrl: g.projectUrl,
  artworkUrl: abs(g.artwork),
});

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const TOOLS = [
  {
    name: "search_games",
    title: "Search games",
    description:
      "Search the PLAYCHIVE catalog by free text, genre and whether a game can be played directly in the browser. Returns compact summaries, ordered by name.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", maxLength: 100, description: "Case-insensitive text matched against name, description, genre and studio." },
        genre: { type: "string", maxLength: 50, description: "Exact genre, case-insensitive (see list_genres)." },
        playable: { type: "boolean", description: "true: only games playable in the browser; false: only catalog-only entries." },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
        offset: { type: "integer", minimum: 0, default: 0 },
      },
      additionalProperties: false,
    },
    annotations: { title: "Search games", ...READ_ONLY },
  },
  {
    name: "get_game",
    title: "Get game",
    description: "Full catalog record for one game, including description, licence, studio, version and play URL.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", maxLength: 100, description: "Game id, e.g. 'blasphemer'." } },
      required: ["id"],
      additionalProperties: false,
    },
    annotations: { title: "Get game", ...READ_ONLY },
  },
  {
    name: "list_genres",
    title: "List genres",
    description: "All genres in the catalog with the number of games and how many are playable in the browser.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { title: "List genres", ...READ_ONLY },
  },
];

type Json = Record<string, unknown>;
class RpcError extends Error {
  constructor(public code: number, message: string, public data?: unknown) {
    super(message);
  }
}

function toolResult(data: unknown, isError = false) {
  return {
    resultType: "complete",
    content: [{ type: "text", text: JSON.stringify(data) }],
    ...(isError ? {} : { structuredContent: data }),
    isError,
  };
}

function callTool(name: string, args: Json) {
  const bad = (m: string) => toolResult({ error: m }, true);
  const allowed = (keys: string[]) => Object.keys(args).find((k) => !keys.includes(k));

  if (name === "search_games") {
    const extra = allowed(["query", "genre", "playable", "limit", "offset"]);
    if (extra) return bad(`Unknown argument: ${extra}`);
    const { query, genre, playable, limit = 10, offset = 0 } = args;
    if (query !== undefined && (typeof query !== "string" || query.length > 100)) return bad("query must be a string up to 100 characters");
    if (genre !== undefined && (typeof genre !== "string" || genre.length > 50)) return bad("genre must be a string up to 50 characters");
    if (playable !== undefined && typeof playable !== "boolean") return bad("playable must be a boolean");
    if (!Number.isInteger(limit) || (limit as number) < 1 || (limit as number) > 50) return bad("limit must be an integer from 1 to 50");
    if (!Number.isInteger(offset) || (offset as number) < 0) return bad("offset must be an integer >= 0");
    const q = typeof query === "string" ? query.trim().toLowerCase() : "";
    const gn = typeof genre === "string" ? genre.trim().toLowerCase() : "";
    const hits = GAMES.filter(
      (g) =>
        (playable === undefined || g.playable === playable) &&
        (!gn || g.genre.toLowerCase() === gn) &&
        (!q || `${g.name} ${g.description} ${g.genre} ${g.studio}`.toLowerCase().includes(q)),
    ).sort((a, b) => a.name.localeCompare(b.name));
    const page = hits.slice(offset as number, (offset as number) + (limit as number));
    return toolResult({ total: hits.length, offset, limit, games: page.map(summary) });
  }
  if (name === "get_game") {
    const extra = allowed(["id"]);
    if (extra) return bad(`Unknown argument: ${extra}`);
    if (typeof args.id !== "string" || !args.id || args.id.length > 100) return bad("id must be a non-empty string up to 100 characters");
    const id = args.id.toLowerCase();
    const g = GAMES.find((x) => x.id.toLowerCase() === id);
    return g ? toolResult(detail(g)) : bad(`No game with id '${args.id}'. Use search_games to find ids.`);
  }
  if (name === "list_genres") {
    const extra = allowed([]);
    if (extra) return bad(`Unknown argument: ${extra}`);
    const m = new Map<string, { genre: string; games: number; playable: number }>();
    for (const g of GAMES) {
      const e = m.get(g.genre) ?? { genre: g.genre, games: 0, playable: 0 };
      e.games++;
      if (g.playable) e.playable++;
      m.set(g.genre, e);
    }
    return toolResult({ genres: [...m.values()].sort((a, b) => a.genre.localeCompare(b.genre)) });
  }
  throw new RpcError(-32602, `Unknown tool: ${name}`);
}

const capabilities = { tools: { listChanged: false } };
const serverInfo = { name: SERVER_NAME, title: "PLAYCHIVE", version: SERVER_VERSION, websiteUrl: SITE };

function dispatch(method: string, params: Json, version: string) {
  const _meta = { [`${META}serverInfo`]: serverInfo };
  switch (method) {
    case "server/discover":
      return {
        resultType: "complete",
        supportedVersions: SUPPORTED,
        capabilities,
        serverInfo,
        instructions: "Read-only catalog of PLAYCHIVE games. Start with search_games or list_genres.",
        _meta,
      };
    case "initialize": {
      // Backward compatibility for clients that still use the pre-2026 handshake.
      const asked = params.protocolVersion;
      return {
        protocolVersion: typeof asked === "string" && SUPPORTED.includes(asked) ? asked : LATEST,
        capabilities,
        serverInfo,
        instructions: "Read-only catalog of PLAYCHIVE games. Start with search_games or list_genres.",
      };
    }
    case "ping":
      return {};
    case "tools/list":
      return { resultType: "complete", tools: TOOLS, ttlMs: 3_600_000, cacheScope: "public", _meta };
    case "tools/call": {
      if (typeof params.name !== "string") throw new RpcError(-32602, "params.name is required");
      const args = params.arguments ?? {};
      if (typeof args !== "object" || args === null || Array.isArray(args)) throw new RpcError(-32602, "params.arguments must be an object");
      return { ...callTool(params.name, args as Json), _meta };
    }
    default:
      throw new RpcError(-32601, `Method not found: ${method}`);
  }
}

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
const fail = (id: unknown, code: number, message: string, data?: unknown, status = 200) =>
  reply({ jsonrpc: "2.0", id: id ?? null, error: { code, message, ...(data === undefined ? {} : { data }) } }, status);

export async function handleMcp(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS });
  if (request.method !== "POST") {
    // Stateless server: there is no server-to-client stream to open with GET.
    return new Response("This MCP endpoint accepts POST (JSON-RPC).", { status: 405, headers: { ...JSON_HEADERS, Allow: "POST, OPTIONS" } });
  }
  const text = await request.text();
  if (text.length > MAX_BODY) return fail(null, -32600, "Request too large", undefined, 413);
  let msg: unknown;
  try {
    msg = JSON.parse(text);
  } catch {
    return fail(null, -32700, "Parse error", undefined, 400);
  }
  if (typeof msg !== "object" || msg === null || Array.isArray(msg) || (msg as Json).jsonrpc !== "2.0") {
    return fail(null, -32600, "Invalid Request: expected a single JSON-RPC 2.0 object", undefined, 400);
  }
  const m = msg as { id?: unknown; method?: unknown; params?: unknown };
  if (typeof m.method !== "string") {
    // A response or malformed message from the client: nothing to do.
    return m.id === undefined ? new Response(null, { status: 202, headers: JSON_HEADERS }) : fail(m.id, -32600, "Invalid Request", undefined, 400);
  }
  const isNotification = m.id === undefined;
  if (isNotification) return new Response(null, { status: 202, headers: JSON_HEADERS });
  if (typeof m.id !== "string" && typeof m.id !== "number") return fail(null, -32600, "Invalid Request: id must be a string or number", undefined, 400);

  const params = (typeof m.params === "object" && m.params !== null && !Array.isArray(m.params) ? m.params : {}) as Json;

  const hMethod = request.headers.get("mcp-method");
  if (hMethod && hMethod !== m.method) return fail(m.id, -32020, "Header mismatch: Mcp-Method differs from the request method", { header: "Mcp-Method" });
  const hName = request.headers.get("mcp-name");
  if (hName && m.method === "tools/call" && hName !== params.name) return fail(m.id, -32020, "Header mismatch: Mcp-Name differs from params.name", { header: "Mcp-Name" });

  const meta = (typeof params._meta === "object" && params._meta !== null ? params._meta : {}) as Json;
  const asked = meta[`${META}protocolVersion`];
  if (asked !== undefined && (typeof asked !== "string" || !SUPPORTED.includes(asked))) {
    return fail(m.id, -32022, "Unsupported protocol version", { supported: SUPPORTED, requested: asked });
  }

  try {
    const result = dispatch(m.method, params, typeof asked === "string" ? asked : LATEST);
    return reply({ jsonrpc: "2.0", id: m.id, result });
  } catch (e) {
    if (e instanceof RpcError) return fail(m.id, e.code, e.message, e.data);
    console.error("MCP internal error:", e);
    return fail(m.id, -32603, "Internal error");
  }
}

// MCP Server Card (SEP-2127): discovery metadata only. Tools are discovered with tools/list.
const CARD_BASE = {
  $schema: "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
  name: SERVER_NAME,
  version: SERVER_VERSION,
  title: "PLAYCHIVE",
  description: DESCRIPTION,
  websiteUrl: `${SITE}/agent/`,
  repository: { url: "https://github.com/MahanKenway/PlayChive", source: "github" },
  remotes: [{ type: "streamable-http", url: MCP_URL, supportedProtocolVersions: SUPPORTED }],
};
export const SERVER_CARD = CARD_BASE;
// Superset served at /.well-known/mcp/server-card.json for scanners that look for these keys.
export const SERVER_CARD_COMPAT = {
  ...CARD_BASE,
  serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
  transport: { type: "streamable-http", endpoint: "/mcp" },
  capabilities,
};

export const CARD_PATHS = ["/.well-known/mcp-server-card", "/.well-known/mcp/server-card.json", "/mcp/server-card"];

export function handleCard(request: Request, path: string): Response {
  const body = path === "/.well-known/mcp/server-card.json" ? SERVER_CARD_COMPAT : SERVER_CARD;
  return new Response(request.method === "HEAD" ? null : JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
