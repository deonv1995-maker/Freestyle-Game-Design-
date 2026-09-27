const GROUND_TOP = 180;
const CEILING_BOTTOM = -520;
const START_POSITION = Object.freeze({ x: -120, y: GROUND_TOP - 16 });

export const GAME_CONFIG = Object.freeze({
  orbGravity: 240,
  minLaunchSpeed: 280,
  maxLaunchSpeed: 980,
  maxAimDistance: 220,
  aimDeadzone: 14,
  orbRadius: 16,
  maxOrbSpeed: 1180,
  bounceRestitution: 0.8,
  bounceTangentialDamping: 0.97,
  bounceSeparation: 1.5,
  restSpeedThreshold: 105,
  cameraSharpness: 10,
  cameraZoom: 0.78,
  respawnInvulnerability: 0.9,
  startingLives: 7
});

export const WORLD_CONFIG = Object.freeze({
  seed: 2000,
  groundTop: GROUND_TOP,
  ceilingBottom: CEILING_BOTTOM,
  structuralThickness: 90,
  proceduralStartX: 1200,
  chunkWidth: 820,
  chunksBehind: 2,
  chunksAhead: 4,
  checkpointInset: 86,
  checkpointSafeRadius: 190,
  worldKillMargin: 180
});

export const HAZARD_CONFIG = Object.freeze({
  pitMinWidth: 118,
  pitMaxWidth: 188,
  floorSpikeHeight: 54,
  ceilingSpikeHeight: 56,
  laserWidth: 12,
  laserMoveRange: 86,
  laserBaseCycle: 2.8,
  laserMinimumCycle: 1.35,
  laserBaseActiveRatio: 0.5,
  laserMaxActiveRatio: 0.68,
  movingPlatformWidth: 170,
  movingPlatformHeight: 30,
  movingPlatformRange: 78,
  movingPlatformBaseSpeed: 0.95,
  difficultyCap: 10
});

export const DRONE_CONFIG = Object.freeze({
  radius: 18,
  basePerChunk: 1,
  maxPerChunk: 3,
  minSpeed: 210,
  maxSpeed: 390,
  acquireRange: 760,
  baseFireInterval: 1.9,
  minFireInterval: 0.78,
  projectileRadius: 6,
  projectileBaseSpeed: 430,
  projectileMaxSpeed: 680,
  projectileLifetime: 3.2,
  maxProjectiles: 28,
  corridorPadding: 72
});

const DEFAULT_LAUNCH = Object.freeze({
  dx: 150,
  dy: -72,
  power: 0.58
});

export const STARTER_SURFACES = Object.freeze([
  Object.freeze({
    id: "starter-floor-left",
    type: "floor",
    visual: "corridorFloor",
    x: -1800,
    y: GROUND_TOP,
    width: 2580,
    height: WORLD_CONFIG.structuralThickness
  }),
  Object.freeze({
    id: "starter-floor-right",
    type: "floor",
    visual: "corridorFloor",
    x: 920,
    y: GROUND_TOP,
    width: WORLD_CONFIG.proceduralStartX - 920,
    height: WORLD_CONFIG.structuralThickness
  }),
  Object.freeze({
    id: "starter-roof",
    type: "ceiling",
    visual: "corridorRoof",
    x: -1800,
    y: CEILING_BOTTOM - WORLD_CONFIG.structuralThickness,
    width: WORLD_CONFIG.proceduralStartX + 1800,
    height: WORLD_CONFIG.structuralThickness
  }),
  Object.freeze({
    id: "starter-moving-platform",
    type: "platform",
    visual: "movingPlatform",
    x: 500,
    y: -110,
    width: HAZARD_CONFIG.movingPlatformWidth,
    height: HAZARD_CONFIG.movingPlatformHeight,
    motion: Object.freeze({
      axis: "y",
      baseX: 500,
      baseY: -110,
      range: 86,
      speed: 1.05,
      phase: 0.45
    })
  })
]);

export const STARTER_HAZARDS = Object.freeze([
  Object.freeze({
    id: "starter-ceiling-spikes",
    type: "ceilingSpikes",
    visual: "spikes",
    x: 260,
    y: CEILING_BOTTOM,
    width: 118,
    height: HAZARD_CONFIG.ceilingSpikeHeight,
    active: true
  }),
  Object.freeze({
    id: "starter-pit-spikes",
    type: "floorSpikes",
    visual: "spikes",
    x: 780,
    y: GROUND_TOP - 34,
    width: 140,
    height: HAZARD_CONFIG.floorSpikeHeight + 48,
    active: true
  }),
  Object.freeze({
    id: "starter-laser",
    type: "laser",
    visual: "laser",
    x: 1060,
    y: CEILING_BOTTOM + 42,
    width: HAZARD_CONFIG.laserWidth,
    height: GROUND_TOP - CEILING_BOTTOM - 84,
    active: true,
    motion: Object.freeze({
      axis: "x",
      baseX: 1060,
      baseY: CEILING_BOTTOM + 42,
      range: 58,
      speed: 0.72,
      phase: 1.1
    }),
    laser: Object.freeze({
      cycle: 2.8,
      activeRatio: 0.5,
      phaseTime: 0.35
    })
  })
]);

const STARTER_DRONES = Object.freeze([
  Object.freeze({
    id: "starter-drone-0",
    chunkIndex: null,
    x: 1120,
    y: -230,
    homeX: 1120,
    homeY: -230,
    difficulty: 1,
    speed: 220,
    fireInterval: 1.9,
    projectileSpeed: 430,
    cooldown: 1.15,
    phase: 0.3
  })
]);

