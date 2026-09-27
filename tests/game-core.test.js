import test from "node:test";
import assert from "node:assert/strict";

import {
  CITY_CONFIG,
  GAME_CONFIG,
  NPC_CONFIG,
  STARTER_SURFACES,
  WORLD_CONFIG,
  beginAim,
  cancelAim,
  createGameState,
  findEarliestNpcCollision,
  findEarliestSurfaceCollision,
  generateNpcChunk,
  generateWorldChunk,
  getLaunchVector,
  getWorldNpcs,
  getWorldSurfaces,
  refreshWorldForFocus,
  releaseAim,
  stepGame,
  updateAim
} from "../src/game-core.js";

test("new run starts in human form with an inactive orb", () => {
  const state = createGameState();

  assert.equal(state.mode, "ready");
  assert.equal(state.orb.active, false);
  assert.equal(state.burstCount, 0);
  assert.equal(state.score.npcHits, 0);
});

test("direct drag aims the orb in the same direction as the gesture", () => {
  const state = createGameState();

  assert.equal(beginAim(state, 100, 100, 7), true);
  assert.equal(updateAim(state, 220, 40, 7), true);

  const aim = getLaunchVector(state);
  assert.ok(aim.x > 0);
  assert.ok(aim.y < 0);
  assert.ok(aim.power > 0);
});

test("drag distance controls launch speed within configured bounds", () => {
  const weak = createGameState();
  beginAim(weak, 0, 0, 1);
  updateAim(weak, 40, 0, 1);
  releaseAim(weak, 1);

  const strong = createGameState();
  beginAim(strong, 0, 0, 2);
  updateAim(strong, GAME_CONFIG.maxAimDistance * 2, 0, 2);
  releaseAim(strong, 2);

  const weakSpeed = Math.hypot(weak.orb.vx, weak.orb.vy);
  const strongSpeed = Math.hypot(strong.orb.vx, strong.orb.vy);

  assert.ok(strongSpeed > weakSpeed);
  assert.ok(weakSpeed >= GAME_CONFIG.minLaunchSpeed);
  assert.ok(strongSpeed <= GAME_CONFIG.maxLaunchSpeed + 0.001);
});

test("a short tap reuses the previous aim rather than creating zero velocity", () => {
  const state = createGameState();

  beginAim(state, 40, 40, 3);
  assert.equal(releaseAim(state, 3), true);

  assert.equal(state.mode, "orb");
  assert.ok(Math.hypot(state.orb.vx, state.orb.vy) >= GAME_CONFIG.minLaunchSpeed);
});

test("cancelled aim safely returns to ready state", () => {
  const state = createGameState();

  beginAim(state, 100, 100, 4);
  updateAim(state, 160, 80, 4);

  assert.equal(cancelAim(state, 4), true);
  assert.equal(state.mode, "ready");
  assert.equal(state.launch.pointerId, null);
});

test("launch transforms the player into the same blue energy-orb gameplay state", () => {
  const state = createGameState();

  beginAim(state, 100, 100, 5);
  updateAim(state, 210, 45, 5);
  assert.equal(releaseAim(state, 5), true);

  assert.equal(state.mode, "orb");
  assert.equal(state.orb.active, true);
  assert.equal(state.burstCount, 1);
  assert.equal(state.animation.transformPulse, 1);
});

test("pressing during orb flight freezes the orb and gameplay for re-aiming", () => {
  const state = createGameState();
  const walkingNpc = getWorldNpcs(state).find((npc) => npc.mode === "walking");

  state.mode = "orb";
  state.orb.active = true;
  state.orb.x = 260;
  state.orb.y = 40;
  state.orb.vx = 520;
  state.orb.vy = -180;

  const orbX = state.orb.x;
  const orbY = state.orb.y;
  const orbVx = state.orb.vx;
  const orbVy = state.orb.vy;
  const npcX = walkingNpc?.x;

  assert.equal(beginAim(state, 400, 220, 21), true);
  assert.equal(state.mode, "airAiming");

  stepGame(state, 0.05);

  assert.equal(state.orb.x, orbX);
  assert.equal(state.orb.y, orbY);
  assert.equal(state.orb.vx, orbVx);
  assert.equal(state.orb.vy, orbVy);
  if (walkingNpc) assert.equal(walkingNpc.x, npcX);
});

