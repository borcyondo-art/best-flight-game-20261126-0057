// Heads-up display and full-screen screens: flight numbers, mission
// progress, the start screen, pause, landing and crash screens.
// One clear job: tell the pilot what is happening and what to press next.

import { RING_COUNT, RUNWAY_CENTER_X, RUNWAY_CENTER_Z, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { nextRingTarget, runwayIsActive } from './missions.js';

export const START_BUTTON = { x: 490, y: 505, w: 300, h: 56 };
export const RESTART_BUTTON = { x: 490, y: 432, w: 300, h: 56 };
export const THROTTLE_UP_BUTTON = { x: 1078, y: 606, w: 72, h: 40 };
export const THROTTLE_DOWN_BUTTON = { x: 1078, y: 656, w: 72, h: 40 };

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function panel(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = 'rgba(10, 14, 24, 0.72)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 210, 63, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function bigNumber(ctx, x, y, label, value, unit) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.fillStyle = '#7a8494';
  ctx.font = 'bold 11px Verdana, sans-serif';
  ctx.fillText(label, x, y);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Verdana, sans-serif';
  const valueWidth = ctx.measureText(value).width;
  ctx.fillText(value, x, y + 30);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 12px Verdana, sans-serif';
  ctx.fillText(unit, x + valueWidth + 8, y + 30);
  ctx.restore();
}

export function drawFlightHud(ctx, plane, mission, frame) {
  panel(ctx, 24, 18, 330, 74);
  bigNumber(ctx, 42, 36, 'ALTITUDE', String(Math.round(plane.alt)), 'ft');
  bigNumber(ctx, 148, 36, 'SPEED', String(Math.round(plane.speed)), 'kt');
  bigNumber(ctx, 254, 36, 'HEADING', String(Math.round(((plane.heading * 180) / Math.PI % 360 + 360) % 360)).padStart(3, '0'), 'deg');

  const ring = nextRingTarget(mission);
  panel(ctx, VIEW_WIDTH / 2 - 190, 18, 380, 56);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 14px Verdana, sans-serif';
  if (mission.outcome === 'landed') {
    ctx.fillText('SUDAH MENDARAT DI LANDASAN', VIEW_WIDTH / 2, 40);
    ctx.fillStyle = '#7ddb6a';
    ctx.font = 'bold 12px Verdana, sans-serif';
    ctx.fillText(`SKOR ${mission.score}`, VIEW_WIDTH / 2, 60);
  } else if (ring) {
    const dist = Math.round(Math.hypot(ring.x - plane.x, ring.z - plane.z));
    ctx.fillText(`RING ${mission.nextRing + 1} / ${RING_COUNT}  •  ${dist} m`, VIEW_WIDTH / 2, 40);
    const bearing = Math.atan2(ring.x - plane.x, ring.z - plane.z) - plane.heading;
    const arrow = bearing > 0.12 ? '◀ BELOK KIRI' : bearing < -0.12 ? 'BELOK KANAN ▶' : '▲ LURUS';
    ctx.fillStyle = '#39d5e8';
    ctx.font = 'bold 12px Verdana, sans-serif';
    ctx.fillText(arrow, VIEW_WIDTH / 2, 60);
  } else {
    ctx.fillText('SEMUA RING LEWAT — MENUJU LANDASAN', VIEW_WIDTH / 2, 40);
    const dist = Math.round(Math.hypot(RUNWAY_CENTER_X - plane.x, RUNWAY_CENTER_Z - plane.z));
    ctx.fillStyle = '#39d5e8';
    ctx.font = 'bold 12px Verdana, sans-serif';
    ctx.fillText(`LANDASAN ${dist} m DI DEPAN`, VIEW_WIDTH / 2, 60);
  }
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'left';
  for (let i = 0; i < RING_COUNT; i++) {
    const px = 42 + i * 30;
    ctx.beginPath();
    ctx.arc(px, 112, 10, 0, Math.PI * 2);
    ctx.fillStyle = i < mission.ringsPassed ? '#7ddb6a' : 'rgba(10, 14, 24, 0.72)';
    ctx.fill();
    ctx.strokeStyle = i === mission.nextRing ? '#ffd23f' : '#3a4358';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = i < mission.ringsPassed ? '#10141f' : '#ffe9a8';
    ctx.font = 'bold 11px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), px, 116);
  }
  ctx.restore();

  if (mission.lastRingFrame && frame - mission.lastRingFrame < 90) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 30px Verdana, sans-serif';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    ctx.fillText(`RING ${mission.ringsPassed} LEWAT!`, VIEW_WIDTH / 2, 150);
    ctx.restore();
  }
  if (plane.stalled) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff5b4d';
    ctx.font = 'bold 24px Verdana, sans-serif';
    ctx.fillText('STALL! TAMBAH THROTTLE, TURUNKAN HIDUNG', VIEW_WIDTH / 2, 190);
    ctx.restore();
  } else if (plane.fuel < 25 && plane.fuel > 0) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff9e4f';
    ctx.font = 'bold 20px Verdana, sans-serif';
    ctx.fillText('BAHAN BAKAR MENIPIS — SEGERA MENDARAT', VIEW_WIDTH / 2, 190);
    ctx.restore();
  }

  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '12px Verdana, sans-serif';
  ctx.restore();
  void runwayIsActive;
}