export function createGameState() {
  const state = {
    mode: "ready",
    burstCount: 0,
    lives: GAME_CONFIG.startingLives,
    orb: {
      active: true,
      x: START_POSITION.x,
      y: START_POSITION.y,
      vx: 0,
      vy: 0,
      travel: 0,
      lastBounce: null,
      invulnerability: 0
    },
    launch: {
      pointerId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      dx: DEFAULT_LAUNCH.dx,
      dy: DEFAULT_LAUNCH.dy,
      power: DEFAULT_LAUNCH.power,
      dragDistance: 0
    },
    lastLaunch: { ...DEFAULT_LAUNCH },
    animation: {
      clock: 0,
      transformPulse: 0,
      bouncePulse: 0,
      deathPulse: 0,
      checkpointPulse: 0,
      runResetPulse: 0
    },
    camera: { x: START_POSITION.x, y: START_POSITION.y },
    progress: {
      startX: START_POSITION.x,
      currentMetres: 0,
      furthestMetres: 0,
      maxProgressX: START_POSITION.x,
      difficultyLevel: 1
    },
    checkpoint: {
      index: 0,
      x: START_POSITION.x,
      spawnX: START_POSITION.x,
      spawnY: START_POSITION.y
    },
    run: {
      deaths: 0,
      restartCount: 0,
      respawnSerial: 0,
      lastDeathCause: null
    },
    world: {
      clock: 0,
      activeStartChunk: null,
      activeEndChunk: null,
      surfaces: [],
      hazards: [],
      checkpoints: [],
      drones: [],
      projectiles: [],
      projectileSerial: 0
    }
  };

  refreshWorldForFocus(state, START_POSITION.x);
  updateProgress(state);
  return state;
}

export function beginAim(state, pointerX, pointerY, pointerId = 0) {
  const beginningFromRest = state.mode === "ready";
  const beginningFromFlight = state.mode === "orb";

  if ((!beginningFromRest && !beginningFromFlight) || state.launch.pointerId !== null) {
    return false;
  }

  state.mode = beginningFromFlight ? "airAiming" : "aiming";
  state.launch.pointerId = pointerId;
  state.launch.startX = pointerX;
  state.launch.startY = pointerY;
  state.launch.currentX = pointerX;
  state.launch.currentY = pointerY;

  if (beginningFromFlight) {
    const speed = Math.hypot(state.orb.vx, state.orb.vy);
    const safeSpeed = Math.max(speed, 1);
    state.launch.dx = (state.orb.vx / safeSpeed) * GAME_CONFIG.maxAimDistance;
    state.launch.dy = (state.orb.vy / safeSpeed) * GAME_CONFIG.maxAimDistance;
    state.launch.power = clamp(
      (speed - GAME_CONFIG.minLaunchSpeed) /
        (GAME_CONFIG.maxLaunchSpeed - GAME_CONFIG.minLaunchSpeed),
      0.18,
      1
    );
  } else {
    state.launch.dx = state.lastLaunch.dx;
    state.launch.dy = state.lastLaunch.dy;
    state.launch.power = state.lastLaunch.power;
  }

  state.launch.dragDistance = 0;
  return true;
}

export function updateAim(state, pointerX, pointerY, pointerId = 0) {
  if (
    (state.mode !== "aiming" && state.mode !== "airAiming") ||
    state.launch.pointerId !== pointerId
  ) {
    return false;
  }

  state.launch.currentX = pointerX;
  state.launch.currentY = pointerY;

  const rawX = pointerX - state.launch.startX;
  const rawY = pointerY - state.launch.startY;
  const distance = Math.hypot(rawX, rawY);
  state.launch.dragDistance = distance;

  if (distance >= GAME_CONFIG.aimDeadzone) {
    const scale = Math.min(1, GAME_CONFIG.maxAimDistance / distance);
    state.launch.dx = rawX * scale;
    state.launch.dy = rawY * scale;
    state.launch.power = clamp(distance / GAME_CONFIG.maxAimDistance, 0.18, 1);

    state.lastLaunch.dx = state.launch.dx;
    state.lastLaunch.dy = state.launch.dy;
    state.lastLaunch.power = state.launch.power;
  }

  return true;
}

export function releaseAim(state, pointerId = state.launch.pointerId) {
  const redirectingMidAir = state.mode === "airAiming";

  if (
    (state.mode !== "aiming" && !redirectingMidAir) ||
    state.launch.pointerId !== pointerId
  ) {
    return false;
  }

  state.launch.pointerId = null;

  const aim = getLaunchVector(state);
  const speed =
    GAME_CONFIG.minLaunchSpeed +
    state.launch.power * (GAME_CONFIG.maxLaunchSpeed - GAME_CONFIG.minLaunchSpeed);

  state.orb.vx = aim.x * speed;
  state.orb.vy = aim.y * speed;
  state.orb.lastBounce = null;
  state.orb.active = true;
  state.mode = "orb";

  if (!redirectingMidAir) {
    state.orb.travel = 0;
    state.animation.transformPulse = 1;
    state.animation.bouncePulse = 0;
    state.burstCount += 1;
  }

  return true;
}

export function cancelAim(state, pointerId = state.launch.pointerId) {
  if (
    (state.mode !== "aiming" && state.mode !== "airAiming") ||
    state.launch.pointerId !== pointerId
  ) {
    return false;
  }

  const redirectingMidAir = state.mode === "airAiming";
  state.launch.pointerId = null;
  state.mode = redirectingMidAir ? "orb" : "ready";
  return true;
}

