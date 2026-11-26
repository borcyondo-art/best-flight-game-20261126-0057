// Flight physics for the Cendrawasih light aircraft.
// One clear job: turn pilot input into position, speed, attitude, fuel
// and ground contact, at a fixed step, with no randomness.

import {
  BANK_RATE,
  CRUISE_SPEED,
  FUEL_BURN_FULL,
  FUEL_BURN_IDLE,
  FUEL_START,
  GRAVITY_SINK,
  MAX_BANK,
  MAX_PITCH,
  MAX_SPEED,
  MIN_FLY_SPEED,
  PITCH_RATE,
  START_ALT,
  START_HEADING,
  START_SPEED,
  START_X,
  START_Z,
  STALL_SPEED,
  THROTTLE_STEP,
} from './config.js';
import { groundHeight } from './terrain.js';

export function createAircraft() {
  return {
    x: START_X,
    z: START_Z,
    alt: START_ALT,
    heading: START_HEADING,
    pitch: 0,
    bank: 0,
    speed: START_SPEED,
    throttle: 0.62,
    fuel: FUEL_START,
    hull: 100,
    verticalSpeed: 0,
    stalled: false,
    grounded: false,
  };
}

export function resetAircraft(plane) {
  const fresh = createAircraft();
  Object.assign(plane, fresh);
}

export function updateAircraft(plane, input, dt) {
  if (input.throttleUp) plane.throttle = Math.min(1, plane.throttle + THROTTLE_STEP * dt);
  if (input.throttleDown) plane.throttle = Math.max(0, plane.throttle - THROTTLE_STEP * dt);

  const pitchInput = (input.pitchUp ? 1 : 0) - (input.pitchDown ? 1 : 0);
  const bankInput = (input.bankRight ? 1 : 0) - (input.bankLeft ? 1 : 0);
  plane.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, plane.pitch + pitchInput * PITCH_RATE * dt));
  plane.bank = Math.max(-MAX_BANK, Math.min(MAX_BANK, plane.bank + bankInput * BANK_RATE * dt));
  if (bankInput === 0) plane.bank *= Math.pow(0.25, dt);
  if (pitchInput === 0) plane.pitch *= Math.pow(0.5, dt);

  const turnRate = plane.bank * 0.55 * Math.min(1, plane.speed / CRUISE_SPEED);
  plane.heading += turnRate * dt;

  const targetSpeed = MIN_FLY_SPEED + plane.throttle * (MAX_SPEED - MIN_FLY_SPEED);
  const accel = (targetSpeed - plane.speed) * 0.35 - Math.abs(plane.bank) * 3.5;
  plane.speed = Math.max(0, plane.speed + accel * dt);

  plane.stalled = plane.speed < STALL_SPEED;
  let climb = Math.sin(plane.pitch) * plane.speed * 0.9;
  if (plane.stalled) climb -= GRAVITY_SINK * (1 - plane.speed / STALL_SPEED) * 2.2;
  climb -= (1 - plane.throttle) * 2.2;
  plane.verticalSpeed = climb;

  const forwardX = Math.sin(plane.heading);
  const forwardZ = Math.cos(plane.heading);
  plane.x += forwardX * plane.speed * dt;
  plane.z += forwardZ * plane.speed * dt;
  plane.alt += climb * dt;

  plane.fuel = Math.max(0, plane.fuel - (FUEL_BURN_IDLE + plane.throttle * FUEL_BURN_FULL) * dt);
  if (plane.fuel <= 0 && plane.throttle > 0) plane.throttle = 0;

  const ground = groundHeight(plane.x, plane.z);
  plane.grounded = plane.alt <= ground + 0.5;
  if (plane.grounded) plane.alt = ground;
  return ground;
}
