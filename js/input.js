// Keyboard (desktop) + touch (mobile) input, unified into one state object.
// Move = left/right arrow keys or on-screen ◀ ▶ buttons.
// Jump = up/space or the on-screen ▲ button.
// Swing = tapping/clicking anywhere on the game canvas, or Z/X/Enter on desktop.

export const Input = {
  left: false,
  right: false,
  jumpQueued: false, // edge-triggered, consumed by the game loop
  swingQueued: false, // edge-triggered, consumed by the game loop
  pauseQueued: false,
};

function queueJump() {
  Input.jumpQueued = true;
}
function queueSwing() {
  Input.swingQueued = true;
}

export function setupInput({ canvas, leftBtn, rightBtn, jumpBtn, pauseBtn }) {
  const isMoveKey = (code) =>
    ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(code);

  const isTextField = (target) => target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

  window.addEventListener('keydown', (e) => {
    if (isTextField(e.target)) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') Input.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') Input.right = true;
    if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') {
      queueJump();
      e.preventDefault();
    }
    if (e.code === 'KeyZ' || e.code === 'KeyX' || e.code === 'Enter') queueSwing();
    if (e.code === 'Escape' || e.code === 'KeyP') Input.pauseQueued = true;
    if (isMoveKey(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    if (isTextField(e.target)) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') Input.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') Input.right = false;
  });

  // Desktop mouse click on the canvas = swing.
  canvas.addEventListener('mousedown', (e) => {
    if (e.target !== canvas) return;
    queueSwing();
  });

  // Touch: tapping the canvas swings the bat, unless the tap lands on a
  // control button (buttons stop propagation themselves).
  canvas.addEventListener(
    'touchstart',
    (e) => {
      queueSwing();
      e.preventDefault();
    },
    { passive: false }
  );

  function bindHold(el, onDown, onUp) {
    if (!el) return;
    const down = (e) => {
      e.preventDefault();
      e.stopPropagation();
      onDown();
    };
    const up = (e) => {
      e.preventDefault();
      e.stopPropagation();
      onUp();
    };
    el.addEventListener('touchstart', down, { passive: false });
    el.addEventListener('touchend', up, { passive: false });
    el.addEventListener('touchcancel', up, { passive: false });
    el.addEventListener('mousedown', down);
    el.addEventListener('mouseup', up);
    el.addEventListener('mouseleave', up);
  }

  bindHold(
    leftBtn,
    () => (Input.left = true),
    () => (Input.left = false)
  );
  bindHold(
    rightBtn,
    () => (Input.right = true),
    () => (Input.right = false)
  );
  bindHold(
    jumpBtn,
    () => queueJump(),
    () => {}
  );

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => (Input.pauseQueued = true));
    pauseBtn.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        Input.pauseQueued = true;
      },
      { passive: false }
    );
  }
}

export function consumeJump() {
  const v = Input.jumpQueued;
  Input.jumpQueued = false;
  return v;
}
export function consumeSwing() {
  const v = Input.swingQueued;
  Input.swingQueued = false;
  return v;
}
export function consumePause() {
  const v = Input.pauseQueued;
  Input.pauseQueued = false;
  return v;
}