export function stepGame(state, deltaSeconds) {
  const dt = clamp(deltaSeconds, 0, 0.05);

  state.animation.clock += dt;
  state.animation.transformPulse = Math.max(0, state.animation.transformPulse - dt * 3.5);
  state.animation.bouncePulse = Math.max(0, state.animation.bouncePulse - dt * 5);
  state.animation.deathPulse = Math.max(0, state.animation.deathPulse - dt * 2.2);
  state.animation.checkpointPulse = Math.max(0, state.animation.checkpointPulse - dt * 1.8);
  state.animation.runResetPulse = Math.max(0, state.animation.runResetPulse - dt * 1.5);

  const gameplayFrozen = state.mode === "airAiming";

  if (!gameplayFrozen) {
    state.world.clock += dt;
    state.orb.invulnerability = Math.max(0, state.orb.invulnerability - dt);

    refreshWorldForFocus(state, state.orb.x);
    updateDynamicWorld(state);
    updateDrones(state, dt);
    advanceProjectiles(state, dt);

    if (state.mode === "orb") {
      simulateOrbFlight(state, dt);
    } else {
      resolveStationaryLethalContacts(state);
    }

    updateProgress(state);
    updateCheckpointProgress(state);
    pruneProjectiles(state);
  } else {
    refreshWorldForFocus(state, state.orb.x);
    updateDynamicWorld(state);
  }

  updateCamera(state, dt);
}

export function getLaunchVector(state) {
  const length = Math.hypot(state.launch.dx, state.launch.dy) || 1;
  return {
    x: state.launch.dx / length,
    y: state.launch.dy / length,
    power: state.launch.power
  };
}

export function getWorldSurfaces(state) {
  return state.world.surfaces;
}

export function getWorldHazards(state) {
  return state.world.hazards;
}

export function getWorldCheckpoints(state) {
  return state.world.checkpoints;
}

export function getWorldDrones(state) {
  return state.world.drones;
}

export function getWorldProjectiles(state) {
  return state.world.projectiles;
}

export function refreshWorldForFocus(state, focusX) {
  const focusChunk = getChunkIndexForX(focusX);
  const startChunk = Math.max(0, focusChunk - WORLD_CONFIG.chunksBehind);
  const endChunk = focusChunk + WORLD_CONFIG.chunksAhead;

  if (
    state.world.activeStartChunk === startChunk &&
    state.world.activeEndChunk === endChunk &&
    state.world.surfaces.length > 0
  ) {
    return false;
  }

  const surfaces = STARTER_SURFACES.map(cloneWorldItem);
  const hazards = STARTER_HAZARDS.map(cloneWorldItem);
  const checkpoints = [];
  const droneDefinitions = STARTER_DRONES.map((drone) => ({ ...drone }));

  for (let chunkIndex = startChunk; chunkIndex <= endChunk; chunkIndex += 1) {
    surfaces.push(...generateWorldChunk(chunkIndex));
    hazards.push(...generateHazardChunk(chunkIndex));
    checkpoints.push(generateCheckpoint(chunkIndex));
    droneDefinitions.push(...generateDroneChunk(chunkIndex));
  }

  state.world.activeStartChunk = startChunk;
  state.world.activeEndChunk = endChunk;
  state.world.surfaces = surfaces;
  state.world.hazards = hazards;
  state.world.checkpoints = checkpoints;
  state.world.drones = reconcileActiveDrones(state.world.drones, droneDefinitions);
  state.world.projectiles = state.world.projectiles.filter((projectile) => {
    if (projectile.chunkIndex === null) return true;
    return projectile.chunkIndex >= startChunk - 1 && projectile.chunkIndex <= endChunk + 1;
  });

  updateDynamicWorld(state);
  return true;
}

export function generateWorldChunk(chunkIndex) {
  const safeIndex = Math.max(0, Math.floor(chunkIndex));
  const chunkX = WORLD_CONFIG.proceduralStartX + safeIndex * WORLD_CONFIG.chunkWidth;
  const difficulty = difficultyForChunk(safeIndex);
  const pitWidth =
    HAZARD_CONFIG.pitMinWidth +
    Math.round(
      seededUnit(safeIndex, 2) * (HAZARD_CONFIG.pitMaxWidth - HAZARD_CONFIG.pitMinWidth)
    );
  const pitX =
    chunkX +
    285 +
    Math.round(seededUnit(safeIndex, 3) * 185);
  const safeEnd = chunkX + WORLD_CONFIG.chunkWidth - WORLD_CONFIG.checkpointSafeRadius;
  const clampedPitX = Math.min(pitX, safeEnd - pitWidth - 28);

  const topPlatformX = chunkX + 155 + Math.round(seededUnit(safeIndex, 6) * 80);
  const bottomPlatformX = chunkX + 520 + Math.round(seededUnit(safeIndex, 7) * 70);
  const motionSpeed =
    HAZARD_CONFIG.movingPlatformBaseSpeed + Math.min(0.75, (difficulty - 1) * 0.07);
  const motionRange =
    HAZARD_CONFIG.movingPlatformRange + Math.min(48, (difficulty - 1) * 5);

  return [
    {
      id: `chunk-${safeIndex}-floor-a`,
      type: "floor",
      visual: "corridorFloor",
      x: chunkX,
      y: GROUND_TOP,
      width: Math.max(24, clampedPitX - chunkX),
      height: WORLD_CONFIG.structuralThickness,
      chunkIndex: safeIndex
    },
    {
      id: `chunk-${safeIndex}-floor-b`,
      type: "floor",
      visual: "corridorFloor",
      x: clampedPitX + pitWidth,
      y: GROUND_TOP,
      width: chunkX + WORLD_CONFIG.chunkWidth - (clampedPitX + pitWidth),
      height: WORLD_CONFIG.structuralThickness,
      chunkIndex: safeIndex
    },
    {
      id: `chunk-${safeIndex}-roof`,
      type: "ceiling",
      visual: "corridorRoof",
      x: chunkX,
      y: CEILING_BOTTOM - WORLD_CONFIG.structuralThickness,
      width: WORLD_CONFIG.chunkWidth,
      height: WORLD_CONFIG.structuralThickness,
      chunkIndex: safeIndex
    },
    makeMovingPlatform(
      `chunk-${safeIndex}-top-platform`,
      safeIndex,
      topPlatformX,
      CEILING_BOTTOM + 126,
      "y",
      motionRange,
      motionSpeed,
      seededUnit(safeIndex, 8) * Math.PI * 2
    ),
    makeMovingPlatform(
      `chunk-${safeIndex}-bottom-platform`,
      safeIndex,
      bottomPlatformX,
      GROUND_TOP - 178,
      "y",
      motionRange * 0.82,
      motionSpeed * 1.08,
      seededUnit(safeIndex, 9) * Math.PI * 2
    )
  ];
}

