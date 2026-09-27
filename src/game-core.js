export const GAME_CONFIG = Object.freeze({
  gravity: 680,
  minThrowSpeed: 220,
  maxThrowSpeed: 1040,
  maxAimDistance: 220,
  aimDeadzone: 12,
  cameraSharpness: 10,
  handOffset: 30
});

const DEFAULT_AIM = Object.freeze({
  dx: 150,
  dy: -72,
  power: 0.58
});

export function createGameState() {
  const state = {
    mode: "ready",
    throwCount: 0,
    player: { x: 0, y: 0 },
    spear: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: Math.atan2(DEFAULT_AIM.dy, DEFAULT_AIM.dx),
      travel: 0
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
    camera: { x: 0, y: 0 },
    teleportPulse: 0
  };

  placeSpearInHand(state);
  return state;
}

export function beginAim(state, pointerX, pointerY, pointerId = 0) {
  const teleported = state.mode === "flying";

  if (teleported) {
    state.player.x = state.spear.x;
    state.player.y = state.spear.y;
    state.teleportPulse = 1;
  }

  state.mode = "aiming";
  state.spear.vx = 0;
  state.spear.vy = 0;
  state.spear.travel = 0;

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
    state.aim.power = clamp(
      rawDistance / GAME_CONFIG.maxAimDistance,
      0.18,
      1
    );

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

  state.spear.x = state.player.x + dirX * GAME_CONFIG.handOffset;
  state.spear.y = state.player.y + dirY * GAME_CONFIG.handOffset;
  state.spear.vx = dirX * speed;
  state.spear.vy = dirY * speed;
  state.spear.angle = Math.atan2(dirY, dirX);
  state.spear.travel = 0;

  state.mode = "flying";
  state.throwCount += 1;
  state.aim.pointerId = null;
  return true;
}

export function stepGame(state, deltaSeconds) {
  const dt = clamp(deltaSeconds, 0, 0.05);

  if (state.mode === "flying") {
    state.spear.vy += GAME_CONFIG.gravity * dt;
    state.spear.x += state.spear.vx * dt;
    state.spear.y += state.spear.vy * dt;
    state.spear.travel += Math.hypot(state.spear.vx * dt, state.spear.vy * dt);
    state.spear.angle = Math.atan2(state.spear.vy, state.spear.vx);
  } else {
    placeSpearInHand(state);
  }

  const target = state.mode === "flying" ? state.spear : state.player;
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

function placeSpearInHand(state) {
  const length = Math.hypot(state.aim.dx, state.aim.dy) || 1;
  const dirX = state.aim.dx / length;
  const dirY = state.aim.dy / length;

  state.spear.x = state.player.x + dirX * GAME_CONFIG.handOffset;
  state.spear.y = state.player.y + dirY * GAME_CONFIG.handOffset;
  state.spear.angle = Math.atan2(dirY, dirX);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
