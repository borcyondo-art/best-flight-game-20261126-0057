// Scene rendering: sunset sky, mountains, recognisable terrain, rings,
// runway, the aircraft and the cockpit frame.
// One clear job: turn flight state into one painted frame, every time,
// from the same deterministic world the physics flies through.

import {
  FOCAL_LENGTH,
  HORIZON_Y,
  PALETTE,
  RUNWAY_ELEVATION,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  WORLD_SEED,
} from './config.js';
import {
  drawAirspeedDial,
  drawAltimeterDial,
  drawArtificialHorizon,
  drawCompassStrip,
  drawFuelGauge,
  drawThrottleGauge,
  drawVerticalSpeedDial,
  drawWarningLights,
} from './instruments.js';
import { nextRingTarget, runwayCorners } from './missions.js';
import { groundHeight, landColor, landUseAt } from './terrain.js';
import { noise2 } from './random.js';

function makeCamera(plane) {
  const sinH = Math.sin(plane.heading);
  const cosH = Math.cos(plane.heading);
  return {
    x: plane.x - sinH * 42,
    z: plane.z - cosH * 42,
    alt: plane.alt + 10,
    sinH,
    cosH,
  };
}

function project(camera, wx, wz, wy) {
  const dx = wx - camera.x;
  const dz = wz - camera.z;
  const fwd = dx * camera.sinH + dz * camera.cosH;
  if (fwd < 3) return null;
  const side = dx * camera.cosH - dz * camera.sinH;
  const scale = FOCAL_LENGTH / fwd;
  return {
    x: VIEW_WIDTH / 2 + side * scale,
    y: HORIZON_Y + (camera.alt - wy) * scale,
    scale,
    fwd,
  };
}

