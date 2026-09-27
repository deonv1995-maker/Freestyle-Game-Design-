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

test("new run starts as a permanent zero-gravity orb with seven lives", () => {
  const state = createGameState();

  assert.equal(state.mode, "ready");
  assert.equal(state.orb.active, true);
  assert.equal(state.lives, 7);
  assert.equal(state.burstCount, 0);
  assert.equal(state.checkpoint.index, 0);
  assert.equal(GAME_CONFIG.orbGravity, 0);
});

test("direct drag aims in the same direction as the gesture", () => {
  const state = createGameState();

  assert.equal(beginAim(state, 100, 100, 7), true);
  assert.equal(updateAim(state, 150, 0, 7), true);

  const aim = getLaunchVector(state);
  assert.ok(aim.x > 0);
  assert.ok(aim.y < 0);
  assert.ok(aim.power > 0);
});

test("drag distance controls launch speed within configured bounds", () => {
  const weak = createGameState();
  beginAim(weak, 0, 0, 1);
  updateAim(weak, 0, -40, 1);
  releaseAim(weak, 1);

  const strong = createGameState();
  beginAim(strong, 0, 0, 2);
  updateAim(strong, 0, -GAME_CONFIG.maxAimDistance * 2, 2);
  releaseAim(strong, 2);

  const weakSpeed = Math.hypot(weak.orb.vx, weak.orb.vy);
  const strongSpeed = Math.hypot(strong.orb.vx, strong.orb.vy);

  assert.ok(strongSpeed > weakSpeed);
  assert.ok(weakSpeed >= GAME_CONFIG.minLaunchSpeed);
  assert.ok(strongSpeed <= GAME_CONFIG.maxLaunchSpeed + 0.001);
});

test("a short tap reuses the upward default aim instead of creating zero velocity", () => {
  const state = createGameState();

  beginAim(state, 40, 40, 3);
  assert.equal(releaseAim(state, 3), true);

  assert.equal(state.mode, "orb");
  assert.equal(state.orb.vx, 0);
  assert.ok(state.orb.vy < 0);
  assert.ok(Math.hypot(state.orb.vx, state.orb.vy) >= GAME_CONFIG.minLaunchSpeed);
});

