// Terrain shape and land use for the valley the sortie flies over.
// One clear job: given a ground position, say how high the ground is and
// what covers it, deterministically, so the renderer and the physics
// always agree.

import {
  PALETTE,
  RUNWAY_CENTER_X,
  RUNWAY_CENTER_Z,
  RUNWAY_ELEVATION,
  RUNWAY_HALF_LENGTH,
  RUNWAY_WIDTH,
  WORLD_SEED,
} from './config.js';
import { fbm2, hashCell, noise2 } from './random.js';

export function riverCenterX(z) {
  return 260 * Math.sin(z * 0.00035) + 120 * Math.sin(z * 0.0011 + 1.7) - 40;
}

export function roadCenterX(z) {
  return -180 + 60 * Math.sin(z * 0.0005 + 0.6);
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function isOnRunway(x, z) {
  return (
    Math.abs(x - RUNWAY_CENTER_X) <= RUNWAY_WIDTH / 2 &&
    Math.abs(z - RUNWAY_CENTER_Z) <= RUNWAY_HALF_LENGTH
  );
}

function rawHeight(x, z) {
  let h = 22 + fbm2(x * 0.0016, z * 0.0016, WORLD_SEED) * 20;
  h += fbm2(x * 0.006, z * 0.006, WORLD_SEED + 5) * 7;
  h += smoothstep(3800, 6200, z) * 95 * (0.55 + 0.45 * fbm2(x * 0.0009 + 3, z * 0.0009, WORLD_SEED + 9));
  h += smoothstep(5600, 7200, z) * 70 * (0.5 + 0.5 * noise2(x * 0.0012, 4.4, WORLD_SEED + 13));
  return h;
}

export function groundHeight(x, z) {
  const h = rawHeight(x, z);
  const nearRunway =
    Math.abs(x - RUNWAY_CENTER_X) < RUNWAY_WIDTH / 2 + 130 &&
    Math.abs(z - RUNWAY_CENTER_Z) < RUNWAY_HALF_LENGTH + 160;
  const nearStart =
    Math.abs(x - 40) < 260 && Math.abs(z - 120) < 320;
  let flat = 0;
  if (nearRunway) flat = Math.max(flat, 1 - smoothstep(0, 1, Math.max(
    (Math.abs(x - RUNWAY_CENTER_X) - RUNWAY_WIDTH / 2) / 130,
    (Math.abs(z - RUNWAY_CENTER_Z) - RUNWAY_HALF_LENGTH) / 160,
  )));
  if (nearStart) flat = Math.max(flat, 1 - smoothstep(0, 1, Math.max(
    (Math.abs(x - 40) - 60) / 200,
    (Math.abs(z - 120) - 120) / 200,
  )));
  const target = nearRunway ? RUNWAY_ELEVATION : 26;
  return h * (1 - flat) + target * flat;
}

export function landUseAt(x, z) {
  if (isOnRunway(x, z)) return 'runway';
  const riverDist = Math.abs(x - riverCenterX(z));
  if (riverDist < 24) return 'river';
  if (riverDist < 40) return 'paddy';
  const roadDist = Math.abs(x - roadCenterX(z));
  if (roadDist < 7) return 'road';
  const townDx = x + 260;
  const townDz = z - 2600;
  if (townDx * townDx + townDz * townDz < 260 * 260) return 'town';
  if (groundHeight(x, z) > 78) return 'mountain';
  const cellX = Math.floor(x / 190);
  const cellZ = Math.floor(z / 190);
  const pick = hashCell(cellX, cellZ, WORLD_SEED + 31);
  if (pick < 0.16) return 'forest';
  if (pick < 0.52) return 'paddy';
  if (pick < 0.72) return 'field';
  if (pick < 0.86) return 'dryfield';
  return 'field';
}

export function landColor(kind, x, z, shade) {
  switch (kind) {
    case 'river':
      return PALETTE.river;
    case 'road':
      return PALETTE.road;
    case 'runway':
      return PALETTE.runway;
    case 'town':
      return hashCell(Math.floor(x / 46), Math.floor(z / 46), WORLD_SEED + 47) < 0.3
        ? PALETTE.townRoof
        : PALETTE.town;
    case 'forest':
      return shade < 0.5 ? '#2a5f33' : PALETTE.forest;
    case 'paddy':
      return shade < 0.5 ? PALETTE.paddyWet : PALETTE.paddy;
    case 'dryfield':
      return PALETTE.dryField;
    case 'mountain':
      return '#6b5a78';
    default:
      return shade < 0.5 ? PALETTE.fieldGreen : PALETTE.fieldLight;
  }
}
