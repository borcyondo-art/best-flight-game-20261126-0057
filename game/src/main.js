// Game entry point: the state machine, the fixed-step loop, deterministic
// screenshot presets and the test hooks the play-test drives.
// One clear job: own the phases (start, flying, paused, landed, crashed)
// and call the physics, mission and rendering pieces in the right order.

import { createAircraft, resetAircraft, updateAircraft } from './aircraft.js';
import {
  createAudio,
  playCrashSound,
  playRingChime,
  playThud,
  playWarning,
  startAudio,
  updateEngineSound,
} from './audio.js';
import { VIEW_HEIGHT, VIEW_WIDTH, WORLD_SEED } from './config.js';
import { applyMouseSteer, bindInput, clearTransientInput, createInput } from './input.js';
import { createMission, resetMission, scoreSortie, updateMission } from './missions.js';
import { mulberry32 } from './random.js';
import { drawScene } from './render.js';
import {
  RESTART_BUTTON,
  START_BUTTON,
  THROTTLE_DOWN_BUTTON,
  THROTTLE_UP_BUTTON,
  drawEndScreen,
  drawFlightHud,
  drawPauseScreen,
  drawStartScreen,
  drawThrottleButtons,
  pointInRect,
} from './hud.js';
import { runwayCorners } from './missions.js';

const STEP = 1 / 60;

function createClouds() {
  const rand = mulberry32(WORLD_SEED + 77);
  const clouds = [];
  for (let i = 0; i < 26; i++) {
    clouds.push({
      x: (rand() - 0.5) * 1500,
      z: 300 + rand() * 5800,
      alt: 260 + rand() * 170,
      size: 34 + rand() * 46,
    });
  }
  return clouds;
}

function createGame() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const plane = createAircraft();
  const mission = createMission();
  const input = createInput();
  const audio = createAudio();
  const clouds = createClouds();
  return {
    canvas,
    ctx,
    plane,
    mission,
    input,
    audio,
    clouds,
    phase: 'start',
    frame: 0,
    lastRingsPassed: 0,
    warningCooldown: 0,
  };
}

function startSortie(game) {
  resetAircraft(game.plane);
  resetMission(game.mission);
  game.mission.startFrame = game.frame;
  game.phase = 'flying';
  game.lastRingsPassed = 0;
  startAudio(game.audio);
}

function restartFromEnd(game) {
  startSortie(game);
}

function applyShotPreset(game, shot) {
  const plane = game.plane;
  const mission = game.mission;
  if (shot === 1) {
    const ring = mission.rings[0];
    plane.x = ring.x - 12;
    plane.z = ring.z - 190;
    plane.alt = ring.alt + 4;
    plane.heading = 0.04;
    plane.speed = 62;
    plane.throttle = 0.7;
    plane.bank = 0.12;
    game.phase = 'flying';
    game.frame = 40;
    mission.startFrame = 0;
  } else if (shot === 2) {
    for (const ring of mission.rings) ring.passed = true;
    mission.ringsPassed = mission.rings.length;
    mission.nextRing = mission.rings.length;
    const rw = runwayCorners();
    plane.x = rw.x + 6;
    plane.z = rw.z - 1050;
    plane.alt = 92;
    plane.heading = 0;
    plane.speed = 52;
    plane.throttle = 0.42;
    plane.pitch = -0.06;
    game.phase = 'flying';
    game.frame = 40;
    mission.startFrame = 0;
  } else if (shot === 3) {
    game.phase = 'start';
    game.frame = 40;
  } else if (shot === 4) {
    for (const ring of mission.rings) ring.passed = true;
    mission.ringsPassed = mission.rings.length;
    mission.nextRing = mission.rings.length;
    const rw = runwayCorners();
    plane.x = rw.x;
    plane.z = rw.z + 120;
    plane.alt = rw.elevation;
    plane.heading = 0;
    plane.speed = 0;
    plane.throttle = 0;
    plane.grounded = true;
    mission.outcome = 'landed';
    mission.outcomeReason = 'Mendarat mulus di landasan Cendrawasih.';
    mission.landingQuality = 0.86;
    mission.elapsedFrames = 60 * 118;
    mission.score = scoreSortie(mission, plane);
    game.phase = 'landed';
    game.frame = 40;
  }
}

