# Large Open-Source Game Bundle Audit

**Audit date:** 2026-10-13

## Result

No new large project in this audit met all of the requested conditions: a permissive MIT-style code license, complete redistributable game assets, no proprietary user files, and a verified browser/WebAssembly build suitable for the PLAYCHIVE Offline Pack.

The key distinction is that a code license does not automatically license a game's maps, textures, models, sound, music, fonts, branding or commercial data files.

## Findings

**OpenLara** is BSD-2-Clause code with an official browser demo, but it is an engine recreation. The demo accepts Tomb Raider level files, and the repository does not grant a license for Tomb Raider data. It remains external-link-only.

**CorsixTH** has MIT-style engine code, but the official project requires Theme Hospital graphics, sounds, levels and movies from the original CD, GOG/EA release or demo. No official browser/WASM build was found. It remains a source/engine reference, not a complete bundle.

**Freeciv-web** is AGPLv3 for its web client and GPL for its server lineage. It has a browser client, but it is a multi-service Java/Tomcat/WebSocket deployment rather than a self-contained offline WASM runtime. Its assets require a file-by-file audit.

**Endless Sky** is GPLv3 code with a documented mixed asset inventory containing public-domain, CC0, CC-BY and CC-BY-SA material. A complete bundle is legally plausible in principle if all notices, attribution and GPL source obligations are retained. However, the upstream build is native CMake and the browser deployment found is third-party, so it is listed as an external experiment until a pinned WebAssembly source/build is verified.

**OpenTTD** is already bundled in PLAYCHIVE with OpenGFX, OpenSFX and OpenMSX. It is GPLv2, not MIT. Original Transport Tycoon Deluxe data is not included.

**Mindustry, Shattered Pixel Dungeon, Veloren, OpenRA, OpenXcom, OpenMW and openage** were not cleared for a complete local bundle in this pass. Their repositories are GPL-family or mixed-license, have unresolved asset obligations, require original commercial data, lack an official browser build, or combine several of those limitations.

## PLAYCHIVE policy

The four newly listed projects are marked `EXTERNAL LINK / RIGHTS REVIEW`. They are not copied into PLAYCHIVE, are not included in the Offline Pack, and are not described as MIT or locally playable. A future Endless Sky bundle requires a pinned web build, exact asset inventory, preserved attribution, GPL source compliance and a successful local smoke test before integration.

## Sources

- OpenLara: https://github.com/XProger/OpenLara and https://xproger.info/projects/OpenLara/
- CorsixTH: https://github.com/CorsixTH/CorsixTH and https://corsixth.com/
- Freeciv-web: https://github.com/freeciv/freeciv-web and https://freeciv.github.io/freeciv-web/
- Endless Sky: https://github.com/endless-sky/endless-sky, https://github.com/endless-sky/endless-sky/blob/master/copyright, and https://play-endless-sky.com/
- OpenTTD: https://github.com/OpenTTD/OpenTTD and https://www.openttd.org/content-creators
