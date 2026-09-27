const GROUND_TOP = 180;

export const GAME_CONFIG = Object.freeze({
  orbGravity: 240,
  minLaunchSpeed: 280,
  maxLaunchSpeed: 980,
  maxAimDistance: 220,
  aimDeadzone: 14,
  orbRadius: 16,
  maxOrbSpeed: 1180,
  bounceRestitution: 0.78,
  bounceSeparation: 1.25,
  cameraSharpness: 10,
  cameraZoom: 0.78
});

export const WORLD_CONFIG = Object.freeze({
  seed: 2000,
  groundTop: GROUND_TOP,
  groundDepth: 620,
  proceduralStartX: 1600,
  chunkWidth: 820,
  chunksBehind: 2,
  chunksAhead: 4
});

export const CITY_CONFIG = Object.freeze({
  minTowerHeight: 1120,
  maxTowerHeight: 1540,
  difficultyTowerGrowth: 180,
  platformDifficultyLift: 110
});

export const NPC_CONFIG = Object.freeze({
  width: 28,
  height: 56,
  perChunk: 2,
  minWalkSpeed: 24,
  maxWalkSpeed: 42,
  gravity: 680,
  hitVelocityScale: 0.58,
  hitLift: 170,
  orbCarryThrough: 0.9,
  fallenDespawnDelay: 0.18
});

const STARTER_NPCS = Object.freeze([
  Object.freeze({
    id: "starter-npc-0",
    chunkIndex: null,
    x: 80,
    y: GROUND_TOP,
    patrolMin: 24,
    patrolMax: 255,
    direction: 1,
    speed: 28,
    mode: "idle",
    behaviorTimer: 1.15,
    behaviorSeed: 0.22,
    behaviorPhase: 0,
    vx: 0,
    vy: 0,
    rotation: 0,
    rotationVelocity: 0,
    hitFlash: 0
  }),
  Object.freeze({
    id: "starter-npc-1",
    chunkIndex: null,
    x: 620,
    y: GROUND_TOP,
    patrolMin: 520,
    patrolMax: 760,
    direction: -1,
    speed: 34,
    mode: "walking",
    behaviorTimer: 2.6,
    behaviorSeed: 0.63,
    behaviorPhase: 0,
    vx: 0,
    vy: 0,
    rotation: 0,
    rotationVelocity: 0,
    hitFlash: 0
  }),
  Object.freeze({
    id: "starter-npc-2",
    chunkIndex: null,
    x: 1240,
    y: GROUND_TOP,
    patrolMin: 1120,
    patrolMax: 1400,
    direction: 1,
    speed: 31,
    mode: "walking",
    behaviorTimer: 1.9,
    behaviorSeed: 0.41,
    behaviorPhase: 0,
    vx: 0,
    vy: 0,
    rotation: 0,
    rotationVelocity: 0,
    hitFlash: 0
  })
]);

export const STARTER_SURFACES = Object.freeze([
  Object.freeze({
    id: "starter-ground",
    type: "ground",
    visual: "cityDeck",
    x: -1800,
    y: GROUND_TOP,
    width: WORLD_CONFIG.proceduralStartX + 1800,
    height: WORLD_CONFIG.groundDepth
  }),
  Object.freeze({
    id: "platform-a",
    type: "platform",
    visual: "hoverCar",
    x: 70,
    y: 88,
    width: 180,
    height: 28
  }),
  Object.freeze({
    id: "wall-a",
    type: "obstacle",
    visual: "tower",
    x: 340,
    y: GROUND_TOP - 1180,
    width: 118,
    height: 1180
  }),
  Object.freeze({
    id: "platform-b",
    type: "platform",
    visual: "landingPad",
    x: 510,
    y: -330,
    width: 230,
    height: 30
  }),
  Object.freeze({
    id: "pillar-b",
    type: "obstacle",
    visual: "spire",
    x: 790,
    y: GROUND_TOP - 1240,
    width: 92,
    height: 1240
  }),
  Object.freeze({
    id: "platform-c",
    type: "platform",
    visual: "roofDeck",
    x: 925,
    y: -210,
    width: 220,
    height: 30
  }),
  Object.freeze({
    id: "platform-d",
    type: "platform",
    visual: "hoverCar",
    x: 1190,
    y: -520,
    width: 210,
    height: 30
  }),
  Object.freeze({
    id: "block-d",
    type: "obstacle",
    visual: "tower",
    x: 1460,
    y: GROUND_TOP - 1360,
    width: 126,
    height: 1360
  })
]);

