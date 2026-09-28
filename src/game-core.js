
const CORRIDOR_LEFT = -230;
const CORRIDOR_RIGHT = 230;
const START_Y = 520;
const START_POSITION = Object.freeze({ x: 0, y: START_Y });

export const GAME_CONFIG = Object.freeze({
  orbGravity: 0,
  minLaunchSpeed: 260,
  maxLaunchSpeed: 900,
  maxAimDistance: 220,
  aimDeadzone: 14,
  orbRadius: 16,
  maxOrbSpeed: 1080,
  bounceRestitution: 0.8,
  bounceTangentialDamping: 0.97,
  bounceSeparation: 1.5,
  restSpeedThreshold: 105,
  cameraSharpness: 10,
  cameraZoom: 0.78,
  touchTimeScale: 0.4,
  respawnInvulnerability: 0.9,
  startingLives: 7
});

export const WORLD_CONFIG = Object.freeze({
  seed: 2000,
  corridorLeft: CORRIDOR_LEFT,
  corridorRight: CORRIDOR_RIGHT,
  corridorCenterX: (CORRIDOR_LEFT + CORRIDOR_RIGHT) * 0.5,
  structuralThickness: 90,
  starterBottomY: 680,
  proceduralStartY: 220,
  chunkHeight: 820,
  chunksBehind: 2,
  chunksAhead: 4,
  checkpointInset: 86,
  checkpointSafeRadius: 190,
  worldKillMargin: 180
});

export const HAZARD_CONFIG = Object.freeze({
  laserHeight: 12,
  laserWallInset: 0,
  laserBaseCycle: 7.2,
  laserMinimumCycle: 3.6,
  laserBeamTravelDuration: 1.8,
  laserShutdownFlickerDuration: 0.7,
  laserShutdownFlickerRate: 9,
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
  firstChunk: 1,
  encounterChunkSpacing: 2,
  basePerChunk: 1,
  extraDroneDifficultyStep: 5,
  maxPerChunk: 2,
  minSpeed: 210,
  maxSpeed: 390,
  acquireRange: 760,
  baseFireInterval: 1.9,
  minFireInterval: 0.78,
  preFireWarningDuration: 0.6,
  projectileRadius: 6,
  projectileBaseSpeed: 430,
  projectileMaxSpeed: 680,
  projectileLifetime: 3.2,
  maxProjectiles: 28,
  corridorPadding: 72,
  verticalInset: 170,
  verticalJitter: 20,
  difficultyCap: 10
});

export const EFFECT_CONFIG = Object.freeze({
  droneExplosionDuration: 0.55,
  maxDroneExplosions: 12
});

const DEFAULT_LAUNCH = Object.freeze({
  dx: 0,
  dy: -150,
  power: 0.58
});


export const STARTER_SURFACES = Object.freeze([
  Object.freeze({
    id: "starter-left-wall",
    type: "leftWall",
    visual: "corridorWall",
    x: CORRIDOR_LEFT - WORLD_CONFIG.structuralThickness,
    y: WORLD_CONFIG.proceduralStartY,
    width: WORLD_CONFIG.structuralThickness,
    height: WORLD_CONFIG.starterBottomY - WORLD_CONFIG.proceduralStartY
  }),
  Object.freeze({
    id: "starter-right-wall",
    type: "rightWall",
    visual: "corridorWall",
    x: CORRIDOR_RIGHT,
    y: WORLD_CONFIG.proceduralStartY,
    width: WORLD_CONFIG.structuralThickness,
    height: WORLD_CONFIG.starterBottomY - WORLD_CONFIG.proceduralStartY
  }),
  Object.freeze({
    id: "starter-bottom-wall",
    type: "bottomWall",
    visual: "corridorWall",
    x: CORRIDOR_LEFT,
    y: WORLD_CONFIG.starterBottomY,
    width: CORRIDOR_RIGHT - CORRIDOR_LEFT,
    height: WORLD_CONFIG.structuralThickness
  }),
  Object.freeze({
    id: "starter-moving-platform",
    type: "platform",
    visual: "movingPlatform",
    x: -85,
    y: 350,
    width: HAZARD_CONFIG.movingPlatformWidth,
    height: HAZARD_CONFIG.movingPlatformHeight,
    motion: Object.freeze({
      axis: "x",
      baseX: -85,
      baseY: 350,
      range: 96,
      speed: 1.05,
      phase: 0.45
    })
  })
]);

