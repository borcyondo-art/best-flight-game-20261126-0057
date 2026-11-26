// Procedural sound: engine hum, ring chime, touchdown thud and warnings.
// One clear job: make every sound from oscillators, with no audio files
// and no network. Sound starts only after a user gesture.

export function createAudio() {
  return {
    context: null,
    engineOsc: null,
    engineGain: null,
    started: false,
    muted: false,
  };
}

export function startAudio(audio) {
  if (audio.started) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const osc = context.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 62;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    const gain = context.createGain();
    gain.gain.value = 0;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    osc.start();
    audio.context = context;
    audio.engineOsc = osc;
    audio.engineGain = gain;
    audio.started = true;
  } catch (error) {
    audio.started = false;
  }
}

export function updateEngineSound(audio, throttle, flying) {
  if (!audio.started || !audio.engineGain) return;
  const target = audio.muted || !flying ? 0 : 0.02 + throttle * 0.05;
  audio.engineGain.gain.setTargetAtTime(target, audio.context.currentTime, 0.12);
  if (audio.engineOsc) {
    audio.engineOsc.frequency.setTargetAtTime(52 + throttle * 48, audio.context.currentTime, 0.12);
  }
}

function beep(audio, frequency, duration, volume, type) {
  if (!audio.started || audio.muted) return;
  try {
    const osc = audio.context.createOscillator();
    const gain = audio.context.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audio.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.context.currentTime + duration);
    osc.connect(gain);
    gain.connect(audio.context.destination);
    osc.start();
    osc.stop(audio.context.currentTime + duration);
  } catch (error) {
    // Sound is garnish: a failure here must never stop the game.
  }
}

export function playRingChime(audio) {
  beep(audio, 880, 0.35, 0.12, 'sine');
  beep(audio, 1320, 0.5, 0.08, 'sine');
}

export function playThud(audio) {
  beep(audio, 70, 0.3, 0.2, 'triangle');
}

export function playCrashSound(audio) {
  beep(audio, 110, 0.6, 0.18, 'sawtooth');
  beep(audio, 55, 0.8, 0.15, 'triangle');
}

export function playWarning(audio) {
  beep(audio, 440, 0.18, 0.07, 'square');
}
