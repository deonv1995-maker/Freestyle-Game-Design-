import test from "node:test";
import assert from "node:assert/strict";

import {
  GAME_CONFIG,
  NPC_CONFIG,
  STARTER_SURFACES,
  WORLD_CONFIG,
  beginSlingshot,
  beginSteering,
  cancelSlingshot,
  createGameState,
  endSteering,
  findEarliestNpcCollision,
  findEarliestSurfaceCollision,
  generateNpcChunk,
  generateWorldChunk,
  getLaunchVector,
  getWorldNpcs,
  getWorldSurfaces,
  refreshWorldForFocus,
  releaseSlingshot,
  stepGame,
  updateSlingshot,
  updateSteering
} from "../src/game-core.js";

test("new run starts in human form with an inactive orb", () => {
  const state = createGameState();

  assert.equal(state.mode, "ready");
  assert.equal(state.orb.active, false);
  assert.equal(state.burstCount, 0);
  assert.equal(state.score.npcHits, 0);
});

test("left-side slingshot pull aims opposite the draw direction", () => {
  const state = createGameState();

  assert.equal(beginSlingshot(state, 180, 220, 7), true);
  updateSlingshot(state, 80, 280, 7);

  const aim = getLaunchVector(state);
  assert.ok(aim.x > 0);
  assert.ok(aim.y < 0);
  assert.ok(aim.power > 0);
});

test("slingshot draw distance controls launch speed within configured bounds", () => {
  const weak = createGameState();
  beginSlingshot(weak, 180, 180, 1);
  updateSlingshot(weak, 140, 190, 1);
  assert.equal(releaseSlingshot(weak, 1), true);

  const strong = createGameState();
  beginSlingshot(strong, 180, 180, 2);
  updateSlingshot(strong, -200, 320, 2);
  assert.equal(releaseSlingshot(strong, 2), true);

  const weakSpeed = Math.hypot(weak.orb.vx, weak.orb.vy);
  const strongSpeed = Math.hypot(strong.orb.vx, strong.orb.vy);

  assert.ok(strongSpeed > weakSpeed);
  assert.ok(weakSpeed >= GAME_CONFIG.minLaunchSpeed);
  assert.ok(strongSpeed <= GAME_CONFIG.maxLaunchSpeed + 0.001);
});

test("releasing without a meaningful pull cancels instead of launching", () => {
  const state = createGameState();

  beginSlingshot(state, 100, 100, 3);
  updateSlingshot(state, 105, 104, 3);

  assert.equal(releaseSlingshot(state, 3), false);
  assert.equal(state.mode, "ready");
  assert.equal(state.orb.active, false);
  assert.equal(state.burstCount, 0);
});

test("cancelled touch gesture safely returns to ready state", () => {
  const state = createGameState();

  beginSlingshot(state, 100, 100, 4);
  updateSlingshot(state, 40, 130, 4);

  assert.equal(cancelSlingshot(state, 4), true);
  assert.equal(state.mode, "ready");
  assert.equal(state.launch.pointerId, null);
});

test("launch transforms the player into the moving energy orb", () => {
  const state = createGameState();

  beginSlingshot(state, 180, 200, 5);
  updateSlingshot(state, 80, 240, 5);
  assert.equal(releaseSlingshot(state, 5), true);

  assert.equal(state.mode, "orb");
  assert.equal(state.orb.active, true);
  assert.equal(state.burstCount, 1);
  assert.ok(Math.hypot(state.orb.vx, state.orb.vy) >= GAME_CONFIG.minLaunchSpeed);
  assert.equal(state.animation.transformPulse, 1);
});

test("right-side steering bends orb velocity while orb form is active", () => {
  const state = createGameState();

  beginSlingshot(state, 180, 200, 6);
  updateSlingshot(state, 80, 200, 6);
  releaseSlingshot(state, 6);

  const initialVy = state.orb.vy;
  assert.equal(beginSteering(state, 800, 250, 9), true);
  assert.equal(updateSteering(state, 800, 120, 9), true);

  stepGame(state, 0.05);

  assert.ok(state.orb.vy < initialVy + GAME_CONFIG.orbGravity * 0.05);
  assert.ok(state.steering.strength > 0);
  assert.equal(endSteering(state, 9), true);
  assert.equal(state.steering.pointerId, null);
});

test("steering cannot begin while the player is in human form", () => {
  const state = createGameState();
  assert.equal(beginSteering(state, 700, 200, 1), false);
});

