import test from "node:test";
import assert from "node:assert/strict";

import {
  GAME_CONFIG,
  NPC_CONFIG,
  STARTER_SURFACES,
  WORLD_CONFIG,
  beginAim,
  createGameState,
  findEarliestNpcCollision,
  findEarliestSurfaceCollision,
  generateNpcChunk,
  generateWorldChunk,
  getWorldNpcs,
  getWorldSurfaces,
  refreshWorldForFocus,
  releaseAim,
  stepGame,
  updateAim
} from "../src/game-core.js";

test("drag direction becomes throw direction", () => {
  const state = createGameState();

  beginAim(state, 100, 100, 7);
  updateAim(state, 220, 40, 7);
  const released = releaseAim(state, 7);

  assert.equal(released, true);
  assert.equal(state.mode, "flying");
  assert.ok(state.spear.vx > 0);
  assert.ok(state.spear.vy < 0);
});

test("drag distance controls throw power within configured bounds", () => {
  const weak = createGameState();
  beginAim(weak, 0, 0, 1);
  updateAim(weak, 40, 0, 1);
  releaseAim(weak, 1);

  const strong = createGameState();
  beginAim(strong, 0, 0, 1);
  updateAim(strong, GAME_CONFIG.maxAimDistance * 2, 0, 1);
  releaseAim(strong, 1);

  const weakSpeed = Math.hypot(weak.spear.vx, weak.spear.vy);
  const strongSpeed = Math.hypot(strong.spear.vx, strong.spear.vy);

  assert.ok(strongSpeed > weakSpeed);
  assert.ok(strongSpeed <= GAME_CONFIG.maxThrowSpeed + 0.001);
  assert.ok(weakSpeed >= GAME_CONFIG.minThrowSpeed);
});

test("pressing during flight relocates the character to the spear and starts aiming", () => {
  const state = createGameState();

  beginAim(state, 0, 0, 3);
  updateAim(state, 180, -80, 3);
  releaseAim(state, 3);
  stepGame(state, 0.02);

  const spearX = state.spear.x;
  const spearY = state.spear.y;

  const result = beginAim(state, 60, 70, 4);

  assert.equal(result.teleported, true);
  assert.equal(state.mode, "aiming");
  assert.equal(state.player.x, spearX);
  assert.equal(state.player.y, spearY);
  assert.equal(state.spear.vx, 0);
  assert.equal(state.spear.vy, 0);
  assert.equal(state.animation.airborneAim, true);
  assert.equal(state.animation.playerAirborne, true);
});


test("grounded aiming does not enter the airborne slow-motion presentation state", () => {
  const state = createGameState();

  beginAim(state, 10, 20, 1);

  assert.equal(state.animation.airborneAim, false);
  assert.equal(state.animation.playerAirborne, false);
});

test("airborne aiming advances its visual clock at the configured slow-motion rate", () => {
  const state = createGameState();

  beginAim(state, 0, 0, 1);
  updateAim(state, 180, -80, 1);
  releaseAim(state, 1);
  stepGame(state, 0.02);
  beginAim(state, 20, 30, 2);

  stepGame(state, 0.05);

  assert.ok(state.animation.airborneAimClock > 0);
  assert.ok(
    state.animation.airborneAimClock <=
      0.05 * GAME_CONFIG.airborneAimVisualTimeScale + 0.000001
  );
});

test("releasing a throw records direction and starts a short follow-through animation", () => {
  const state = createGameState();

  beginAim(state, 0, 0, 5);
  updateAim(state, 150, -60, 5);
  releaseAim(state, 5);

  assert.equal(state.animation.airborneAim, false);
  assert.equal(state.animation.throwFollowThrough, 1);
  assert.ok(state.animation.throwDirectionX > 0);
  assert.ok(state.animation.throwDirectionY < 0);

  stepGame(state, GAME_CONFIG.throwFollowThroughDuration * 0.5);
  assert.ok(state.animation.throwFollowThrough < 1);
  assert.ok(state.animation.throwFollowThrough > 0);
});

test("flight simulation applies gravity and advances the camera toward the spear", () => {
  const state = createGameState();

  beginAim(state, 0, 0, 9);
  updateAim(state, 200, -100, 9);
  releaseAim(state, 9);

  const initialVy = state.spear.vy;
  const initialCameraX = state.camera.x;
  stepGame(state, 0.03);

  assert.ok(state.spear.vy > initialVy);
  assert.notEqual(state.camera.x, initialCameraX);
  assert.ok(state.spear.travel > 0);
});

test("a short tap still throws using the previous aim instead of producing zero velocity", () => {
  const state = createGameState();

  beginAim(state, 40, 40, 2);
  releaseAim(state, 2);

  assert.equal(state.mode, "flying");
  assert.ok(Math.hypot(state.spear.vx, state.spear.vy) >= GAME_CONFIG.minThrowSpeed);
});


test("active world surfaces are unique valid rectangles", () => {
  const state = createGameState();
  const ids = new Set();

  for (const surface of getWorldSurfaces(state)) {
    assert.ok(surface.width > 0);
    assert.ok(surface.height > 0);
    assert.ok(["ground", "platform", "obstacle"].includes(surface.type));
    assert.equal(ids.has(surface.id), false);
    ids.add(surface.id);
  }
});

test("swept collision catches a fast spear crossing an obstacle", () => {
  const state = createGameState();
  const hit = findEarliestSurfaceCollision(state, 300, 100, 430, 100);

  assert.ok(hit);
  assert.equal(hit.surface.id, "wall-a");
  assert.equal(hit.x, 340);
  assert.equal(hit.normalX, -1);
});

