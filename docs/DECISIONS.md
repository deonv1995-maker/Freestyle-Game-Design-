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

## 2026-09-27 — Documentation is project memory

Decision: important gameplay and architecture decisions are recorded in this repository. Current repository documentation takes precedence over reconstructing project intent from old chat history.

## 2026-09-27 — First prototype uses browser-native 2D Canvas

Decision: the first Spear Relay prototype uses HTML5 Canvas and JavaScript with no runtime framework or game-engine dependency. Gameplay state/physics are separated from input/rendering.

Reason: the requested mechanic is 2D, touch-first and small enough to test directly in a browser. A minimal stack provides the shortest path to repeatable phone testing while preserving the option to move to a larger engine if later experiments genuinely require it.

This replaces the earlier temporary "no engine chosen yet" state for the current prototype only; it is not a permanent prohibition on changing technology later.

## 2026-09-27 — Spear relay input contract

Decision: aiming is a screen-space drag gesture. Drag direction determines throw direction and drag distance determines throw power. Releasing throws the spear with light ballistic gravity.

While the spear is in flight, the camera follows the spear. Pressing again immediately relocates the character to the spear's exact current world position, stops the current spear flight, and uses that same press as the start of the next aim gesture.

Reason: one continuous press-drag-release loop matches the requested touch interaction without adding movement buttons, confirmation controls or a separate teleport command.

## 2026-09-27 — Prototype 0.1 excludes world collision

Decision: Spear Relay 0.1 intentionally has no terrain collision, enemies, damage, death state or progression.

Reason: the first test should answer whether throw-follow-relocate-repeat is satisfying before other systems obscure that core movement question.

## 2026-09-27 — Home-screen testing uses a lightweight web-app manifest

Decision: Spear Relay exposes install metadata and a dedicated app icon so the deployed GitHub Pages prototype can be added to a phone home screen and opened in standalone mode.

Reason: one-tap access shortens the test loop without introducing a native packaging pipeline before the core mechanic earns that complexity. No service worker is added yet, because an offline cache can make rapid iteration confusing by serving an older prototype after a deployment.
