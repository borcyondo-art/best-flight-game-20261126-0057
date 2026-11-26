// Mission logic: the ring route, the runway landing, scoring and endings.
// One clear job: decide what counts as progress, a landing, or a crash,
// and turn a finished sortie into a score.

import {
  LANDING_MAX_ALIGN_DEG,
  LANDING_MAX_DESCENT,
  LANDING_MAX_OFFSET,
  LANDING_MAX_SPEED,
  LANDING_MIN_SPEED,
  RING_COUNT,
  RING_RADIUS,
  RUNWAY_CENTER_X,
  RUNWAY_CENTER_Z,
  RUNWAY_ELEVATION,
  RUNWAY_HALF_LENGTH,
  RUNWAY_WIDTH,
} from './config.js';
import { groundHeight, isOnRunway, riverCenterX } from './terrain.js';

export function createMission() {
  const rings = [];
  for (let i = 0; i < RING_COUNT; i++) {
    const z = 620 + i * 680;
    const x = riverCenterX(z) + (i % 2 === 0 ? 150 : -170);
    rings.push({
      x,
      z,
      alt: 105 + (i % 3) * 32,
      radius: RING_RADIUS,
      passed: false,
    });
  }
  return {
    rings,
    nextRing: 0,
    ringsPassed: 0,
    startFrame: 0,
    elapsedFrames: 0,
    outcome: null,
    outcomeReason: '',
    landingQuality: 0,
    score: 0,
  };
}

export function resetMission(mission) {
  const fresh = createMission();
  mission.rings = fresh.rings;
  mission.nextRing = 0;
  mission.ringsPassed = 0;
  mission.startFrame = 0;
  mission.elapsedFrames = 0;
  mission.outcome = null;
  mission.outcomeReason = '';
  mission.landingQuality = 0;
  mission.score = 0;
}

function ringDistanceSquared(plane, ring) {
  const dx = plane.x - ring.x;
  const dz = plane.z - ring.z;
  const da = plane.alt - ring.alt;
  return dx * dx + dz * dz + da * da;
}

export function nextRingTarget(mission) {
  return mission.nextRing < mission.rings.length ? mission.rings[mission.nextRing] : null;
}

export function runwayIsActive(mission) {
  return mission.nextRing >= mission.rings.length;
}

export function scoreSortie(mission, plane) {
  const seconds = mission.elapsedFrames / 60;
  const timeBonus = Math.max(0, Math.round(2400 - seconds * 8));
  const ringPoints = mission.ringsPassed * 450;
  const fuelBonus = Math.round(plane.fuel * 9);
  const landingBonus = Math.round(mission.landingQuality * 1400);
  return ringPoints + timeBonus + fuelBonus + landingBonus;
}

export function updateMission(mission, plane, frame) {
  if (mission.outcome) return mission.outcome;
  mission.elapsedFrames = frame - mission.startFrame;

  const ring = nextRingTarget(mission);
  if (ring && ringDistanceSquared(plane, ring) < (ring.radius + 8) * (ring.radius + 8)) {
    ring.passed = true;
    mission.ringsPassed += 1;
    mission.nextRing += 1;
    mission.lastRingFrame = frame;
  }

  if (plane.grounded) {
    const ground = groundHeight(plane.x, plane.z);
    if (isOnRunway(plane.x, plane.z)) {
      const alignDeg = Math.abs(plane.heading) * (180 / Math.PI);
      const offset = Math.abs(plane.x - RUNWAY_CENTER_X);
      const descent = -plane.verticalSpeed;
      const gentle = descent <= LANDING_MAX_DESCENT;
      const speedOk = plane.speed >= LANDING_MIN_SPEED && plane.speed <= LANDING_MAX_SPEED;
      const aligned = alignDeg <= LANDING_MAX_ALIGN_DEG || alignDeg >= 360 - LANDING_MAX_ALIGN_DEG;
      const centered = offset <= LANDING_MAX_OFFSET;
      if (gentle && speedOk && aligned && centered) {
        mission.landingQuality = Math.max(0, 1 - descent / 14) * 0.5
          + Math.max(0, 1 - offset / LANDING_MAX_OFFSET) * 0.3
          + Math.max(0, 1 - Math.abs(plane.speed - 46) / 22) * 0.2;
        mission.outcome = 'landed';
        mission.outcomeReason = 'Mendarat mulus di landasan Cendrawasih.';
        mission.score = scoreSortie(mission, plane);
        return mission.outcome;
      }
      mission.outcome = 'crashed';
      mission.outcomeReason = gentle
        ? 'Pendaratan gagal: kecepatan atau arah tidak selaras dengan landasan.'
        : 'Mendarat terlalu keras — pesawat menghantam landasan.';
      mission.score = mission.ringsPassed * 450;
      return mission.outcome;
    }
    mission.outcome = 'crashed';
    mission.outcomeReason = plane.alt <= RUNWAY_ELEVATION + 2 && Math.abs(plane.z - RUNWAY_CENTER_Z) < RUNWAY_HALF_LENGTH + 200
      ? 'Keluar landasan dan menghantam tanah.'
      : 'Pesawat menghantam medan.';
    mission.score = mission.ringsPassed * 450;
    return mission.outcome;
  }

  if (plane.fuel <= 0 && plane.alt < groundHeight(plane.x, plane.z) + 90) {
    mission.outcome = 'crashed';
    mission.outcomeReason = 'Bahan bakar habis di udara.';
    mission.score = mission.ringsPassed * 450;
    return mission.outcome;
  }
  if (plane.alt > 900) {
    mission.outcome = 'crashed';
    mission.outcomeReason = 'Terbang terlalu tinggi — mesin mati di udara tipis.';
    mission.score = mission.ringsPassed * 450;
    return mission.outcome;
  }
  return null;
}

export function runwayCorners() {
  return {
    x: RUNWAY_CENTER_X,
    z: RUNWAY_CENTER_Z,
    halfWidth: RUNWAY_WIDTH / 2,
    halfLength: RUNWAY_HALF_LENGTH,
    elevation: RUNWAY_ELEVATION,
  };
}