test("orb impact with the ground reforms the player at the exact contact", () => {
  const state = createGameState();

  state.mode = "orb";
  state.orb.active = true;
  state.orb.x = 0;
  state.orb.y = 120;
  state.orb.vx = 0;
  state.orb.vy = 600;

  for (let i = 0; i < 10 && state.mode === "orb"; i += 1) {
    stepGame(state, 0.05);
  }

  assert.equal(state.mode, "ready");
  assert.equal(state.orb.active, false);
  assert.equal(state.orb.y, WORLD_CONFIG.groundTop);
  assert.equal(state.player.x, state.orb.x);
  assert.equal(state.player.y, state.orb.y);
  assert.equal(state.orb.contact.surfaceId, "starter-ground");
  assert.ok(state.animation.reformPulse > 0);
});

test("orb collision knocks an NPC down and counts the hit once", () => {
  const state = createGameState();
  const npc = getWorldNpcs(state).find((candidate) => candidate.id === "starter-npc-0");

  state.mode = "orb";
  state.orb.active = true;
  state.orb.x = npc.x - 60;
  state.orb.y = npc.y - 30;
  state.orb.vx = 1200;
  state.orb.vy = 0;

  const predictedHit = findEarliestNpcCollision(
    state,
    state.orb.x,
    state.orb.y,
    state.orb.x + 60,
    state.orb.y
  );

  assert.ok(predictedHit);
  assert.equal(predictedHit.npc.id, npc.id);

  stepGame(state, 0.05);

  assert.equal(state.score.npcHits, 1);
  assert.equal(npc.mode, "thrown");
  assert.equal(state.world.defeatedNpcIds.has(npc.id), true);

  stepGame(state, 0.05);
  assert.equal(state.score.npcHits, 1);
});

test("defeated NPC falls before disappearing from the active world", () => {
  const state = createGameState();
  const npc = getWorldNpcs(state).find((candidate) => candidate.id === "starter-npc-0");

  state.mode = "orb";
  state.orb.active = true;
  state.orb.x = npc.x - 60;
  state.orb.y = npc.y - 30;
  state.orb.vx = 1200;
  state.orb.vy = 0;
  stepGame(state, 0.05);

  let sawFallen = false;
  for (
    let i = 0;
    i < 80 && getWorldNpcs(state).some((candidate) => candidate.id === npc.id);
    i += 1
  ) {
    stepGame(state, 0.05);
    const active = getWorldNpcs(state).find((candidate) => candidate.id === npc.id);
    if (active?.mode === "fallen") sawFallen = true;
  }

  assert.equal(sawFallen, true);
  assert.equal(getWorldNpcs(state).some((candidate) => candidate.id === npc.id), false);
});

test("active world surfaces remain unique valid rectangles", () => {
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

test("swept collision still catches a fast crossing of a thin obstacle", () => {
  const state = createGameState();
  const hit = findEarliestSurfaceCollision(state, 300, 100, 430, 100);

  assert.ok(hit);
  assert.equal(hit.surface.id, "wall-a");
  assert.equal(hit.x, 340);
  assert.equal(hit.normalX, -1);
});

test("procedural chunks remain deterministic and their ground joins without gaps", () => {
  const first = generateWorldChunk(7);
  const second = generateWorldChunk(7);
  const groundA = generateWorldChunk(3).find((surface) => surface.type === "ground");
  const groundB = generateWorldChunk(4).find((surface) => surface.type === "ground");

  assert.deepEqual(first, second);
  assert.equal(groundA.x + groundA.width, groundB.x);
  assert.equal(groundA.y, WORLD_CONFIG.groundTop);
  assert.equal(groundB.y, WORLD_CONFIG.groundTop);
});

test("procedural NPC generation remains deterministic and bounded per chunk", () => {
  const first = generateNpcChunk(6);
  const second = generateNpcChunk(6);

  assert.deepEqual(first, second);
  assert.equal(first.length, NPC_CONFIG.perChunk);
  assert.ok(first.every((npc) => npc.patrolMax > npc.patrolMin));
});

test("world and NPC streaming remain bounded far into a run", () => {
  const state = createGameState();
  const farX = WORLD_CONFIG.proceduralStartX + WORLD_CONFIG.chunkWidth * 50 + 100;

  assert.equal(refreshWorldForFocus(state, farX), true);

  assert.ok(getWorldSurfaces(state).length <= STARTER_SURFACES.length + 7 * 6);
  const maximumNpcs =
    3 +
    (WORLD_CONFIG.chunksBehind + WORLD_CONFIG.chunksAhead + 1) * NPC_CONFIG.perChunk;
  assert.ok(getWorldNpcs(state).length <= maximumNpcs);
});

test("camera remains deliberately zoomed out for mobile traversal visibility", () => {
  assert.ok(GAME_CONFIG.cameraZoom > 0);
  assert.ok(GAME_CONFIG.cameraZoom < 1);
});
