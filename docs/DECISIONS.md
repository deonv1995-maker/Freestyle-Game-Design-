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


## 2026-09-27 — Prototype 0.3 streams deterministic procedural traversal chunks

Decision: the handmade opening course remains the authored starting area. Beyond x=1600, the traversal world is produced in fixed-width chunks from a repository-owned seed and a small set of controlled traversal patterns.

Each generated chunk owns its continuous ground plus its platform and obstacle geometry. The same generated surface collection is consumed by both rendering and collision, preserving one source of truth.

Only a bounded window of procedural chunks around the current player/spear focus is kept active. Distant chunks are discarded and regenerated deterministically from their chunk index when revisited. This prevents an endless run from causing unbounded geometry growth on mobile.

Player progress is recorded when the relay actually moves the player forward; spear flight may stream geometry ahead so collision remains available before the player arrives.

Reason: the course should continue indefinitely as the player advances without duplicating geometry systems, introducing random impossible seams, or allowing memory use to grow forever.

## 2026-09-27 — Prototype 0.4 adds throw animation and airborne bullet-time presentation

Decision: relaying to a spear while it is still in flight enters an airborne aiming presentation state. The existing relay input contract still stops the active spear flight immediately, so the slow-motion look does not introduce a second gameplay physics timescale or alter deterministic throw/collision behavior.

The gameplay state owns only the minimal animation descriptors needed across frames: airborne aim, persistent airborne player pose, visual animation clocks, throw direction and normalized follow-through. Rendering owns the stick-figure pose, recoil, tucked legs, slow float, vignette/rings and precision reticle.

Grounded aiming keeps the normal presentation. Releasing any aim starts a short throw follow-through. Releasing from airborne aim preserves the airborne body pose until the next relay changes the player's placement context.

Reason: throwing should read as a physical action, and mid-air aiming should feel like hang-time/bullet-time without destabilizing the procedural world, touch controls, spear physics, collision or camera systems.


## 2026-09-27 — Prototype 0.5 adds bounded roaming NPC targets and a wider camera

Decision: the traversal camera renders the world at a 0.78 scale while retaining the existing camera focus and touch aiming contract. The zoom factor is centralized in `GAME_CONFIG` so rendering systems share one view scale.

NPCs are owned by `game-core.js`, not by the renderer. The authored opening area has a small fixed NPC set, and each procedural chunk deterministically contributes two more. Only NPCs belonging to the current bounded chunk window remain active, matching the terrain streaming model and preventing endless runs from accumulating unbounded character state.

NPCs alternate between standing and simple ground patrol behavior. Obstacle checks reverse patrol direction before walking through solid world geometry. Spear collision uses the same swept segment approach as terrain collision, compares the earliest NPC and surface contact, and transfers part of the spear momentum to the NPC when the NPC is hit. A thrown NPC is temporarily removed from spear targeting until it lands and recovers.

The run score stores only the integer number of NPC hit events. Resetting the run resets that counter. No unbounded hit-history collection is kept.

Reason: the world should feel more populated and readable at speed while preserving mobile performance, deterministic procedural generation, one authoritative gameplay simulation, and the existing spear-relay control loop.


## 2026-09-27 — Prototype 0.6 auto-relays on world impact and removes defeated NPCs

Decision: a spear collision with solid world geometry now immediately moves the player to the spear's exact impact point. The spear still enters the planted state so the contact remains visible, but the next press no longer performs the relocation when the player is already at that contact; it only begins the next aim gesture.

NPC hits retain a short physical reaction instead of disappearing instantly. A hit NPC is marked defeated immediately, inherits spear momentum, tumbles through the air, enters a brief fallen pose on ground contact, fades, and is then removed from the active NPC collection. Defeated IDs are retained only for the currently streamed definition window and pruned as chunks leave that window, keeping the endless-run state bounded.

Reason: impact should feel immediate and readable while removing an extra relay input after terrain contact, and NPC targets should visibly react to a successful spear hit before leaving the scene without becoming permanent runtime objects.


## 2026-09-27 — Prototype 0.7 replaces the spear with an energy transformation and split controls

Decision: the spear entity and throw/relay input contract are replaced by a player-owned energy-orb transformation. In normal form the player is visible and stationary at the current world position. Releasing a valid launch gesture transforms the player into the orb; while orb form is active, the normal player body is not rendered because the orb is the player.

