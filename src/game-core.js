const GROUND_TOP = 180;

export const GAME_CONFIG = Object.freeze({
  orbGravity: 240,
  minLaunchSpeed: 280,
  maxLaunchSpeed: 980,
  maxDrawDistance: 220,
  aimDeadzone: 14,
  orbRadius: 16,
  steeringAcceleration: 920,
  steeringMaxDistance: 130,
  steeringDeadzone: 10,
  maxOrbSpeed: 1180,
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
    x: -1800,
    y: GROUND_TOP,
    width: WORLD_CONFIG.proceduralStartX + 1800,
    height: WORLD_CONFIG.groundDepth
  }),
  Object.freeze({ id: "platform-a", type: "platform", x: 70, y: 88, width: 170, height: 24 }),
  Object.freeze({ id: "wall-a", type: "obstacle", x: 340, y: 18, width: 52, height: 162 }),
  Object.freeze({ id: "platform-b", type: "platform", x: 500, y: -54, width: 220, height: 26 }),
  Object.freeze({ id: "pillar-b", type: "obstacle", x: 790, y: 60, width: 56, height: 120 }),
  Object.freeze({ id: "platform-c", type: "platform", x: 900, y: 22, width: 200, height: 24 }),
  Object.freeze({ id: "platform-d", type: "platform", x: 1150, y: -112, width: 240, height: 24 }),
  Object.freeze({ id: "block-d", type: "obstacle", x: 1450, y: 32, width: 112, height: 148 })
]);

const CHUNK_PATTERNS = Object.freeze([
  Object.freeze([
    Object.freeze({ type: "platform", x: 90, y: 88, width: 180, height: 24 }),
    Object.freeze({ type: "obstacle", x: 340, width: 52, height: 128 }),
    Object.freeze({ type: "platform", x: 465, y: -8, width: 205, height: 26 }),
    Object.freeze({ type: "obstacle", x: 735, width: 48, height: 92 })
  ]),
  Object.freeze([
    Object.freeze({ type: "obstacle", x: 125, width: 66, height: 96 }),
    Object.freeze({ type: "platform", x: 265, y: 54, width: 185, height: 24 }),
    Object.freeze({ type: "obstacle", x: 515, width: 54, height: 148 }),
    Object.freeze({ type: "platform", x: 610, y: -48, width: 175, height: 26 })
  ]),
  Object.freeze([
    Object.freeze({ type: "platform", x: 72, y: 36, width: 168, height: 24 }),
    Object.freeze({ type: "obstacle", x: 300, width: 50, height: 158 }),
    Object.freeze({ type: "platform", x: 405, y: 98, width: 150, height: 24 }),
    Object.freeze({ type: "obstacle", x: 605, width: 48, height: 112 }),
    Object.freeze({ type: "platform", x: 675, y: 4, width: 118, height: 24 })
  ]),
  Object.freeze([
    Object.freeze({ type: "obstacle", x: 92, width: 52, height: 122 }),
    Object.freeze({ type: "platform", x: 210, y: 6, width: 205, height: 26 }),
    Object.freeze({ type: "platform", x: 470, y: 82, width: 150, height: 24 }),
    Object.freeze({ type: "obstacle", x: 668, width: 58, height: 166 })
  ])
]);

