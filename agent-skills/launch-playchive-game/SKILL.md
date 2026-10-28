---
name: launch-playchive-game
description: Open and operate a playable PLAYCHIVE game in a browser, wait for the runtime to be ready, and use its labeled controls. Use after picking a record with playable true from the PLAYCHIVE catalog.
---

# Launch and operate a PLAYCHIVE game

Games run as WebAssembly or HTML5 inside the browser page. Nothing is installed and no login is needed.

## Steps

1. Pick a catalog record with `playable: true` (see the `browse-playchive-catalog` skill) and open `https://playchive.ir/` + its `runtimeUrl`.
2. Wait until the element `#game-status` has `data-runtime-state="ready"`, or a visible READY message appears. Possible states are `loading`, `ready`, `playing`, `paused`, `error` and `stopped`.
3. Runtime controls carry `data-agent-action` and an accessible name. Available actions: `launch`, `pause`, `resume`, `restart`, `fullscreen`, `return-to-hub` and `press-key`. Selector for all of them: `[data-agent-action]`.
4. Input: keyboard, touch (PSP-style on-screen controls), gamepad and fullscreen are supported where the record's `controls` list them. If a runtime asks to capture the pointer, click the game canvas once.
5. The hub at `https://playchive.ir/` also supports an optional agent mode with `?agent=1`. Launch links on the hub match `a[data-agent-action=launch-game]`.

## Things to know

- Progress and saves stay in the browser's local storage. They are never uploaded, and clearing site data removes them.
- ECWolf only ships the engine. It needs the user's own lawful game data, so do not report it as playable without that data.
- Browsers usually require a user gesture before fullscreen or audio starts.
- If the state becomes `error`, report it instead of retrying in a loop.