export function drawSky(ctx, frame) {
  const grad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 60);
  grad.addColorStop(0, PALETTE.skyTop);
  grad.addColorStop(0.45, PALETTE.skyMid);
  grad.addColorStop(0.8, PALETTE.skyLow);
  grad.addColorStop(1, '#ffd98a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_WIDTH, HORIZON_Y + 60);
  const sunX = 985;
  const sunY = 128;
  const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 150);
  glow.addColorStop(0, 'rgba(255, 243, 196, 0.95)');
  glow.addColorStop(0.25, 'rgba(255, 158, 79, 0.55)');
  glow.addColorStop(1, 'rgba(255, 158, 79, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 150, sunY - 150, 300, 300);
  ctx.beginPath();
  ctx.arc(sunX, sunY, 34, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.sunCore;
  ctx.fill();
  void frame;
}

export function drawMountains(ctx) {
  for (const [base, amp, color, seedOff] of [
    [26, 66, PALETTE.mountainFar, 3.1],
    [6, 44, PALETTE.mountainNear, 8.7],
  ]) {
    ctx.beginPath();
    ctx.moveTo(-10, HORIZON_Y + 40);
    for (let sx = -10; sx <= VIEW_WIDTH + 10; sx += 16) {
      const ridge = base + (noise2(sx * 0.008, seedOff, WORLD_SEED) * 0.5 + 0.5) * amp;
      ctx.lineTo(sx, HORIZON_Y + 34 - ridge);
    }
    ctx.lineTo(VIEW_WIDTH + 10, HORIZON_Y + 40);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
}

export function drawClouds(ctx, camera, clouds) {
  ctx.save();
  for (const cloud of clouds) {
    const p = project(camera, cloud.x, cloud.z, cloud.alt);
    if (!p || p.y > HORIZON_Y + 10) continue;
    const r = cloud.size * p.scale;
    if (r < 2) continue;
    const puffs = [
      [0, 0, 1],
      [-0.62, 0.14, 0.62],
      [0.6, 0.12, 0.66],
      [-0.25, -0.22, 0.55],
      [0.3, -0.18, 0.5],
    ];
    for (const [ox, oy, s] of puffs) {
      ctx.beginPath();
      ctx.arc(p.x + ox * r, p.y + oy * r, r * s * 0.52, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 238, 224, 0.72)';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + r * 0.22, r * 0.95, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 180, 120, 0.45)';
    ctx.fill();
  }
  ctx.restore();
}

function bandDistances() {
  const dists = [];
  let d = 1050;
  while (d > 13) {
    dists.push(d);
    d *= 0.82;
  }
  dists.push(13);
  return dists;
}

export function drawTerrain(ctx, camera) {
  const dists = bandDistances();
  const segments = 34;
  ctx.fillStyle = '#8a7a5e';
  ctx.fillRect(0, HORIZON_Y + 20, VIEW_WIDTH, VIEW_HEIGHT - HORIZON_Y);
  for (let b = 0; b < dists.length - 1; b++) {
    const far = dists[b];
    const near = dists[b + 1];
    for (let s = 0; s < segments; s++) {
      const s0 = -1.18 + (s / segments) * 2.36;
      const s1 = -1.18 + ((s + 1) / segments) * 2.36;
      const corners = [];
      let visible = true;
      for (const [d, sv] of [[far, s0], [far, s1], [near, s1], [near, s0]]) {
        const wx = camera.x + camera.sinH * d + camera.cosH * (sv * d);
        const wz = camera.z + camera.cosH * d - camera.sinH * (sv * d);
        const wy = groundHeight(wx, wz);
        const p = project(camera, wx, wz, wy);
        if (!p) { visible = false; break; }
        corners.push(p);
      }
      if (!visible) continue;
      const midX = camera.x + camera.sinH * ((far + near) / 2) + camera.cosH * (((s0 + s1) / 2) * ((far + near) / 2));
      const midZ = camera.z + camera.cosH * ((far + near) / 2) - camera.sinH * (((s0 + s1) / 2) * ((far + near) / 2));
      const kind = landUseAt(midX, midZ);
      const shade = ((s + b) % 2 === 0) ? 0.4 : 0.7;
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      ctx.lineTo(corners[1].x, corners[1].y);
      ctx.lineTo(corners[2].x, corners[2].y);
      ctx.lineTo(corners[3].x, corners[3].y);
      ctx.closePath();
      ctx.fillStyle = landColor(kind, midX, midZ, shade);
      ctx.fill();
    }
  }
}

export function drawRings(ctx, camera, mission) {
  for (let i = 0; i < mission.rings.length; i++) {
    const ring = mission.rings[i];
    if (ring.passed) continue;
    const isNext = i === mission.nextRing;
    const p = project(camera, ring.x, ring.z, ring.alt);
    if (!p) continue;
    const rx = ring.radius * p.scale;
    if (rx < 3 || rx > 900) continue;
    const ry = rx * 0.6;
    ctx.save();
    if (isNext) {
      ctx.shadowColor = PALETTE.ringNext;
      ctx.shadowBlur = 22;
    }
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = isNext ? PALETTE.ringNext : PALETTE.ringTodo;
    ctx.lineWidth = Math.max(3, rx * 0.09);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, rx * 0.62, ry * 0.62, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (isNext && rx >= 18) {
      ctx.fillStyle = isNext ? '#fff3c4' : '#e8fbff';
      ctx.font = `bold ${Math.max(12, Math.min(22, rx * 0.3))}px Verdana, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`RING ${i + 1}`, p.x, p.y - ry - 10);
      ctx.fillText(`${Math.round(p.fwd)} m`, p.x, p.y + ry + 22);
    }
    ctx.restore();
  }
}

export function drawRunway(ctx, camera) {
  const rw = runwayCorners();
  const corners = [];
  for (const [dx, dz] of [[-rw.halfWidth, -rw.halfLength], [rw.halfWidth, -rw.halfLength], [rw.halfWidth, rw.halfLength], [-rw.halfWidth, rw.halfLength]]) {
    const p = project(camera, rw.x + dx, rw.z + dz, rw.elevation + 1);
    if (!p) return;
    corners.push(p);
  }
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  ctx.lineTo(corners[1].x, corners[1].y);
  ctx.lineTo(corners[2].x, corners[2].y);
  ctx.lineTo(corners[3].x, corners[3].y);
  ctx.closePath();
  ctx.fillStyle = PALETTE.runway;
  ctx.fill();
  ctx.strokeStyle = PALETTE.runwayMark;
  ctx.lineWidth = 2;
  ctx.stroke();
  for (let t = 0.08; t < 0.95; t += 0.16) {
    const z = rw.z - rw.halfLength + t * rw.halfLength * 2;
    const a = project(camera, rw.x, z, rw.elevation + 1.2);
    const b = project(camera, rw.x, z + 55, rw.elevation + 1.2);
    if (!a || !b) continue;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = PALETTE.runwayMark;
    ctx.lineWidth = Math.max(2, a.scale * 2.2);
    ctx.stroke();
  }
  for (const side of [-1, 1]) {
    for (let dz = -rw.halfLength + 40; dz <= rw.halfLength; dz += 90) {
      const p = project(camera, rw.x + side * (rw.halfWidth + 3), rw.z + dz, rw.elevation + 2);
      if (!p) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(2, p.scale * 1.4), 0, Math.PI * 2);
      ctx.fillStyle = '#ffb347';
      ctx.fill();
    }
  }
  const label = project(camera, rw.x, rw.z, rw.elevation + 12);
  if (label && label.fwd > 40 && label.fwd < 1600) {
    ctx.fillStyle = '#fff3c4';
    ctx.font = 'bold 18px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LANDASAN CENDRAWASIH', label.x, label.y - 30);
  }
  ctx.restore();
}

export function drawAircraft(ctx, plane, frame) {
  const px = VIEW_WIDTH / 2;
  const py = 468 + Math.sin(frame * 0.08) * 1.5;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(plane.bank * 0.55);
  ctx.scale(1, 1 - Math.abs(plane.pitch) * 0.18);
  const propAngle = frame * 0.9;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 74, 72, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8722a';
  ctx.beginPath();
  ctx.moveTo(-118, 6);
  ctx.quadraticCurveTo(-118, -10, -88, -10);
  ctx.lineTo(88, -10);
  ctx.quadraticCurveTo(118, -10, 118, 6);
  ctx.quadraticCurveTo(118, 14, 88, 14);
  ctx.lineTo(-88, 14);
  ctx.quadraticCurveTo(-118, 14, -118, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f6ead2';
  ctx.beginPath();
  ctx.moveTo(-14, -58);
  ctx.quadraticCurveTo(-20, -20, -16, 34);
  ctx.lineTo(-8, 62);
  ctx.quadraticCurveTo(0, 70, 8, 62);
  ctx.lineTo(16, 34);
  ctx.quadraticCurveTo(20, -20, 14, -58);
  ctx.quadraticCurveTo(0, -66, -14, -58);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0e7d8c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-13, -30);
  ctx.lineTo(13, -30);
  ctx.stroke();
  ctx.fillStyle = '#123a52';
  ctx.beginPath();
  ctx.ellipse(0, -34, 10, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.ellipse(-3, -39, 4, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8722a';
  ctx.beginPath();
  ctx.moveTo(-34, 52);
  ctx.lineTo(34, 52);
  ctx.lineTo(24, 66);
  ctx.lineTo(-24, 66);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0e7d8c';
  ctx.fillRect(-5, 56, 10, 12);
  ctx.save();
  ctx.translate(0, -64);
  ctx.rotate(propAngle);
  ctx.fillStyle = 'rgba(40, 40, 48, 0.55)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(0, -64, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#3a4358';
  ctx.fill();
  ctx.restore();
}

export function drawCockpitFrame(ctx, plane, mission, frame) {
  ctx.save();
  const grad = ctx.createLinearGradient(0, 556, 0, VIEW_HEIGHT);
  grad.addColorStop(0, '#2b2f3a');
  grad.addColorStop(0.12, '#1a1d26');
  grad.addColorStop(1, '#101219');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, VIEW_HEIGHT);
  ctx.lineTo(0, 586);
  ctx.quadraticCurveTo(VIEW_WIDTH / 2, 552, VIEW_WIDTH, 586);
  ctx.lineTo(VIEW_WIDTH, VIEW_HEIGHT);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(0, 584, VIEW_WIDTH, 3);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(118, 0);
  ctx.lineTo(72, VIEW_HEIGHT);
  ctx.lineTo(0, VIEW_HEIGHT);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(VIEW_WIDTH, 0);
  ctx.lineTo(VIEW_WIDTH - 118, 0);
  ctx.lineTo(VIEW_WIDTH - 72, VIEW_HEIGHT);
  ctx.lineTo(VIEW_WIDTH, VIEW_HEIGHT);
  ctx.closePath();
  ctx.fill();

  drawArtificialHorizon(ctx, 250, 648, 44, plane.bank, plane.pitch, frame);
  drawAirspeedDial(ctx, 368, 648, 42, plane.speed);
  drawAltimeterDial(ctx, 480, 648, 42, plane.alt);
  drawVerticalSpeedDial(ctx, 584, 648, 38, plane.verticalSpeed);
  drawCompassStrip(ctx, 640, 592, 300, plane.heading);
  drawThrottleGauge(ctx, 1012, 606, 30, 76, plane.throttle);
  drawFuelGauge(ctx, 856, 704, 140, plane.fuel, plane.fuel < 25);
  const ring = nextRingTarget(mission);
  drawWarningLights(ctx, 836, 640, plane.stalled, plane.fuel < 25, Boolean(ring));
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 12px Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('CENDRAWASIH', 130, 700);
  ctx.fillStyle = '#7a8494';
  ctx.font = '11px Verdana, sans-serif';
  ctx.fillText('Langit Senja', 130, 682);
  ctx.restore();
}

export function drawScene(ctx, plane, mission, clouds, frame) {
  const camera = makeCamera(plane);
  drawSky(ctx, frame);
  drawMountains(ctx);
  drawClouds(ctx, camera, clouds);
  drawTerrain(ctx, camera);
  drawRunway(ctx, camera);
  drawRings(ctx, camera, mission);
  drawAircraft(ctx, plane, frame);
  drawCockpitFrame(ctx, plane, mission, frame);
}