const DEFAULT_LAUNCH = Object.freeze({
  dx: 1,
  dy: -0.35,
  power: 0
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
      contact: null
    },
    launch: {
      pointerId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      dx: DEFAULT_LAUNCH.dx,
      dy: DEFAULT_LAUNCH.dy,
      power: 0,
      dragDistance: 0
    },
    steering: {
      pointerId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      x: 0,
      y: 0,
      strength: 0
    },
    animation: {
      clock: 0,
      transformPulse: 0,
      reformPulse: 0
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

export function beginSlingshot(state, pointerX, pointerY, pointerId = 0) {
  if (state.mode !== "ready" || state.launch.pointerId !== null) {
    return false;
  }

  state.mode = "charging";
  state.launch.pointerId = pointerId;
  state.launch.startX = pointerX;
  state.launch.startY = pointerY;
  state.launch.currentX = pointerX;
  state.launch.currentY = pointerY;
  state.launch.dx = DEFAULT_LAUNCH.dx;
  state.launch.dy = DEFAULT_LAUNCH.dy;
  state.launch.power = 0;
  state.launch.dragDistance = 0;
  return true;
}

export function updateSlingshot(state, pointerX, pointerY, pointerId = 0) {
  if (state.mode !== "charging" || state.launch.pointerId !== pointerId) {
    return false;
  }

  state.launch.currentX = pointerX;
  state.launch.currentY = pointerY;

  const pullX = pointerX - state.launch.startX;
  const pullY = pointerY - state.launch.startY;
  const pullDistance = Math.hypot(pullX, pullY);
  state.launch.dragDistance = pullDistance;

  if (pullDistance >= GAME_CONFIG.aimDeadzone) {
    const scale = Math.min(1, GAME_CONFIG.maxDrawDistance / pullDistance);
    state.launch.dx = -pullX * scale;
    state.launch.dy = -pullY * scale;
    state.launch.power = clamp(pullDistance / GAME_CONFIG.maxDrawDistance, 0, 1);
  } else {
    state.launch.dx = DEFAULT_LAUNCH.dx;
    state.launch.dy = DEFAULT_LAUNCH.dy;
    state.launch.power = 0;
  }

  return true;
}

export function releaseSlingshot(state, pointerId = state.launch.pointerId) {
  if (state.mode !== "charging" || state.launch.pointerId !== pointerId) {
    return false;
  }

  state.launch.pointerId = null;

  if (state.launch.dragDistance < GAME_CONFIG.aimDeadzone) {
    state.mode = "ready";
    state.launch.power = 0;
    return false;
  }

  const aim = getLaunchVector(state);
  const speed =
    GAME_CONFIG.minLaunchSpeed +
    state.launch.power * (GAME_CONFIG.maxLaunchSpeed - GAME_CONFIG.minLaunchSpeed);

  state.orb.active = true;
  state.orb.x = state.player.x;
  state.orb.y = state.player.y - 28;
  state.orb.vx = aim.x * speed;
  state.orb.vy = aim.y * speed;
  state.orb.travel = 0;
  state.orb.contact = null;

  state.steering.pointerId = null;
  state.steering.x = 0;
  state.steering.y = 0;
  state.steering.strength = 0;

  state.animation.transformPulse = 1;
  state.mode = "orb";
  state.burstCount += 1;
  return true;
}

export function cancelSlingshot(state, pointerId = state.launch.pointerId) {
  if (state.mode !== "charging" || state.launch.pointerId !== pointerId) {
    return false;
  }

  state.launch.pointerId = null;
  state.launch.power = 0;
  state.launch.dragDistance = 0;
  state.mode = "ready";
  return true;
}

export function beginSteering(state, pointerX, pointerY, pointerId = 0) {
  if (state.mode !== "orb" || state.steering.pointerId !== null) {
    return false;
  }

  state.steering.pointerId = pointerId;
  state.steering.startX = pointerX;
  state.steering.startY = pointerY;
  state.steering.currentX = pointerX;
  state.steering.currentY = pointerY;
  state.steering.x = 0;
  state.steering.y = 0;
  state.steering.strength = 0;
  return true;
}

export function updateSteering(state, pointerX, pointerY, pointerId = 0) {
  if (state.mode !== "orb" || state.steering.pointerId !== pointerId) {
    return false;
  }

  state.steering.currentX = pointerX;
  state.steering.currentY = pointerY;

  const rawX = pointerX - state.steering.startX;
  const rawY = pointerY - state.steering.startY;
  const distance = Math.hypot(rawX, rawY);

  if (distance < GAME_CONFIG.steeringDeadzone) {
    state.steering.x = 0;
    state.steering.y = 0;
    state.steering.strength = 0;
    return true;
  }

  state.steering.x = rawX / distance;
  state.steering.y = rawY / distance;
  state.steering.strength = clamp(
    (distance - GAME_CONFIG.steeringDeadzone) /
      (GAME_CONFIG.steeringMaxDistance - GAME_CONFIG.steeringDeadzone),
    0,
    1
  );
  return true;
}

export function endSteering(state, pointerId = state.steering.pointerId) {
  if (state.steering.pointerId !== pointerId) {
    return false;
  }

  state.steering.pointerId = null;
  state.steering.x = 0;
  state.steering.y = 0;
  state.steering.strength = 0;
  return true;
}

export function stepGame(state, deltaSeconds) {
  const dt = clamp(deltaSeconds, 0, 0.05);

  state.animation.clock += dt;
  state.animation.transformPulse = Math.max(0, state.animation.transformPulse - dt * 3.5);
  state.animation.reformPulse = Math.max(0, state.animation.reformPulse - dt * 3);

  updateNpcs(state, dt);

  if (state.mode === "orb") {
    const startX = state.orb.x;
    const startY = state.orb.y;

    if (state.steering.strength > 0) {
      const acceleration = GAME_CONFIG.steeringAcceleration * state.steering.strength;
      state.orb.vx += state.steering.x * acceleration * dt;
      state.orb.vy += state.steering.y * acceleration * dt;
    }

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
    const surfaceHit = findEarliestSurfaceCollision(state, startX, startY, nextX, nextY);
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
      state.orb.vx = 0;
      state.orb.vy = 0;
      state.orb.contact = {
        surfaceId: surfaceHit.surface.id,
        normalX: surfaceHit.normalX,
        normalY: surfaceHit.normalY
      };
      state.orb.active = false;
      reformPlayerAtOrbImpact(state);
      state.mode = "ready";
      endSteering(state);
    } else {
      state.orb.x = nextX;
      state.orb.y = nextY;
      state.orb.travel += Math.hypot(nextX - startX, nextY - startY);
    }
  } else {
    refreshWorldForFocus(state, state.player.x);
    state.orb.x = state.player.x;
    state.orb.y = state.player.y - 28;
  }

  const target = state.mode === "orb" ? state.orb : state.player;
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
      chunkIndex: safeIndex
    }
  ];

  let platformNumber = 0;
  let obstacleNumber = 0;

  for (let elementIndex = 0; elementIndex < pattern.length; elementIndex += 1) {
    const element = pattern[elementIndex];
    const heightVariation = Math.round((seededUnit(safeIndex, elementIndex + 1) - 0.5) * 34);

    if (element.type === "platform") {
      const difficultyLift = Math.round(difficulty * 30);
      surfaces.push({
        id: `chunk-${safeIndex}-platform-${platformNumber}`,
        type: "platform",
        x: chunkX + element.x,
        y: element.y + heightVariation - difficultyLift,
        width: element.width,
        height: element.height,
        chunkIndex: safeIndex
      });
      platformNumber += 1;
      continue;
    }

    const obstacleHeight = Math.max(
      72,
      element.height + Math.round(heightVariation * 0.5) + Math.round(difficulty * 24)
    );

    surfaces.push({
      id: `chunk-${safeIndex}-obstacle-${obstacleNumber}`,
      type: "obstacle",
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

export function findEarliestSurfaceCollision(state, startX, startY, endX, endY) {
  let earliest = null;

  for (const surface of state.world.surfaces) {
    const hit = segmentRectIntersection(startX, startY, endX, endY, surface);
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

function reformPlayerAtOrbImpact(state) {
  state.player.x = state.orb.x;
  state.player.y = state.orb.y;
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
