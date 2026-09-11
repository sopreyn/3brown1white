// Tiny synthesized 8-bit style sound effects — no audio files required, so
// there's nothing extra to host or load on a slow mobile connection.

let ctx = null;
let muted = false;

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  return ctx;
}

export function resumeAudio() {
  const c = getCtx();
  if (c && c.state === 'suspended') c.resume();
}

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function beep({ freq = 440, duration = 0.1, type = 'square', gain = 0.12, slide = 0, delay = 0 }) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, t0 + duration);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export const sfx = {
  jump: () => beep({ freq: 380, duration: 0.14, type: 'square', slide: 220 }),
  swing: () => beep({ freq: 180, duration: 0.09, type: 'triangle', slide: -60 }),
  hitEnemy: () => beep({ freq: 520, duration: 0.08, type: 'square', slide: -200 }),
  hurt: () => beep({ freq: 140, duration: 0.25, type: 'sawtooth', slide: -80 }),
  pickupBug: () => beep({ freq: 660, duration: 0.09, type: 'square', slide: 260 }),
  goldenBug: () => {
    beep({ freq: 520, duration: 0.09, type: 'square', slide: 200 });
    beep({ freq: 780, duration: 0.12, type: 'square', slide: 260, delay: 0.08 });
  },
  powerup: () => {
    beep({ freq: 440, duration: 0.1, type: 'square', delay: 0 });
    beep({ freq: 660, duration: 0.1, type: 'square', delay: 0.09 });
    beep({ freq: 880, duration: 0.16, type: 'square', delay: 0.18 });
  },
  enemyDefeat: () => beep({ freq: 300, duration: 0.14, type: 'square', slide: -150 }),
  bossHit: () => beep({ freq: 200, duration: 0.12, type: 'sawtooth', slide: -100 }),
  bossDefeat: () => {
    [0, 0.1, 0.2, 0.32].forEach((d, i) =>
      beep({ freq: 260 + i * 120, duration: 0.18, type: 'square', delay: d })
    );
  },
  levelComplete: () => {
    [523, 659, 784, 1047].forEach((f, i) =>
      beep({ freq: f, duration: 0.16, type: 'square', delay: i * 0.12 })
    );
  },
  gameOver: () => {
    [400, 340, 280, 200].forEach((f, i) =>
      beep({ freq: f, duration: 0.22, type: 'sawtooth', delay: i * 0.16 })
    );
  },
  win: () => {
    [523, 587, 659, 784, 880, 1047].forEach((f, i) =>
      beep({ freq: f, duration: 0.2, type: 'square', delay: i * 0.14 })
    );
  },
  uiSelect: () => beep({ freq: 500, duration: 0.06, type: 'square' }),
};
