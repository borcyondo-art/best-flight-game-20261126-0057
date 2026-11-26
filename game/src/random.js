// Deterministic randomness for the world: a seeded generator and smooth
// value noise. The game never calls Math.random, so two runs of the same
// seed build byte-identical terrain, clouds and ring layouts.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(ix, iz, seed) {
  let h = (ix * 374761393 + iz * 668265263 + seed * 974634211) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

export function noise2(x, z, seed) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const a = hash2(ix, iz, seed);
  const b = hash2(ix + 1, iz, seed);
  const c = hash2(ix, iz + 1, seed);
  const d = hash2(ix + 1, iz + 1, seed);
  const ux = smooth(fx);
  const uz = smooth(fz);
  return (a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz) * 2 - 1;
}

export function fbm2(x, z, seed) {
  return (
    noise2(x, z, seed) * 0.55 +
    noise2(x * 2.13 + 7.3, z * 2.13 + 3.1, seed + 11) * 0.28 +
    noise2(x * 4.31 + 1.7, z * 4.31 + 9.2, seed + 23) * 0.17
  );
}

export function hashCell(cx, cz, seed) {
  return hash2(cx, cz, seed);
}
