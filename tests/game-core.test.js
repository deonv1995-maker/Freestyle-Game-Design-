import test from "node:test";
import assert from "node:assert/strict";

import {
  DRONE_CONFIG,
  GAME_CONFIG,
  HAZARD_CONFIG,
  STARTER_HAZARDS,
  STARTER_SURFACES,
  WORLD_CONFIG,
  beginAim,
  cancelAim,
  createGameState,
  findEarliestHazardCollision,
  findEarliestSurfaceCollision,
  generateCheckpoint,
  generateDroneChunk,
  generateHazardChunk,
  generateWorldChunk,
  getLaunchVector,
  getWorldCheckpoints,
  getWorldDrones,
  getWorldHazards,
  getWorldProjectiles,
  getWorldSurfaces,
  loseLife,
  refreshWorldForFocus,
  releaseAim,
  stepGame,
  updateAim
} from "../src/game-core.js";

test("new run starts as a permanent orb with seven lives", () => {
  const state = createGameState();

  assert.equal(state.mode, "ready");
  assert.equal(state.orb.active, true);
  assert.equal(state.lives, 7);
  assert.equal(state.burstCount, 0);
  assert.equal(state.checkpoint.index, 0);
});

test("direct drag aims in the same direction as the gesture", () => {
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

test("a short tap reuses the previous aim instead of creating zero velocity", () => {
  const state = createGameState();

  beginAim(state, 40, 40, 3);
  assert.equal(releaseAim(state, 3), true);

  assert.equal(state.mode, "orb");
  assert.ok(Math.hypot(state.orb.vx, state.orb.vy) >= GAME_CONFIG.minLaunchSpeed);
});

test("resting orb can launch upward directly from the floor", () => {
  const state = createGameState();
  const restingY = state.orb.y;

  assert.equal(beginAim(state, 100, 100, 31), true);
  assert.equal(updateAim(state, 100, 0, 31), true);
  assert.equal(releaseAim(state, 31), true);
  assert.ok(state.orb.vy < 0);

  stepGame(state, 0.05);

  assert.equal(state.mode, "orb");
  assert.ok(state.orb.y < restingY);
  assert.ok(state.orb.vy < 0);
  assert.equal(state.orb.lastBounce, null);
});

test("cancelled aim returns the resting orb to ready", () => {
  const state = createGameState();

  beginAim(state, 100, 100, 4);
  updateAim(state, 160, 80, 4);

  assert.equal(cancelAim(state, 4), true);
  assert.equal(state.mode, "ready");
  assert.equal(state.launch.pointerId, null);
  assert.equal(state.orb.active, true);
});

test("pressing during orb flight freezes world gameplay for re-aiming", () => {
  const state = createGameState();
  const drone = getWorldDrones(state)[0];

  state.mode = "orb";
  state.orb.x = 260;
  state.orb.y = 20;
  state.orb.vx = 520;
  state.orb.vy = -180;

  const orbX = state.orb.x;
  const orbY = state.orb.y;
  const orbVx = state.orb.vx;
  const orbVy = state.orb.vy;
  const worldClock = state.world.clock;
  const droneX = drone.x;
  const projectileCount = getWorldProjectiles(state).length;

  assert.equal(beginAim(state, 400, 220, 21), true);
  assert.equal(state.mode, "airAiming");

  stepGame(state, 0.05);

  assert.equal(state.orb.x, orbX);
  assert.equal(state.orb.y, orbY);
  assert.equal(state.orb.vx, orbVx);
  assert.equal(state.orb.vy, orbVy);
  assert.equal(state.world.clock, worldClock);
  assert.equal(drone.x, droneX);
  assert.equal(getWorldProjectiles(state).length, projectileCount);
});

test("midair re-aim redirects the same orb without creating a new burst", () => {
  const state = createGameState();

  state.mode = "orb";
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
  assert.equal(state.orb.x, frozenX);
  assert.equal(state.orb.y, frozenY);
  assert.ok(state.orb.vx < 0);
  assert.ok(state.orb.vy < 0);
  assert.equal(state.burstCount, 3);
});

test("all solid world contacts rebound instead of reforming a human character", () => {
  const state = createGameState();

  state.mode = "orb";
  state.orb.x = 0;
  state.orb.y = WORLD_CONFIG.groundTop - GAME_CONFIG.orbRadius - 10;
  state.orb.vx = 180;
  state.orb.vy = 360;

  stepGame(state, 0.05);

  assert.equal(state.orb.active, true);
  assert.equal(state.mode, "orb");
  assert.ok(state.orb.vy < 0);
  assert.equal(state.orb.lastBounce.surfaceId, "starter-floor-left");
});

test("low-momentum floor bounces settle the orb back to ready", () => {
  const state = createGameState();

  state.mode = "orb";
  state.orb.x = 0;
  state.orb.y = WORLD_CONFIG.groundTop - GAME_CONFIG.orbRadius - 2;
  state.orb.vx = 18;
  state.orb.vy = 40;

  for (let i = 0; i < 5 && state.mode === "orb"; i += 1) {
    stepGame(state, 0.05);
  }

  assert.equal(state.mode, "ready");
  assert.equal(state.orb.vx, 0);
  assert.equal(state.orb.vy, 0);
});

test("the course has a continuous roof and no legacy obstacle surfaces", () => {
  const state = createGameState();
  const surfaces = getWorldSurfaces(state);

  assert.ok(surfaces.some((surface) => surface.type === "ceiling"));
  assert.ok(surfaces.some((surface) => surface.type === "platform"));
  assert.equal(surfaces.some((surface) => surface.type === "obstacle"), false);

  for (const surface of surfaces) {
    assert.ok(["floor", "ceiling", "platform"].includes(surface.type));
    assert.ok(surface.width > 0);
    assert.ok(surface.height > 0);
  }
});

test("top and bottom moving platforms are deterministic per chunk", () => {
  const first = generateWorldChunk(4);
  const second = generateWorldChunk(4);
  const moving = first.filter((surface) => surface.type === "platform");

  assert.deepEqual(first, second);
  assert.equal(moving.length, 2);
  assert.ok(moving.every((surface) => surface.motion?.axis === "y"));
});

test("starter course and generated chunks contain lasers and floor/roof spikes", () => {
  const generated = generateHazardChunk(2);
  const types = new Set([...STARTER_HAZARDS, ...generated].map((hazard) => hazard.type));

  assert.equal(types.has("laser"), true);
  assert.equal(types.has("floorSpikes"), true);
  assert.equal(types.has("ceilingSpikes"), true);
});

test("moving lasers change position and cycle between active and inactive states", () => {
  const state = createGameState();
  const laser = getWorldHazards(state).find((hazard) => hazard.type === "laser");

  const startX = laser.x;
  const seenStates = new Set([laser.active]);

  for (let i = 0; i < 90; i += 1) {
    stepGame(state, 0.05);
    seenStates.add(laser.active);
  }

  assert.notEqual(laser.x, startX);
  assert.equal(seenStates.has(true), true);
  assert.equal(seenStates.has(false), true);
});

test("swept hazard collision detects a spike field before tunneling through it", () => {
  const state = createGameState();
  const spike = getWorldHazards(state).find(
    (hazard) => hazard.id === "starter-pit-spikes"
  );

  const hit = findEarliestHazardCollision(
    state,
    spike.x + spike.width * 0.5,
    spike.y - 100,
    spike.x + spike.width * 0.5,
    spike.y + spike.height + 100
  );

  assert.ok(hit);
  assert.equal(hit.hazard.id, spike.id);
  assert.equal(hit.cause, "floorSpikes");
});

test("a lethal hazard removes one life and respawns at the current checkpoint", () => {
  const state = createGameState();
  const checkpoint = generateCheckpoint(0);

  state.checkpoint.index = checkpoint.index;
  state.checkpoint.x = checkpoint.x;
  state.checkpoint.spawnX = checkpoint.spawnX;
  state.checkpoint.spawnY = checkpoint.spawnY;
  state.lives = 5;

  assert.equal(loseLife(state, "laser"), true);

  assert.equal(state.lives, 4);
  assert.equal(state.mode, "ready");
  assert.equal(state.orb.x, checkpoint.spawnX);
  assert.equal(state.orb.y, checkpoint.spawnY);
  assert.ok(state.orb.invulnerability > 0);
  assert.equal(state.run.lastDeathCause, "laser");
});

test("using all seven lives automatically restarts the run", () => {
  const state = createGameState();

  for (let i = 0; i < GAME_CONFIG.startingLives; i += 1) {
    state.orb.invulnerability = 0;
    assert.equal(loseLife(state, "spikes"), true);
  }

  assert.equal(state.lives, GAME_CONFIG.startingLives);
  assert.equal(state.checkpoint.index, 0);
  assert.equal(state.progress.currentMetres, 0);
  assert.equal(state.progress.furthestMetres, 0);
  assert.equal(state.run.restartCount, 1);
  assert.ok(state.animation.runResetPulse > 0);
});

test("crossing a checkpoint advances respawn location and difficulty", () => {
  const state = createGameState();
  const checkpoint = getWorldCheckpoints(state).find((item) => item.index === 1);

  state.mode = "orb";
  state.orb.x = checkpoint.x + 8;
  state.orb.y = -100;
  state.orb.vx = 0;
  state.orb.vy = 0;
  state.orb.invulnerability = 2;

  stepGame(state, 0.01);

  assert.equal(state.checkpoint.index, 1);
  assert.equal(state.checkpoint.spawnX, checkpoint.spawnX);
  assert.equal(state.progress.difficultyLevel, checkpoint.difficultyAfter);
  assert.ok(state.animation.checkpointPulse > 0);
});

test("distance tracks current progress and furthest run distance", () => {
  const state = createGameState();

  state.mode = "orb";
  state.orb.x = state.progress.startX + 500;
  state.orb.y = -100;
  state.orb.vx = 0;
  state.orb.vy = 0;
  state.orb.invulnerability = 2;
  stepGame(state, 0.01);

  assert.ok(state.progress.currentMetres >= 49);
  const furthest = state.progress.furthestMetres;

  state.orb.x = state.progress.startX + 200;
  stepGame(state, 0.01);

  assert.ok(state.progress.currentMetres < furthest);
  assert.equal(state.progress.furthestMetres, furthest);
});

test("drones are deterministic, slower than the orb and scale with difficulty", () => {
  const easy = generateDroneChunk(0);
  const hard = generateDroneChunk(7);
  const easyAgain = generateDroneChunk(0);

  assert.deepEqual(easy, easyAgain);
  assert.ok(easy.length >= DRONE_CONFIG.basePerChunk);
  assert.ok(hard.length >= easy.length);
  assert.ok(
    [...easy, ...hard].every(
      (drone) =>
        drone.speed < GAME_CONFIG.maxOrbSpeed &&
        drone.projectileSpeed < GAME_CONFIG.maxOrbSpeed
    )
  );
});

test("nearby drones eventually fire targeted projectiles", () => {
  const state = createGameState();
  const drone = getWorldDrones(state)[0];

  state.mode = "ready";
  state.orb.x = drone.x - 180;
  state.orb.y = drone.y;
  state.orb.invulnerability = 3;

  for (let i = 0; i < 80 && getWorldProjectiles(state).length === 0; i += 1) {
    stepGame(state, 0.05);
  }

  assert.ok(getWorldProjectiles(state).length > 0);
});

test("orb contact destroys a drone without costing a life", () => {
  const state = createGameState();
  const drone = getWorldDrones(state).find(
    (candidate) => candidate.id === "starter-drone-0"
  );
  const startingLives = state.lives;

  state.mode = "orb";
  state.orb.x = drone.x - 62;
  state.orb.y = drone.y;
  state.orb.vx = 900;
  state.orb.vy = 0;

  stepGame(state, 0.05);

  assert.equal(state.lives, startingLives);
  assert.equal(state.mode, "orb");
  assert.equal(
    getWorldDrones(state).some((candidate) => candidate.id === drone.id),
    false
  );
  assert.equal(state.world.destroyedDroneIds.has(drone.id), true);

  assert.equal(
    refreshWorldForFocus(
      state,
      WORLD_CONFIG.proceduralStartX + WORLD_CONFIG.chunkWidth + 20
    ),
    true
  );
  assert.equal(
    getWorldDrones(state).some((candidate) => candidate.id === drone.id),
    false
  );
});

test("procedural hazard difficulty increases as checkpoint chunks advance", () => {
  const earlyDrone = generateDroneChunk(0)[0];
  const lateDrone = generateDroneChunk(8)[0];
  const earlyLaser = generateHazardChunk(0).find((hazard) => hazard.type === "laser");
  const lateLaser = generateHazardChunk(8).find((hazard) => hazard.type === "laser");

  assert.ok(lateDrone.speed >= earlyDrone.speed);
  assert.ok(lateDrone.projectileSpeed >= earlyDrone.projectileSpeed);
  assert.ok(lateDrone.fireInterval <= earlyDrone.fireInterval);
  assert.ok(lateLaser.laser.cycle <= earlyLaser.laser.cycle);
  assert.ok(lateLaser.laser.activeRatio >= earlyLaser.laser.activeRatio);
});

test("world streaming remains bounded far into a run", () => {
  const state = createGameState();
  const farX = WORLD_CONFIG.proceduralStartX + WORLD_CONFIG.chunkWidth * 50 + 100;

  assert.equal(refreshWorldForFocus(state, farX), true);

  const activeChunks = WORLD_CONFIG.chunksBehind + WORLD_CONFIG.chunksAhead + 1;
  assert.ok(getWorldSurfaces(state).length <= STARTER_SURFACES.length + activeChunks * 5);
  assert.ok(getWorldHazards(state).length <= STARTER_HAZARDS.length + activeChunks * 5);
  assert.ok(getWorldDrones(state).length <= 1 + activeChunks * DRONE_CONFIG.maxPerChunk);
  assert.ok(getWorldCheckpoints(state).length <= activeChunks);
});

test("camera remains zoomed out for mobile traversal visibility", () => {
  assert.ok(GAME_CONFIG.cameraZoom > 0);
  assert.ok(GAME_CONFIG.cameraZoom < 1);
});

test("configured hazard values remain physically valid", () => {
  assert.ok(HAZARD_CONFIG.laserMinimumCycle > 0);
  assert.ok(HAZARD_CONFIG.laserMaxActiveRatio < 1);
  assert.ok(WORLD_CONFIG.ceilingBottom < WORLD_CONFIG.groundTop);
});

test("surface collision still uses the orb radius", () => {
  const state = createGameState();
  const hit = findEarliestSurfaceCollision(
    state,
    0,
    WORLD_CONFIG.groundTop - GAME_CONFIG.orbRadius - 50,
    0,
    WORLD_CONFIG.groundTop + 20,
    GAME_CONFIG.orbRadius
  );

  assert.ok(hit);
  assert.equal(hit.surface.type, "floor");
  assert.equal(hit.normalY, -1);
});