export function generateHazardChunk(chunkIndex) {
  const safeIndex = Math.max(0, Math.floor(chunkIndex));
  const chunkX = WORLD_CONFIG.proceduralStartX + safeIndex * WORLD_CONFIG.chunkWidth;
  const difficulty = difficultyForChunk(safeIndex);
  const surfaces = generateWorldChunk(safeIndex);
  const floorA = surfaces.find((surface) => surface.id.endsWith("floor-a"));
  const floorB = surfaces.find((surface) => surface.id.endsWith("floor-b"));
  const pitX = floorA.x + floorA.width;
  const pitWidth = floorB.x - pitX;

  const ceilingSpikeWidth = 92 + Math.round(seededUnit(safeIndex, 12) * 54);
  const ceilingSpikeX =
    chunkX + 90 + Math.round(seededUnit(safeIndex, 13) * 150);

  const cycle = Math.max(
    HAZARD_CONFIG.laserMinimumCycle,
    HAZARD_CONFIG.laserBaseCycle - (difficulty - 1) * 0.12
  );
  const activeRatio = Math.min(
    HAZARD_CONFIG.laserMaxActiveRatio,
    HAZARD_CONFIG.laserBaseActiveRatio + (difficulty - 1) * 0.018
  );
  const laserX = chunkX + 555 + Math.round(seededUnit(safeIndex, 14) * 60);
  const laserRange =
    HAZARD_CONFIG.laserMoveRange + Math.min(50, (difficulty - 1) * 4);
  const laserSpeed = 0.72 + Math.min(0.68, (difficulty - 1) * 0.055);

  const hazards = [
    {
      id: `chunk-${safeIndex}-pit-spikes`,
      type: "floorSpikes",
      visual: "spikes",
      x: pitX,
      y: GROUND_TOP - 34,
      width: pitWidth,
      height: HAZARD_CONFIG.floorSpikeHeight + 48,
      active: true,
      chunkIndex: safeIndex,
      difficulty
    },
    {
      id: `chunk-${safeIndex}-ceiling-spikes-0`,
      type: "ceilingSpikes",
      visual: "spikes",
      x: ceilingSpikeX,
      y: CEILING_BOTTOM,
      width: ceilingSpikeWidth,
      height: HAZARD_CONFIG.ceilingSpikeHeight,
      active: true,
      chunkIndex: safeIndex,
      difficulty
    },
    {
      id: `chunk-${safeIndex}-laser-0`,
      type: "laser",
      visual: "laser",
      x: laserX,
      y: CEILING_BOTTOM + 42,
      width: HAZARD_CONFIG.laserWidth,
      height: GROUND_TOP - CEILING_BOTTOM - 84,
      active: true,
      chunkIndex: safeIndex,
      difficulty,
      motion: {
        axis: "x",
        baseX: laserX,
        baseY: CEILING_BOTTOM + 42,
        range: laserRange,
        speed: laserSpeed,
        phase: seededUnit(safeIndex, 15) * Math.PI * 2
      },
      laser: {
        cycle,
        activeRatio,
        phaseTime: seededUnit(safeIndex, 16) * cycle
      }
    }
  ];

  if (difficulty >= 4) {
    const secondX = chunkX + 330 + Math.round(seededUnit(safeIndex, 17) * 90);
    hazards.push({
      id: `chunk-${safeIndex}-ceiling-spikes-1`,
      type: "ceilingSpikes",
      visual: "spikes",
      x: secondX,
      y: CEILING_BOTTOM,
      width: 78 + Math.round(seededUnit(safeIndex, 18) * 42),
      height: HAZARD_CONFIG.ceilingSpikeHeight,
      active: true,
      chunkIndex: safeIndex,
      difficulty
    });
  }

  if (difficulty >= 6) {
    const secondLaserX = chunkX + 385;
    hazards.push({
      id: `chunk-${safeIndex}-laser-1`,
      type: "laser",
      visual: "laser",
      x: secondLaserX,
      y: CEILING_BOTTOM + 62,
      width: HAZARD_CONFIG.laserWidth,
      height: GROUND_TOP - CEILING_BOTTOM - 124,
      active: true,
      chunkIndex: safeIndex,
      difficulty,
      motion: {
        axis: "x",
        baseX: secondLaserX,
        baseY: CEILING_BOTTOM + 62,
        range: Math.max(44, laserRange * 0.65),
        speed: laserSpeed * 1.12,
        phase: seededUnit(safeIndex, 19) * Math.PI * 2
      },
      laser: {
        cycle: Math.max(HAZARD_CONFIG.laserMinimumCycle, cycle * 0.92),
        activeRatio: Math.min(HAZARD_CONFIG.laserMaxActiveRatio, activeRatio + 0.04),
        phaseTime: seededUnit(safeIndex, 20) * cycle
      }
    });
  }

  return hazards;
}

