// worker/oauth.ts
// Real OAuth/OIDC for PLAYCHIVE, using Cloudflare Access (SaaS OIDC app) as the identity provider.
// - GET/PUT /api/favorites: per-user favourite games, protected by an Access-issued bearer token.
// - /.well-known/openid-configuration and /.well-known/oauth-authorization-server: the IdP's own
//   discovery document, proxied (only when the IdP is configured).
// Everything is OFF until ACCESS_ISSUER, ACCESS_AUDIENCE and the FAVORITES KV binding exist, so a
// partially configured deploy never advertises something that does not work.

import catalog from "../data/games.json";

export interface OAuthEnv {
  ACCESS_ISSUER?: string; // e.g. https://TEAM.cloudflareaccess.com/cdn-cgi/access/sso/oidc/CLIENT_ID
  ACCESS_AUDIENCE?: string; // the OIDC client id
  FAVORITES?: { get(k: string): Promise<string | null>; put(k: string, v: string): Promise<void> };
}

export const SITE = "https://playchive.ir";
export const OAUTH_PATHS = ["/.well-known/openid-configuration", "/.well-known/oauth-authorization-server"];
const MAX_FAVORITES = 100;
const KNOWN_IDS = new Set((catalog as { games: { id: string }[] }).games.map((g) => g.id));

export const isConfigured = (env: OAuthEnv) => !!(env.ACCESS_ISSUER && env.ACCESS_AUDIENCE && env.FAVORITES);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "X-Content-Type-Options": "nosniff",
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS, ...extra } });

const unauthorized = (error: string) =>
  json({ error }, 401, {
    "WWW-Authenticate": `Bearer realm="PLAYCHIVE", error="${error}", resource_metadata="${SITE}/.well-known/oauth-protected-resource"`,
  });

// ---------------------------------------------------------------- discovery + keys (cached)

type Json = Record<string, any>;
const cache = new Map<string, { at: number; doc: Json; keys: Json[] }>();
export const resetCache = () => cache.clear();
const TTL_MS = 5 * 60 * 1000;

async function idp(env: OAuthEnv, now = Date.now()): Promise<{ doc: Json; keys: Json[] }> {
  const issuer = env.ACCESS_ISSUER!.replace(/\/$/, "");
  const hit = cache.get(issuer);
  if (hit && now - hit.at < TTL_MS) return hit;
  const res = await fetch(`${issuer}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error(`discovery ${res.status}`);
  const doc = (await res.json()) as Json;
  if (doc.issuer !== issuer) throw new Error("issuer mismatch in IdP discovery");
  const jr = await fetch(doc.jwks_uri);
  if (!jr.ok) throw new Error(`jwks ${jr.status}`);
  const entry = { at: now, doc, keys: ((await jr.json()) as Json).keys ?? [] };
  cache.set(issuer, entry);
  return entry;
}

const b64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
const parse = (s: string) => JSON.parse(new TextDecoder().decode(b64u(s)));

/** Verify an RS256 bearer token from the configured IdP. Returns the subject or an error code. */
export async function verifyToken(token: string, env: OAuthEnv, now = Math.floor(Date.now() / 1000)): Promise<{ sub: string } | { error: string }> {
  const parts = token.split(".");
  if (parts.length !== 3) return { error: "invalid_token" };
  let header: Json, claims: Json;
  try {
    header = parse(parts[0]);
    claims = parse(parts[1]);
  } catch {
    return { error: "invalid_token" };
  }
  if (header.alg !== "RS256") return { error: "invalid_token" };
  let keys: Json[];
  try {
    keys = (await idp(env)).keys;
  } catch (e) {
    console.error("IdP lookup failed:", e);
    return { error: "temporarily_unavailable" };
  }
  const jwk = keys.find((k) => k.kid === header.kid && k.kty === "RSA");
  if (!jwk) return { error: "invalid_token" };
  const key = await crypto.subtle.importKey("jwk", jwk as JsonWebKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64u(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  if (!ok) return { error: "invalid_token" };
  const issuer = env.ACCESS_ISSUER!.replace(/\/$/, "");
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.iss !== issuer || !aud.includes(env.ACCESS_AUDIENCE)) return { error: "invalid_token" };
  if (typeof claims.exp !== "number" || claims.exp + 60 < now) return { error: "invalid_token" };
  if (typeof claims.nbf === "number" && claims.nbf - 60 > now) return { error: "invalid_token" };
  if (typeof claims.sub !== "string" || !claims.sub) return { error: "invalid_token" };
  return { sub: claims.sub };
}

// ---------------------------------------------------------------- handlers

export async function handleDiscovery(request: Request, env: OAuthEnv): Promise<Response> {
  if (!env.ACCESS_ISSUER) return json({ error: "no authorization server is configured for this resource" }, 404);
  try {
    const { doc } = await idp(env);
    return new Response(request.method === "HEAD" ? null : JSON.stringify(doc, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600", ...CORS },
    });
  } catch (e) {
    console.error("Discovery proxy failed:", e);
    return json({ error: "authorization server unavailable" }, 502);
  }
}

export async function handleFavorites(request: Request, env: OAuthEnv): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (!isConfigured(env)) return json({ error: "favourites are not enabled yet" }, 503);
  if (request.method !== "GET" && request.method !== "PUT") return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, PUT, OPTIONS", ...CORS } });

  const m = /^Bearer\s+(\S+)$/i.exec(request.headers.get("authorization") ?? "");
  if (!m) return unauthorized("invalid_request");
  const who = await verifyToken(m[1], env);
  if ("error" in who) return who.error === "temporarily_unavailable" ? json({ error: who.error }, 503) : unauthorized(who.error);
  const key = `fav:${who.sub}`;

  if (request.method === "GET") {
    const raw = await env.FAVORITES!.get(key);
    return json({ games: raw ? JSON.parse(raw) : [] });
  }

  const text = await request.text();
  if (text.length > 8192) return json({ error: "body too large" }, 413);
  let body: Json;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }
  const games = body?.games;
  if (!Array.isArray(games) || games.length > MAX_FAVORITES || games.some((g) => typeof g !== "string" || !KNOWN_IDS.has(g))) {
    return json({ error: `games must be an array of at most ${MAX_FAVORITES} known game ids` }, 400);
  }
  const unique = [...new Set(games as string[])];
  await env.FAVORITES!.put(key, JSON.stringify(unique));
  return json({ games: unique });
}

/** RFC 9728 document. Lists the authorization server only when one really exists. */
export function protectedResource(env: OAuthEnv) {
  const base = { resource: SITE, resource_name: "PLAYCHIVE", resource_documentation: `${SITE}/auth.md` };
  if (!isConfigured(env)) return { ...base, bearer_methods_supported: [] as string[] };
  return { ...base, authorization_servers: [env.ACCESS_ISSUER!.replace(/\/$/, "")], scopes_supported: ["openid"], bearer_methods_supported: ["header"] };
}
