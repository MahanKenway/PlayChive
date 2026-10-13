# PLAYCHIVE External Experiments Audit

**Audit date:** 2026-10-13  
**Scope:** The external URLs supplied for the PLAYCHIVE catalog expansion.

## Decision summary

PLAYCHIVE will **not mirror or bundle** any project merely because it is publicly reachable or hosted on GitHub. A public demo is not a redistribution license, and an open-source engine license does not license proprietary game data, maps, models, music, trademarks or branding.

### Added as external links only

These entries are catalog references to the original host. They are not part of the Offline Pack, are not copied into PLAYCHIVE, and may change or become unavailable outside PLAYCHIVE's control:

- Vibeslops / Claude of Duty: Vibe Slops II — MIT code, but Call of Duty-derived assets are not relicensed.
- OVZ / Contemporary Conflict: Global Flashpoint — browser alpha with Call of Duty-derived content; no bundle permission verified.
- Surfd — playable browser surf game; map/content redistribution is not cleared.
- webXash and PixelSutf Half-Life — Xash3D/browser builds; game archives remain user/rightsholder content.
- Halo web port and Halo CE Mobile — user-owned ISO/XISO or extracted maps required.
- Pieter.com Quake, Quake II, Quake III, RTCW and Urban Terror pages — hosted ports with mixed engine/data licensing; `ut.pieter.com` is Urban Terror, not Unreal Tournament.
- GTA: Vice City WASM by JonCodeOfficial — MIT engine/client source does not license Rockstar game data.
- PES 6 Web Online Port — proprietary Konami game data.
- Skate 3 Rust Engine web project — GPL engine source, but EA Skate 3 data is not redistributable.
- Diablo Web — shareware demo is available, while full game data requires the user's own `DIABDAT.MPQ`.
- WebWars — Hedgewars browser port; source is described as GPL v2, but live availability and every asset's license require verification before bundling.

### Not added

- **Moon Zombies, Kino der Toten, Cheese Cube:** unverified or unstable fan reconstructions using Call of Duty content; no redistribution license.
- **SHAR WASM:** based on leaked/proprietary Simpsons: Hit & Run material; reject.
- **WasmArcade Fan:** Eaglercraft/Minecraft-derived distribution is not cleared for PLAYCHIVE mirroring.
- **Global Terror:** inspected as a Shopify store/media site, not a game.

## Implementation policy

1. External entries use `projectUrl` and `catalogState: EXTERNAL LINK / RIGHTS REVIEW`.
2. They are `playable: false` in the PLAYCHIVE manifest so agents do not mistake an external link for a local runtime.
3. They are excluded from the Offline Pack because the service worker only covers PLAYCHIVE-owned files.
4. The UI calls them **Open official/external page**, not **Play now** or **Download locally**.
5. Reassess only when a project provides an explicit redistribution license and a complete asset/provenance audit.

## Embedded view

External cards now offer an **Open inside PLAYCHIVE** action. This loads the original project URL in an iframe inside a PLAYCHIVE dialog, so the browser address bar remains on PLAYCHIVE while the project is displayed from its original host. This is an embed, not a proxy or a mirror: the remote host still executes the project, controls its assets and may set its own cookies or storage.

Embedding is inherently best-effort. A remote site can block framing with `X-Frame-Options` or `Content-Security-Policy: frame-ancestors`; some projects also require top-level navigation, cross-origin isolation, user-owned files, WebSocket services or browser permissions. When that happens, the dialog exposes **Open original host** as a transparent fallback. PLAYCHIVE does not bypass those protections.