const CHUNK_PATTERNS = Object.freeze([
  Object.freeze([
    Object.freeze({
      type: "platform",
      visual: "landingPad",
      x: 72,
      y: -170,
      width: 190,
      height: 30
    }),
    Object.freeze({ type: "obstacle", visual: "tower", x: 320, width: 116, height: 1180 }),
    Object.freeze({
      type: "platform",
      visual: "hoverCar",
      x: 488,
      y: -520,
      width: 175,
      height: 28
    }),
    Object.freeze({ type: "obstacle", visual: "spire", x: 716, width: 94, height: 1260 })
  ]),
  Object.freeze([
    Object.freeze({ type: "obstacle", visual: "spire", x: 92, width: 96, height: 1160 }),
    Object.freeze({
      type: "platform",
      visual: "roofDeck",
      x: 235,
      y: -360,
      width: 190,
      height: 30
    }),
    Object.freeze({ type: "obstacle", visual: "tower", x: 478, width: 128, height: 1320 }),
    Object.freeze({
      type: "platform",
      visual: "hoverCar",
      x: 628,
      y: -610,
      width: 158,
      height: 28
    })
  ]),
  Object.freeze([
    Object.freeze({
      type: "platform",
      visual: "hoverCar",
      x: 58,
      y: -260,
      width: 166,
      height: 28
    }),
    Object.freeze({ type: "obstacle", visual: "tower", x: 272, width: 122, height: 1240 }),
    Object.freeze({
      type: "platform",
      visual: "landingPad",
      x: 438,
      y: -470,
      width: 168,
      height: 30
    }),
    Object.freeze({ type: "obstacle", visual: "spire", x: 650, width: 102, height: 1380 })
  ]),
  Object.freeze([
    Object.freeze({ type: "obstacle", visual: "tower", x: 78, width: 120, height: 1200 }),
    Object.freeze({
      type: "platform",
      visual: "landingPad",
      x: 242,
      y: -430,
      width: 188,
      height: 30
    }),
    Object.freeze({
      type: "platform",
      visual: "hoverCar",
      x: 486,
      y: -650,
      width: 152,
      height: 28
    }),
    Object.freeze({ type: "obstacle", visual: "tower", x: 680, width: 128, height: 1460 })
  ])
]);

const DEFAULT_LAUNCH = Object.freeze({
  dx: 150,
  dy: -72,
  power: 0.58
});

const START_POSITION = Object.freeze({ x: -120, y: GROUND_TOP });

export function createGameState() {
  const state = {
    mode: "ready",
    burstCount: 0,
    score: {
      npcHits: 0
    },
    player: { ...START_POSITION },
    orb: {
      active: false,
      x: START_POSITION.x,
      y: START_POSITION.y - 28,
      vx: 0,
      vy: 0,
      travel: 0,
      contact: null,
      lastBounce: null
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
      reformPulse: 0,
      bouncePulse: 0
    },
    camera: { ...START_POSITION },
    world: {
      maxProgressX: START_POSITION.x,
      activeStartChunk: null,
      activeEndChunk: null,
      surfaces: [],
      npcs: [],
      defeatedNpcIds: new Set()
    }
  };

  refreshWorldForFocus(state, START_POSITION.x);
  return state;
}