export function generateDroneChunk(chunkIndex) {
  const safeIndex = Math.max(0, Math.floor(chunkIndex));
  const chunkX = WORLD_CONFIG.proceduralStartX + safeIndex * WORLD_CONFIG.chunkWidth;
  const difficulty = difficultyForChunk(safeIndex);
  const count = Math.min(
    DRONE_CONFIG.maxPerChunk,
    DRONE_CONFIG.basePerChunk + Math.floor((difficulty - 1) / 3)
  );
  const drones = [];

  for (let index = 0; index < count; index += 1) {
    const lane = (index + 1) / (count + 1);
    const x =
      chunkX +
      250 +
      lane * 420 +
      (seededUnit(safeIndex, 30 + index) - 0.5) * 80;
    const y =
      CEILING_BOTTOM +
      165 +
      seededUnit(safeIndex, 40 + index) * 320;
    const speed = Math.min(
      DRONE_CONFIG.maxSpeed,
      DRONE_CONFIG.minSpeed + (difficulty - 1) * 16 + seededUnit(safeIndex, 50 + index) * 34
    );
    const fireInterval = Math.max(
      DRONE_CONFIG.minFireInterval,
      DRONE_CONFIG.baseFireInterval - (difficulty - 1) * 0.09
    );
    const projectileSpeed = Math.min(
      DRONE_CONFIG.projectileMaxSpeed,
      DRONE_CONFIG.projectileBaseSpeed + (difficulty - 1) * 24
    );

    drones.push({
      id: `chunk-${safeIndex}-drone-${index}`,
      chunkIndex: safeIndex,
      x,
      y,
      homeX: x,
      homeY: y,
      difficulty,
      speed,
      fireInterval,
      projectileSpeed,
      cooldown: 0.5 + seededUnit(safeIndex, 60 + index) * fireInterval,
      phase: seededUnit(safeIndex, 70 + index) * Math.PI * 2
    });
  }

  return drones;
}

export function generateCheckpoint(chunkIndex) {
  const safeIndex = Math.max(0, Math.floor(chunkIndex));
  const chunkX = WORLD_CONFIG.proceduralStartX + safeIndex * WORLD_CONFIG.chunkWidth;
  const x = chunkX + WORLD_CONFIG.chunkWidth - WORLD_CONFIG.checkpointInset;

  return {
    id: `checkpoint-${safeIndex + 1}`,
    index: safeIndex + 1,
    x,
    spawnX: x + 34,
    spawnY: GROUND_TOP - GAME_CONFIG.orbRadius,
    chunkIndex: safeIndex,
    difficultyAfter: Math.min(HAZARD_CONFIG.difficultyCap, safeIndex + 2)
  };
}

export function findEarliestSurfaceCollision(
  state,
  startX,
  startY,
  endX,
  endY,
  radius = 0
) {
  let earliest = null;

  for (const surface of state.world.surfaces) {
    const collisionRect = expandedRect(surface, radius);
    const hit = segmentRectIntersection(startX, startY, endX, endY, collisionRect);
    if (!hit) continue;

    if (!earliest || hit.t < earliest.t) {
      earliest = { ...hit, surface };
    }
  }

  return earliest;
}

export function findEarliestHazardCollision(
  state,
  startX,
  startY,
  endX,
  endY,
  radius = GAME_CONFIG.orbRadius
) {
  let earliest = null;

  for (const hazard of state.world.hazards) {
    if (!hazard.active) continue;
    const hit = segmentRectIntersection(
      startX,
      startY,
      endX,
      endY,
      expandedRect(hazard, radius)
    );
    if (!hit) continue;

    if (!earliest || hit.t < earliest.t) {
      earliest = { ...hit, hazard, cause: hazard.type };
    }
  }

  return earliest;
}

export function loseLife(state, cause = "hazard") {
  if (state.orb.invulnerability > 0) return false;

  state.lives -= 1;
  state.run.deaths += 1;
  state.run.respawnSerial += 1;
  state.run.lastDeathCause = cause;

  if (state.lives <= 0) {
    const restartCount = state.run.restartCount + 1;
    const respawnSerial = state.run.respawnSerial;
    const deaths = state.run.deaths;
    const reset = createGameState();

    reset.run.restartCount = restartCount;
    reset.run.respawnSerial = respawnSerial;
    reset.run.deaths = deaths;
    reset.run.lastDeathCause = cause;
    reset.animation.runResetPulse = 1;
    reset.animation.deathPulse = 1;

    replaceState(state, reset);
    return true;
  }

  state.mode = "ready";
  state.launch.pointerId = null;
  state.orb.active = true;
  state.orb.x = state.checkpoint.spawnX;
  state.orb.y = state.checkpoint.spawnY;
  state.orb.vx = 0;
  state.orb.vy = 0;
  state.orb.lastBounce = null;
  state.orb.invulnerability = GAME_CONFIG.respawnInvulnerability;
  state.world.projectiles = [];
  state.animation.deathPulse = 1;
  state.animation.bouncePulse = 0;
  state.camera.x = state.orb.x;
  state.camera.y = state.orb.y;
  refreshWorldForFocus(state, state.orb.x);
  updateProgress(state);
  return true;
}

