// SPDX-License-Identifier: MIT
// Entry program for the best-flight-game bounty (program/v1).
// It hands the game in: it copies game/ and screenshots/ from this
// repository into the output directory and writes dossier.json there
// with buildDossier from vendor/makefun-game.ts. Standard library only,
// no network, deterministic output: the same input files always produce
// the same output bytes.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');
if (!existsSync(join(gameDir, 'index.html'))) {
  throw new Error('main.ts: game/index.html is missing, refusing to hand in an unplayable game');
}
if (!existsSync(shotsDir)) {
  throw new Error('main.ts: screenshots/ is missing, refusing to hand in an entry with no renders');
}

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
