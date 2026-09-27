import {
  beginAim,
  createGameState,
  getAimVector,
  getPlayerHandPosition,
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

  for (const surface of getWorldSurfaces(state)) {
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
  const airborne = state.animation.airborneAim;
  const guideColor = airborne
    ? "rgba(121, 209, 255, 0.86)"
    : "rgba(255, 213, 106, 0.72)";
  const solidGuideColor = airborne
    ? "rgba(156, 224, 255, 0.98)"
    : "rgba(255, 213, 106, 0.95)";

  ctx.save();
  ctx.setLineDash(airborne ? [5, 8] : [8, 7]);
  ctx.strokeStyle = guideColor;
  ctx.lineWidth = airborne ? 2.5 : 2;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = solidGuideColor;
  ctx.beginPath();
  ctx.arc(endX, endY, 4 + aim.power * 3, 0, Math.PI * 2);
  ctx.fill();

  if (airborne) {
    ctx.strokeStyle = "rgba(156, 224, 255, 0.66)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(endX, endY, 13, 0, Math.PI * 2);
    ctx.moveTo(endX - 19, endY);
    ctx.lineTo(endX - 8, endY);
    ctx.moveTo(endX + 8, endY);
    ctx.lineTo(endX + 19, endY);
    ctx.moveTo(endX, endY - 19);
    ctx.lineTo(endX, endY - 8);
    ctx.moveTo(endX, endY + 8);
    ctx.lineTo(endX, endY + 19);
    ctx.stroke();
  }

  const barWidth = 90;
  const barX = origin.x - barWidth * 0.5;
  const barY = origin.y + 48;
  ctx.fillStyle = "rgba(255,255,255,0.11)";
  roundRect(ctx, barX, barY, barWidth, 6, 3);
  ctx.fill();
  ctx.fillStyle = airborne
    ? "rgba(121,209,255,0.92)"
    : "rgba(255,213,106,0.9)";
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

function drawSlowMotionEffect() {
  if (!state.animation.airborneAim) return;

  const focus = worldToScreen(state.player.x, state.player.y - 34);
  const phase = reduceMotion ? 0.45 : state.animation.airborneAimClock;

  ctx.save();

  ctx.fillStyle = "rgba(5, 11, 24, 0.2)";
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  const vignette = ctx.createRadialGradient(
    focus.x,
    focus.y,
    24,
    focus.x,
    focus.y,
    Math.max(180, Math.min(viewportWidth, viewportHeight) * 0.72)
  );
  vignette.addColorStop(0, "rgba(121, 209, 255, 0.03)");
  vignette.addColorStop(0.42, "rgba(54, 116, 170, 0.06)");
  vignette.addColorStop(1, "rgba(2, 7, 17, 0.24)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  ctx.strokeStyle = "rgba(121, 209, 255, 0.15)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i += 1) {
    const radius = 54 + i * 30 + mod(phase * 22, 24);
    ctx.beginPath();
    ctx.arc(focus.x, focus.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8 + phase * 0.32;
    const inner = 72 + (i % 2) * 9;
    const outer = inner + 26;
    ctx.beginPath();
    ctx.moveTo(focus.x + Math.cos(angle) * inner, focus.y + Math.sin(angle) * inner);
    ctx.lineTo(focus.x + Math.cos(angle) * outer, focus.y + Math.sin(angle) * outer);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPlayer() {
  const p = worldToScreen(state.player.x, state.player.y);
  const isAiming = state.mode === "aiming";
  const isAirAim = state.animation.airborneAim;
  const isAirborne = state.animation.playerAirborne;
  const followThrough = state.animation.throwFollowThrough;
  const throwProgress = followThrough > 0 ? 1 - followThrough : 1;
  const throwSwing = followThrough > 0 ? Math.sin(throwProgress * Math.PI) : 0;
  const aim = getAimVector(state);
  const direction = isAiming
    ? aim
    : {
        x: state.animation.throwDirectionX,
        y: state.animation.throwDirectionY
      };
  const facing = direction.x < -0.05 ? -1 : 1;
  const motionClock = isAirAim
    ? state.animation.airborneAimClock
    : state.animation.clock;
  const floatOffset =
    isAirborne && !reduceMotion ? Math.sin(motionClock * 3.2) * 2.2 : 0;
  const recoil = followThrough > 0 ? throwSwing * 3.5 : 0;
  const bodyLean = isAiming
    ? Math.max(-4, Math.min(4, direction.x * 3.4))
    : direction.x * throwSwing * 5;

  const neck = { x: bodyLean * 0.5, y: -42 };
  const hip = { x: -bodyLean * 0.18, y: -17 };
  const shoulder = { x: neck.x + facing * 2, y: -36 };

  let throwElbow;
  let throwHand;

  if (isAiming) {
    throwElbow = {
      x: shoulder.x - facing * 10 - direction.y * 4,
      y: shoulder.y + 5 - direction.x * 3
    };
    throwHand = { x: 0, y: -34 };
  } else if (followThrough > 0) {
    const armLength = 22 + throwSwing * 9;
    throwHand = {
      x: shoulder.x + direction.x * armLength,
      y: shoulder.y + direction.y * armLength
    };
    throwElbow = {
      x: shoulder.x + direction.x * armLength * 0.48 - direction.y * 4,
      y: shoulder.y + direction.y * armLength * 0.48 + direction.x * 4
    };
  } else {
    throwElbow = { x: facing * 7, y: -31 };
    throwHand = { x: facing * 12, y: -39 };
  }

  const offShoulder = { x: neck.x - facing * 2, y: -35 };
  const offElbow = isAirAim
    ? { x: -facing * 11, y: -28 }
    : { x: -facing * 9 - direction.x * throwSwing * 4, y: -28 };
  const offHand = isAirAim
    ? { x: -facing * 16, y: -18 }
    : { x: -facing * 14 - direction.x * throwSwing * 7, y: -22 };

  let legA;
  let legB;

  if (isAirborne) {
    const curl = reduceMotion ? 0.45 : (Math.sin(motionClock * 4) + 1) * 0.5;
    legA = {
      knee: { x: -facing * 9, y: -7 - curl * 4 },
      foot: { x: -facing * 3, y: 1 - curl * 2 }
    };
    legB = {
      knee: { x: facing * 9, y: -9 + curl * 3 },
      foot: { x: facing * 16, y: -2 + curl * 2 }
    };
  } else {
    const stride = throwSwing * 4;
    legA = {
      knee: { x: -facing * 6, y: -8 },
      foot: { x: -facing * (11 + stride), y: 0 }
    };
    legB = {
      knee: { x: facing * 7, y: -7 },
      foot: { x: facing * (11 + stride), y: 0 }
    };
  }

  ctx.save();
  ctx.translate(
    p.x - direction.x * recoil,
    p.y + floatOffset - direction.y * recoil * 0.35
  );

  if (followThrough > 0) {
    ctx.strokeStyle = `rgba(255, 213, 106, ${0.18 + throwSwing * 0.22})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(shoulder.x, shoulder.y, 25 + throwSwing * 7, -1.9, 0.45);
    ctx.stroke();
  }

  ctx.strokeStyle = "#eef3ff";
  ctx.fillStyle = "#eef3ff";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.arc(neck.x + bodyLean * 0.18, -51, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(neck.x, neck.y);
  ctx.lineTo(hip.x, hip.y);

  ctx.moveTo(shoulder.x, shoulder.y);
  ctx.lineTo(throwElbow.x, throwElbow.y);
  ctx.lineTo(throwHand.x, throwHand.y);

  ctx.moveTo(offShoulder.x, offShoulder.y);
  ctx.lineTo(offElbow.x, offElbow.y);
  ctx.lineTo(offHand.x, offHand.y);

  ctx.moveTo(hip.x, hip.y);
  ctx.lineTo(legA.knee.x, legA.knee.y);
  ctx.lineTo(legA.foot.x, legA.foot.y);

  ctx.moveTo(hip.x, hip.y);
  ctx.lineTo(legB.knee.x, legB.knee.y);
  ctx.lineTo(legB.foot.x, legB.foot.y);
  ctx.stroke();

  if (isAirAim) {
    ctx.fillStyle = "rgba(121, 209, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(throwHand.x, throwHand.y, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

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
  drawSlowMotionEffect();
  drawAimGuide();
  drawTeleportPulse();
  drawPlayer();
  drawSpear();
}

function updateHud() {
  if (state.mode === "flying") {
    statusNode.textContent = `SPEAR IN FLIGHT · THROW ${state.throwCount} · ${Math.max(0, Math.round(state.world.maxProgressX / 10))}m`;
    hintNode.textContent = "Press and hold to jump to the spear now, then slide to aim the next throw.";
    return;
  }

  if (state.mode === "stuck") {
    statusNode.textContent = `SPEAR PLANTED · THROW ${state.throwCount} · ${Math.max(0, Math.round(state.world.maxProgressX / 10))}m`;
    hintNode.textContent = "Hold the screen to relay onto this surface, slide to aim, then release.";
    return;
  }

  if (state.mode === "aiming") {
    if (state.animation.airborneAim) {
      statusNode.textContent = "AIR AIM · SLOW MOTION";
      hintNode.textContent = "Hang time is slowed for aiming. Slide to line up the throw, then release.";
    } else {
      statusNode.textContent = "AIMING";
      hintNode.textContent = "Slide in the throw direction. Release your finger to launch.";
    }
    return;
  }

  statusNode.textContent = "READY";
  hintNode.textContent = "Move forward and the course will keep generating ahead of you.";
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
