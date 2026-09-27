import {
  GAME_CONFIG,
  NPC_CONFIG,
  beginAim,
  cancelAim,
  createGameState,
  getLaunchVector,
  getWorldNpcs,
  getWorldSurfaces,
  releaseAim,
  stepGame,
  updateAim

} from "./game-core.js";

const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d", { alpha: false });
const statusNode = document.querySelector("#status");
const hintNode = document.querySelector("#hint");
const resetButton = document.querySelector("#resetButton");

let state = createGameState();
let trail = [];
let lastTime = performance.now();
let viewportWidth = 1;
let viewportHeight = 1;
let pixelRatio = 1;
let lastHudSnapshot = "";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  viewportWidth = Math.max(1, rect.width);
  viewportHeight = Math.max(1, rect.height);
  pixelRatio = Math.min(2.5, window.devicePixelRatio || 1);

  const width = Math.round(viewportWidth * pixelRatio);
  const height = Math.round(viewportHeight * pixelRatio);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function worldToScreen(x, y) {
  const scale = GAME_CONFIG.cameraZoom;
  return {
    x: (x - state.camera.x) * scale + viewportWidth * 0.5,
    y: (y - state.camera.y) * scale + viewportHeight * 0.53
  };
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, viewportHeight);
  gradient.addColorStop(0, "#14213b");
  gradient.addColorStop(0.55, "#10182b");
  gradient.addColorStop(1, "#090d18");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  drawParallaxDots();
  drawWorldGrid();
}

