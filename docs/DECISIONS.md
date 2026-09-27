# Decisions Log

This file records durable decisions for Freestyle Game Design.

## 2026-09-27 — Experimental repository

Decision: Freestyle Game Design is intentionally open-ended. It may become one game, multiple prototypes, or a testing ground for mechanics and visual ideas.

Reason: the purpose is to explore ideas quickly without forcing a final game concept too early.

## 2026-09-27 — Repository-first development loop

Decision: development follows the same practical collaboration loop proven in The Villager Rebuild: describe the requested change, inspect the current repository, implement it directly in GitHub, verify it, then test the resulting build and iterate from observed feedback.

Reason: this keeps implementation tied to the real repository state rather than code fragments copied manually between chat and the project.

## 2026-09-27 — Stable main after first playable build

Decision: once a playable prototype exists, `main` becomes the stable playable baseline. Future experiments should preserve that baseline or be isolated until they are safe to merge.

## 2026-09-27 — No engine chosen yet

Decision: do not preselect Unity, Three.js, Godot, another engine, or a particular rendering architecture before the first concrete game idea establishes the requirements.

Reason: this repository exists for experimentation, so the technical foundation should serve the idea rather than constrain it prematurely.

## 2026-09-27 — Documentation is project memory

Decision: important gameplay and architecture decisions are recorded in this repository. Current repository documentation takes precedence over reconstructing project intent from old chat history.
