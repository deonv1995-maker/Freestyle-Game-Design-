import {
  DRONE_CONFIG,
  GAME_CONFIG,
  WORLD_CONFIG,
  beginAim,
  cancelAim,
  createGameState,
  getDroneExplosions,
  getLaunchVector,
  getWorldCheckpoints,
  getWorldDrones,
  getWorldHazards,
  getWorldProjectiles,
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

const RECORD_KEY = "energy-relay-best-distance-metres-v1";

let state = createGameState();
let trail = [];
let lastTime = performance.now();
let viewportWidth = 1;
let viewportHeight = 1;
let pixelRatio = 1;
let lastHudSnapshot = "";
let lastRespawnSerial = state.run.respawnSerial;
let bestDistanceMetres = loadBestDistance();

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
    y: (y - state.camera.y) * scale + viewportHeight * 0.66
  };
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, viewportHeight);
  gradient.addColorStop(0, "#101d35");
  gradient.addColorStop(0.55, "#0c1425");
  gradient.addColorStop(1, "#070b13");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  drawParallaxDots();
  drawWorldGrid();
}

function drawParallaxDots() {
  ctx.save();
  ctx.fillStyle = "rgba(217, 230, 255, 0.2)";

  const spacing = 96;
  const offsetX = mod(-state.camera.x * 0.16, spacing);
  const offsetY = mod(-state.camera.y * 0.12, spacing);

  for (let y = offsetY - spacing; y < viewportHeight + spacing; y += spacing) {
    for (let x = offsetX - spacing; x < viewportWidth + spacing; x += spacing) {
      const key = Math.sin(
        (x + state.camera.x * 0.16) * 0.021 +
          (y + state.camera.y * 0.12) * 0.037
      );
      const radius = key > 0.2 ? 1.3 : 0.75;
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
  ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
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

  ctx.restore();
}

function drawWorldSurfaces() {
  const scale = GAME_CONFIG.cameraZoom;

  for (const surface of getWorldSurfaces(state)) {
    const p = worldToScreen(surface.x, surface.y);
    const width = surface.width * scale;
    const height = surface.height * scale;

    if (
      p.x > viewportWidth + 120 ||
      p.x + width < -120 ||
      p.y > viewportHeight + 120 ||
      p.y + height < -120
    ) {
      continue;
    }

    if (surface.type === "platform") {
      drawMovingPlatform(p, width, height, scale, surface.motion);
    } else {
      drawCorridorShell(p, width, height, scale, surface.type);
    }
  }
}


function drawCorridorShell(p, width, height, scale, type) {
  ctx.save();

  const leftWall = type === "leftWall";
  const bottomWall = type === "bottomWall";
  const gradient = bottomWall
    ? ctx.createLinearGradient(p.x, p.y, p.x, p.y + height)
    : ctx.createLinearGradient(p.x, p.y, p.x + width, p.y);

  if (bottomWall) {
    gradient.addColorStop(0, "#263347");
    gradient.addColorStop(1, "#121a27");
  } else {
    gradient.addColorStop(0, leftWall ? "#121a27" : "#263347");
    gradient.addColorStop(1, leftWall ? "#263347" : "#121a27");
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(p.x, p.y, width, height);

  ctx.fillStyle = "rgba(77, 215, 255, 0.5)";
  if (bottomWall) {
    ctx.fillRect(p.x, p.y, width, Math.max(2, 4 * scale));
  } else {
    const edgeX = leftWall ? p.x + width - 5 * scale : p.x;
    ctx.fillRect(edgeX, p.y, Math.max(2, 4 * scale), height);
  }

  const panelStep = 112 * scale;
  ctx.strokeStyle = "rgba(155, 190, 216, 0.1)";
  ctx.lineWidth = 1;

  if (bottomWall) {
    for (let x = p.x + panelStep; x < p.x + width; x += panelStep) {
      ctx.beginPath();
      ctx.moveTo(x, p.y);
      ctx.lineTo(x, p.y + height);
      ctx.stroke();
    }
  } else {
    for (let y = p.y + panelStep; y < p.y + height; y += panelStep) {
      ctx.beginPath();
      ctx.moveTo(p.x, y);
      ctx.lineTo(p.x + width, y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawMovingPlatform(p, width, height, scale, motion) {
  ctx.save();

  ctx.shadowColor = "rgba(65, 208, 255, 0.42)";
  ctx.shadowBlur = 14 * scale;
  ctx.fillStyle = "#26394a";
  ctx.strokeStyle = "#67ddff";
  ctx.lineWidth = Math.max(1, 2 * scale);
  roundRect(ctx, p.x, p.y, width, height, 7 * scale);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(145, 234, 255, 0.9)";
  ctx.fillRect(p.x + 12 * scale, p.y + 5 * scale, Math.max(0, width - 24 * scale), 2 * scale);

  if (motion) {
    ctx.fillStyle = "rgba(6, 17, 29, 0.55)";
    const arrowX = p.x + width * 0.5;
    const arrowY = p.y + height * 0.55;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY - 5 * scale);
    ctx.lineTo(arrowX + 5 * scale, arrowY);
    ctx.lineTo(arrowX, arrowY + 5 * scale);
    ctx.lineTo(arrowX - 5 * scale, arrowY);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}


function drawCheckpoints() {
  const scale = GAME_CONFIG.cameraZoom;

  for (const checkpoint of getWorldCheckpoints(state)) {
    const y = worldToScreen(0, checkpoint.y).y;
    if (y < -80 || y > viewportHeight + 80) continue;

    const left = worldToScreen(WORLD_CONFIG.corridorLeft + 18, checkpoint.y).x;
    const right = worldToScreen(WORLD_CONFIG.corridorRight - 18, checkpoint.y).x;
    const center = (left + right) * 0.5;
    const active = checkpoint.index <= state.checkpoint.index;

    ctx.save();
    ctx.strokeStyle = active
      ? "rgba(105, 255, 205, 0.72)"
      : "rgba(100, 198, 255, 0.45)";
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 8]);
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = active
      ? "rgba(105, 255, 205, 0.86)"
      : "rgba(142, 218, 255, 0.78)";
    ctx.font = "700 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`CP ${checkpoint.index}`, center, y - 10 * scale);
    ctx.restore();
  }
}

function drawHazards() {
  for (const hazard of getWorldHazards(state)) {
    if (hazard.type === "laser") {
      drawLaser(hazard);
    }
  }
}


function drawLaser(hazard) {
  const scale = GAME_CONFIG.cameraZoom;
  const p = worldToScreen(hazard.x, hazard.y);
  const width = hazard.width * scale;
  const height = Math.max(3, hazard.height * scale);

  if (
    p.x > viewportWidth + 90 ||
    p.x + width < -90 ||
    p.y > viewportHeight + 90 ||
    p.y + height < -90
  ) {
    return;
  }

  const sourceSide = hazard.laser?.sourceSide === "right" ? "right" : "left";
  const beamProgress = Math.min(
    1,
    Math.max(0, hazard.laser?.beamProgress ?? 0)
  );
  const beamWidth = width * beamProgress;
  const beamX =
    sourceSide === "left" ? p.x : p.x + width - beamWidth;
  const centerY = p.y + height * 0.5;
  const sourceX = sourceSide === "left" ? p.x : p.x + width;
  const receiverX = sourceSide === "left" ? p.x + width : p.x;
  const emitterRadius = 11 * scale;
  const flickerLevel =
    hazard.active && hazard.laser?.shutdownFlicker
      ? Math.min(1, Math.max(0.35, hazard.laser.flickerLevel ?? 1))
      : 1;

  ctx.save();

  // The wall hardware is always visible. Only the energy beam switches on/off.
  ctx.fillStyle = "#263444";
  ctx.strokeStyle = hazard.active ? "#ff7a87" : "#61778d";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(sourceX, centerY, emitterRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#1b2532";
  ctx.strokeStyle = "rgba(130, 158, 184, 0.8)";
  ctx.beginPath();
  ctx.arc(receiverX, centerY, emitterRadius * 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.globalAlpha = flickerLevel;
  ctx.fillStyle = hazard.active ? "#ff536d" : "#5f7082";
  ctx.beginPath();
  ctx.arc(sourceX, centerY, emitterRadius * 0.34, 0, Math.PI * 2);
  ctx.fill();

  if (hazard.active && beamWidth > 0) {
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = "rgba(255, 70, 96, 0.95)";
    ctx.shadowBlur = 18;

    ctx.fillStyle = "rgba(255, 67, 91, 0.88)";
    ctx.fillRect(beamX, p.y, beamWidth, height);

    ctx.fillStyle = "rgba(255, 225, 230, 0.96)";
    ctx.fillRect(
      beamX,
      p.y + height * 0.34,
      beamWidth,
      Math.max(1, height * 0.32)
    );

    const tipX = sourceSide === "left" ? beamX + beamWidth : beamX;
    ctx.fillStyle = "rgba(255, 239, 242, 0.98)";
    ctx.beginPath();
    ctx.arc(tipX, centerY, Math.max(2, 4 * scale), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawDronesAndProjectiles() {
  const scale = GAME_CONFIG.cameraZoom;

  for (const drone of getWorldDrones(state)) {
    const p = worldToScreen(drone.x, drone.y);
    if (p.x < -80 || p.x > viewportWidth + 80 || p.y < -80 || p.y > viewportHeight + 80) {
      continue;
    }

    const radius = DRONE_CONFIG.radius * scale;
    const angle = state.animation.clock * 1.8 + drone.phase;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.sin(angle) * 0.08);

    ctx.shadowColor = "rgba(255, 113, 136, 0.45)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#273443";
    ctx.strokeStyle = "#ff8799";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.lineTo(radius * 1.25, 0);
    ctx.lineTo(0, radius);
    ctx.lineTo(-radius * 1.25, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ff536d";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(146, 217, 255, 0.48)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.65, angle, angle + Math.PI * 1.2);
    ctx.stroke();

    ctx.restore();
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (const projectile of getWorldProjectiles(state)) {
    const p = worldToScreen(projectile.x, projectile.y);
    if (p.x < -40 || p.x > viewportWidth + 40 || p.y < -40 || p.y > viewportHeight + 40) {
      continue;
    }

    const radius = DRONE_CONFIG.projectileRadius * scale;
    ctx.shadowColor = "rgba(255, 73, 101, 0.9)";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#ff8a9b";
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawDroneExplosions() {
  const scale = GAME_CONFIG.cameraZoom;

  for (const explosion of getDroneExplosions(state)) {
    const p = worldToScreen(explosion.x, explosion.y);
    if (
      p.x < -100 ||
      p.x > viewportWidth + 100 ||
      p.y < -100 ||
      p.y > viewportHeight + 100
    ) {
      continue;
    }

    const progress = Math.min(1, Math.max(0, explosion.age / explosion.duration));
    const remaining = 1 - progress;
    const innerRadius = (8 + progress * 18) * scale;
    const ringRadius = (14 + progress * 44) * scale;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const flash = ctx.createRadialGradient(
      p.x,
      p.y,
      0,
      p.x,
      p.y,
      Math.max(1, ringRadius)
    );
    flash.addColorStop(0, `rgba(255, 247, 214, ${0.95 * remaining})`);
    flash.addColorStop(0.24, `rgba(255, 155, 92, ${0.82 * remaining})`);
    flash.addColorStop(0.58, `rgba(255, 78, 105, ${0.48 * remaining})`);
    flash.addColorStop(1, "rgba(255, 62, 91, 0)");

    ctx.fillStyle = flash;
    ctx.beginPath();
    ctx.arc(p.x, p.y, ringRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 190, 122, ${0.9 * remaining})`;
    ctx.lineWidth = Math.max(1.5, 3 * scale * remaining);
    ctx.beginPath();
    ctx.arc(p.x, p.y, innerRadius, 0, Math.PI * 2);
    ctx.stroke();

    const shardCount = reduceMotion ? 4 : 8;
    for (let i = 0; i < shardCount; i += 1) {
      const angle =
        explosion.phase +
        (Math.PI * 2 * i) / shardCount +
        progress * (i % 2 === 0 ? 0.28 : -0.22);
      const start = (10 + progress * 10) * scale;
      const end = (18 + progress * 48) * scale;
      const sx = p.x + Math.cos(angle) * start;
      const sy = p.y + Math.sin(angle) * start;
      const ex = p.x + Math.cos(angle) * end;
      const ey = p.y + Math.sin(angle) * end;

      ctx.strokeStyle =
        i % 2 === 0
          ? `rgba(255, 219, 166, ${0.85 * remaining})`
          : `rgba(255, 91, 116, ${0.72 * remaining})`;
      ctx.lineWidth = Math.max(1, 2.2 * scale * remaining);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }

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

    ctx.strokeStyle = `rgba(68, 178, 255, ${age * 0.23})`;
    ctx.lineWidth = 8 * age + 1;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    ctx.strokeStyle = `rgba(181, 233, 255, ${age * 0.56})`;
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
  const origin = worldToScreen(state.orb.x, state.orb.y);
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

function drawOrb() {
  if (!state.orb.active) return;

  const p = worldToScreen(state.orb.x, state.orb.y);
  const scale = GAME_CONFIG.cameraZoom;
  const radius = GAME_CONFIG.orbRadius * scale;
  const phase = state.animation.clock;
  const pulse = 1 + Math.sin(phase * 11) * 0.08;
  const invulnerable = state.orb.invulnerability > 0;
  const alpha = invulnerable && Math.floor(phase * 12) % 2 === 0 ? 0.42 : 1;

  ctx.save();
  ctx.globalAlpha = alpha;
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


function drawSlowMotionField() {
  if (state.launch.pointerId === null) return;

  const p = worldToScreen(state.orb.x, state.orb.y);
  const phase = state.animation.clock;

  ctx.save();
  ctx.fillStyle = "rgba(8, 18, 35, 0.12)";
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  ctx.strokeStyle = "rgba(132, 222, 255, 0.4)";
  ctx.lineWidth = 1.5;

  for (let i = 0; i < 3; i += 1) {
    const radius = 34 + i * 20 + Math.sin(phase * 2.2 + i) * 3;
    const sweep = Math.PI * (0.9 + i * 0.16);
    const start = phase * (0.7 + i * 0.12) + i * 1.4;

    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, start, start + sweep);
    ctx.stroke();
  }

  ctx.restore();
}

function drawEventPulse() {
  if (
    state.animation.deathPulse <= 0 &&
    state.animation.checkpointPulse <= 0 &&
    state.animation.runResetPulse <= 0
  ) {
    return;
  }

  ctx.save();

  if (state.animation.runResetPulse > 0) {
    ctx.fillStyle = `rgba(255, 68, 92, ${state.animation.runResetPulse * 0.12})`;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
  } else if (state.animation.deathPulse > 0) {
    ctx.fillStyle = `rgba(255, 72, 96, ${state.animation.deathPulse * 0.1})`;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
  }

  if (state.animation.checkpointPulse > 0) {
    ctx.strokeStyle = `rgba(103, 255, 205, ${state.animation.checkpointPulse * 0.55})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, viewportWidth - 16, viewportHeight - 16);
  }

  ctx.restore();
}

function render() {
  drawBackground();
  drawWorldSurfaces();
  drawCheckpoints();
  drawHazards();
  drawDronesAndProjectiles();
  drawDroneExplosions();
  drawTrail();
  drawSlowMotionField();
  drawAimGuide();
  drawOrb();
  drawEventPulse();
}

function updateHud() {
  const snapshot = [
    state.mode,
    state.lives,
    state.burstCount,
    state.progress.currentMetres,
    state.progress.furthestMetres,
    bestDistanceMetres,
    state.checkpoint.index,
    state.progress.difficultyLevel,
    Math.round(state.launch.power * 100),
    Math.round(state.animation.deathPulse * 10),
    Math.round(state.animation.runResetPulse * 10)
  ].join("|");

  if (snapshot === lastHudSnapshot) return;
  lastHudSnapshot = snapshot;

  const runStats =
    `LIVES ${state.lives} · ${state.progress.currentMetres}m · ` +
    `RECORD ${bestDistanceMetres}m · CP ${state.checkpoint.index} · ` +
    `LEVEL ${state.progress.difficultyLevel}`;

  if (state.animation.runResetPulse > 0.35) {
    statusNode.textContent = `RUN RESET · ${runStats}`;
    hintNode.textContent =
      "All seven lives were used. The run restarted automatically from the beginning.";
    return;
  }

  if (state.animation.deathPulse > 0.4) {
    statusNode.textContent = `RESPAWNED · ${runStats}`;
    hintNode.textContent =
      "Hazard hit. You respawned at your latest checkpoint with brief protection.";
    return;
  }

  if (state.mode === "aiming") {
    statusNode.textContent =
      `SLOW MOTION ${Math.round(GAME_CONFIG.touchTimeScale * 100)}% · AIMING · POWER ${Math.round(state.launch.power * 100)}% · ${runStats}`;
    hintNode.textContent =
      "Time slows as soon as you touch. Drag in the direction you want the orb to travel, then release.";
    return;
  }

  if (state.mode === "airAiming") {
    statusNode.textContent =
      `SLOW MOTION ${Math.round(GAME_CONFIG.touchTimeScale * 100)}% · REDIRECT · POWER ${Math.round(state.launch.power * 100)}% · ${runStats}`;
    hintNode.textContent =
      "Time stays slowed while you hold the screen. Drag a new direction and release to redirect.";
    return;
  }

  if (state.mode === "orb") {
    statusNode.textContent = `ENERGY FORM · ${runStats}`;
    hintNode.textContent =
      "Zero gravity: every touch slows time, giving you a window to redirect around flickering lasers and drones.";
    return;
  }

  statusNode.textContent = `ORB READY · ${runStats}`;
  hintNode.textContent =
    "Zero gravity. Drag upward to launch through the side-wall corridor; momentum changes only through redirects and impacts.";
}

function recordTrail() {
  if (state.mode !== "orb" && state.mode !== "airAiming") return;

  const previous = trail.at(-1);
  if (!previous || Math.hypot(state.orb.x - previous.x, state.orb.y - previous.y) > 8) {
    trail.push({ x: state.orb.x, y: state.orb.y });
    if (trail.length > 38) trail.shift();
  }
}

function updateRecord() {
  if (state.progress.furthestMetres <= bestDistanceMetres) return;

  bestDistanceMetres = state.progress.furthestMetres;
  saveBestDistance(bestDistanceMetres);
  lastHudSnapshot = "";
}

function frame(now) {
  resizeCanvas();

  const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;

  stepGame(state, reduceMotion ? Math.min(dt, 1 / 30) : dt);

  if (state.run.respawnSerial !== lastRespawnSerial) {
    lastRespawnSerial = state.run.respawnSerial;
    trail = [];
  }

  recordTrail();
  updateRecord();

  if (state.mode === "ready" && trail.length > 0) {
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
  lastRespawnSerial = state.run.respawnSerial;
  lastHudSnapshot = "";
  updateHud();
});

window.addEventListener("resize", resizeCanvas);

function loadBestDistance() {
  try {
    const value = Number.parseInt(window.localStorage.getItem(RECORD_KEY) || "0", 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function saveBestDistance(value) {
  try {
    window.localStorage.setItem(RECORD_KEY, String(value));
  } catch {
    // Record persistence is optional; gameplay must continue if storage is unavailable.
  }
}

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