export function beginAim(state, pointerX, pointerY, pointerId = 0) {
  const beginningFromGround = state.mode === "ready";
  const beginningFromOrb = state.mode === "orb";

  if ((!beginningFromGround && !beginningFromOrb) || state.launch.pointerId !== null) {
    return false;
  }

  state.mode = beginningFromOrb ? "airAiming" : "aiming";
  state.launch.pointerId = pointerId;
  state.launch.startX = pointerX;
  state.launch.startY = pointerY;
  state.launch.currentX = pointerX;
  state.launch.currentY = pointerY;

  if (beginningFromOrb) {
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

  state.orb.active = true;
  state.orb.vx = aim.x * speed;
  state.orb.vy = aim.y * speed;
  state.orb.contact = null;
  state.orb.lastBounce = null;

  if (redirectingMidAir) {
    state.mode = "orb";
    return true;
  }

  state.orb.x = state.player.x;
  state.orb.y = state.player.y - 28;
  state.orb.travel = 0;
  state.animation.transformPulse = 1;
  state.animation.bouncePulse = 0;
  state.mode = "orb";
  state.burstCount += 1;
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
  state.animation.reformPulse = Math.max(0, state.animation.reformPulse - dt * 3);
  state.animation.bouncePulse = Math.max(0, state.animation.bouncePulse - dt * 5);

  const gameplayFrozen = state.mode === "airAiming";
  if (!gameplayFrozen) {
    updateNpcs(state, dt);
  }

  if (state.mode === "orb") {
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
    const surfaceHit = findEarliestSurfaceCollision(
      state,
      startX,
      startY,
      nextX,
      nextY,
      GAME_CONFIG.orbRadius
    );
    const npcHit = findEarliestNpcCollision(state, startX, startY, nextX, nextY);

    if (npcHit && (!surfaceHit || npcHit.t < surfaceHit.t)) {
      state.orb.x = npcHit.x;
      state.orb.y = npcHit.y;
      state.orb.travel += Math.hypot(npcHit.x - startX, npcHit.y - startY);
      throwNpcWithOrb(state, npcHit.npc);
      state.orb.vx *= NPC_CONFIG.orbCarryThrough;
      state.orb.vy *= NPC_CONFIG.orbCarryThrough;
    } else if (surfaceHit) {
      state.orb.x = surfaceHit.x;
      state.orb.y = surfaceHit.y;
      state.orb.travel += Math.hypot(surfaceHit.x - startX, surfaceHit.y - startY);

      if (isStandableLanding(surfaceHit, state.orb.vy)) {
        state.orb.vx = 0;
        state.orb.vy = 0;
        state.orb.contact = {
          surfaceId: surfaceHit.surface.id,
          normalX: surfaceHit.normalX,
          normalY: surfaceHit.normalY
        };
        state.orb.active = false;
        reformPlayerAtLanding(state, surfaceHit);
        state.mode = "ready";
      } else {
        bounceOrbFromSurface(state, surfaceHit);
      }
    } else {
      state.orb.x = nextX;
      state.orb.y = nextY;
      state.orb.travel += Math.hypot(nextX - startX, nextY - startY);
    }
  } else if (state.mode === "airAiming") {
    refreshWorldForFocus(state, state.orb.x);
  } else {
    refreshWorldForFocus(state, state.player.x);
    state.orb.x = state.player.x;
    state.orb.y = state.player.y - 28;
  }

  const target =
    state.mode === "orb" || state.mode === "airAiming" ? state.orb : state.player;
  const cameraBlend = 1 - Math.exp(-GAME_CONFIG.cameraSharpness * dt);
  state.camera.x += (target.x - state.camera.x) * cameraBlend;
  state.camera.y += (target.y - state.camera.y) * cameraBlend;
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

export function getWorldNpcs(state) {
  return state.world.npcs;
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

  const surfaces = [...STARTER_SURFACES];
  const npcDefinitions = STARTER_NPCS.map((npc) => ({ ...npc }));

  for (let chunkIndex = startChunk; chunkIndex <= endChunk; chunkIndex += 1) {
    const chunkSurfaces = generateWorldChunk(chunkIndex);
    surfaces.push(...chunkSurfaces);
    npcDefinitions.push(...generateNpcChunk(chunkIndex, chunkSurfaces));
  }

  state.world.activeStartChunk = startChunk;
  state.world.activeEndChunk = endChunk;
  state.world.surfaces = surfaces;
  state.world.npcs = reconcileActiveNpcs(
    state.world.npcs,
    npcDefinitions,
    state.world.defeatedNpcIds
  );
  return true;
}

export function generateWorldChunk(chunkIndex) {
  const safeIndex = Math.max(0, Math.floor(chunkIndex));
  const chunkX = WORLD_CONFIG.proceduralStartX + safeIndex * WORLD_CONFIG.chunkWidth;
  const patternIndex = Math.floor(seededUnit(safeIndex, 0) * CHUNK_PATTERNS.length);
  const pattern = CHUNK_PATTERNS[Math.min(CHUNK_PATTERNS.length - 1, patternIndex)];
  const difficulty = Math.min(1, safeIndex / 12);
  const surfaces = [
    {
      id: `chunk-${safeIndex}-ground`,
      type: "ground",
      x: chunkX,
      y: GROUND_TOP,
      width: WORLD_CONFIG.chunkWidth,
      height: WORLD_CONFIG.groundDepth,
      visual: "cityDeck",
      chunkIndex: safeIndex
    }
  ];

  let platformNumber = 0;
  let obstacleNumber = 0;

  for (let elementIndex = 0; elementIndex < pattern.length; elementIndex += 1) {
    const element = pattern[elementIndex];
    const heightVariation = Math.round((seededUnit(safeIndex, elementIndex + 1) - 0.5) * 34);

    if (element.type === "platform") {
      const difficultyLift = Math.round(difficulty * CITY_CONFIG.platformDifficultyLift);
      surfaces.push({
        id: `chunk-${safeIndex}-platform-${platformNumber}`,
        type: "platform",
        x: chunkX + element.x,
        y: element.y + heightVariation - difficultyLift,
        width: element.width,
        height: element.height,
        visual: element.visual || "landingPad",
        chunkIndex: safeIndex
      });
      platformNumber += 1;
      continue;
    }

    const obstacleHeight = clamp(
      element.height +
        Math.round(heightVariation * 0.5) +
        Math.round(difficulty * CITY_CONFIG.difficultyTowerGrowth),
      CITY_CONFIG.minTowerHeight,
      CITY_CONFIG.maxTowerHeight
    );

    surfaces.push({
      id: `chunk-${safeIndex}-obstacle-${obstacleNumber}`,
      type: "obstacle",
      visual: element.visual || "tower",
      x: chunkX + element.x,
      y: GROUND_TOP - obstacleHeight,
      width: element.width,
      height: obstacleHeight,
      chunkIndex: safeIndex
    });
    obstacleNumber += 1;
  }

  return surfaces;
}

export function generateNpcChunk(chunkIndex, chunkSurfaces = null) {
  const safeIndex = Math.max(0, Math.floor(chunkIndex));
  const chunkX = WORLD_CONFIG.proceduralStartX + safeIndex * WORLD_CONFIG.chunkWidth;
  const surfaces = chunkSurfaces || generateWorldChunk(safeIndex);
  const npcs = [];

  for (let npcIndex = 0; npcIndex < NPC_CONFIG.perChunk; npcIndex += 1) {
    const lane = (npcIndex + 1) / (NPC_CONFIG.perChunk + 1);
    const jitter = (seededUnit(safeIndex, 40 + npcIndex) - 0.5) * 110;
    const preferredX = chunkX + WORLD_CONFIG.chunkWidth * lane + jitter;
    const x = pickNpcSpawnX(surfaces, chunkX, preferredX);
    const behaviorSeed = seededUnit(safeIndex, 60 + npcIndex);
    const speed =
      NPC_CONFIG.minWalkSpeed +
      behaviorSeed * (NPC_CONFIG.maxWalkSpeed - NPC_CONFIG.minWalkSpeed);
    const patrolHalf = 72 + seededUnit(safeIndex, 70 + npcIndex) * 62;

    npcs.push({
      id: "chunk-" + safeIndex + "-npc-" + npcIndex,
      chunkIndex: safeIndex,
      x,
      y: GROUND_TOP,
      patrolMin: Math.max(chunkX + 24, x - patrolHalf),
      patrolMax: Math.min(chunkX + WORLD_CONFIG.chunkWidth - 24, x + patrolHalf),
      direction: seededUnit(safeIndex, 80 + npcIndex) < 0.5 ? -1 : 1,
      speed,
      mode: seededUnit(safeIndex, 90 + npcIndex) < 0.28 ? "idle" : "walking",
      behaviorTimer: 1.2 + seededUnit(safeIndex, 100 + npcIndex) * 2.2,
      behaviorSeed,
      behaviorPhase: 0,
      vx: 0,
      vy: 0,
      rotation: 0,
      rotationVelocity: 0,
      hitFlash: 0
    });
  }

  return npcs;
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
    const collisionRect =
      radius > 0
        ? {
            x: surface.x - radius,
            y: surface.y - radius,
            width: surface.width + radius * 2,
            height: surface.height + radius * 2
          }
        : surface;
    const hit = segmentRectIntersection(startX, startY, endX, endY, collisionRect);
    if (!hit) continue;

    if (!earliest || hit.t < earliest.t) {
      earliest = { ...hit, surface };
    }
  }

  return earliest;
}

export function findEarliestNpcCollision(state, startX, startY, endX, endY) {
  let earliest = null;

  for (const npc of state.world.npcs) {
    if (npc.mode === "thrown" || npc.mode === "fallen") continue;

    const bounds = {
      x: npc.x - NPC_CONFIG.width * 0.5,
      y: npc.y - NPC_CONFIG.height,
      width: NPC_CONFIG.width,
      height: NPC_CONFIG.height
    };
    const hit = segmentRectIntersection(startX, startY, endX, endY, bounds);
    if (!hit) continue;

    if (!earliest || hit.t < earliest.t) {
      earliest = { ...hit, npc };
    }
  }

  return earliest;
}

function reconcileActiveNpcs(existingNpcs, definitions, defeatedNpcIds) {
  const activeDefinitionIds = new Set(definitions.map((definition) => definition.id));
  for (const defeatedId of defeatedNpcIds) {
    if (!activeDefinitionIds.has(defeatedId)) {
      defeatedNpcIds.delete(defeatedId);
    }
  }

  const previousById = new Map(existingNpcs.map((npc) => [npc.id, npc]));
  return definitions
    .filter((definition) => !defeatedNpcIds.has(definition.id))
    .map((definition) => previousById.get(definition.id) || { ...definition });
}

function updateNpcs(state, dt) {
  for (const npc of state.world.npcs) {
    npc.hitFlash = Math.max(0, npc.hitFlash - dt * 3.5);

    if (npc.mode === "thrown") {
      npc.vy += NPC_CONFIG.gravity * dt;
      npc.x += npc.vx * dt;
      npc.y += npc.vy * dt;
      npc.rotation += npc.rotationVelocity * dt;

      if (npc.y >= GROUND_TOP) {
        npc.y = GROUND_TOP;
        npc.vx = 0;
        npc.vy = 0;
        npc.rotationVelocity = 0;
        npc.rotation = npc.direction < 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        npc.mode = "fallen";
        npc.behaviorTimer = NPC_CONFIG.fallenDespawnDelay;
      }
      continue;
    }

    if (npc.mode === "fallen") {
      npc.behaviorTimer -= dt;
      if (npc.behaviorTimer <= 0) {
        npc.mode = "removed";
      }
      continue;
    }

    npc.y = GROUND_TOP;
    npc.behaviorTimer -= dt;

    if (npc.mode === "walking") {
      const nextX = npc.x + npc.direction * npc.speed * dt;
      const outsidePatrol = nextX < npc.patrolMin || nextX > npc.patrolMax;
      const blocked = isNpcWalkBlocked(state.world.surfaces, npc, nextX);

      if (outsidePatrol || blocked) {
        npc.direction *= -1;
      } else {
        npc.x = nextX;
      }
    }

    if (npc.behaviorTimer <= 0) {
      npc.behaviorPhase += 1;
      if (npc.mode === "walking") {
        npc.mode = "idle";
        npc.behaviorTimer = 0.7 + npc.behaviorSeed * 1.15;
      } else {
        npc.mode = "walking";
        npc.direction = npc.behaviorPhase % 2 === 0 ? 1 : -1;
        npc.behaviorTimer = 1.8 + npc.behaviorSeed * 2.2;
      }
    }
  }

  state.world.npcs = state.world.npcs.filter((npc) => npc.mode !== "removed");
}

function throwNpcWithOrb(state, npc) {
  npc.mode = "thrown";
  npc.vx = state.orb.vx * NPC_CONFIG.hitVelocityScale;
  npc.vy = Math.min(-90, state.orb.vy * 0.24 - NPC_CONFIG.hitLift);
  npc.rotationVelocity = clamp(state.orb.vx * 0.012, -9, 9);
  npc.hitFlash = 1;
  npc.behaviorTimer = NPC_CONFIG.fallenDespawnDelay;
  npc.direction = state.orb.vx < 0 ? -1 : 1;
  state.world.defeatedNpcIds.add(npc.id);
  state.score.npcHits += 1;
}

function isStandableLanding(hit, incomingVy) {
  return (
    incomingVy > 0 &&
    hit.normalY === -1 &&
    (hit.surface.type === "ground" || hit.surface.type === "platform")
  );
}

function bounceOrbFromSurface(state, hit) {
  const dot = state.orb.vx * hit.normalX + state.orb.vy * hit.normalY;

  if (dot < 0) {
    const impulse = (1 + GAME_CONFIG.bounceRestitution) * dot;
    state.orb.vx -= impulse * hit.normalX;
    state.orb.vy -= impulse * hit.normalY;
  }

  state.orb.x += hit.normalX * GAME_CONFIG.bounceSeparation;
  state.orb.y += hit.normalY * GAME_CONFIG.bounceSeparation;
  state.orb.contact = null;
  state.orb.lastBounce = {
    surfaceId: hit.surface.id,
    normalX: hit.normalX,
    normalY: hit.normalY
  };
  state.animation.bouncePulse = 1;
}

function reformPlayerAtLanding(state, hit) {
  state.player.x = state.orb.x;
  state.player.y = hit.surface.y;
  state.animation.reformPulse = 1;
  state.world.maxProgressX = Math.max(state.world.maxProgressX, state.player.x);
  refreshWorldForFocus(state, state.player.x);
}

function isNpcWalkBlocked(surfaces, npc, nextX) {
  const halfWidth = NPC_CONFIG.width * 0.5 + 5;

  return surfaces.some(
    (surface) =>
      surface.type === "obstacle" &&
      npc.y >= surface.y &&
      npc.y <= surface.y + surface.height + 1 &&
      nextX + halfWidth > surface.x &&
      nextX - halfWidth < surface.x + surface.width
  );
}

function pickNpcSpawnX(surfaces, chunkX, preferredX) {
  const safeLeft = chunkX + 48;
  const safeRight = chunkX + WORLD_CONFIG.chunkWidth - 48;
  const clearance = NPC_CONFIG.width + 18;
  const obstacles = surfaces
    .filter((surface) => surface.type === "obstacle")
    .sort((a, b) => a.x - b.x);

  const ranges = [];
  let cursor = safeLeft;

  for (const obstacle of obstacles) {
    const blockedStart = Math.max(safeLeft, obstacle.x - clearance);
    const blockedEnd = Math.min(safeRight, obstacle.x + obstacle.width + clearance);

    if (blockedStart > cursor) {
      ranges.push([cursor, blockedStart]);
    }
    cursor = Math.max(cursor, blockedEnd);
  }

  if (cursor < safeRight) {
    ranges.push([cursor, safeRight]);
  }

  if (ranges.length === 0) {
    return clamp(preferredX, safeLeft, safeRight);
  }

  let bestRange = ranges[0];
  let bestDistance = Infinity;

  for (const range of ranges) {
    if (preferredX >= range[0] && preferredX <= range[1]) {
      return preferredX;
    }

    const nearest = clamp(preferredX, range[0], range[1]);
    const distance = Math.abs(nearest - preferredX);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestRange = range;
    }
  }

  return clamp(preferredX, bestRange[0], bestRange[1]);
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

  if (normalX === 0 && normalY === 0) {
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
