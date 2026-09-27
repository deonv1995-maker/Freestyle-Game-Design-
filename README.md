# Freestyle Game Design

An experimental game-design repository for rapidly turning ideas into playable prototypes without sacrificing project stability.

This project is intentionally open-ended. It may become one game, several experiments, or a place to test unusual mechanics before deciding what deserves deeper development.

## Current playable slice — Spear Relay 0.5

The current prototype is a mobile-first 2D traversal mechanic:

- press and hold anywhere on the game area;
- slide in the direction you want to throw;
- drag distance controls throw power;
- release to throw the spear;
- while the spear is flying, the camera follows it from a wider zoomed-out view so more of the course remains visible;
- the spear now collides with the floor, platforms and solid obstacles instead of passing through them;
- press again while the spear is flying or planted to relocate the character to the spear's current position;
- that same press immediately starts the next aiming gesture;
- the player now visibly winds up, leans and follows through when aiming and throwing;
- relaying to a spear that is still in flight enters a tucked airborne pose with slowed visual motion and a precision reticle;\n- lightweight NPCs now stand and patrol through the streamed world;\n- hitting an NPC with the spear throws the NPC physically and increments a per-run hit counter.

The handmade opening section now flows into an endless deterministic traversal course. As play moves forward, nearby world chunks are generated from a fixed seed, each with continuous ground plus varied platforms and obstacles. Old distant procedural chunks are discarded and can be regenerated identically later, keeping runtime memory bounded on mobile.

The prototype is still focused on movement. NPCs are currently non-hostile traversal targets; there is still no player damage, death state or larger progression system.

## Technical foundation

The first prototype uses browser-native HTML5 Canvas and JavaScript with no runtime dependencies.

Gameplay state, deterministic chunk/NPC generation, active world geometry, NPC behavior and collision physics live in `src/game-core.js`. Pointer input, camera presentation, rendering and HUD presentation live in `src/game.js`.

The static build is produced by `scripts/build.mjs`, and the repository includes automated gameplay-state, collision and procedural-world tests plus GitHub Actions verification.

This choice is intentionally lightweight. It is not a permanent commitment to a larger engine if future experiments require one.

## Phone testing

The deployed GitHub Pages build includes a web-app manifest and dedicated Spear Relay icon. On Android, open the deployed prototype in Chrome, use the browser menu, and choose **Add to Home screen** or **Install app** when offered. The shortcut opens in standalone mode so repeated phone testing is one tap from the home screen.

A service worker is intentionally not used yet. Keeping the prototype free of an offline cache reduces the chance of an older build being mistaken for the newest test after a deployment.

## Local commands

- `npm test` — run core mechanic and collision tests.
- `npm run build` — build the static site into `dist/`.
- `npm run check` — run tests and build together.

## Working relationship

The development loop is:

1. Describe the idea, mechanic, visual change, or problem in plain language.
2. Inspect the current repository and existing project decisions before changing code.
3. Implement the smallest complete playable slice that proves the idea.
4. Verify the build, startup path, imports/assets, and affected gameplay flow.
5. Commit the change to GitHub.
6. Test the result on the target device/build.
7. Use test feedback to refine, keep, expand, or remove the idea.

Once a playable build exists, `main` is treated as the stable baseline. Experimental work should not knowingly leave `main` unusable.

## Project principles

- Experiment freely, but keep architecture understandable.
- Prefer one authoritative implementation over duplicate or competing systems.
- Keep gameplay, UI, rendering, assets, persistence, and deployment separated where practical.
- Prefer small vertical slices over many unfinished systems.
- Preserve working behavior unless an experiment intentionally replaces it.
- Fix root causes rather than layering patches on top of broken assumptions.
- Keep shared data and gameplay values centralized and data-driven.
- Treat mobile performance, readable controls, and reliable startup as first-class requirements when the chosen project targets mobile.
- Record important technical or design decisions in the repository so future work does not depend on chat history.
- Do not claim a change is complete until it is actually committed and relevant verification has succeeded.

## Project memory

- `docs/DEVELOPMENT_RULES.md` — implementation and stability rules.
- `docs/DECISIONS.md` — durable design and architecture decisions.
- `docs/IDEA_LOG.md` — ideas worth keeping, rejecting, revisiting, or combining.
- `docs/TESTING.md` — how each playable iteration should be checked before moving forward.