The screen is divided by responsibility rather than by duplicated movement systems. The left half is the initiation zone. Pressing there begins a slingshot draw: dragging away from the initial touch point stores power, and the launch direction is the inverse of that pull vector. Releasing below the deadzone cancels safely; releasing a valid draw launches the orb. The right half is the control zone while orb form is active. A hold-drag gesture behaves as a bounded virtual joystick that applies steering acceleration without replacing the orb's existing momentum.

The orb uses the existing deterministic world collision and bounded streamed NPC/world data. NPC contact transfers orb momentum into the existing knockdown/fall/despawn lifecycle and increments the run hit counter. Solid-world contact ends orb form and reforms the player at the orb's exact impact position.

Gameplay physics and input state remain in `game-core.js`; split-screen gesture routing, slingshot/joystick presentation, blue energy rendering and HUD copy remain in `game.js`.

Reason: the mechanic should read as a superpower rather than a projectile tool while preserving the successful traversal architecture, mobile-first two-thumb ergonomics, deterministic collision, bounded streaming and one authoritative gameplay simulation.


## 2026-09-27 — Prototype 0.8 restores direct aiming and separates rebound from landing

Decision: the split left-initiation/right-steering control scheme from 0.7 is removed. Energy Relay returns to the earlier one-finger motion contract: a press can begin anywhere on the game area, drag direction is the launch direction, drag distance sets power, and release transforms the player into the existing energy orb and launches it. The orb presentation remains unchanged.

World contact is no longer treated as one universal stop condition. The orb is collision-tested as a circle by sweeping its center against world rectangles expanded by the orb radius. A contact is considered a valid landing only when all three conditions are true: the orb is descending, the collision normal is the top-face normal, and the surface type is either ground or platform.

All other solid-world contacts are rebounds. Side impacts reflect horizontal momentum, underside impacts reflect vertical momentum, and obstacle surfaces—including obstacle tops—reflect the orb instead of reforming the player. A small separation offset is applied after reflection so the next physics step begins outside the contact boundary and does not repeatedly re-hit the same face.

Reason: the character should never hang from a wall, platform edge or ceiling. Landing/reforming is a semantic gameplay action reserved for standable top surfaces, while non-standable geometry behaves as a physical rebound surface.


## 2026-09-27 — Prototype 0.9 adds repeatable midair time-freeze redirection

Decision: pressing while the player is already in orb form enters an `airAiming` gameplay state at the orb's exact current position. Orb physics, gravity, collision advancement and NPC simulation pause while this state is active. Cosmetic energy animation may continue so the frozen state remains visually readable.

The same direct drag aiming contract is reused for both grounded launch and midair redirect. Grounded release creates a new orb burst and increments the burst count. Midair release changes the existing orb's velocity in place, does not move its position, does not create a new burst, and returns to normal orb flight. Cancelling a midair aim resumes the pre-existing orb velocity.

The frozen orb remains the camera focus and remains rendered as the same blue energy form. Rendering adds a subtle freeze field and uses the aim guide from the orb position rather than introducing a second targeting system.

Reason: midair redirection should feel like temporarily stopping time to reconsider the trajectory, while preserving one aiming model, one orb physics system, the rebound/landing rules from 0.8, and repeatable mobile input without extra buttons.


## 2026-09-27 — Prototype 0.10 turns traversal geometry into a futuristic vertical city

Decision: the existing `ground`, `platform` and `obstacle` collision types remain authoritative gameplay semantics. Presentation is added as lightweight `visual` metadata on those same surface records rather than creating separate visual-only level objects or a second collision layout.

Standable platforms may present as rooftop decks, landing pads or hover cars. Non-standable obstacles present as futuristic towers or spires and retain the rebound-only behavior established in 0.8. Generated tower height limits live in `CITY_CONFIG` beside the world generator.

The minimum generated tower height is intentionally greater than the ballistic rise of a full-power 45-degree launch. This removes the obvious one-shot diagonal flyover while still allowing steeper launches and, more importantly, the repeatable midair freeze/redirection system from 0.9 to solve vertical routes.

Reason: platforms and obstacles should have a clear purpose and visual identity without splitting rendering from collision truth, and the skyline should create traversal decisions that make the orb's redirection power matter.

## 2026-09-27 — Prototype 0.11 becomes a permanent-orb hazard survival run