test("midair re-aim redirects the same orb without creating a new burst", () => {
  const state = createGameState();

  state.mode = "orb";
  state.orb.active = true;
  state.orb.x = 310;
  state.orb.y = 25;
  state.orb.vx = 600;
  state.orb.vy = 80;
  state.burstCount = 3;

  assert.equal(beginAim(state, 500, 250, 22), true);
  assert.equal(updateAim(state, 390, 150, 22), true);

  const frozenX = state.orb.x;
  const frozenY = state.orb.y;

  assert.equal(releaseAim(state, 22), true);

  assert.equal(state.mode, "orb");
  assert.equal(state.orb.active, true);
  assert.equal(state.orb.x, frozenX);
  assert.equal(state.orb.y, frozenY);
  assert.ok(state.orb.vx < 0);
  assert.ok(state.orb.vy < 0);
  assert.equal(state.burstCount, 3);
});

test("cancelling a midair re-aim resumes the original trajectory", () => {
  const state = createGameState();

  state.mode = "orb";
  state.orb.active = true;
  state.orb.x = 250;
  state.orb.y = 10;
  state.orb.vx = 430;
  state.orb.vy = -210;

  const originalVx = state.orb.vx;
  const originalVy = state.orb.vy;

  beginAim(state, 420, 210, 23);
  updateAim(state, 320, 310, 23);

  assert.equal(cancelAim(state, 23), true);
  assert.equal(state.mode, "orb");
  assert.equal(state.orb.vx, originalVx);
  assert.equal(state.orb.vy, originalVy);
});

test("orb can freeze and redirect repeatedly during one airborne burst", () => {
  const state = createGameState();

  state.mode = "orb";
  state.orb.active = true;
  state.orb.x = 240;
  state.orb.y = 0;
  state.orb.vx = 500;
  state.orb.vy = -120;
  state.burstCount = 1;

  beginAim(state, 400, 200, 24);
  updateAim(state, 470, 120, 24);
  releaseAim(state, 24);
  assert.ok(state.orb.vx > 0);
  assert.ok(state.orb.vy < 0);

  beginAim(state, 420, 220, 25);
  updateAim(state, 350, 300, 25);
  releaseAim(state, 25);

  assert.equal(state.mode, "orb");
  assert.ok(state.orb.vx < 0);
  assert.ok(state.orb.vy > 0);
  assert.equal(state.burstCount, 1);
});

test("orb radius participates in swept world collision", () => {
  const state = createGameState();
  const hit = findEarliestSurfaceCollision(
    state,
    300,
    100,
    350,
    100,
    GAME_CONFIG.orbRadius
  );

  assert.ok(hit);
  assert.equal(hit.surface.id, "wall-a");
  assert.equal(hit.normalX, -1);
  assert.equal(hit.x, 340 - GAME_CONFIG.orbRadius);
});

test("side impact with a wall bounces instead of reforming the character", () => {
  const state = createGameState();

  state.mode = "orb";
  state.orb.active = true;
  state.orb.x = 300;
  state.orb.y = 100;
  state.orb.vx = 700;
  state.orb.vy = 0;

  stepGame(state, 0.05);

  assert.equal(state.mode, "orb");
  assert.equal(state.orb.active, true);
  assert.ok(state.orb.vx < 0);
  assert.equal(state.orb.lastBounce.surfaceId, "wall-a");
  assert.equal(state.orb.lastBounce.normalX, -1);
  assert.ok(state.animation.bouncePulse > 0);
});

