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

## 2026-09-27 — Android testing uses a thin native APK shell

Decision: the current browser-native Spear Relay gameplay remains the single source of truth, while a minimal Android WebView shell packages the verified `dist/` output into an installable APK.

Reason: phone testing now requires a real downloadable/installable application, but duplicating gameplay in a second Android implementation would create competing logic and slow iteration.

The Android test package ID is `com.freestylegamedesign.spearrelay`. Automated test APKs use a repository-owned development signing key only so later test builds can update the installed app. That key is explicitly not a production/store signing identity.


## 2026-09-27 — Prototype 0.2 introduces data-driven solid world geometry

Decision: the first traversal world is defined by one `WORLD_SURFACES` collection in `game-core.js`. Ground, platforms and obstacles are all axis-aligned solid rectangles read by both collision and rendering instead of maintaining separate visual and physics layouts.

Spear movement uses swept segment-versus-rectangle collision each physics step. On the first impact, the spear stops at the contact point and enters a planted/stuck state. Pressing while the spear is planted still performs the same relay action and immediately begins the next aim gesture.

The player's stored world position now represents the character's feet. This keeps an exact relay to a horizontal surface contact visually grounded without introducing a second correction/placement system.

Reason: the world needs reliable collision for mobile traversal, high-speed throws must not tunnel through thin platforms, and world geometry should remain expandable without duplicating collision coordinates in rendering code.
