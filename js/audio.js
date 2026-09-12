// Tiny synthesized 8-bit style sound effects (no audio files needed for
// these) plus the game's one real audio asset: a looping theme song.

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

// Per-level background music. Levels without a dedicated track yet
// (5 and 6) fall back to the main theme.
const MUSIC_TRACKS = {
  theme: 'assets/music/theme.mp3',
  1: 'assets/music/baby-with-a-rat-tail.mp3',
  2: 'assets/music/violet-interiors.mp3',
  3: 'assets/music/in-a-shed.mp3',
  4: 'assets/music/the-beef-boy.mp3',
  ending: 'assets/music/ending.mp3',
};

let music = null;
let currentTrack = null;
function getMusic() {
  if (!music) {
    music = new Audio();
    music.loop = true;
    music.volume = 0.5;
    music.preload = 'auto';
  }
  return music;
}

function playTrack(key) {
  const src = MUSIC_TRACKS[key] || MUSIC_TRACKS.theme;
  const m = getMusic();
  if (currentTrack !== key) {
    currentTrack = key;
    m.src = src;
  }
  if (!muted) m.play().catch(() => {});
}

/** Start the title theme looping. Call this from a user-gesture handler —
 * browsers block audio playback before the first tap/click. */
export function startMusic() {
  playTrack('theme');
}

/** Switch background music to the track for the given level id (falls
 * back to the main theme if that level has no dedicated track yet). */
export function playLevelMusic(levelId) {
  playTrack(MUSIC_TRACKS[levelId] ? levelId : 'theme');
}

/** Switch to the ending/credits song for the win cutscene. */
export function playEndingMusic() {
  playTrack('ending');
}

export function setMuted(value) {
  muted = value;
  if (music) {
    if (muted) music.pause();
    else music.play().catch(() => {});
  }
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