function simulateOrbFlight(state, dt) {
  const startX = state.orb.x;
  const startY = state.orb.y;

  state.orb.vy += GAME_CONFIG.orbGravity * dt;

  const speed = Math.hypot(state.orb.vx, state.orb.vy);
  if (speed > GAME_CONFIG.maxOrbSpeed) {
    const scale = GAME_CONFIG.maxOrbSpeed / speed;
    state.orb.vx *= scale;
    state.orb.vy *= scale;
  }

  const nextX = startX + state.orb.vx * dt;
  const nextY = startY + state.orb.vy * dt;

  refreshWorldForFocus(state, nextX);
  updateDynamicWorld(state);

  const surfaceHit = findEarliestSurfaceCollision(
    state,
    startX,
    startY,
    nextX,
    nextY,
    GAME_CONFIG.orbRadius
  );

  const lethalHit =
    state.orb.invulnerability > 0
      ? null
      : findEarliestLethalCollision(state, startX, startY, nextX, nextY);

  if (lethalHit && (!surfaceHit || lethalHit.t <= surfaceHit.t)) {
    state.orb.x = lethalHit.x ?? startX;
    state.orb.y = lethalHit.y ?? startY;
    loseLife(state, lethalHit.cause);
    return;
  }

  if (surfaceHit) {
    state.orb.x = surfaceHit.x;
    state.orb.y = surfaceHit.y;
    state.orb.travel += Math.hypot(surfaceHit.x - startX, surfaceHit.y - startY);
    bounceOrbFromSurface(state, surfaceHit);
  } else {
    state.orb.x = nextX;
    state.orb.y = nextY;
    state.orb.travel += Math.hypot(nextX - startX, nextY - startY);
  }

  if (
    state.orb.invulnerability <= 0 &&
    (state.orb.y > GROUND_TOP + WORLD_CONFIG.worldKillMargin ||
      state.orb.y < CEILING_BOTTOM - WORLD_CONFIG.worldKillMargin)
  ) {
    loseLife(state, "outOfBounds");
  }
}

function resolveStationaryLethalContacts(state) {
  if (state.orb.invulnerability > 0) return;

  const hit = findEarliestLethalCollision(
    state,
    state.orb.x,
    state.orb.y,
    state.orb.x,
    state.orb.y
  );

  if (hit) {
    loseLife(state, hit.cause);
  }
}

function findEarliestLethalCollision(state, startX, startY, endX, endY) {
  let earliest = findEarliestHazardCollision(
    state,
    startX,
    startY,
    endX,
    endY,
    GAME_CONFIG.orbRadius
  );

  for (const drone of state.world.drones) {
    const hit = segmentCircleIntersection(
      startX,
      startY,
      endX,
      endY,
      drone.x,
      drone.y,
      GAME_CONFIG.orbRadius + DRONE_CONFIG.radius
    );
    if (!hit) continue;
    if (!earliest || hit.t < earliest.t) {
      earliest = { ...hit, cause: "drone", drone };
    }
  }

  for (const projectile of state.world.projectiles) {
    const relativeStartX = projectile.prevX - startX;
    const relativeStartY = projectile.prevY - startY;
    const relativeEndX = projectile.x - endX;
    const relativeEndY = projectile.y - endY;
    const hit = segmentCircleIntersection(
      relativeStartX,
      relativeStartY,
      relativeEndX,
      relativeEndY,
      0,
      0,
      GAME_CONFIG.orbRadius + DRONE_CONFIG.projectileRadius
    );
    if (!hit) continue;

    if (!earliest || hit.t < earliest.t) {
      earliest = {
        t: hit.t,
        x: startX + (endX - startX) * hit.t,
        y: startY + (endY - startY) * hit.t,
        cause: "projectile",
        projectile
      };
    }
  }

  return earliest;
}

function bounceOrbFromSurface(state, hit) {
  const dot = state.orb.vx * hit.normalX + state.orb.vy * hit.normalY;

  if (dot < 0) {
    const impulse = (1 + GAME_CONFIG.bounceRestitution) * dot;
    state.orb.vx -= impulse * hit.normalX;
    state.orb.vy -= impulse * hit.normalY;
  }

  if (hit.normalX !== 0) {
    state.orb.vy *= GAME_CONFIG.bounceTangentialDamping;
  } else {
    state.orb.vx *= GAME_CONFIG.bounceTangentialDamping;
  }

  state.orb.x += hit.normalX * GAME_CONFIG.bounceSeparation;
  state.orb.y += hit.normalY * GAME_CONFIG.bounceSeparation;
  state.orb.lastBounce = {
    surfaceId: hit.surface.id,
    normalX: hit.normalX,
    normalY: hit.normalY
  };
  state.animation.bouncePulse = 1;

  const speed = Math.hypot(state.orb.vx, state.orb.vy);
  const canRest = hit.normalY === -1 && state.orb.vy <= 0;

  if (canRest && speed < GAME_CONFIG.restSpeedThreshold) {
    state.orb.vx = 0;
    state.orb.vy = 0;
    state.mode = "ready";
  }
}

function updateDynamicWorld(state) {
  for (const surface of state.world.surfaces) {
    applyMotion(surface, state.world.clock);
  }

  for (const hazard of state.world.hazards) {
    applyMotion(hazard, state.world.clock);

    if (hazard.type === "laser" && hazard.laser) {
      const phase = mod(
        state.world.clock + hazard.laser.phaseTime,
        hazard.laser.cycle
      );
      hazard.active = phase < hazard.laser.cycle * hazard.laser.activeRatio;
    } else {
      hazard.active = true;
    }
  }
}

