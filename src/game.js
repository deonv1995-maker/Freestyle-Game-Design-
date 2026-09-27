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
      p.x > viewportWidth + 100 ||
      p.x + width < -100 ||
      p.y > viewportHeight + 100 ||
      p.y + height < -100
    ) {
      continue;
    }

    if (surface.type === "ground") {
      drawCityDeckSurface(p, width, height, scale);
      continue;
    }

    if (surface.type === "platform") {
      drawFuturePlatformSurface(surface, p, width, height, scale);
      continue;
    }

    drawFutureObstacleSurface(surface, p, width, height, scale);
  }

  ctx.restore();
}

function drawCityDeckSurface(p, width, height, scale) {
  ctx.fillStyle = "#111722";
  ctx.fillRect(p.x, p.y, width, height);

  ctx.fillStyle = "#253847";
  ctx.fillRect(p.x, p.y, width, 10 * scale);

  ctx.fillStyle = "rgba(63, 212, 255, 0.42)";
  ctx.fillRect(p.x, p.y + 10 * scale, width, 2 * scale);

  const laneSpacing = 82 * scale;
  const laneWidth = 30 * scale;
  for (let x = p.x + 18 * scale; x < p.x + width; x += laneSpacing) {
    ctx.fillStyle = "rgba(107, 140, 164, 0.16)";
    ctx.fillRect(x, p.y + 23 * scale, laneWidth, 3 * scale);
  }
}

function drawFuturePlatformSurface(surface, p, width, height, scale) {
  if (surface.visual === "hoverCar") {
    drawHoverCarSurface(p, width, height, scale);
    return;
  }

  const landingPad = surface.visual === "landingPad";
  ctx.save();

  ctx.shadowColor = landingPad
    ? "rgba(77, 221, 255, 0.28)"
    : "rgba(134, 121, 255, 0.22)";
  ctx.shadowBlur = 13 * scale;

  ctx.fillStyle = landingPad ? "#26394a" : "#30354e";
  ctx.strokeStyle = landingPad ? "#65dcff" : "#938dff";
  ctx.lineWidth = Math.max(1, 2 * scale);
  roundRect(ctx, p.x, p.y, width, height, 6 * scale);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = landingPad
    ? "rgba(118, 226, 255, 0.82)"
    : "rgba(184, 174, 255, 0.72)";
  ctx.fillRect(p.x + 10 * scale, p.y + 4 * scale, Math.max(0, width - 20 * scale), 2 * scale);

  const panelWidth = 34 * scale;
  for (let x = p.x + 16 * scale; x < p.x + width - 12 * scale; x += 52 * scale) {
    ctx.fillStyle = "rgba(8, 13, 24, 0.42)";
    ctx.fillRect(x, p.y + 11 * scale, Math.min(panelWidth, p.x + width - x - 8 * scale), 6 * scale);
  }

  ctx.restore();
}

function drawHoverCarSurface(p, width, height, scale) {
  ctx.save();

  ctx.shadowColor = "rgba(71, 202, 255, 0.52)";
  ctx.shadowBlur = 18 * scale;
  ctx.fillStyle = "#283747";
  ctx.strokeStyle = "#71dfff";
  ctx.lineWidth = Math.max(1, 2 * scale);
  roundRect(ctx, p.x, p.y, width, height, 12 * scale);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#172333";
  roundRect(
    ctx,
    p.x + width * 0.24,
    p.y + 6 * scale,
    width * 0.4,
    Math.max(5 * scale, height * 0.4),
    8 * scale
  );
  ctx.fill();

  ctx.fillStyle = "rgba(135, 229, 255, 0.88)";
  ctx.fillRect(p.x + 12 * scale, p.y + 4 * scale, Math.max(0, width - 24 * scale), 2 * scale);

  ctx.fillStyle = "rgba(78, 191, 255, 0.55)";
  const thrusterY = p.y + height + 4 * scale;
  ctx.fillRect(p.x + width * 0.16, thrusterY, width * 0.2, 3 * scale);
  ctx.fillRect(p.x + width * 0.64, thrusterY, width * 0.2, 3 * scale);

  ctx.restore();
}

function drawFutureObstacleSurface(surface, p, width, height, scale) {
  const isSpire = surface.visual === "spire";
  const topTrim = Math.max(5 * scale, Math.min(14 * scale, height * 0.04));

  ctx.save();

  const gradient = ctx.createLinearGradient(p.x, 0, p.x + width, 0);
  gradient.addColorStop(0, isSpire ? "#252a44" : "#202b3a");
  gradient.addColorStop(0.55, isSpire ? "#343956" : "#2b3b4d");
  gradient.addColorStop(1, "#17212e");
  ctx.fillStyle = gradient;
  ctx.strokeStyle = isSpire ? "#827cff" : "#4ed5ff";
  ctx.lineWidth = Math.max(1, 2 * scale);
  roundRect(ctx, p.x, p.y, width, height, 5 * scale);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isSpire
    ? "rgba(143, 129, 255, 0.9)"
    : "rgba(75, 220, 255, 0.9)";
  ctx.fillRect(p.x + 6 * scale, p.y + topTrim, 3 * scale, Math.max(0, height - topTrim * 2));

  const visibleTop = Math.max(p.y + 28 * scale, -30);
  const visibleBottom = Math.min(p.y + height - 22 * scale, viewportHeight + 30);
  const rowStep = 40 * scale;
  const columnStep = 34 * scale;
  const windowWidth = 13 * scale;
  const windowHeight = 7 * scale;

  for (let y = visibleTop; y < visibleBottom; y += rowStep) {
    for (let x = p.x + 22 * scale; x < p.x + width - 14 * scale; x += columnStep) {
      ctx.fillStyle =
        (Math.floor((x + y) / Math.max(1, 22 * scale)) % 3 === 0)
          ? "rgba(255, 215, 122, 0.52)"
          : "rgba(91, 188, 230, 0.28)";
      ctx.fillRect(x, y, Math.min(windowWidth, p.x + width - x - 8 * scale), windowHeight);
    }
  }

  ctx.shadowColor = isSpire
    ? "rgba(141, 121, 255, 0.48)"
    : "rgba(64, 211, 255, 0.48)";
  ctx.shadowBlur = 14 * scale;
  ctx.fillStyle = isSpire ? "#8f80ff" : "#62ddff";
  ctx.fillRect(p.x + 8 * scale, p.y + 5 * scale, Math.max(0, width - 16 * scale), 3 * scale);

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
