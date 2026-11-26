// Flight tuning and world constants for Langit Senja: Rute Cendrawasih.
// One clear job: every number the rest of the game tunes against lives here.

export const WORLD_SEED = 20261126;

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
export const HORIZON_Y = 300;
export const FOCAL_LENGTH = 560;

export const GRAVITY_SINK = 9;
export const MIN_FLY_SPEED = 26;
export const STALL_SPEED = 30;
export const CRUISE_SPEED = 62;
export const MAX_SPEED = 96;
export const TAKEOFF_SPEED = 34;

export const THROTTLE_STEP = 0.55;
export const PITCH_RATE = 0.55;
export const BANK_RATE = 1.15;
export const MAX_BANK = 1.05;
export const MAX_PITCH = 0.5;

export const FUEL_START = 100;
export const FUEL_BURN_IDLE = 0.22;
export const FUEL_BURN_FULL = 1.35;

export const RING_COUNT = 6;
export const RING_RADIUS = 30;
export const RUNWAY_CENTER_X = 60;
export const RUNWAY_CENTER_Z = 5200;
export const RUNWAY_WIDTH = 48;
export const RUNWAY_HALF_LENGTH = 450;
export const RUNWAY_ELEVATION = 30;

export const START_X = 40;
export const START_Z = 120;
export const START_ALT = 150;
export const START_HEADING = 0;
export const START_SPEED = 58;

export const LANDING_MAX_DESCENT = 6;
export const LANDING_MIN_SPEED = 30;
export const LANDING_MAX_SPEED = 66;
export const LANDING_MAX_ALIGN_DEG = 14;
export const LANDING_MAX_OFFSET = 26;

export const PALETTE = {
  skyTop: '#2b3a6e',
  skyMid: '#e8825a',
  skyLow: '#ffc46b',
  sunCore: '#fff3c4',
  sunGlow: '#ff9e4f',
  mountainFar: '#7a6a9e',
  mountainNear: '#5d4f7d',
  fieldGreen: '#6da34a',
  fieldLight: '#93bd58',
  paddy: '#4f9e57',
  paddyWet: '#3d8fa8',
  dryField: '#c9a95c',
  forest: '#2f6b3a',
  town: '#9a8f85',
  townRoof: '#b3614e',
  river: '#3f8fb5',
  road: '#6e6258',
  runway: '#4a4a52',
  runwayMark: '#f2ead8',
  ringNext: '#ffd23f',
  ringTodo: '#39d5e8',
  ringDone: '#7ddb6a',
};