function updateDrones(state, dt) {
  const orb = state.orb;

  for (const drone of state.world.drones) {
    const dx = orb.x - drone.x;
    const dy = orb.y - drone.y;
    const distance = Math.hypot(dx, dy);
    drone.cooldown -= dt;

    if (distance <= DRONE_CONFIG.acquireRange && distance > 1) {
      const desiredX = (dx / distance) * drone.speed;
      const desiredY = (dy / distance) * drone.speed;
      const pursuitScale = 0.72;

      drone.x += desiredX * dt * pursuitScale;
      drone.y += desiredY * dt * pursuitScale;
    } else {
      const phase = state.world.clock * 0.8 + drone.phase;
      drone.x += (drone.homeX + Math.sin(phase) * 24 - drone.x) * Math.min(1, dt * 1.8);
      drone.y += (drone.homeY + Math.cos(phase * 0.8) * 18 - drone.y) * Math.min(1, dt * 1.8);
    }

    const chunkMinX =
      drone.chunkIndex === null
        ? WORLD_CONFIG.proceduralStartX - 260
        : WORLD_CONFIG.proceduralStartX +
          drone.chunkIndex * WORLD_CONFIG.chunkWidth +
          DRONE_CONFIG.corridorPadding;
    const chunkMaxX =
      drone.chunkIndex === null
        ? WORLD_CONFIG.proceduralStartX + 100
        : WORLD_CONFIG.proceduralStartX +
          (drone.chunkIndex + 1) * WORLD_CONFIG.chunkWidth -
          DRONE_CONFIG.corridorPadding;

    drone.x = clamp(drone.x, chunkMinX, chunkMaxX);
    drone.y = clamp(
      drone.y,
      CEILING_BOTTOM + DRONE_CONFIG.corridorPadding,
      GROUND_TOP - DRONE_CONFIG.corridorPadding
    );

    if (
      drone.cooldown <= 0 &&
      distance <= DRONE_CONFIG.acquireRange &&
      state.world.projectiles.length < DRONE_CONFIG.maxProjectiles
    ) {
      fireDroneProjectile(state, drone, dx, dy, distance);
      drone.cooldown = drone.fireInterval;
    }
  }
}

function fireDroneProjectile(state, drone, dx, dy, distance) {
  const safeDistance = Math.max(1, distance);
  const vx = (dx / safeDistance) * drone.projectileSpeed;
  const vy = (dy / safeDistance) * drone.projectileSpeed;
  const serial = state.world.projectileSerial;
  state.world.projectileSerial += 1;

  state.world.projectiles.push({
    id: `${drone.id}-shot-${serial}`,
    ownerId: drone.id,
    chunkIndex: drone.chunkIndex,
    x: drone.x,
    y: drone.y,
    prevX: drone.x,
    prevY: drone.y,
    vx,
    vy,
    age: 0,
    lifetime: DRONE_CONFIG.projectileLifetime
  });
}

function advanceProjectiles(state, dt) {
  for (const projectile of state.world.projectiles) {
    projectile.prevX = projectile.x;
    projectile.prevY = projectile.y;
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.age += dt;
  }
}

function pruneProjectiles(state) {
  state.world.projectiles = state.world.projectiles.filter((projectile) => {
    if (projectile.age >= projectile.lifetime) return false;
    if (projectile.y < CEILING_BOTTOM - 120 || projectile.y > GROUND_TOP + 120) return false;
    if (projectile.x < state.orb.x - 1800 || projectile.x > state.orb.x + 2600) return false;
    return true;
  });

  if (state.world.projectiles.length > DRONE_CONFIG.maxProjectiles) {
    state.world.projectiles.splice(
      0,
      state.world.projectiles.length - DRONE_CONFIG.maxProjectiles
    );
  }
}

function updateCheckpointProgress(state) {
  let nextCheckpoint = null;

  for (const checkpoint of state.world.checkpoints) {
    if (
      checkpoint.index > state.checkpoint.index &&
      state.orb.x >= checkpoint.x &&
      (!nextCheckpoint || checkpoint.index < nextCheckpoint.index)
    ) {
      nextCheckpoint = checkpoint;
    }
  }

  if (!nextCheckpoint) return;

  state.checkpoint.index = nextCheckpoint.index;
  state.checkpoint.x = nextCheckpoint.x;
  state.checkpoint.spawnX = nextCheckpoint.spawnX;
  state.checkpoint.spawnY = nextCheckpoint.spawnY;
  state.progress.difficultyLevel = nextCheckpoint.difficultyAfter;
  state.animation.checkpointPulse = 1;
}

function updateProgress(state) {
  state.progress.maxProgressX = Math.max(state.progress.maxProgressX, state.orb.x);
  state.progress.currentMetres = Math.max(
    0,
    Math.floor((state.orb.x - state.progress.startX) / 10)
  );
  state.progress.furthestMetres = Math.max(
    state.progress.furthestMetres,
    Math.floor((state.progress.maxProgressX - state.progress.startX) / 10)
  );
}

function updateCamera(state, dt) {
  const cameraBlend = 1 - Math.exp(-GAME_CONFIG.cameraSharpness * dt);
  state.camera.x += (state.orb.x - state.camera.x) * cameraBlend;
  state.camera.y += (state.orb.y - state.camera.y) * cameraBlend;
}