function drawParallaxDots() {
  ctx.save();
  ctx.fillStyle = "rgba(217, 230, 255, 0.24)";

  const spacing = 96;
  const offsetX = mod(-state.camera.x * 0.16, spacing);
  const offsetY = mod(-state.camera.y * 0.12, spacing);

  for (let y = offsetY - spacing; y < viewportHeight + spacing; y += spacing) {
    for (let x = offsetX - spacing; x < viewportWidth + spacing; x += spacing) {
      const key = Math.sin((x + state.camera.x * 0.16) * 0.021 + (y + state.camera.y * 0.12) * 0.037);
      const radius = key > 0.2 ? 1.4 : 0.8;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawWorldGrid() {
  const spacing = 160 * GAME_CONFIG.cameraZoom;
  const center = worldToScreen(0, 0);
  const startX = mod(center.x, spacing) - spacing;
  const startY = mod(center.y, spacing) - spacing;

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.045)";
  ctx.lineWidth = 1;

  for (let x = startX; x <= viewportWidth + spacing; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, viewportHeight);
    ctx.stroke();
  }

  for (let y = startY; y <= viewportHeight + spacing; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(viewportWidth, y);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillText(
    `x ${Math.round(state.camera.x)}   y ${Math.round(state.camera.y)}`,
    14,
    viewportHeight - 18
  );
  ctx.restore();
}

function drawWorldSurfaces() {
  const scale = GAME_CONFIG.cameraZoom;
  ctx.save();

  for (const surface of getWorldSurfaces(state)) {
    const p = worldToScreen(surface.x, surface.y);
    const width = surface.width * scale;
    const height = surface.height * scale;

    if (
      p.x > viewportWidth + 80 ||
      p.x + width < -80 ||
      p.y > viewportHeight + 80 ||
      p.y + height < -80
    ) {
      continue;
    }

    if (surface.type === "ground") {
      ctx.fillStyle = "#202a25";
      ctx.fillRect(p.x, p.y, width, height);
      ctx.fillStyle = "#5f7a58";
      ctx.fillRect(p.x, p.y, width, 7 * scale);
      ctx.fillStyle = "rgba(151, 184, 134, 0.42)";
      for (let x = p.x + 16 * scale; x < p.x + width; x += 34 * scale) {
        ctx.fillRect(x, p.y - 4 * scale, 2 * scale, 6 * scale);
      }
      continue;
    }

    const isPlatform = surface.type === "platform";
    ctx.fillStyle = isPlatform ? "#36465f" : "#493d48";
    ctx.strokeStyle = isPlatform ? "#8499bb" : "#9f7f8a";
    ctx.lineWidth = Math.max(1, 2 * scale);
    roundRect(
      ctx,
      p.x,
      p.y,
      width,
      height,
      (isPlatform ? 6 : 4) * scale
    );
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = isPlatform
      ? "rgba(203, 220, 244, 0.22)"
      : "rgba(232, 199, 208, 0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x + 8 * scale, p.y + 6 * scale);
    ctx.lineTo(p.x + width - 8 * scale, p.y + 6 * scale);
    ctx.stroke();
  }

  ctx.restore();
}

function drawNpcs() {
  const scale = GAME_CONFIG.cameraZoom;

  for (const npc of getWorldNpcs(state)) {
    const p = worldToScreen(npc.x, npc.y);
    if (p.x < -70 || p.x > viewportWidth + 70 || p.y < -90 || p.y > viewportHeight + 80) {
      continue;
    }

    const facing = npc.direction < 0 ? -1 : 1;
    const walking = npc.mode === "walking";
    const thrown = npc.mode === "thrown";
    const fallen = npc.mode === "fallen";
    const stride = walking
      ? Math.sin(state.animation.clock * (4.2 + npc.speed * 0.035) + npc.x * 0.018)
      : 0;
    const armSwing = stride * 7;
    const legSwing = stride * 9;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(scale, scale);

    if (thrown) {
      ctx.translate(0, -24);
      ctx.rotate(npc.rotation);
      ctx.translate(0, 24);
    } else if (fallen) {
      const fade = Math.max(
        0,
        Math.min(1, npc.behaviorTimer / NPC_CONFIG.fallenDespawnDelay)
      );
      ctx.globalAlpha = fade;
      ctx.translate(0, -4);
      ctx.rotate(npc.rotation);
    }

    ctx.strokeStyle = npc.hitFlash > 0 ? "#ffd56a" : "#f29b72";
    ctx.fillStyle = npc.hitFlash > 0 ? "#fff0b2" : "#ffd0b8";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.arc(0, -48, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(0, -18);

    ctx.moveTo(0, -35);
    ctx.lineTo(-facing * 11 - armSwing, -25);
    ctx.moveTo(0, -35);
    ctx.lineTo(facing * 11 + armSwing, -25);

    ctx.moveTo(0, -18);
    ctx.lineTo(-facing * 8 - legSwing, 0);
    ctx.moveTo(0, -18);
    ctx.lineTo(facing * 8 + legSwing, 0);
    ctx.stroke();

    ctx.fillStyle = "rgba(20, 25, 35, 0.72)";
    ctx.beginPath();
    ctx.arc(facing * 3, -49, 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawTrail() {
  if (trail.length < 2) return;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 1; i < trail.length; i += 1) {
    const a = worldToScreen(trail[i - 1].x, trail[i - 1].y);
    const b = worldToScreen(trail[i].x, trail[i].y);
    const age = i / trail.length;

    ctx.strokeStyle = `rgba(68, 178, 255, ${age * 0.24})`;
    ctx.lineWidth = 8 * age + 1;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    ctx.strokeStyle = `rgba(181, 233, 255, ${age * 0.58})`;
    ctx.lineWidth = 2.2 * age + 0.6;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawAimGuide() {
  if (state.mode !== "aiming" && state.mode !== "airAiming") return;

  const aim = getLaunchVector(state);
  const origin =
    state.mode === "airAiming"
      ? worldToScreen(state.orb.x, state.orb.y)
      : worldToScreen(state.player.x, state.player.y - 28);
  const guideLength = 95 + aim.power * 150;
  const endX = origin.x + aim.x * guideLength;
  const endY = origin.y + aim.y * guideLength;

  ctx.save();

  ctx.setLineDash([8, 7]);
  ctx.strokeStyle = "rgba(105, 207, 255, 0.8)";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(168, 229, 255, 0.92)";
  ctx.beginPath();
  ctx.arc(endX, endY, 5 + aim.power * 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(188, 236, 255, 0.68)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(endX, endY, 13, 0, Math.PI * 2);
  ctx.stroke();

  const barWidth = 104;
  const barX = origin.x - barWidth * 0.5;
  const barY = origin.y + 46;
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  roundRect(ctx, barX, barY, barWidth, 7, 4);
  ctx.fill();

  ctx.fillStyle = "rgba(86, 194, 255, 0.92)";
  roundRect(ctx, barX, barY, barWidth * aim.power, 7, 4);
  ctx.fill();

  ctx.restore();
}

function drawReformPulse() {
  if (state.animation.reformPulse <= 0) return;

  const p = worldToScreen(state.player.x, state.player.y - 28);
  const progress = 1 - state.animation.reformPulse;
  const radius = 18 + progress * 54;

  ctx.save();
  ctx.strokeStyle = `rgba(78, 190, 255, ${state.animation.reformPulse * 0.72})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius * GAME_CONFIG.cameraZoom, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPlayer() {
  if (state.mode === "orb" || state.mode === "airAiming") return;

  const p = worldToScreen(state.player.x, state.player.y);
  const scale = GAME_CONFIG.cameraZoom;
  const aiming = state.mode === "aiming";
  const aim = getLaunchVector(state);
  const facing = aim.x < -0.05 ? -1 : 1;
  const lean = aiming ? aim.x * 3.5 * state.launch.power : 0;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(scale, scale);

  if (aiming) {
    const aura = 18 + state.launch.power * 18;
    ctx.strokeStyle = `rgba(70, 187, 255, ${0.22 + state.launch.power * 0.45})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, -29, aura + i * 7, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = "#eef3ff";
  ctx.fillStyle = "#eef3ff";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.arc(lean * 0.25, -51, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(lean * 0.15, -42);
  ctx.lineTo(-lean * 0.12, -18);

  if (aiming) {
    ctx.moveTo(lean * 0.05, -36);
    ctx.lineTo(-facing * 9, -29);
    ctx.lineTo(-facing * 15, -20);
    ctx.moveTo(lean * 0.05, -36);
    ctx.lineTo(facing * 10, -30);
    ctx.lineTo(facing * 16, -22);
  } else {
    ctx.moveTo(0, -35);
    ctx.lineTo(-10, -27);
    ctx.moveTo(0, -35);
    ctx.lineTo(10, -27);
  }

  ctx.moveTo(-lean * 0.12, -18);
  ctx.lineTo(-9, 0);
  ctx.moveTo(-lean * 0.12, -18);
  ctx.lineTo(9, 0);
  ctx.stroke();

  if (aiming) {
    ctx.fillStyle = "rgba(116, 211, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(0, -31, 3 + state.launch.power * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawOrb() {
  if ((state.mode !== "orb" && state.mode !== "airAiming") || !state.orb.active) return;

  const p = worldToScreen(state.orb.x, state.orb.y);
  const scale = GAME_CONFIG.cameraZoom;
  const radius = GAME_CONFIG.orbRadius * scale;
  const phase = state.animation.clock;
  const pulse = 1 + Math.sin(phase * 11) * 0.08;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowColor = "rgba(72, 190, 255, 0.95)";
  ctx.shadowBlur = 24;

  const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 2.6);
  glow.addColorStop(0, "rgba(236, 251, 255, 1)");
  glow.addColorStop(0.24, "rgba(126, 219, 255, 0.98)");
  glow.addColorStop(0.52, "rgba(48, 153, 255, 0.72)");
  glow.addColorStop(1, "rgba(34, 115, 255, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius * 2.6 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(188, 239, 255, 0.98)";
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(207, 246, 255, 0.96)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6 + phase * (1.4 + i * 0.08);
    const inner = radius * 0.8;
    const mid = radius * (1.35 + 0.15 * Math.sin(phase * 13 + i));
    const outer = radius * (1.9 + 0.18 * Math.sin(phase * 9 + i * 1.7));
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(angle) * inner, p.y + Math.sin(angle) * inner);
    ctx.lineTo(
      p.x + Math.cos(angle + 0.19 * Math.sin(phase * 17 + i)) * mid,
      p.y + Math.sin(angle + 0.19 * Math.sin(phase * 17 + i)) * mid
    );
    ctx.lineTo(
      p.x + Math.cos(angle - 0.12) * outer,
      p.y + Math.sin(angle - 0.12) * outer
    );
    ctx.stroke();
  }

  if (state.animation.transformPulse > 0) {
    const transformRadius = radius * (1.7 + (1 - state.animation.transformPulse) * 3.5);
    ctx.strokeStyle = `rgba(122, 219, 255, ${state.animation.transformPulse * 0.7})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, transformRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (state.animation.bouncePulse > 0) {
    const bounceRadius = radius * (1.2 + (1 - state.animation.bouncePulse) * 2.2);
    ctx.strokeStyle = `rgba(204, 244, 255, ${state.animation.bouncePulse * 0.72})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, bounceRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawTimeFreezeField() {
  if (state.mode !== "airAiming") return;

  const p = worldToScreen(state.orb.x, state.orb.y);
  const phase = state.animation.clock;

  ctx.save();
  ctx.fillStyle = "rgba(8, 18, 35, 0.2)";
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  ctx.strokeStyle = "rgba(132, 222, 255, 0.34)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i += 1) {
    const radius = 34 + i * 20 + Math.sin(phase * 3 + i) * 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function render() {
  drawBackground();
  drawWorldSurfaces();
  drawNpcs();
  drawTrail();
  drawTimeFreezeField();
  drawAimGuide();
  drawReformPulse();
  drawPlayer();
  drawOrb();
}

function updateHud() {
  const progressMetres = Math.max(0, Math.round(state.world.maxProgressX / 10));
  const snapshot = [
    state.mode,
    state.burstCount,
    state.score.npcHits,
    progressMetres,
    Math.round(state.launch.power * 100)
  ].join("|");

  if (snapshot === lastHudSnapshot) return;
  lastHudSnapshot = snapshot;

  if (state.mode === "aiming") {
    statusNode.textContent =
      "AIMING · POWER " +
      Math.round(state.launch.power * 100) +
      "% · HITS " +
      state.score.npcHits +
      " · " +
      progressMetres +
      "m";
    hintNode.textContent =
      "Drag in the direction you want to travel, then release to transform and launch.";
    return;
  }

  if (state.mode === "airAiming") {
    statusNode.textContent =
      "TIME FROZEN · REDIRECT · POWER " +
      Math.round(state.launch.power * 100) +
      "% · HITS " +
      state.score.npcHits +
      " · " +
      progressMetres +
      "m";
    hintNode.textContent =
      "Time is frozen. Drag a new direction and release to redirect the orb.";
    return;
  }

  if (state.mode === "orb") {
    statusNode.textContent =
      "ENERGY FORM · BURST " +
      state.burstCount +
      " · HITS " +
      state.score.npcHits +
      " · " +
      progressMetres +
      "m";
    hintNode.textContent =
      "Tap and hold mid-air to freeze time and re-aim. Sides and undersides still bounce.";
    return;
  }

  statusNode.textContent =
    "READY · BURSTS " +
    state.burstCount +
    " · HITS " +
    state.score.npcHits +
    " · " +
    progressMetres +
    "m";
  hintNode.textContent =
    "Press anywhere, drag in the direction you want to move, then release.";
}

function recordTrail() {
  if (state.mode !== "orb") return;

  const previous = trail.at(-1);
  if (!previous || Math.hypot(state.orb.x - previous.x, state.orb.y - previous.y) > 8) {
    trail.push({ x: state.orb.x, y: state.orb.y });
    if (trail.length > 34) trail.shift();
  }
}

function frame(now) {
  resizeCanvas();

  const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;

  stepGame(state, reduceMotion ? Math.min(dt, 1 / 30) : dt);
  recordTrail();

  if (
    state.mode !== "orb" &&
    state.mode !== "airAiming" &&
    state.animation.reformPulse <= 0.15 &&
    trail.length > 0
  ) {
    trail.shift();
  }

  updateHud();
  render();
  requestAnimationFrame(frame);
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

canvas.addEventListener("pointerdown", (event) => {
  if (state.mode !== "ready" && state.mode !== "orb") return;

  event.preventDefault();
  const point = pointerPosition(event);

  if (beginAim(state, point.x, point.y, event.pointerId)) {
    canvas.setPointerCapture?.(event.pointerId);
    updateHud();
  }
});

canvas.addEventListener("pointermove", (event) => {
  if (state.launch.pointerId !== event.pointerId) return;

  event.preventDefault();
  const point = pointerPosition(event);
  updateAim(state, point.x, point.y, event.pointerId);
});

canvas.addEventListener("pointerup", (event) => {
  if (state.launch.pointerId !== event.pointerId) return;

  event.preventDefault();
  if (releaseAim(state, event.pointerId)) {
    trail = [{ x: state.orb.x, y: state.orb.y }];
  }
  canvas.releasePointerCapture?.(event.pointerId);
  updateHud();
});

canvas.addEventListener("pointercancel", (event) => {
  if (state.launch.pointerId !== event.pointerId) return;

  cancelAim(state, event.pointerId);
  canvas.releasePointerCapture?.(event.pointerId);
  updateHud();
});

resetButton.addEventListener("click", () => {
  state = createGameState();
  trail = [];
  lastHudSnapshot = "";
  updateHud();
});

window.addEventListener("resize", resizeCanvas);

function roundRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, Math.abs(width) * 0.5, Math.abs(height) * 0.5);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function mod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

resizeCanvas();
updateHud();
requestAnimationFrame(frame);
