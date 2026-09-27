# Freestyle Game Design

An experimental game-design repository for rapidly turning ideas into playable prototypes without sacrificing project stability.

This project is intentionally open-ended. It may become one game, several experiments, or a place to test unusual mechanics before deciding what deserves deeper development.

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

## Current state

Repository foundation only. No engine, rendering stack, gameplay architecture, art direction, or core game concept has been locked yet.

The first actual game idea will determine the technical foundation rather than the foundation determining the idea.

## Project memory

- `docs/DEVELOPMENT_RULES.md` — implementation and stability rules.
- `docs/DECISIONS.md` — durable design and architecture decisions.
- `docs/IDEA_LOG.md` — ideas worth keeping, rejecting, revisiting, or combining.
- `docs/TESTING.md` — how each playable iteration should be checked before moving forward.
