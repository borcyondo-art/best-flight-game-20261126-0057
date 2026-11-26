// Cockpit instruments: the lit dials on the dashboard panel.
// One clear job: draw the artificial horizon, airspeed, altitude,
// vertical speed, compass and fuel/throttle gauges from flight state.

import { PALETTE } from './config.js';

function dialFace(ctx, x, y, r, label) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#10141f';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#3a4358';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r - 4, 0, Math.PI * 2);
  ctx.strokeStyle = '#f7b731';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 11px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y + r - 8);
  ctx.restore();
}

function needle(ctx, x, y, angle, length, color, width) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(0, -length);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function drawArtificialHorizon(ctx, x, y, r, roll, pitch, frame) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(x, y);
  ctx.rotate(-roll);
  const offset = pitch * r * 1.4;
  ctx.fillStyle = '#4aa3df';
  ctx.fillRect(-r * 2, -r * 2 + offset, r * 4, r * 2);
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(-r * 2, offset, r * 4, r * 2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 2, offset);
  ctx.lineTo(r * 2, offset);
  ctx.stroke();
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue;
    const ly = offset + i * 14;
    ctx.beginPath();
    ctx.moveTo(-16, ly);
    ctx.lineTo(16, ly);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#3a4358';
  ctx.stroke();
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - r + 8, y);
  ctx.lineTo(x - 12, y);
  ctx.lineTo(x, y - 4);
  ctx.lineTo(x + 12, y);
  ctx.lineTo(x + r - 8, y);
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 10px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HORIZON', x, y + r + 13);
  ctx.restore();
  void frame;
}

export function drawAirspeedDial(ctx, x, y, r, speed) {
  dialFace(ctx, x, y, r, 'AIRSPEED kt');
  ctx.fillStyle = '#cfe8ff';
  ctx.font = 'bold 12px Verdana, sans-serif';
  ctx.textAlign = 'center';
  for (let v = 0; v <= 100; v += 20) {
    const a = -Math.PI * 0.75 + (v / 100) * Math.PI * 1.5;
    const tx = x + Math.sin(a) * (r - 14);
    const ty = y - Math.cos(a) * (r - 14) + 4;
    ctx.fillText(String(v), tx, ty);
  }
  const angle = -Math.PI * 0.75 + (Math.min(100, speed) / 100) * Math.PI * 1.5;
  needle(ctx, x, y, angle, r - 16, '#ff5b4d', 3);
}

export function drawAltimeterDial(ctx, x, y, r, altitude) {
  dialFace(ctx, x, y, r, 'ALTITUDE ft');
  ctx.fillStyle = '#cfe8ff';
  ctx.font = 'bold 12px Verdana, sans-serif';
  ctx.textAlign = 'center';
  for (let v = 0; v < 10; v++) {
    const a = (v / 10) * Math.PI * 2;
    const tx = x + Math.sin(a) * (r - 14);
    const ty = y - Math.cos(a) * (r - 14) + 4;
    ctx.fillText(String(v), tx, ty);
  }
  const hundreds = (altitude % 1000) / 100;
  const angle = (hundreds / 10) * Math.PI * 2;
  needle(ctx, x, y, angle, r - 16, '#39d5e8', 3);
}

export function drawVerticalSpeedDial(ctx, x, y, r, verticalSpeed) {
  dialFace(ctx, x, y, r, 'VERT SPD');
  ctx.fillStyle = '#cfe8ff';
  ctx.font = 'bold 11px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('+', x - r + 14, y - 6);
  ctx.fillText('-', x - r + 14, y + 16);
  const clamped = Math.max(-12, Math.min(12, verticalSpeed));
  const angle = (clamped / 12) * Math.PI * 0.7;
  needle(ctx, x, y, angle, r - 16, '#7ddb6a', 3);
}

export function drawCompassStrip(ctx, x, y, width, heading) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - width / 2, y - 16, width, 32);
  ctx.fillStyle = '#10141f';
  ctx.fill();
  ctx.strokeStyle = '#3a4358';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.clip();
  const headings = [
    [0, 'N'], [45, 'NE'], [90, 'E'], [135, 'SE'],
    [180, 'S'], [225, 'SW'], [270, 'W'], [315, 'NW'],
  ];
  const deg = ((heading * 180) / Math.PI % 360 + 360) % 360;
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 13px Verdana, sans-serif';
  ctx.textAlign = 'center';
  for (const [h, label] of headings) {
    let diff = h - deg;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    const px = x + diff * 2.1;
    if (px < x - width / 2 - 20 || px > x + width / 2 + 20) continue;
    ctx.fillText(label, px, y + 5);
    ctx.fillRect(px - 1, y - 14, 2, 6);
  }
  ctx.restore();
  ctx.save();
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.moveTo(x, y - 18);
  ctx.lineTo(x - 6, y - 28);
  ctx.lineTo(x + 6, y - 28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawThrottleGauge(ctx, x, y, width, height, throttle) {
  ctx.save();
  ctx.fillStyle = '#10141f';
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = '#3a4358';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
  const fillH = height * throttle;
  const grad = ctx.createLinearGradient(0, y + height, 0, y);
  grad.addColorStop(0, '#ff9e4f');
  grad.addColorStop(1, '#ffd23f');
  ctx.fillStyle = grad;
  ctx.fillRect(x + 3, y + height - fillH, width - 6, Math.max(0, fillH - 3));
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 10px Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('THR', x + width / 2, y + height + 13);
  ctx.fillText(`${Math.round(throttle * 100)}%`, x + width / 2, y - 6);
  ctx.restore();
}

export function drawFuelGauge(ctx, x, y, width, fuel, lowFuel) {
  ctx.save();
  ctx.fillStyle = '#10141f';
  ctx.fillRect(x, y, width, 16);
  ctx.strokeStyle = '#3a4358';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, 16);
  const fillW = (width - 4) * Math.max(0, fuel / 100);
  ctx.fillStyle = lowFuel ? '#ff5b4d' : '#7ddb6a';
  ctx.fillRect(x + 2, y + 2, fillW, 12);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 11px Verdana, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`FUEL ${Math.round(fuel)}%`, x, y - 5);
  ctx.restore();
}

export function drawWarningLights(ctx, x, y, stalled, lowFuel, ringAhead) {
  const lights = [
    ['STALL', stalled, '#ff5b4d'],
    ['FUEL', lowFuel, '#ff9e4f'],
    ['RING', ringAhead, '#39d5e8'],
  ];
  ctx.save();
  ctx.font = 'bold 11px Verdana, sans-serif';
  ctx.textAlign = 'center';
  lights.forEach(([label, on, color], i) => {
    const lx = x + i * 54;
    ctx.beginPath();
    ctx.arc(lx, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = on ? color : '#2a3040';
    ctx.fill();
    ctx.strokeStyle = '#3a4358';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = on ? '#ffffff' : '#7a8494';
    ctx.fillText(label, lx, y + 24);
  });
  ctx.restore();
  void PALETTE;
}