test("resting orb can launch upward in open space", () => {
  const state = createGameState();
  const restingY = state.orb.y;

  assert.equal(beginAim(state, 100, 100, 31), true);
  assert.equal(updateAim(state, 100, 0, 31), true);
  assert.equal(releaseAim(state, 31), true);
  const launchVy = state.orb.vy;

  stepGame(state, 0.05);

  assert.equal(state.mode, "orb");
  assert.ok(state.orb.y < restingY);
  assert.equal(state.orb.vy, launchVy);
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

test("pressing during orb flight slows gameplay instead of freezing it", () => {
  const slow = createGameState();
  const normal = createGameState();

  for (const state of [slow, normal]) {
    state.mode = "orb";
    state.orb.x = 0;
    state.orb.y = 500;
    state.orb.vx = 120;
    state.orb.vy = -520;
    state.orb.invulnerability = 5;
  }

  assert.equal(beginAim(slow, 400, 220, 21), true);
  assert.equal(slow.mode, "airAiming");

  stepGame(slow, 0.05);
  stepGame(normal, 0.05);

  assert.equal(
    slow.world.clock,
    0.05 * GAME_CONFIG.airAimTimeScale
  );
  assert.equal(
    slow.animation.clock,
    0.05 * GAME_CONFIG.airAimTimeScale
  );
  assert.equal(normal.world.clock, 0.05);
  assert.equal(normal.animation.clock, 0.05);

  const slowDx = slow.orb.x;
  const slowDy = 500 - slow.orb.y;
  const normalDx = normal.orb.x;
  const normalDy = 500 - normal.orb.y;

  assert.ok(slowDx > 0);
  assert.ok(slowDy > 0);
  assert.ok(normalDx > slowDx);
  assert.ok(normalDy > slowDy);
  assert.ok(
    Math.abs(slowDx / normalDx - GAME_CONFIG.airAimTimeScale) < 1e-9
  );
  assert.ok(
    Math.abs(slowDy / normalDy - GAME_CONFIG.airAimTimeScale) < 1e-9
  );
  assert.equal(slow.orb.vx, normal.orb.vx);
  assert.equal(slow.orb.vy, normal.orb.vy);
});

test("midair re-aim redirects the same orb without creating a new burst", () => {
  const state = createGameState();

  state.mode = "orb";
  state.orb.x = 0;
  state.orb.y = 360;
  state.orb.vx = 120;
  state.orb.vy = -600;
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

test("side-wall contacts rebound the orb", () => {
  const state = createGameState();

  state.mode = "orb";
  state.orb.x = WORLD_CONFIG.corridorLeft + GAME_CONFIG.orbRadius + 10;
  state.orb.y = 500;
  state.orb.vx = -360;
  state.orb.vy = -40;

  stepGame(state, 0.05);

  assert.equal(state.orb.active, true);
  assert.equal(state.mode, "orb");
  assert.ok(state.orb.vx > 0);
  assert.equal(state.orb.lastBounce.surfaceId, "starter-left-wall");
  assert.equal(state.orb.lastBounce.normalX, 1);
});

test("low-momentum wall bounces settle the orb back to ready", () => {
  const state = createGameState();

  state.mode = "orb";
  state.orb.x = WORLD_CONFIG.corridorLeft + GAME_CONFIG.orbRadius + 2;
  state.orb.y = 500;
  state.orb.vx = -40;
  state.orb.vy = 0;

  stepGame(state, 0.05);

  assert.equal(state.mode, "ready");
  assert.equal(state.orb.vx, 0);
  assert.equal(state.orb.vy, 0);
});

test("the course is a vertical corridor with side walls and no floor or ceiling shell", () => {
  const state = createGameState();
  const surfaces = getWorldSurfaces(state);

  assert.ok(surfaces.some((surface) => surface.type === "leftWall"));
  assert.ok(surfaces.some((surface) => surface.type === "rightWall"));
  assert.ok(surfaces.some((surface) => surface.type === "platform"));
  assert.equal(surfaces.some((surface) => surface.type === "floor"), false);
  assert.equal(surfaces.some((surface) => surface.type === "ceiling"), false);
  assert.equal(surfaces.some((surface) => surface.type === "obstacle"), false);

  for (const surface of surfaces) {
    assert.ok(["leftWall", "rightWall", "platform"].includes(surface.type));
    assert.ok(surface.width > 0);
    assert.ok(surface.height > 0);
  }
});

test("left and right moving platforms are deterministic and move horizontally", () => {
  const first = generateWorldChunk(4);
  const second = generateWorldChunk(4);
  const moving = first.filter((surface) => surface.type === "platform");

  assert.deepEqual(first, second);
  assert.equal(moving.length, 2);
  assert.ok(moving.every((surface) => surface.motion?.axis === "x"));
});

test("starter course and generated chunks contain lasers and wall spikes", () => {
  const generated = generateHazardChunk(2);
  const types = new Set([...STARTER_HAZARDS, ...generated].map((hazard) => hazard.type));

  assert.equal(types.has("laser"), true);
  assert.equal(types.has("leftSpikes"), true);
  assert.equal(types.has("rightSpikes"), true);
});

test("wall-mounted lasers stay fixed, persist, and cycle their beam on and off", () => {
  const state = createGameState();
  state.orb.invulnerability = 10;

  const laser = getWorldHazards(state).find((hazard) => hazard.type === "laser");
  const startY = laser.y;
  const startX = laser.x;
  const startWidth = laser.width;
  const seenStates = new Set([laser.active]);

  assert.equal(laser.motion, undefined);
  assert.ok(["left", "right"].includes(laser.laser.sourceSide));
  assert.equal(
    laser.x,
    WORLD_CONFIG.corridorLeft + HAZARD_CONFIG.laserWallInset
  );
  assert.equal(
    laser.width,
    WORLD_CONFIG.corridorRight -
      WORLD_CONFIG.corridorLeft -
      HAZARD_CONFIG.laserWallInset * 2
  );

  for (let i = 0; i < 90; i += 1) {
    stepGame(state, 0.05);
    seenStates.add(laser.active);

    assert.equal(
      getWorldHazards(state).some((hazard) => hazard.id === laser.id),
      true
    );
  }

  assert.equal(laser.x, startX);
  assert.equal(laser.y, startY);
  assert.equal(laser.width, startWidth);
  assert.equal(seenStates.has(true), true);
  assert.equal(seenStates.has(false), true);
});

test("all generated lasers span the corridor from persistent wall emitters", () => {
  for (let chunkIndex = 0; chunkIndex < 10; chunkIndex += 1) {
    const lasers = generateHazardChunk(chunkIndex).filter(
      (hazard) => hazard.type === "laser"
    );

    assert.ok(lasers.length >= 1);

    for (const laser of lasers) {
      assert.equal(laser.motion, undefined);
      assert.ok(["left", "right"].includes(laser.laser.sourceSide));
      assert.equal(
        laser.x,
        WORLD_CONFIG.corridorLeft + HAZARD_CONFIG.laserWallInset
      );
      assert.equal(
        laser.width,
        WORLD_CONFIG.corridorRight -
          WORLD_CONFIG.corridorLeft -
          HAZARD_CONFIG.laserWallInset * 2
      );
    }
  }
});

test("swept hazard collision detects a wall spike field before tunneling through it", () => {
  const state = createGameState();
  const spike = getWorldHazards(state).find(
    (hazard) => hazard.id === "starter-left-spikes"
  );

  // The full-width starter laser now overlaps this spike's vertical band.
  // Disable it here so this regression isolates swept collision with the spike.
  const laser = getWorldHazards(state).find(
    (hazard) => hazard.id === "starter-laser"
  );
  laser.active = false;

  const hit = findEarliestHazardCollision(
    state,
    spike.x + spike.width + 80,
    spike.y + spike.height * 0.5,
    spike.x - 80,
    spike.y + spike.height * 0.5
  );

  assert.ok(hit);
  assert.equal(hit.hazard.id, spike.id);
  assert.equal(hit.cause, "leftSpikes");
});

test("a lethal hazard removes one life and respawns at the current checkpoint", () => {
  const state = createGameState();
  const checkpoint = generateCheckpoint(0);

  state.checkpoint.index = checkpoint.index;
  state.checkpoint.x = checkpoint.x;
  state.checkpoint.y = checkpoint.y;
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

test("crossing upward through a checkpoint advances respawn location and difficulty", () => {
  const state = createGameState();
  const checkpoint = getWorldCheckpoints(state).find((item) => item.index === 1);

  state.mode = "orb";
  state.orb.x = 0;
  state.orb.y = checkpoint.y - 8;
  state.orb.vx = 0;
  state.orb.vy = 0;
  state.orb.invulnerability = 2;

  stepGame(state, 0.01);

  assert.equal(state.checkpoint.index, 1);
  assert.equal(state.checkpoint.spawnY, checkpoint.spawnY);
  assert.equal(state.progress.difficultyLevel, checkpoint.difficultyAfter);
  assert.ok(state.animation.checkpointPulse > 0);
});

test("distance tracks upward progress and furthest run distance", () => {
  const state = createGameState();

  state.mode = "orb";
  state.orb.x = 0;
  state.orb.y = state.progress.startY - 500;
  state.orb.vx = 0;
  state.orb.vy = 0;
  state.orb.invulnerability = 2;
  stepGame(state, 0.01);

  assert.ok(state.progress.currentMetres >= 49);
  const furthest = state.progress.furthestMetres;

  state.orb.y = state.progress.startY - 200;
  stepGame(state, 0.01);

  assert.ok(state.progress.currentMetres < furthest);
  assert.equal(state.progress.furthestMetres, furthest);
});

test("zero gravity preserves free-flight velocity", () => {
  const state = createGameState();

  state.mode = "orb";
  state.orb.x = 0;
  state.orb.y = 500;
  state.orb.vx = 80;
  state.orb.vy = -300;
  state.orb.invulnerability = 2;

  stepGame(state, 0.05);

  assert.equal(state.orb.vx, 80);
  assert.equal(state.orb.vy, -300);
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
  state.orb.x = drone.x;
  state.orb.y = drone.y + 180;
  state.orb.invulnerability = 3;

  for (let i = 0; i < 80 && getWorldProjectiles(state).length === 0; i += 1) {
    stepGame(state, 0.05);
  }

  assert.ok(getWorldProjectiles(state).length > 0);
});

test("orb contact destroys a drone without costing a life", () => {
  const state = createGameState();
  const drone = getWorldDrones(state).find(
    (candidate) => candidate.id === "chunk-0-drone-0"
  );
  const startingLives = state.lives;

  // Keep the contact path in the starter area's open center so the
  // drone-contact rule is isolated from generated platforms and hazards.
  drone.x = 0;
  drone.y = 100;
  drone.homeX = drone.x;
  drone.homeY = drone.y;

  state.mode = "orb";
  state.orb.x = -62;
  state.orb.y = 100;
  state.orb.vx = 900;
  state.orb.vy = 0;
  state.orb.invulnerability = 2;

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
      WORLD_CONFIG.proceduralStartY - WORLD_CONFIG.chunkHeight - 20
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

test("vertical world chunks join continuously along both side walls", () => {
  const chunk0 = generateWorldChunk(0);
  const chunk1 = generateWorldChunk(1);
  const left0 = chunk0.find((surface) => surface.type === "leftWall");
  const left1 = chunk1.find((surface) => surface.type === "leftWall");
  const right0 = chunk0.find((surface) => surface.type === "rightWall");
  const right1 = chunk1.find((surface) => surface.type === "rightWall");

  assert.equal(left1.y + left1.height, left0.y);
  assert.equal(right1.y + right1.height, right0.y);
  assert.equal(left0.x + left0.width, WORLD_CONFIG.corridorLeft);
  assert.equal(right0.x, WORLD_CONFIG.corridorRight);
});

test("checkpoints advance upward as chunk index increases", () => {
  const first = generateCheckpoint(0);
  const second = generateCheckpoint(1);

  assert.ok(second.y < first.y);
  assert.equal(second.index, first.index + 1);
  assert.ok(second.spawnY < second.y);
});

test("world streaming remains bounded far into an upward run", () => {
  const state = createGameState();
  const farY =
    WORLD_CONFIG.proceduralStartY - WORLD_CONFIG.chunkHeight * 50 - 100;

  assert.equal(refreshWorldForFocus(state, farY), true);

  const activeChunks = WORLD_CONFIG.chunksBehind + WORLD_CONFIG.chunksAhead + 1;
  assert.ok(getWorldSurfaces(state).length <= STARTER_SURFACES.length + activeChunks * 4);
  assert.ok(getWorldHazards(state).length <= STARTER_HAZARDS.length + activeChunks * 5);
  assert.ok(getWorldDrones(state).length <= 1 + activeChunks * DRONE_CONFIG.maxPerChunk);
  assert.ok(getWorldCheckpoints(state).length <= activeChunks);
});

test("camera remains zoomed out for mobile vertical traversal visibility", () => {
  assert.ok(GAME_CONFIG.cameraZoom > 0);
  assert.ok(GAME_CONFIG.cameraZoom < 1);
});

test("configured space-corridor values remain physically valid", () => {
  assert.equal(GAME_CONFIG.orbGravity, 0);
  assert.ok(GAME_CONFIG.airAimTimeScale > 0);
  assert.ok(GAME_CONFIG.airAimTimeScale < 1);
  assert.ok(HAZARD_CONFIG.laserMinimumCycle > 0);
  assert.ok(HAZARD_CONFIG.laserMaxActiveRatio < 1);
  assert.ok(WORLD_CONFIG.corridorLeft < WORLD_CONFIG.corridorRight);
  assert.ok(WORLD_CONFIG.chunkHeight > 0);
});

test("surface collision still uses the orb radius against side walls", () => {
  const state = createGameState();
  const hit = findEarliestSurfaceCollision(
    state,
    0,
    500,
    WORLD_CONFIG.corridorLeft - 40,
    500,
    GAME_CONFIG.orbRadius
  );

  assert.ok(hit);
  assert.equal(hit.surface.type, "leftWall");
  assert.equal(hit.normalX, 1);
});