function reconcileActiveDrones(existingDrones, definitions) {
  const previousById = new Map(existingDrones.map((drone) => [drone.id, drone]));

  return definitions.map((definition) => {
    const existing = previousById.get(definition.id);
    if (!existing) return { ...definition };

    return {
      ...definition,
      x: existing.x,
      y: existing.y,
      cooldown: existing.cooldown
    };
  });
}

function makeMovingPlatform(id, chunkIndex, x, y, axis, range, speed, phase) {
  return {
    id,
    type: "platform",
    visual: "movingPlatform",
    x,
    y,
    width: HAZARD_CONFIG.movingPlatformWidth,
    height: HAZARD_CONFIG.movingPlatformHeight,
    chunkIndex,
    motion: {
      axis,
      baseX: x,
      baseY: y,
      range,
      speed,
      phase
    }
  };
}

function applyMotion(item, clock) {
  if (!item.motion) return;

  const offset = Math.sin(clock * item.motion.speed + item.motion.phase) * item.motion.range;
  item.x = item.motion.baseX + (item.motion.axis === "x" ? offset : 0);
  item.y = item.motion.baseY + (item.motion.axis === "y" ? offset : 0);
}

function difficultyForChunk(chunkIndex) {
  return Math.min(HAZARD_CONFIG.difficultyCap, Math.max(1, chunkIndex + 1));
}

function getChunkIndexForX(x) {
  if (x <= WORLD_CONFIG.proceduralStartX) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor((x - WORLD_CONFIG.proceduralStartX) / WORLD_CONFIG.chunkWidth)
  );
}

function cloneWorldItem(item) {
  return {
    ...item,
    motion: item.motion ? { ...item.motion } : undefined,
    laser: item.laser ? { ...item.laser } : undefined
  };
}

function expandedRect(rect, radius) {
  if (radius <= 0) return rect;

  return {
    x: rect.x - radius,
    y: rect.y - radius,
    width: rect.width + radius * 2,
    height: rect.height + radius * 2
  };
}

function seededUnit(chunkIndex, salt) {
  let value =
    WORLD_CONFIG.seed ^
    Math.imul(chunkIndex + 1, 0x9e3779b1) ^
    Math.imul(salt + 1, 0x85ebca6b);

  value >>>= 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;

  return (value >>> 0) / 4294967296;
}

function segmentRectIntersection(startX, startY, endX, endY, rect) {
  const dx = endX - startX;
  const dy = endY - startY;
  let tEnter = 0;
  let tExit = 1;
  let normalX = 0;
  let normalY = 0;

  const xResult = clipAxis(startX, dx, rect.x, rect.x + rect.width, -1, 0, 1, 0);
  if (!xResult) return null;
  if (xResult.enter > tEnter) {
    tEnter = xResult.enter;
    normalX = xResult.normalX;
    normalY = xResult.normalY;
  }
  tExit = Math.min(tExit, xResult.exit);
  if (tEnter > tExit) return null;

  const yResult = clipAxis(startY, dy, rect.y, rect.y + rect.height, 0, -1, 0, 1);
  if (!yResult) return null;
  if (yResult.enter > tEnter) {
    tEnter = yResult.enter;
    normalX = yResult.normalX;
    normalY = yResult.normalY;
  }
  tExit = Math.min(tExit, yResult.exit);
  if (tEnter > tExit || tEnter < 0 || tEnter > 1) return null;

  if (normalX === 0 && normalY === 0 && (dx !== 0 || dy !== 0)) {
    if (Math.abs(dx) >= Math.abs(dy)) {
      normalX = dx >= 0 ? -1 : 1;
    } else {
      normalY = dy >= 0 ? -1 : 1;
    }
  }

  return {
    t: tEnter,
    x: startX + dx * tEnter,
    y: startY + dy * tEnter,
    normalX,
    normalY
  };
}

function segmentCircleIntersection(startX, startY, endX, endY, cx, cy, radius) {
  const dx = endX - startX;
  const dy = endY - startY;
  const fx = startX - cx;
  const fy = startY - cy;

  const a = dx * dx + dy * dy;
  const c = fx * fx + fy * fy - radius * radius;

  if (a < 1e-12) {
    if (c <= 0) {
      return { t: 0, x: startX, y: startY };
    }
    return null;
  }

  const b = 2 * (fx * dx + fy * dy);
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;

  const sqrtDiscriminant = Math.sqrt(discriminant);
  const t1 = (-b - sqrtDiscriminant) / (2 * a);
  const t2 = (-b + sqrtDiscriminant) / (2 * a);
  const t = t1 >= 0 && t1 <= 1 ? t1 : t2 >= 0 && t2 <= 1 ? t2 : null;
  if (t === null) return null;

  return {
    t,
    x: startX + dx * t,
    y: startY + dy * t
  };
}

function clipAxis(start, delta, min, max, minNormalX, minNormalY, maxNormalX, maxNormalY) {
  if (Math.abs(delta) < 1e-9) {
    return start < min || start > max
      ? null
      : { enter: 0, exit: 1, normalX: 0, normalY: 0 };
  }

  const tMin = (min - start) / delta;
  const tMax = (max - start) / delta;

  if (tMin <= tMax) {
    return { enter: tMin, exit: tMax, normalX: minNormalX, normalY: minNormalY };
  }

  return { enter: tMax, exit: tMin, normalX: maxNormalX, normalY: maxNormalY };
}

function replaceState(target, source) {
  for (const key of Object.keys(target)) {
    delete target[key];
  }
  Object.assign(target, source);
}

function mod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
