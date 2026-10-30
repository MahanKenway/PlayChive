// A2A agent card for PLAYCHIVE. The agent itself runs in the Ikol Worker (IKOL_BOT repo, POST /a2a),
// which answers by calling this site's read-only MCP server. This card only advertises it.
// Do not merge this until Ikol's /a2a endpoint is deployed: a card pointing at a dead URL is worse than none.

export const A2A_ENDPOINT = "https://ikol.mahankenway.workers.dev/a2a";
export const A2A_CARD_PATHS = ["/.well-known/agent-card.json"];

export const AGENT_CARD = {
  name: "PLAYCHIVE Game Guide",
  description:
    "Answers questions about the PLAYCHIVE catalog of free, classic and open-source browser games: search by name, genre or topic and get the direct play link, licence and controls. Read-only, no account needed.",
  version: "1.0.0",
  supportedInterfaces: [{ url: A2A_ENDPOINT, protocolBinding: "JSONRPC", protocolVersion: "1.0" }],
  provider: { organization: "PLAYCHIVE", url: "https://playchive.ir" },
  documentationUrl: "https://playchive.ir/agent/",
  capabilities: { streaming: false, pushNotifications: false, extendedAgentCard: false },
  defaultInputModes: ["text/plain"],
  defaultOutputModes: ["text/plain", "application/json"],
  skills: [
    {
      id: "search-games",
      name: "Search PLAYCHIVE games",
      description: "Find games in the PLAYCHIVE catalog by name, genre or topic and return playable browser links.",
      tags: ["games", "retro", "webassembly", "catalog", "search"],
      examples: ["racing games", "Find a free puzzle game", "tell me about blasphemer"],
      inputModes: ["text/plain"],
      outputModes: ["text/plain", "application/json"],
    },
    {
      id: "list-genres",
      name: "List game genres",
      description: "List the genres available in PLAYCHIVE with the number of games in each.",
      tags: ["games", "genres"],
      examples: ["what genres do you have?"],
      inputModes: ["text/plain"],
      outputModes: ["text/plain", "application/json"],
    },
  ],
};

export function handleAgentCard(request: Request): Response {
  return new Response(request.method === "HEAD" ? null : JSON.stringify(AGENT_CARD, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