- The playable character remains in energy-orb form permanently. Landing no longer reforms a human character.
- Solid traversal geometry is restricted to floor, ceiling and moving-platform surfaces. Legacy city obstacle surfaces and NPC target systems are removed from the active gameplay loop.
- The procedural course is an enclosed corridor with deterministic floor gaps/spike pits, roof spikes, vertically moving platforms and moving lasers that cycle between active and inactive states.
- Gameplay uses seven lives. Lethal environmental hazards and drone projectiles consume one life and respawn the orb at the latest checkpoint with brief invulnerability. Losing the seventh life automatically resets the run.
- Direct orb contact destroys drones instead of damaging the player. Destroyed drone IDs are retained only while their streamed definitions remain active, so nearby chunk refreshes cannot visibly respawn a destroyed drone while long-run state remains bounded.
- Each procedural chunk ends with a checkpoint. Checkpoint progression is the source of truth for respawn position and difficulty advancement.
- Difficulty is data-driven from checkpoint/chunk progression: moving-platform speed/range, laser timing and density, ceiling-spike density, drone count/speed, projectile speed and fire interval scale upward within explicit caps.
- Drones and their projectiles remain slower than the orb's maximum configured speed so evasion remains player-controlled rather than unavoidable.
- Mid-air re-aim keeps the established time-freeze rule: the gameplay clock, dynamic surfaces, lasers, drones and projectiles do not advance while the player is redirecting.
- Current/furthest run distance belongs to the simulation state. Persistent best-distance storage stays in the browser/UI layer so persistence does not contaminate deterministic gameplay logic.
- World surfaces, hazards, checkpoints, drones and projectiles remain bounded through streamed chunk windows to preserve mobile performance and long-run scalability.

Reason: the game is now centered on momentum survival and precision redirection instead of defeating NPCs or landing to transform back. The new boundaries keep hazards, progression, persistence and rendering separable for future expansion.

## 2026-09-27 — Settled-contact launch collision rule

Decision: a swept solid collision that begins exactly on an expanded collision boundary is ignored when the orb's movement is leaving that boundary. This allows a settled orb to launch directly away from the floor, roof or platform instead of treating the starting contact as a new impact at time zero.

Reason: resting contact and incoming collision are different physical states. Keeping that distinction in the shared collision layer fixes ground liftoff without special-casing input or adding launch-only teleport offsets.

## 2026-09-27 — Zero-gravity vertical space corridor

Decision: Energy Relay's authoritative traversal axis is now vertical, progressing upward as world Y decreases. The orb has no constant gravity acceleration; free-flight velocity is preserved until player redirection, collision response or configured damping changes it.

The survival course is bounded by continuous left and right walls rather than a floor and roof. Procedural chunks stack upward. Moving platforms travel primarily across the corridor, wall spikes project inward, and timed lasers span horizontally while moving vertically. Checkpoint crossing, respawn positions, difficulty progression, distance measurement, camera tracking and streamed-world focus all derive from the same upward-Y progression model.

Reason: the space presentation and bottom-to-top play direction should be mechanical truths rather than camera tricks. Rotating the progression source of truth keeps gameplay, hazards, streaming and records consistent and avoids maintaining a second horizontal coordinate model behind vertical presentation.

## 2026-09-27 — Midair re-aim uses slow motion, not a hard freeze

Decision: entering the midair re-aim state slows authoritative gameplay time to 20% rather than stopping it. Orb movement, moving platforms, laser timing, drones, projectiles, invulnerability timers and world simulation all advance using the same scaled gameplay delta while aiming. Camera interpolation remains presentation-time based so the control stays readable and responsive.

Decision: lasers are persistent wall-mounted devices. Their collision beam spans the corridor from one side to the other at a fixed world position. The emitter hardware remains visible continuously; only the beam's active state cycles on and off. Procedural lasers alternate source sides for visual variety without changing collision semantics.

Reason: re-aiming should preserve pressure and momentum instead of becoming a complete pause, while laser hazards should read as physical devices switching power states rather than objects appearing and disappearing.

## 2026-09-27 — Every active gameplay touch engages slow motion

Decision: slow motion is keyed to an active gameplay pointer rather than only the midair redirect state. The initial launch aim and every later redirect therefore run authoritative gameplay at 20% speed for as long as the player holds the screen. Releasing the touch returns gameplay to full speed.

Decision: persistent laser emitters keep the same wall-to-wall geometry and on/off behavior, but their base cycle is lengthened from 2.8 seconds to 3.6 seconds and the minimum cycle from 1.35 seconds to 1.8 seconds so their timing is easier to read without removing pressure.

Reason: touching the screen should always create the same planning window, and laser timing should feel deliberate rather than flickery.