test("falling spear sticks to the ground instead of passing through it", () => {
  const state = createGameState();
  state.mode = "flying";
  state.spear.x = 0;
  state.spear.y = 120;
  state.spear.vx = 0;
  state.spear.vy = 600;

  for (let i = 0; i < 10 && state.mode === "flying"; i += 1) {
    stepGame(state, 0.05);
  }

  assert.equal(state.mode, "stuck");
  assert.equal(state.spear.y, 180);
  assert.equal(state.spear.contact.surfaceId, "starter-ground");
  assert.equal(state.spear.vx, 0);
  assert.equal(state.spear.vy, 0);
});

test("pressing a stuck spear relays the character to its collision point", () => {
  const state = createGameState();
  state.mode = "stuck";
  state.spear.x = 340;
  state.spear.y = 100;
  state.spear.contact = { surfaceId: "wall-a", normalX: -1, normalY: 0 };

  const result = beginAim(state, 20, 20, 8);

  assert.equal(result.teleported, true);
  assert.equal(state.player.x, 340);
  assert.equal(state.player.y, 100);
  assert.equal(state.mode, "aiming");
});


test("procedural chunks are deterministic for the same chunk index", () => {
  const first = generateWorldChunk(7);
  const second = generateWorldChunk(7);

  assert.deepEqual(first, second);
  assert.ok(first.some((surface) => surface.type === "ground"));
  assert.ok(first.some((surface) => surface.type === "platform"));
  assert.ok(first.some((surface) => surface.type === "obstacle"));
});

test("procedural ground chunks join without gaps", () => {
  const firstGround = generateWorldChunk(3).find((surface) => surface.type === "ground");
  const nextGround = generateWorldChunk(4).find((surface) => surface.type === "ground");

  assert.equal(firstGround.x + firstGround.width, nextGround.x);
  assert.equal(firstGround.y, WORLD_CONFIG.groundTop);
  assert.equal(nextGround.y, WORLD_CONFIG.groundTop);
});

test("world streaming advances active chunks while keeping surface count bounded", () => {
  const state = createGameState();
  const farX = WORLD_CONFIG.proceduralStartX + WORLD_CONFIG.chunkWidth * 40 + 100;

  const changed = refreshWorldForFocus(state, farX);

  assert.equal(changed, true);
  assert.ok(state.world.activeStartChunk >= 38);
  assert.ok(state.world.activeEndChunk <= 44);
  assert.ok(getWorldSurfaces(state).length <= STARTER_SURFACES.length + 7 * 6);
});

test("streamed procedural geometry participates in spear collision", () => {
  const state = createGameState();
  const chunkIndex = 8;
  const chunk = generateWorldChunk(chunkIndex);
  const obstacle = chunk.find((surface) => surface.type === "obstacle");

  refreshWorldForFocus(state, obstacle.x);
  const hit = findEarliestSurfaceCollision(
    state,
    obstacle.x - 40,
    obstacle.y + obstacle.height * 0.5,
    obstacle.x + obstacle.width + 40,
    obstacle.y + obstacle.height * 0.5
  );

  assert.ok(hit);
  assert.equal(hit.surface.id, obstacle.id);
});


test("camera uses a wider-than-1:1 world view", () => {
  assert.ok(GAME_CONFIG.cameraZoom > 0);
  assert.ok(GAME_CONFIG.cameraZoom < 1);
});

test("procedural NPC generation is deterministic and bounded per chunk", () => {
  const first = generateNpcChunk(6);
  const second = generateNpcChunk(6);

  assert.deepEqual(first, second);
  assert.equal(first.length, NPC_CONFIG.perChunk);
  assert.ok(first.every((npc) => npc.x >= WORLD_CONFIG.proceduralStartX));
  assert.ok(first.every((npc) => npc.patrolMax > npc.patrolMin));
});

test("walking NPCs patrol without requiring rendering state", () => {
  const state = createGameState();
  const npc = getWorldNpcs(state).find((candidate) => candidate.id === "starter-npc-1");

  assert.ok(npc);
  assert.equal(npc.mode, "walking");

  const startX = npc.x;
  stepGame(state, 0.05);

  assert.notEqual(npc.x, startX);
  assert.equal(npc.y, WORLD_CONFIG.groundTop);
});

test("spear collision throws an NPC and increments the run hit counter", () => {
  const state = createGameState();
  const npc = getWorldNpcs(state).find((candidate) => candidate.id === "starter-npc-0");

  state.mode = "flying";
  state.spear.x = npc.x - 60;
  state.spear.y = npc.y - 30;
  state.spear.vx = 1200;
  state.spear.vy = 0;

  const predictedHit = findEarliestNpcCollision(
    state,
    state.spear.x,
    state.spear.y,
    state.spear.x + 60,
    state.spear.y
  );
  assert.ok(predictedHit);
  assert.equal(predictedHit.npc.id, npc.id);

  stepGame(state, 0.05);

  assert.equal(state.score.npcHits, 1);
  assert.equal(npc.mode, "thrown");
  assert.ok(Math.abs(npc.vx) > 0);
  assert.ok(npc.vy < 0);

  stepGame(state, 0.05);
  assert.equal(state.score.npcHits, 1);
});

test("NPC streaming stays bounded as procedural progress advances", () => {
  const state = createGameState();
  const farX = WORLD_CONFIG.proceduralStartX + WORLD_CONFIG.chunkWidth * 50 + 100;

  refreshWorldForFocus(state, farX);

  const maximumExpected =
    3 +
    (WORLD_CONFIG.chunksBehind + WORLD_CONFIG.chunksAhead + 1) * NPC_CONFIG.perChunk;

  assert.ok(getWorldNpcs(state).length <= maximumExpected);
});