function stepGame(game) {
  const { plane, mission, input } = game;
  if (input.pausePressed) {
    game.phase = game.phase === 'paused' ? 'flying' : 'paused';
  }
  if (game.phase !== 'flying') return;
  applyMouseSteer(input, plane);
  if (input.mouseDown) {
    if (pointInRect(input.mouseX, input.mouseY, THROTTLE_UP_BUTTON)) plane.throttle = Math.min(1, plane.throttle + 0.5 * STEP);
    if (pointInRect(input.mouseX, input.mouseY, THROTTLE_DOWN_BUTTON)) plane.throttle = Math.max(0, plane.throttle - 0.5 * STEP);
  }
  updateAircraft(plane, input, STEP);
  const outcome = updateMission(mission, plane, game.frame);
  if (mission.ringsPassed > game.lastRingsPassed) {
    game.lastRingsPassed = mission.ringsPassed;
    playRingChime(game.audio);
  }
  if (outcome === 'landed') {
    game.phase = 'landed';
    playThud(game.audio);
  } else if (outcome === 'crashed') {
    game.phase = 'crashed';
    playCrashSound(game.audio);
  }
  if (plane.stalled || plane.fuel < 25) {
    game.warningCooldown -= 1;
    if (game.warningCooldown <= 0) {
      playWarning(game.audio);
      game.warningCooldown = 70;
    }
  }
  updateEngineSound(game.audio, plane.throttle, true);
}

function renderGame(game) {
  const { ctx, plane, mission } = game;
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  drawScene(ctx, plane, mission, game.clouds, game.frame);
  if (game.phase === 'start') {
    drawStartScreen(ctx, plane, mission, game.frame);
  } else if (game.phase === 'flying' || game.phase === 'paused') {
    drawFlightHud(ctx, plane, mission, game.frame);
    drawThrottleButtons(ctx);
    if (game.phase === 'paused') drawPauseScreen(ctx);
  } else {
    drawFlightHud(ctx, plane, mission, game.frame);
    drawEndScreen(ctx, plane, mission, game.frame);
  }
}

function handleClicks(game) {
  const { input } = game;
  if (input.startPressed) {
    if (game.phase === 'start') startSortie(game);
    else if (game.phase === 'landed' || game.phase === 'crashed') restartFromEnd(game);
    input.startPressed = false;
  }
  if (input.clicked) {
    if (game.phase === 'start' && pointInRect(input.clickX, input.clickY, START_BUTTON)) {
      startSortie(game);
    } else if ((game.phase === 'landed' || game.phase === 'crashed') && pointInRect(input.clickX, input.clickY, RESTART_BUTTON)) {
      restartFromEnd(game);
    }
  }
}

function main() {
  const game = createGame();
  bindInput(game.input, game.canvas, () => startAudio(game.audio));
  window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyR' && (game.phase === 'landed' || game.phase === 'crashed')) {
      restartFromEnd(game);
    }
    if (event.code === 'Enter' && game.phase === 'start') startSortie(game);
  });

  window.__flight = {
    game,
    phase: () => game.phase,
    state: () => ({
      phase: game.phase,
      frame: game.frame,
      x: game.plane.x,
      z: game.plane.z,
      alt: game.plane.alt,
      speed: game.plane.speed,
      heading: game.plane.heading,
      throttle: game.plane.throttle,
      fuel: game.plane.fuel,
      ringsPassed: game.mission.ringsPassed,
      nextRing: game.mission.nextRing,
      outcome: game.mission.outcome,
      score: game.mission.score,
    }),
    start: () => startSortie(game),
    setInput: (patch) => Object.assign(game.input, patch),
    step: (n) => {
      for (let i = 0; i < (n || 1); i++) {
        game.frame += 1;
        stepGame(game);
        handleClicks(game);
        clearTransientInput(game.input);
      }
      renderGame(game);
    },
  };

  const params = new URLSearchParams(window.location.search);
  const shot = Number(params.get('shot') || 0);
  if (shot >= 1 && shot <= 4) {
    applyShotPreset(game, shot);
    renderGame(game);
    document.title = 'shot-ready';
    window.__flightShot = true;
    return;
  }

  let last = performance.now();
  let accumulator = 0;
  function loop(now) {
    const elapsed = Math.min(0.25, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    while (accumulator >= STEP) {
      game.frame += 1;
      stepGame(game);
      handleClicks(game);
      clearTransientInput(game.input);
      accumulator -= STEP;
    }
    renderGame(game);
    requestAnimationFrame(loop);
  }
  renderGame(game);
  requestAnimationFrame(loop);
}

main();
