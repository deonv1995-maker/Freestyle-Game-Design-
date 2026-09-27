const GROUND_TOP = 180;

export const GAME_CONFIG = Object.freeze({
  gravity: 680,
  minThrowSpeed: 220,
  maxThrowSpeed: 1040,
  maxAimDistance: 220,
  aimDeadzone: 12,
  cameraSharpness: 10,
  handOffset: 30,
  handHeight: 34,
  throwFollowThroughDuration: 0.28,
  airborneAimVisualTimeScale: 0.18
});

export const WORLD_SURFACES = Object.freeze([
  Object.freeze({ id: "ground", type: "ground", x: -1800, y: GROUND_TOP, width: 5000, height: 620 }),
  Object.freeze({ id: "platform-a", type: "platform", x: 70, y: 88, width: 170, height: 24 }),
  Object.freeze({ id: "wall-a", type: "obstacle", x: 340, y: 18, width: 52, height: 162 }),
  Object.freeze({ id: "platform-b", type: "platform", x: 500, y: -54, width: 220, height: 26 }),
  Object.freeze({ id: "pillar-b", type: "obstacle", x: 790, y: 60, width: 56, height: 120 }),
  Object.freeze({ id: "platform-c", type: "platform", x: 900, y: 22, width: 200, height: 24 }),
  Object.freeze({ id: "platform-d", type: "platform", x: 1150, y: -112, width: 240, height: 24 }),
  Object.freeze({ id: "block-d", type: "obstacle", x: 1450, y: 32, width: 112, height: 148 })
]);

const DEFAULT_AIM = Object.freeze({
  dx: 150,
  dy: -72,
  power: 0.58
});

const START_POSITION = Object.freeze({ x: -120, y: GROUND_TOP });

export function createGameState() {
  const state = {
    mode: "ready",
    throwCount: 0,
    player: { ...START_POSITION },
    spear: {
      x: START_POSITION.x,
      y: START_POSITION.y,
      vx: 0,
      vy: 0,
      angle: Math.atan2(DEFAULT_AIM.dy, DEFAULT_AIM.dx),
      travel: 0,
      contact: null
    },
    aim: {
      pointerId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      dx: DEFAULT_AIM.dx,
      dy: DEFAULT_AIM.dy,
      power: DEFAULT_AIM.power,
      dragDistance: 0
    },
    lastAim: { ...DEFAULT_AIM },
    animation: {
      clock: 0,
      airborneAim: false,
      playerAirborne: false,
      airborneAimClock: 0,
      throwFollowThrough: 0,
      throwDirectionX: 1,
      throwDirectionY: 0
    },
    camera: { ...START_POSITION },
    teleportPulse: 0
  };

  placeSpearInHand(state);
  return state;
}

export function beginAim(state, pointerX, pointerY, pointerId = 0) {
  const relayedFromFlight = state.mode === "flying";
  const teleported = relayedFromFlight || state.mode === "stuck";

  if (teleported) {
    state.player.x = state.spear.x;
    state.player.y = state.spear.y;
    state.teleportPulse = 1;
  }

  state.mode = "aiming";
  state.spear.vx = 0;
  state.spear.vy = 0;
  state.spear.travel = 0;
  state.spear.contact = null;

  state.animation.airborneAim = relayedFromFlight;
  state.animation.playerAirborne = relayedFromFlight;
  state.animation.airborneAimClock = 0;
  state.animation.throwFollowThrough = 0;

  state.aim.pointerId = pointerId;
  state.aim.startX = pointerX;
  state.aim.startY = pointerY;
  state.aim.currentX = pointerX;
  state.aim.currentY = pointerY;
  state.aim.dx = state.lastAim.dx;
  state.aim.dy = state.lastAim.dy;
  state.aim.power = state.lastAim.power;
  state.aim.dragDistance = 0;

  placeSpearInHand(state);
  return { teleported };
}

export function updateAim(state, pointerX, pointerY, pointerId = 0) {
  if (state.mode !== "aiming" || state.aim.pointerId !== pointerId) {
    return false;
  }

  state.aim.currentX = pointerX;
  state.aim.currentY = pointerY;

  const rawX = pointerX - state.aim.startX;
  const rawY = pointerY - state.aim.startY;
  const rawDistance = Math.hypot(rawX, rawY);
  state.aim.dragDistance = rawDistance;

  if (rawDistance >= GAME_CONFIG.aimDeadzone) {
    const scale = Math.min(1, GAME_CONFIG.maxAimDistance / rawDistance);
    state.aim.dx = rawX * scale;
    state.aim.dy = rawY * scale;
    state.aim.power = clamp(rawDistance / GAME_CONFIG.maxAimDistance, 0.18, 1);

    state.lastAim.dx = state.aim.dx;
    state.lastAim.dy = state.aim.dy;
    state.lastAim.power = state.aim.power;
  }

  placeSpearInHand(state);
  return true;
}

