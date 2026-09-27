# Freestyle Game Design

An experimental game-design repository for rapidly turning ideas into playable prototypes without sacrificing project stability.

This project is intentionally open-ended. It may become one game, several experiments, or a place to test unusual mechanics before deciding what deserves deeper development.

## Current playable slice — Energy Relay 0.15

- The player remains permanently in the blue energy-orb state; there is no human reform state.
- Movement is now true zero-gravity/inertial motion: the orb has no constant downward acceleration. It keeps its current velocity until a redirect, collision or damping event changes it.
- The run progresses from the bottom of the screen upward through a narrow space corridor with continuous left and right walls plus a solid rebound wall closing the starting end.
- Every active gameplay touch enters 20% slow motion, including the very first launch aim. Drag in the direction of travel and release to launch or redirect the same orb.
- Side-wall, bottom-cap and moving-platform contacts bounce the orb. Restitution and tangential damping bleed momentum, and a sufficiently low-speed impact settles the orb for another launch.
- Hazards are oriented for vertical play: spikes project inward from the side walls and persistent wall-mounted laser emitters switch full cross-corridor beams on and off at a deliberately slower cadence without the laser hardware spawning or disappearing.
- The orb has seven lives. A lethal hit respawns at the latest checkpoint with short invulnerability; losing the seventh life automatically starts a fresh run.
- Checkpoints, difficulty, procedural streaming and distance records all use upward vertical progress as their single source of truth.
- Targeting drones pursue within their active vertical chunk and fire projectiles. Direct orb contact destroys the drone without costing a life and now produces a short visible explosion; fired projectiles remain lethal.
- Procedural chunks, hazards, checkpoints and drones remain deterministic and bounded for mobile-friendly runtime behavior.

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