function drawButton(ctx, rect, label) {
  ctx.save();
  const grad = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  grad.addColorStop(0, '#ffd23f');
  grad.addColorStop(1, '#e8722a');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#fff3c4';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#241505';
  ctx.font = 'bold 20px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 7);
  ctx.restore();
}

export function drawStartScreen(ctx, plane, mission, frame) {
  ctx.save();
  ctx.fillStyle = 'rgba(16, 20, 36, 0.55)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  panel(ctx, 290, 96, 700, 470);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd23f';
  ctx.font = 'bold 15px Verdana, sans-serif';
  ctx.fillText('SORTIE SENJA DI ATAS LEMBAH', 640, 140);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 46px Verdana, sans-serif';
  ctx.fillText('LANGIT SENJA', 640, 192);
  ctx.fillStyle = '#ff9e4f';
  ctx.font = 'bold 24px Verdana, sans-serif';
  ctx.fillText('Rute Cendrawasih', 640, 226);
  ctx.fillStyle = '#e8eef7';
  ctx.font = '16px Verdana, sans-serif';
  ctx.fillText('Terbangkan Cendrawasih melewati 6 ring bercahaya di atas', 640, 268);
  ctx.fillText('sawah, sungai, dan kota kecil — lalu mendaratlah dengan', 640, 292);
  ctx.fillText('mulus di landasan sebelum bahan bakar habis.', 640, 316);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 14px Verdana, sans-serif';
  ctx.fillText('KONTROL', 640, 352);
  ctx.fillStyle = '#e8eef7';
  ctx.font = '15px Verdana, sans-serif';
  ctx.fillText('↑ / ↓  hidung naik–turun      ← / →  belok', 640, 378);
  ctx.fillText('W / S  atau  Shift / Ctrl  throttle      Tahan-klik mouse: kemudikan', 640, 402);
  ctx.fillText('Klik tombol THR + / − di kokpit untuk throttle dengan mouse', 640, 426);
  ctx.fillText('Jaga kecepatan di atas stall, hemat bahan bakar, dan', 640, 462);
  ctx.fillText('selaraskan hidung dengan landasan saat mendarat.', 640, 486);
  drawButton(ctx, START_BUTTON, '✈  TERBANG');
  ctx.restore();
  void plane;
  void mission;
  void frame;
}

export function drawEndScreen(ctx, plane, mission, frame) {
  const landed = mission.outcome === 'landed';
  ctx.save();
  ctx.fillStyle = landed ? 'rgba(20, 46, 24, 0.6)' : 'rgba(52, 18, 16, 0.6)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  panel(ctx, 340, 130, 600, 400);
  ctx.textAlign = 'center';
  ctx.fillStyle = landed ? '#7ddb6a' : '#ff5b4d';
  ctx.font = 'bold 40px Verdana, sans-serif';
  ctx.fillText(landed ? 'MENDARAT MULUS!' : 'PESAWAT JATUH', 640, 190);
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px Verdana, sans-serif';
  ctx.fillText(mission.outcomeReason, 640, 226);
  const seconds = Math.round(mission.elapsedFrames / 60);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 20px Verdana, sans-serif';
  ctx.fillText(`Ring: ${mission.ringsPassed} / ${RING_COUNT}    Waktu: ${seconds} dtk    Bahan bakar: ${Math.round(plane.fuel)}%`, 640, 286);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px Verdana, sans-serif';
  ctx.fillText(`SKOR  ${mission.score}`, 640, 344);
  ctx.fillStyle = '#9aa5b5';
  ctx.font = '14px Verdana, sans-serif';
  ctx.fillText(landed ? 'Sortie selesai. Terbang lagi untuk skor yang lebih baik.' : 'Coba lagi — atur throttle dan jaga ketinggian.', 640, 384);
  drawButton(ctx, RESTART_BUTTON, '↻  TERBANG LAGI');
  ctx.fillStyle = '#9aa5b5';
  ctx.font = '12px Verdana, sans-serif';
  ctx.fillText('atau tekan R', 640, 516);
  ctx.restore();
  void frame;
}

export function drawPauseScreen(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(10, 14, 24, 0.6)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px Verdana, sans-serif';
  ctx.fillText('JEDA', 640, 330);
  ctx.font = '16px Verdana, sans-serif';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText('Tekan P untuk lanjut terbang', 640, 368);
  ctx.restore();
}

export function drawThrottleButtons(ctx) {
  drawButton(ctx, THROTTLE_UP_BUTTON, 'THR +');
  drawButton(ctx, THROTTLE_DOWN_BUTTON, 'THR −');
}