export function releaseAim(state, pointerId = state.aim.pointerId) {
  if (state.mode !== "aiming" || state.aim.pointerId !== pointerId) {
    return false;
  }

  const length = Math.hypot(state.aim.dx, state.aim.dy) || 1;
  const dirX = state.aim.dx / length;
  const dirY = state.aim.dy / length;
  const speed =
    GAME_CONFIG.minThrowSpeed +
    state.aim.power * (GAME_CONFIG.maxThrowSpeed - GAME_CONFIG.minThrowSpeed);
  const hand = getPlayerHandPosition(state);

  state.spear.x = hand.x + dirX * GAME_CONFIG.handOffset;
  state.spear.y = hand.y + dirY * GAME_CONFIG.handOffset;
  state.spear.vx = dirX * speed;
  state.spear.vy = dirY * speed;
  state.spear.angle = Math.atan2(dirY, dirX);
  state.spear.travel = 0;
  state.spear.contact = null;

  state.animation.throwDirectionX = dirX;
  state.animation.throwDirectionY = dirY;
  state.animation.throwFollowThrough = 1;
  state.animation.airborneAim = false;

  state.mode = "flying";
  state.throwCount += 1;
  state.aim.pointerId = null;
  return true;
}

export function stepGame(state, deltaSeconds) {
  const dt = clamp(deltaSeconds, 0, 0.05);

  state.animation.clock += dt;

  if (state.animation.airborneAim) {
    state.animation.airborneAimClock += dt * GAME_CONFIG.airborneAimVisualTimeScale;
  }

  if (state.animation.throwFollowThrough > 0) {
    state.animation.throwFollowThrough = Math.max(
      0,
      state.animation.throwFollowThrough - dt / GAME_CONFIG.throwFollowThroughDuration
    );
  }

  if (state.mode === "flying") {
    const startX = state.spear.x;
    const startY = state.spear.y;

    state.spear.vy += GAME_CONFIG.gravity * dt;
    const nextX = startX + state.spear.vx * dt;
    const nextY = startY + state.spear.vy * dt;
    const hit = findEarliestSurfaceCollision(startX, startY, nextX, nextY);

    if (hit) {
      state.spear.x = hit.x;
      state.spear.y = hit.y;
      state.spear.travel += Math.hypot(hit.x - startX, hit.y - startY);
      state.spear.angle = Math.atan2(state.spear.vy, state.spear.vx);
      state.spear.vx = 0;
      state.spear.vy = 0;
      state.spear.contact = {
        surfaceId: hit.surface.id,
        normalX: hit.normalX,
        normalY: hit.normalY
      };
      state.mode = "stuck";
    } else {
      state.spear.x = nextX;
      state.spear.y = nextY;
      state.spear.travel += Math.hypot(nextX - startX, nextY - startY);
      state.spear.angle = Math.atan2(state.spear.vy, state.spear.vx);
    }
  } else if (state.mode !== "stuck") {
    placeSpearInHand(state);
  }

  const target = state.mode === "flying" || state.mode === "stuck" ? state.spear : state.player;
  const cameraBlend = 1 - Math.exp(-GAME_CONFIG.cameraSharpness * dt);
  state.camera.x += (target.x - state.camera.x) * cameraBlend;
  state.camera.y += (target.y - state.camera.y) * cameraBlend;

  state.teleportPulse = Math.max(0, state.teleportPulse - dt * 2.6);
}

export function getAimVector(state) {
  const length = Math.hypot(state.aim.dx, state.aim.dy) || 1;
  return {
    x: state.aim.dx / length,
    y: state.aim.dy / length,
    power: state.aim.power
  };
}

export function getPlayerHandPosition(state) {
  return {
    x: state.player.x,
    y: state.player.y - GAME_CONFIG.handHeight
  };
}

export function findEarliestSurfaceCollision(startX, startY, endX, endY) {
  let earliest = null;

  for (const surface of WORLD_SURFACES) {
    const hit = segmentRectIntersection(startX, startY, endX, endY, surface);
    if (!hit) continue;

    if (!earliest || hit.t < earliest.t) {
      earliest = { ...hit, surface };
    }
  }

  return earliest;
}

function placeSpearInHand(state) {
  const length = Math.hypot(state.aim.dx, state.aim.dy) || 1;
  const dirX = state.aim.dx / length;
  const dirY = state.aim.dy / length;
  const hand = getPlayerHandPosition(state);

  state.spear.x = hand.x + dirX * GAME_CONFIG.handOffset;
  state.spear.y = hand.y + dirY * GAME_CONFIG.handOffset;
  state.spear.angle = Math.atan2(dirY, dirX);
  state.spear.contact = null;
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
    return start < min || start > max ? null : { enter: 0, exit: 1, normalX: 0, normalY: 0 };
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
