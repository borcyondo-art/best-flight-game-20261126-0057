# Langit Senja: Rute Cendrawasih

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/borcyondo-art/best-flight-game-20261126-0057/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/borcyondo-art/best-flight-game-20261126-0057/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

A complete, original flight game that runs offline in a desktop browser
from its own static files. Fly the light aircraft *Cendrawasih* at sunset
over a valley of rice paddies, a winding river, a road, a small town and a
volcano ridge: pass 6 glowing rings in order, then land on the runway
before the fuel runs out.

## Play

Open `game/index.html` in desktop Chrome (serve `game/` with any static
HTTP server, or open the file directly — it loads nothing over the
network).

- Arrow keys / WASD: pitch, bank and throttle
- `W`/`S` or Shift/Ctrl: throttle up/down
- Hold-click and move the mouse: steer
- Click the THR + / − buttons in the cockpit: throttle with the mouse
- `P`: pause · `Space`: start · `R`: fly again after landing or a crash

Land gently, slow, and lined up with the runway. Stall, run out of fuel,
or hit the terrain and the sortie ends.

## Layout

- `main.ts` — entry program: copies `game/` and `screenshots/` to the
  output directory and writes `dossier.json` with `buildDossier`.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `game/src/config.js` — tuning and world constants.
- `game/src/random.js` — seeded randomness and value noise.
- `game/src/terrain.js` — ground height and land use.
- `game/src/aircraft.js` — flight physics.
- `game/src/missions.js` — rings, landing rules and scoring.
- `game/src/instruments.js` — lit cockpit dials.
- `game/src/render.js` — sky, terrain, rings, runway, aircraft, cockpit.
- `game/src/hud.js` — HUD numbers, banners and screens.
- `game/src/input.js` — keyboard and mouse input.
- `game/src/audio.js` — procedural sound, no audio files.
- `game/src/main.js` — phases, fixed-step loop, screenshot presets.
- `screenshots/` — real renders of the game's own code in a browser.

---

<sub>Entered on [make.fun](https://make.fun/?ref=h9p10zvy&utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>