test("underside impact with a platform bounces downward instead of sticking", () => {
  const state = createGameState();

  state.mode = "orb";
  state.orb.active = true;
  state.orb.x = 150;
  state.orb.y = 150;
  state.orb.vx = 0;
  state.orb.vy = -650;

  stepGame(state, 0.05);

  assert.equal(state.mode, "orb");
  assert.equal(state.orb.active, true);
  assert.ok(state.orb.vy > 0);
  assert.equal(state.orb.lastBounce.surfaceId, "platform-a");
  assert.equal(state.orb.lastBounce.normalY, 1);
});

test("top of an obstacle is not standable and bounces the orb", () => {
  const state = createGameState();
  const wall = getWorldSurfaces(state).find((surface) => surface.id === "wall-a");

  state.mode = "orb";
  state.orb.active = true;
  state.orb.x = wall.x + wall.width * 0.5;
  state.orb.y = wall.y - GAME_CONFIG.orbRadius - 8;
  state.orb.vx = 0;
  state.orb.vy = 420;

  stepGame(state, 0.05);

  assert.equal(state.mode, "orb");
  assert.equal(state.orb.active, true);
  assert.ok(state.orb.vy < 0);
  assert.equal(state.orb.lastBounce.surfaceId, "wall-a");
  assert.equal(state.orb.lastBounce.normalY, -1);
});

test("top landing on ground reforms the player standing on the floor", () => {
  const state = createGameState();

  state.mode = "orb";
  state.orb.active = true;
  state.orb.x = 0;
  state.orb.y = 130;
  state.orb.vx = 0;
  state.orb.vy = 600;

  for (let i = 0; i < 10 && state.mode === "orb"; i += 1) {
    stepGame(state, 0.05);
  }

  assert.equal(state.mode, "ready");
  assert.equal(state.orb.active, false);
  assert.equal(state.orb.y, WORLD_CONFIG.groundTop - GAME_CONFIG.orbRadius);
  assert.equal(state.player.x, state.orb.x);
  assert.equal(state.player.y, WORLD_CONFIG.groundTop);
  assert.equal(state.orb.contact.surfaceId, "starter-ground");
  assert.ok(state.animation.reformPulse > 0);
});

test("top landing on a platform reforms the player on the platform top", () => {
  const state = createGameState();

  state.mode = "orb";
  state.orb.active = true;
  state.orb.x = 150;
  state.orb.y = 55;
  state.orb.vx = 0;
  state.orb.vy = 420;

  stepGame(state, 0.05);

  assert.equal(state.mode, "ready");
  assert.equal(state.orb.active, false);
  assert.equal(state.orb.contact.surfaceId, "platform-a");
  assert.equal(state.player.y, 88);
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

test("city surfaces carry presentation metadata without changing collision semantics", () => {
  const state = createGameState();

  for (const surface of getWorldSurfaces(state)) {
    assert.equal(typeof surface.visual, "string");
    assert.ok(surface.visual.length > 0);
    assert.ok(["ground", "platform", "obstacle"].includes(surface.type));
  }

  const hoverCars = getWorldSurfaces(state).filter(
    (surface) => surface.type === "platform" && surface.visual === "hoverCar"
  );
  assert.ok(hoverCars.length > 0);
});

test("tower obstacles defeat the simple full-power 45-degree flyover arc", () => {
  const diagonalVerticalSpeed = GAME_CONFIG.maxLaunchSpeed / Math.sqrt(2);
  const diagonalArcRise =
    (diagonalVerticalSpeed * diagonalVerticalSpeed) / (2 * GAME_CONFIG.orbGravity);

  assert.ok(CITY_CONFIG.minTowerHeight > diagonalArcRise);

  for (let chunkIndex = 0; chunkIndex < 8; chunkIndex += 1) {
    const obstacles = generateWorldChunk(chunkIndex).filter(
      (surface) => surface.type === "obstacle"
    );
    assert.ok(obstacles.length > 0);
    assert.ok(
      obstacles.every(
        (surface) =>
          surface.height >= CITY_CONFIG.minTowerHeight &&
          surface.height <= CITY_CONFIG.maxTowerHeight
      )
    );
  }
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