export const STARTER_HAZARDS = Object.freeze([
  Object.freeze({
    id: "starter-laser",
    type: "laser",
    visual: "laser",
    x: CORRIDOR_LEFT + HAZARD_CONFIG.laserWallInset,
    y: 315,
    width:
      CORRIDOR_RIGHT -
      CORRIDOR_LEFT -
      HAZARD_CONFIG.laserWallInset * 2,
    height: HAZARD_CONFIG.laserHeight,
    active: true,
    laser: Object.freeze({
      cycle: HAZARD_CONFIG.laserBaseCycle,
      activeRatio: 0.5,
      phaseTime: 0.35,
      sourceSide: "left"
    })
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
    effects: {
      droneExplosions: []
    },
    camera: { x: START_POSITION.x, y: START_POSITION.y },
    progress: {
      startY: START_POSITION.y,
      currentMetres: 0,
      furthestMetres: 0,
      minProgressY: START_POSITION.y,
      difficultyLevel: 1
    },
    checkpoint: {
      index: 0,
      x: START_POSITION.x,
      y: START_POSITION.y,
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
      destroyedDroneIds: new Set(),
      projectiles: [],
      projectileSerial: 0
    }
  };

  refreshWorldForFocus(state, START_POSITION.y);
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
  const touchSlowMotionActive = state.launch.pointerId !== null;
  const gameplayScale = touchSlowMotionActive ? GAME_CONFIG.touchTimeScale : 1;
  const gameplayDt = dt * gameplayScale;

  // Any active gameplay touch/aim slows authoritative gameplay and
  // gameplay-driven animation together, including the very first launch aim.
  state.animation.clock += gameplayDt;
  state.animation.transformPulse = Math.max(
    0,
    state.animation.transformPulse - gameplayDt * 3.5
  );
  state.animation.bouncePulse = Math.max(
    0,
    state.animation.bouncePulse - gameplayDt * 5
  );
  state.animation.deathPulse = Math.max(
    0,
    state.animation.deathPulse - gameplayDt * 2.2
  );
  state.animation.checkpointPulse = Math.max(
    0,
    state.animation.checkpointPulse - gameplayDt * 1.8
  );
  state.animation.runResetPulse = Math.max(
    0,
    state.animation.runResetPulse - gameplayDt * 1.5
  );

  state.world.clock += gameplayDt;
  state.orb.invulnerability = Math.max(
    0,
    state.orb.invulnerability - gameplayDt
  );
  advanceTransientEffects(state, gameplayDt);

  refreshWorldForFocus(state, state.orb.y);
  updateDynamicWorld(state);
  updateDrones(state, gameplayDt);
  advanceProjectiles(state, gameplayDt);

  if (state.mode === "orb" || state.mode === "airAiming") {
    simulateOrbFlight(state, gameplayDt);
  } else {
    resolveStationarySurfaceContacts(state);
    resolveStationaryLethalContacts(state);
  }

  updateProgress(state);
  updateCheckpointProgress(state);
  pruneProjectiles(state);

  // Camera interpolation remains presentation-time based so aiming stays
  // readable and responsive while the world itself runs at the scaled rate.
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

export function getDroneExplosions(state) {
  return state.effects.droneExplosions;
}


export function refreshWorldForFocus(state, focusY) {
  const focusChunk = getChunkIndexForY(focusY);
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
  const droneDefinitions = [];

  for (let chunkIndex = startChunk; chunkIndex <= endChunk; chunkIndex += 1) {
    surfaces.push(...generateWorldChunk(chunkIndex));
    hazards.push(...generateHazardChunk(chunkIndex));
    checkpoints.push(generateCheckpoint(chunkIndex));
    droneDefinitions.push(...generateDroneChunk(chunkIndex));
  }

  const activeDroneDefinitionIds = new Set(droneDefinitions.map((drone) => drone.id));
  for (const destroyedId of state.world.destroyedDroneIds) {
    if (!activeDroneDefinitionIds.has(destroyedId)) {
      state.world.destroyedDroneIds.delete(destroyedId);
    }
  }

  const activeDroneDefinitions = droneDefinitions.filter(
    (drone) => !state.world.destroyedDroneIds.has(drone.id)
  );

  state.world.activeStartChunk = startChunk;
  state.world.activeEndChunk = endChunk;
  state.world.surfaces = surfaces;
  state.world.hazards = hazards;
  state.world.checkpoints = checkpoints;
  state.world.drones = reconcileActiveDrones(state.world.drones, activeDroneDefinitions);
  state.world.projectiles = state.world.projectiles.filter((projectile) => {
    if (projectile.chunkIndex === null) return true;
    return projectile.chunkIndex >= startChunk - 1 && projectile.chunkIndex <= endChunk + 1;
  });

  updateDynamicWorld(state);
  return true;
}


export function generateWorldChunk(chunkIndex) {
  const safeIndex = Math.max(0, Math.floor(chunkIndex));
  const chunkBottomY = WORLD_CONFIG.proceduralStartY - safeIndex * WORLD_CONFIG.chunkHeight;
  const chunkTopY = chunkBottomY - WORLD_CONFIG.chunkHeight;
  const difficulty = difficultyForChunk(safeIndex);
  const motionSpeed =
    HAZARD_CONFIG.movingPlatformBaseSpeed + Math.min(0.75, (difficulty - 1) * 0.07);
  const motionRange =
    HAZARD_CONFIG.movingPlatformRange + Math.min(48, (difficulty - 1) * 5);

  const lowerPlatformY =
    chunkBottomY - 235 - Math.round(seededUnit(safeIndex, 6) * 70);
  const upperPlatformY =
    chunkBottomY - 565 - Math.round(seededUnit(safeIndex, 7) * 80);

  return [
    {
      id: `chunk-${safeIndex}-left-wall`,
      type: "leftWall",
      visual: "corridorWall",
      x: CORRIDOR_LEFT - WORLD_CONFIG.structuralThickness,
      y: chunkTopY,
      width: WORLD_CONFIG.structuralThickness,
      height: WORLD_CONFIG.chunkHeight,
      chunkIndex: safeIndex
    },
    {
      id: `chunk-${safeIndex}-right-wall`,
      type: "rightWall",
      visual: "corridorWall",
      x: CORRIDOR_RIGHT,
      y: chunkTopY,
      width: WORLD_CONFIG.structuralThickness,
      height: WORLD_CONFIG.chunkHeight,
      chunkIndex: safeIndex
    },
    makeMovingPlatform(
      `chunk-${safeIndex}-left-platform`,
      safeIndex,
      CORRIDOR_LEFT + 58,
      lowerPlatformY,
      "x",
      motionRange,
      motionSpeed,
      seededUnit(safeIndex, 8) * Math.PI * 2
    ),
    makeMovingPlatform(
      `chunk-${safeIndex}-right-platform`,
      safeIndex,
      CORRIDOR_RIGHT - HAZARD_CONFIG.movingPlatformWidth - 58,
      upperPlatformY,
      "x",
      motionRange * 0.82,
      motionSpeed * 1.08,
      seededUnit(safeIndex, 9) * Math.PI * 2
    )
  ];
}


export function generateHazardChunk(chunkIndex) {
  const safeIndex = Math.max(0, Math.floor(chunkIndex));
  const chunkBottomY = WORLD_CONFIG.proceduralStartY - safeIndex * WORLD_CONFIG.chunkHeight;
  const difficulty = difficultyForChunk(safeIndex);

  const cycle = Math.max(
    HAZARD_CONFIG.laserMinimumCycle,
    HAZARD_CONFIG.laserBaseCycle - (difficulty - 1) * 0.12
  );
  const activeRatio = Math.min(
    HAZARD_CONFIG.laserMaxActiveRatio,
    HAZARD_CONFIG.laserBaseActiveRatio + (difficulty - 1) * 0.018
  );
  const laserY =
    chunkBottomY - 330 - Math.round(seededUnit(safeIndex, 14) * 90);
  const corridorWidth = CORRIDOR_RIGHT - CORRIDOR_LEFT;

  const hazards = [
    {
      id: `chunk-${safeIndex}-laser-0`,
      type: "laser",
      visual: "laser",
      x: CORRIDOR_LEFT + HAZARD_CONFIG.laserWallInset,
      y: laserY,
      width: corridorWidth - HAZARD_CONFIG.laserWallInset * 2,
      height: HAZARD_CONFIG.laserHeight,
      active: true,
      chunkIndex: safeIndex,
      difficulty,
      laser: {
        cycle,
        activeRatio,
        phaseTime: seededUnit(safeIndex, 16) * cycle,
        sourceSide: safeIndex % 2 === 0 ? "left" : "right"
      }
    }
  ];

  if (difficulty >= 6) {
    const secondLaserY = chunkBottomY - 610;
    hazards.push({
      id: `chunk-${safeIndex}-laser-1`,
      type: "laser",
      visual: "laser",
      x: CORRIDOR_LEFT + HAZARD_CONFIG.laserWallInset,
      y: secondLaserY,
      width: corridorWidth - HAZARD_CONFIG.laserWallInset * 2,
      height: HAZARD_CONFIG.laserHeight,
      active: true,
      chunkIndex: safeIndex,
      difficulty,
      laser: {
        cycle: Math.max(HAZARD_CONFIG.laserMinimumCycle, cycle * 0.92),
        activeRatio: Math.min(HAZARD_CONFIG.laserMaxActiveRatio, activeRatio + 0.04),
        phaseTime: seededUnit(safeIndex, 20) * cycle,
        sourceSide: safeIndex % 2 === 0 ? "right" : "left"
      }
    });
  }

  return hazards;
}

export function generateDroneChunk(chunkIndex) {
  const safeIndex = Math.max(0, Math.floor(chunkIndex));

  if (safeIndex < DRONE_CONFIG.firstChunk) {
    return [];
  }

  const chunkOffset = safeIndex - DRONE_CONFIG.firstChunk;
  if (chunkOffset % DRONE_CONFIG.encounterChunkSpacing !== 0) {
    return [];
  }

  const encounterIndex = Math.floor(
    chunkOffset / DRONE_CONFIG.encounterChunkSpacing
  );
  const chunkBottomY =
    WORLD_CONFIG.proceduralStartY - safeIndex * WORLD_CONFIG.chunkHeight;
  const difficulty = Math.min(
    DRONE_CONFIG.difficultyCap,
    encounterIndex + 1
  );
  const count = Math.min(
    DRONE_CONFIG.maxPerChunk,
    DRONE_CONFIG.basePerChunk +
      Math.floor((difficulty - 1) / DRONE_CONFIG.extraDroneDifficultyStep)
  );
  const drones = [];
  const usableWidth =
    CORRIDOR_RIGHT - CORRIDOR_LEFT - DRONE_CONFIG.corridorPadding * 2;
  const verticalSpan =
    WORLD_CONFIG.chunkHeight - DRONE_CONFIG.verticalInset * 2;

  for (let index = 0; index < count; index += 1) {
    const lane = count === 1 ? 0.5 : index / (count - 1);
    const x =
      CORRIDOR_LEFT +
      DRONE_CONFIG.corridorPadding +
      seededUnit(safeIndex, 30 + index) * usableWidth;
    const y =
      chunkBottomY -
      DRONE_CONFIG.verticalInset -
      lane * verticalSpan +
      (seededUnit(safeIndex, 40 + index) - 0.5) *
        DRONE_CONFIG.verticalJitter *
        2;
    const speed = Math.min(
      DRONE_CONFIG.maxSpeed,
      DRONE_CONFIG.minSpeed +
        (difficulty - 1) * 16 +
        seededUnit(safeIndex, 50 + index) * 34
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
  const chunkBottomY = WORLD_CONFIG.proceduralStartY - safeIndex * WORLD_CONFIG.chunkHeight;
  const y =
    chunkBottomY - WORLD_CONFIG.chunkHeight + WORLD_CONFIG.checkpointInset;

  return {
    id: `checkpoint-${safeIndex + 1}`,
    index: safeIndex + 1,
    x: WORLD_CONFIG.corridorCenterX,
    y,
    spawnX: WORLD_CONFIG.corridorCenterX,
    spawnY: y - 34,
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
  const overlapHit = findShallowestSurfacePenetration(
    state,
    startX,
    startY,
    radius
  );

  if (overlapHit) {
    return {
      t: 0,
      x: startX,
      y: startY,
      ...overlapHit
    };
  }

  let earliest = null;

  for (const surface of state.world.surfaces) {
    const collisionRect = expandedRect(surface, radius);

    if (segmentStartsByLeavingRect(startX, startY, endX, endY, collisionRect)) {
      continue;
    }

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

    const collisionRect = getHazardCollisionRect(hazard);
    if (!collisionRect) continue;

    const hit = segmentRectIntersection(
      startX,
      startY,
      endX,
      endY,
      expandedRect(collisionRect, radius)
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
  refreshWorldForFocus(state, state.orb.y);
  updateProgress(state);
  return true;
}

function simulateOrbFlight(state, dt) {
  const startX = state.orb.x;
  const startY = state.orb.y;

  const speed = Math.hypot(state.orb.vx, state.orb.vy);
  if (speed > GAME_CONFIG.maxOrbSpeed) {
    const scale = GAME_CONFIG.maxOrbSpeed / speed;
    state.orb.vx *= scale;
    state.orb.vy *= scale;
  }

  const nextX = startX + state.orb.vx * dt;
  const nextY = startY + state.orb.vy * dt;

  refreshWorldForFocus(state, nextY);
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

  const blockingTime = Math.min(surfaceHit?.t ?? 1, lethalHit?.t ?? 1);
  destroyDronesAlongSegment(state, startX, startY, nextX, nextY, blockingTime);

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
    (state.orb.x < CORRIDOR_LEFT - WORLD_CONFIG.worldKillMargin ||
      state.orb.x > CORRIDOR_RIGHT + WORLD_CONFIG.worldKillMargin ||
      state.orb.y > WORLD_CONFIG.starterBottomY + WORLD_CONFIG.worldKillMargin)
  ) {
    loseLife(state, "outOfBounds");
  }
}

function resolveStationaryLethalContacts(state) {
  destroyDronesAlongSegment(
    state,
    state.orb.x,
    state.orb.y,
    state.orb.x,
    state.orb.y
  );

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

function destroyDronesAlongSegment(
  state,
  startX,
  startY,
  endX,
  endY,
  maxTime = 1
) {
  const destroyedDrones = [];

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

    if (!hit || hit.t > maxTime + 1e-9) continue;
    destroyedDrones.push(drone);
  }

  if (destroyedDrones.length === 0) return 0;

  const destroyedIds = destroyedDrones.map((drone) => drone.id);
  const destroyedSet = new Set(destroyedIds);

  for (const drone of destroyedDrones) {
    state.world.destroyedDroneIds.add(drone.id);
    queueDroneExplosion(state, drone);
  }

  state.world.drones = state.world.drones.filter(
    (drone) => !destroyedSet.has(drone.id)
  );

  return destroyedDrones.length;
}

function queueDroneExplosion(state, drone) {
  state.effects.droneExplosions.push({
    sourceId: drone.id,
    x: drone.x,
    y: drone.y,
    age: 0,
    duration: EFFECT_CONFIG.droneExplosionDuration,
    phase: mod(state.world.clock * 2.7 + drone.x * 0.013 + drone.y * 0.009, Math.PI * 2)
  });

  if (state.effects.droneExplosions.length > EFFECT_CONFIG.maxDroneExplosions) {
    state.effects.droneExplosions.splice(
      0,
      state.effects.droneExplosions.length - EFFECT_CONFIG.maxDroneExplosions
    );
  }
}

function advanceTransientEffects(state, dt) {
  for (const explosion of state.effects.droneExplosions) {
    explosion.age += dt;
  }

  state.effects.droneExplosions = state.effects.droneExplosions.filter(
    (explosion) => explosion.age < explosion.duration
  );
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

  separateOrbFromSurface(state, hit);
  state.orb.lastBounce = {
    surfaceId: hit.surface.id,
    normalX: hit.normalX,
    normalY: hit.normalY
  };
  state.animation.bouncePulse = 1;

  const speed = Math.hypot(state.orb.vx, state.orb.vy);

  if (speed < GAME_CONFIG.restSpeedThreshold && state.mode !== "airAiming") {
    state.orb.vx = 0;
    state.orb.vy = 0;
    state.mode = "ready";
  }
}

function separateOrbFromSurface(state, hit) {
  const penetrationDepth = Math.max(0, hit.penetrationDepth ?? 0);
  const correction = penetrationDepth + GAME_CONFIG.bounceSeparation;

  state.orb.x += hit.normalX * correction;
  state.orb.y += hit.normalY * correction;
}

function resolveStationarySurfaceContacts(state) {
  // A moving platform can advance into a resting/aiming orb between frames.
  // Resolve any overlap without cancelling the player's current input state.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const hit = findShallowestSurfacePenetration(
      state,
      state.orb.x,
      state.orb.y,
      GAME_CONFIG.orbRadius
    );

    if (!hit) return;

    separateOrbFromSurface(state, hit);
    state.orb.lastBounce = {
      surfaceId: hit.surface.id,
      normalX: hit.normalX,
      normalY: hit.normalY
    };
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
      const activeDuration = hazard.laser.cycle * hazard.laser.activeRatio;
      const beamTravelDuration = Math.min(
        HAZARD_CONFIG.laserBeamTravelDuration,
        activeDuration
      );

      const shutdownFlickerDuration = Math.min(
        HAZARD_CONFIG.laserShutdownFlickerDuration,
        activeDuration
      );
      const activeTimeRemaining = activeDuration - phase;

      hazard.active = phase < activeDuration;
      hazard.laser.beamProgress =
        hazard.active && beamTravelDuration > 0
          ? clamp(phase / beamTravelDuration, 0, 1)
          : 0;
      hazard.laser.shutdownFlicker =
        hazard.active &&
        activeTimeRemaining <= shutdownFlickerDuration;
      hazard.laser.flickerLevel = hazard.laser.shutdownFlicker
        ? Math.floor(
            (shutdownFlickerDuration - activeTimeRemaining) *
              HAZARD_CONFIG.laserShutdownFlickerRate *
              2
          ) %
            2 ===
          0
          ? 1
          : 0.35
        : 1;
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
    const targetInRange =
      distance <= DRONE_CONFIG.acquireRange && distance > 1;
    const projectileCapacityAvailable =
      state.world.projectiles.length < DRONE_CONFIG.maxProjectiles;

    drone.cooldown = Math.max(0, drone.cooldown - dt);

    if (!targetInRange || !projectileCapacityAvailable) {
      drone.cooldown = Math.max(
        drone.cooldown,
        DRONE_CONFIG.preFireWarningDuration
      );
    }

    drone.fireWarning =
      targetInRange &&
      projectileCapacityAvailable &&
      drone.cooldown <= DRONE_CONFIG.preFireWarningDuration;
    drone.fireWarningProgress = drone.fireWarning
      ? clamp(
          1 - drone.cooldown / DRONE_CONFIG.preFireWarningDuration,
          0,
          1
        )
      : 0;

    if (targetInRange) {
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

    const chunkBottomY =
      drone.chunkIndex === null
        ? WORLD_CONFIG.starterBottomY
        : WORLD_CONFIG.proceduralStartY - drone.chunkIndex * WORLD_CONFIG.chunkHeight;
    const chunkTopY =
      drone.chunkIndex === null
        ? WORLD_CONFIG.proceduralStartY
        : chunkBottomY - WORLD_CONFIG.chunkHeight;

    drone.x = clamp(
      drone.x,
      CORRIDOR_LEFT + DRONE_CONFIG.corridorPadding,
      CORRIDOR_RIGHT - DRONE_CONFIG.corridorPadding
    );
    drone.y = clamp(
      drone.y,
      chunkTopY + DRONE_CONFIG.corridorPadding,
      chunkBottomY - DRONE_CONFIG.corridorPadding
    );

    if (
      drone.cooldown <= 0 &&
      targetInRange &&
      projectileCapacityAvailable
    ) {
      fireDroneProjectile(state, drone, dx, dy, distance);
      drone.cooldown = drone.fireInterval;
      drone.fireWarning = false;
      drone.fireWarningProgress = 0;
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
    if (projectile.x < CORRIDOR_LEFT - 120 || projectile.x > CORRIDOR_RIGHT + 120) {
      return false;
    }
    if (projectile.y < state.orb.y - 2600 || projectile.y > state.orb.y + 1800) {
      return false;
    }
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
      state.orb.y <= checkpoint.y &&
      (!nextCheckpoint || checkpoint.index < nextCheckpoint.index)
    ) {
      nextCheckpoint = checkpoint;
    }
  }

  if (!nextCheckpoint) return;

  state.checkpoint.index = nextCheckpoint.index;
  state.checkpoint.x = nextCheckpoint.x;
  state.checkpoint.y = nextCheckpoint.y;
  state.checkpoint.spawnX = nextCheckpoint.spawnX;
  state.checkpoint.spawnY = nextCheckpoint.spawnY;
  state.progress.difficultyLevel = nextCheckpoint.difficultyAfter;
  state.animation.checkpointPulse = 1;
}


function updateProgress(state) {
  state.progress.minProgressY = Math.min(state.progress.minProgressY, state.orb.y);
  state.progress.currentMetres = Math.max(
    0,
    Math.floor((state.progress.startY - state.orb.y) / 10)
  );
  state.progress.furthestMetres = Math.max(
    state.progress.furthestMetres,
    Math.floor((state.progress.startY - state.progress.minProgressY) / 10)
  );
}


function updateCamera(state, dt) {
  const cameraBlend = 1 - Math.exp(-GAME_CONFIG.cameraSharpness * dt);
  state.camera.x += (WORLD_CONFIG.corridorCenterX - state.camera.x) * cameraBlend;
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
      cooldown: existing.cooldown,
      fireWarning: existing.fireWarning ?? false,
      fireWarningProgress: existing.fireWarningProgress ?? 0
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


function getChunkIndexForY(y) {
  if (y >= WORLD_CONFIG.proceduralStartY) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor((WORLD_CONFIG.proceduralStartY - y) / WORLD_CONFIG.chunkHeight)
  );
}

function cloneWorldItem(item) {
  return {
    ...item,
    motion: item.motion ? { ...item.motion } : undefined,
    laser: item.laser ? { ...item.laser } : undefined
  };
}

function getHazardCollisionRect(hazard) {
  if (hazard.type !== "laser" || !hazard.laser) {
    return hazard;
  }

  const beamProgress = clamp(hazard.laser.beamProgress ?? 0, 0, 1);
  const beamWidth = hazard.width * beamProgress;

  if (beamWidth <= 1e-9) {
    return null;
  }

  const sourceFromRight = hazard.laser.sourceSide === "right";

  return {
    x: sourceFromRight ? hazard.x + hazard.width - beamWidth : hazard.x,
    y: hazard.y,
    width: beamWidth,
    height: hazard.height
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

function findShallowestSurfacePenetration(state, x, y, radius = 0) {
  let shallowest = null;

  for (const surface of state.world.surfaces) {
    const penetration = pointRectPenetration(
      x,
      y,
      expandedRect(surface, radius)
    );

    if (!penetration) continue;

    if (
      !shallowest ||
      penetration.depth < shallowest.penetrationDepth
    ) {
      shallowest = {
        surface,
        normalX: penetration.normalX,
        normalY: penetration.normalY,
        penetrationDepth: penetration.depth
      };
    }
  }

  return shallowest;
}

function pointRectPenetration(x, y, rect) {
  const epsilon = 1e-7;
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;

  if (
    x <= rect.x + epsilon ||
    x >= right - epsilon ||
    y <= rect.y + epsilon ||
    y >= bottom - epsilon
  ) {
    return null;
  }

  const candidates = [
    { depth: x - rect.x, normalX: -1, normalY: 0 },
    { depth: right - x, normalX: 1, normalY: 0 },
    { depth: y - rect.y, normalX: 0, normalY: -1 },
    { depth: bottom - y, normalX: 0, normalY: 1 }
  ];

  let shallowest = candidates[0];

  for (let index = 1; index < candidates.length; index += 1) {
    if (candidates[index].depth < shallowest.depth) {
      shallowest = candidates[index];
    }
  }

  return shallowest;
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

function segmentStartsByLeavingRect(startX, startY, endX, endY, rect) {
  const epsilon = 1e-7;
  const dx = endX - startX;
  const dy = endY - startY;
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;
  const withinX = startX >= rect.x - epsilon && startX <= right + epsilon;
  const withinY = startY >= rect.y - epsilon && startY <= bottom + epsilon;

  if (withinX && Math.abs(startY - rect.y) <= epsilon && dy < 0) return true;
  if (withinX && Math.abs(startY - bottom) <= epsilon && dy > 0) return true;
  if (withinY && Math.abs(startX - rect.x) <= epsilon && dx < 0) return true;
  if (withinY && Math.abs(startX - right) <= epsilon && dx > 0) return true;

  return false;
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
