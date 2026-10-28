# PLAYCHIVE auth.md

> Agent authentication and registration discovery for https://playchive.ir

## Summary

PLAYCHIVE requires **no authentication**. The site has no accounts, no API keys, no OAuth server and no registration or provisioning endpoint. Every public endpoint is a static, read-only `GET`. Agents do not need to register, and no credentials are issued.

Agent audience: browser agents, crawlers and LLM tools that read the public game catalog or open a game runtime in a browser.

## Resource

- Resource: https://playchive.ir
- Authorization servers: none
- OAuth Protected Resource Metadata (`/.well-known/oauth-protected-resource`): not published, because there is nothing to protect
- OAuth Authorization Server metadata: not published, because PLAYCHIVE runs no authorization server
- Bearer methods: not applicable, do not send an `Authorization` header

## Registration and provisioning

- Registration endpoint: none. There is no `/agent/auth` or similar endpoint to call.
- Supported methods: none (no ID-JAG, no verified email, no anonymous registration)
- Credentials: none are issued or accepted

If PLAYCHIVE ever adds accounts or protected endpoints, this file will be updated together with OAuth metadata and an `agent_auth` block.

## What an agent can use without credentials

- Catalog (JSON): https://playchive.ir/data/games.json and https://playchive.ir/agent/catalog.json
- OpenAPI description: https://playchive.ir/openapi.json
- API catalog (RFC 9727): https://playchive.ir/.well-known/api-catalog
- Agent guide: https://playchive.ir/agent/ and https://playchive.ir/agent-manifest.json
- Site guide for LLMs: https://playchive.ir/llms.txt and https://playchive.ir/llms-full.txt
- Games: open the `runtimeUrl` of a playable record in a browser. Game progress is stored in that browser only, with no login.

Please keep request rates reasonable and follow https://playchive.ir/robots.txt. Responses are static and cacheable.

## Privacy and contact

- Privacy: https://playchive.ir/privacy/
- Source and issues: https://github.com/MahanKenway/PlayChive
