// Keyboard and mouse input for the sortie.
// One clear job: turn keys, pointer movement and clicks into one plain
// input state the physics reads every fixed step.

export function createInput() {
  return {
    pitchUp: false,
    pitchDown: false,
    bankLeft: false,
    bankRight: false,
    throttleUp: false,
    throttleDown: false,
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    mouseSteer: false,
    clicked: false,
    clickX: 0,
    clickY: 0,
    pausePressed: false,
    startPressed: false,
  };
}

const KEYMAP = {
  ArrowUp: 'pitchUp',
  KeyW: 'throttleUp',
  ArrowDown: 'pitchDown',
  KeyS: 'throttleDown',
  ArrowLeft: 'bankLeft',
  KeyA: 'bankLeft',
  ArrowRight: 'bankRight',
  KeyD: 'bankRight',
};

export function bindInput(input, canvas, onFirstGesture) {
  const gesture = () => {
    if (onFirstGesture) onFirstGesture();
  };
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const field = KEYMAP[event.code];
    if (field) {
      input[field] = true;
      event.preventDefault();
    }
    if (event.code === 'Space') {
      input.startPressed = true;
      event.preventDefault();
    }
    if (event.code === 'KeyP' || event.code === 'Escape') input.pausePressed = true;
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') input.throttleUp = true;
    if (event.code === 'ControlLeft' || event.code === 'ControlRight') input.throttleDown = true;
    gesture();
  });
  window.addEventListener('keyup', (event) => {
    const field = KEYMAP[event.code];
    if (field) input[field] = false;
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') input.throttleUp = false;
    if (event.code === 'ControlLeft' || event.code === 'ControlRight') input.throttleDown = false;
  });
  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
    input.mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;
    if (input.mouseDown) input.mouseSteer = true;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
    input.mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;
    input.mouseDown = true;
    input.clicked = true;
    input.clickX = input.mouseX;
    input.clickY = input.mouseY;
    gesture();
  });
  window.addEventListener('pointerup', () => {
    input.mouseDown = false;
    input.mouseSteer = false;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
}

export function applyMouseSteer(input, plane) {
  if (!input.mouseSteer) return;
  const centerX = 640;
  const centerY = 330;
  const dx = (input.mouseX - centerX) / 640;
  const dy = (input.mouseY - centerY) / 360;
  input.bankLeft = dx < -0.08;
  input.bankRight = dx > 0.08;
  input.pitchUp = dy < -0.08;
  input.pitchDown = dy > 0.08;
}

export function clearTransientInput(input) {
  input.clicked = false;
  input.startPressed = false;
  input.pausePressed = false;
}
