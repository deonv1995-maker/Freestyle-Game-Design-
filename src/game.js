import {
  WORLD_SURFACES,
  beginAim,
  createGameState,
  getAimVector,
  getPlayerHandPosition,
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
  return {
    x: x - state.camera.x + viewportWidth * 0.5,
    y: y - state.camera.y + viewportHeight * 0.53
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
  const spacing = 160;
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
  ctx.save();

  for (const surface of WORLD_SURFACES) {
    const p = worldToScreen(surface.x, surface.y);

    if (
      p.x > viewportWidth + 80 ||
      p.x + surface.width < -80 ||
      p.y > viewportHeight + 80 ||
      p.y + surface.height < -80
    ) {
      continue;
    }

    if (surface.type === "ground") {
      ctx.fillStyle = "#202a25";
      ctx.fillRect(p.x, p.y, surface.width, surface.height);
      ctx.fillStyle = "#5f7a58";
      ctx.fillRect(p.x, p.y, surface.width, 7);
      ctx.fillStyle = "rgba(151, 184, 134, 0.42)";
      for (let x = p.x + 16; x < p.x + surface.width; x += 34) {
        ctx.fillRect(x, p.y - 4, 2, 6);
      }
      continue;
    }

    const isPlatform = surface.type === "platform";
    ctx.fillStyle = isPlatform ? "#36465f" : "#493d48";
    ctx.strokeStyle = isPlatform ? "#8499bb" : "#9f7f8a";
    ctx.lineWidth = 2;
    roundRect(ctx, p.x, p.y, surface.width, surface.height, isPlatform ? 6 : 4);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = isPlatform
      ? "rgba(203, 220, 244, 0.22)"
      : "rgba(232, 199, 208, 0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x + 8, p.y + 6);
    ctx.lineTo(p.x + surface.width - 8, p.y + 6);
    ctx.stroke();
  }

  ctx.restore();
}

function drawTrail() {
  if (trail.length < 2) return;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 1; i < trail.length; i += 1) {
    const a = worldToScreen(trail[i - 1].x, trail[i - 1].y);
    const b = worldToScreen(trail[i].x, trail[i].y);
    const alpha = (i / trail.length) * 0.34;
    ctx.strokeStyle = `rgba(255, 213, 106, ${alpha})`;
    ctx.lineWidth = 1 + (i / trail.length) * 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawAimGuide() {
  if (state.mode !== "aiming") return;

  const hand = getPlayerHandPosition(state);
  const origin = worldToScreen(hand.x, hand.y);
  const aim = getAimVector(state);
  const guideLength = 90 + aim.power * 100;
  const endX = origin.x + aim.x * guideLength;
  const endY = origin.y + aim.y * guideLength;

  ctx.save();
  ctx.setLineDash([8, 7]);
  ctx.strokeStyle = "rgba(255, 213, 106, 0.72)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(255, 213, 106, 0.95)";
  ctx.beginPath();
  ctx.arc(endX, endY, 4 + aim.power * 3, 0, Math.PI * 2);
  ctx.fill();

  const barWidth = 90;
  const barX = origin.x - barWidth * 0.5;
  const barY = origin.y + 48;
  ctx.fillStyle = "rgba(255,255,255,0.11)";
  roundRect(ctx, barX, barY, barWidth, 6, 3);
  ctx.fill();
  ctx.fillStyle = "rgba(255,213,106,0.9)";
  roundRect(ctx, barX, barY, barWidth * aim.power, 6, 3);
  ctx.fill();
  ctx.restore();
}

function drawTeleportPulse() {
  if (state.teleportPulse <= 0) return;

  const p = worldToScreen(state.player.x, state.player.y - 28);
  const progress = 1 - state.teleportPulse;
  const radius = 24 + progress * 48;

  ctx.save();
  ctx.strokeStyle = `rgba(121, 209, 255, ${state.teleportPulse * 0.75})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPlayer() {
  const p = worldToScreen(state.player.x, state.player.y);

  ctx.save();
  ctx.translate(p.x, p.y);

  ctx.strokeStyle = "#eef3ff";
  ctx.fillStyle = "#eef3ff";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.arc(0, -51, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, -42);
  ctx.lineTo(0, -17);
  ctx.moveTo(0, -34);
  ctx.lineTo(-13, -25);
  ctx.moveTo(0, -33);
  ctx.lineTo(12, -39);
  ctx.moveTo(0, -17);
  ctx.lineTo(-10, 0);
  ctx.moveTo(0, -17);
  ctx.lineTo(11, 0);
  ctx.stroke();

  ctx.restore();
}

function drawSpear() {
  const p = worldToScreen(state.spear.x, state.spear.y);

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(state.spear.angle);

  ctx.strokeStyle = "#e8d5a1";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.lineTo(25, 0);
  ctx.stroke();

  ctx.fillStyle = "#d9e6ff";
  ctx.beginPath();
  ctx.moveTo(34, 0);
  ctx.lineTo(22, -7);
  ctx.lineTo(22, 7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#b38b52";
  ctx.fillRect(-32, -3, 8, 6);

  if (state.mode === "stuck") {
    ctx.strokeStyle = "rgba(255, 213, 106, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function render() {
  drawBackground();
  drawWorldSurfaces();
  drawTrail();
  drawAimGuide();
  drawTeleportPulse();
  drawPlayer();
  drawSpear();
}

function updateHud() {
  if (state.mode === "flying") {
    statusNode.textContent = `SPEAR IN FLIGHT · THROW ${state.throwCount}`;
    hintNode.textContent = "Press and hold to jump to the spear now, then slide to aim the next throw.";
    return;
  }

  if (state.mode === "stuck") {
    statusNode.textContent = `SPEAR PLANTED · THROW ${state.throwCount}`;
    hintNode.textContent = "Hold the screen to relay onto this surface, slide to aim, then release.";
    return;
  }

  if (state.mode === "aiming") {
    statusNode.textContent = "AIMING";
    hintNode.textContent = "Slide in the throw direction. Release your finger to launch.";
    return;
  }

  statusNode.textContent = "READY";
  hintNode.textContent = "Use the floor, platforms and obstacles: hold, slide to aim, release to throw.";
}

function recordTrail() {
  if (state.mode !== "flying") return;

  const previous = trail.at(-1);
  if (!previous || Math.hypot(state.spear.x - previous.x, state.spear.y - previous.y) > 11) {
    trail.push({ x: state.spear.x, y: state.spear.y });
    if (trail.length > 26) trail.shift();
  }
}

function frame(now) {
  resizeCanvas();

  const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;

  stepGame(state, reduceMotion ? Math.min(dt, 1 / 30) : dt);
  recordTrail();
  render();
  requestAnimationFrame(frame);
}

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  canvas.setPointerCapture?.(event.pointerId);

  const wasRelaying = state.mode === "flying" || state.mode === "stuck";
  beginAim(state, event.clientX, event.clientY, event.pointerId);

  if (wasRelaying) {
    trail = [];
  }

  updateHud();
});

canvas.addEventListener("pointermove", (event) => {
  if (state.mode !== "aiming") return;
  event.preventDefault();
  updateAim(state, event.clientX, event.clientY, event.pointerId);
});

function finishAim(event) {
  if (state.mode !== "aiming") return;
  event.preventDefault();

  if (releaseAim(state, event.pointerId)) {
    trail = [{ x: state.spear.x, y: state.spear.y }];
    updateHud();
  }

  canvas.releasePointerCapture?.(event.pointerId);
}

canvas.addEventListener("pointerup", finishAim);
canvas.addEventListener("pointercancel", finishAim);

resetButton.addEventListener("click", () => {
  state = createGameState();
  trail = [];
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
