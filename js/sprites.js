// ---------------------------------------------------------------------------
// Original 8-bit style pixel art, authored as ASCII grids (one character per
// "art pixel"). Nothing here is traced or copied from any real logo or
// artwork — it's original fan art built only from the Louisville Bats'
// public color scheme (red / black / white). Swap palettes freely.
// ---------------------------------------------------------------------------

import { PIXEL } from './constants.js';

const cache = new Map();

/** Render an ASCII grid + palette to an offscreen canvas once, then reuse it. */
export function getSpriteCanvas(key, grid, palette, pixelSize = PIXEL, overrides = null) {
  const cacheKey = key + (overrides ? ':' + JSON.stringify(overrides) : '') + ':' + pixelSize;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const rows = grid.length;
  const cols = grid[0].length;
  const off = document.createElement('canvas');
  off.width = cols * pixelSize;
  off.height = rows * pixelSize;
  const octx = off.getContext('2d');
  octx.imageSmoothingEnabled = false;
  for (let ry = 0; ry < rows; ry++) {
    const row = grid[ry];
    for (let cx = 0; cx < cols; cx++) {
      const ch = row[cx];
      if (ch === '.' || ch === undefined) continue;
      const color = (overrides && overrides[ch]) || palette[ch];
      if (!color) continue;
      octx.fillStyle = color;
      octx.fillRect(cx * pixelSize, ry * pixelSize, pixelSize, pixelSize);
    }
  }
  cache.set(cacheKey, off);
  return off;
}

/** Draw a cached sprite canvas at world (x,y), optionally flipped, optionally scaled. */
export function drawSprite(ctx, key, grid, palette, x, y, opts = {}) {
  const { pixelSize = PIXEL, flip = false, overrides = null, scale = 1, alpha = 1 } = opts;
  const canvas = getSpriteCanvas(key, grid, palette, pixelSize, overrides);
  const w = canvas.width * scale;
  const h = canvas.height * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (flip) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(canvas, 0, 0, w, h);
  } else {
    ctx.drawImage(canvas, x, y, w, h);
  }
  ctx.restore();
}

export function spriteSize(grid, pixelSize = PIXEL, scale = 1) {
  return { w: grid[0].length * pixelSize * scale, h: grid.length * pixelSize * scale };
}

// ---------------------------------------------------------------------------
// Buddy the Bat (player) — original mascot: a small winged bat in a red &
// white Louisville Bats jersey, swinging a baseball bat.
// ---------------------------------------------------------------------------

export const PLAYER_PALETTE = {
  e: '#161616', // ear/wing black
  p: '#5b3aa0', // fur purple
  l: '#7c5cc4', // fur highlight
  r: '#c8102e', // cap red
  c: '#f5f5f0', // cap logo / trim white
  w: '#ffffff', // eye white
  b: '#111111', // eye pupil
  j: '#f5f5f0', // jersey white
  k: '#c8102e', // jersey trim red
  g: '#2b2b33', // pants
  h: '#111111', // shoes
};

export const PLAYER_FRAMES = {
  idle: [
    '.e....e.',
    'ee....ee',
    '.rrrrrr.',
    '.rcrrcr.',
    '.pppppp.',
    '.pwbwbp.',
    '.pllllp.',
    '..jjjj..',
    '.jjjjjj.',
    '.jkjjkj.',
    '..g..g..',
    '..h..h..',
  ],
  walk1: [
    '.e....e.',
    'ee....ee',
    '.rrrrrr.',
    '.rcrrcr.',
    '.pppppp.',
    '.pwbwbp.',
    '.pllllp.',
    '..jjjj..',
    '.jjjjjj.',
    '.jkjjkj.',
    '.g....g.',
    'h......h',
  ],
  walk2: [
    '.e....e.',
    'ee....ee',
    '.rrrrrr.',
    '.rcrrcr.',
    '.pppppp.',
    '.pwbwbp.',
    '.pllllp.',
    '..jjjj..',
    '.jjjjjj.',
    '.jkjjkj.',
    '..gg....',
    '..hh....',
  ],
  jump: [
    '.e....e.',
    'ee....ee',
    '.rrrrrr.',
    '.rcrrcr.',
    '.pppppp.',
    '.pwbwbp.',
    '.pllllp.',
    '..jjjj..',
    '.jjjjjj.',
    '.jkjjkj.',
    '.g....g.',
    '........',
  ],
  hurt: [
    '.e....e.',
    'ee....ee',
    '.rrrrrr.',
    '.rcrrcr.',
    '.pppppp.',
    '.pbwwbp.',
    '.pllllp.',
    '..jjjj..',
    '.jjjjjj.',
    '.jkjjkj.',
    '.g....g.',
    '.h....h.',
  ],
};

export const BAT_PALETTE = { t: '#c9a066', d: '#7a4c22' };
export const BAT_GRID = ['.t', '.t', '.t', '.t', '.T', '.T', 'TT', 'TT'].map((r) =>
  r.replace(/T/g, 'd')
);

// ---------------------------------------------------------------------------
// Small enemies + bosses. Bosses reuse the same grid at a larger pixel size
// with recolored eyes, per the "big version of the little guy" design.
// ---------------------------------------------------------------------------

export const BASEBALL_PALETTE = { w: '#f5f5f0', s: '#c8102e', e: '#111111', o: '#8b1023' };
export const BASEBALL_FRAMES = {
  roll1: ['.wwwwww.', 'wwwwwwww', 'we.ww.ew', 'wwwwwwww', 'wswwwwsw', 'wwwwwwww', 'wwssssww', '.wwwwww.'],
  roll2: ['.wwwwww.', 'wwewweww', 'wwwwwwww', 'wswwwwsw', 'wwwwwwww', 'wwssssww', 'wwwwwwww', '.wwwwww.'],
};
export const BASEBALL_BOSS_OVERRIDE = { e: '#ffdd00', s: '#8b1023' };

export const WORKER_PALETTE = {
  h: '#f2c14e', f: '#e8b686', b: '#3b6ea5', d: '#274a73', g: '#26374a', s: '#111111', t: '#9aa0a6',
};
export const WORKER_FRAMES = {
  walk1: ['..hhhh..', '.hhhhhh.', '.ffffff.', '.f.ff.f.', '..ffff..', '.bbbbbb.', 'tbbbbbb.', '.bbbbbb.', '.bdddb..', '..gggg..', '.g....g.', 's......s'],
  walk2: ['..hhhh..', '.hhhhhh.', '.ffffff.', '.f.ff.f.', '..ffff..', '.bbbbbb.', 'tbbbbbb.', '.bbbbbb.', '.bdddb..', '..gggg..', 'g....g..', '.s....s.'],
};
export const WORKER_BOSS_OVERRIDE = { f: '#d99a66', h: '#ff3b3b' };

export const JOGGER_PALETTE = {
  h: '#ff7a00', f: '#e8b686', j: '#1f8a70', d: '#12604d', l: '#dfe3e6', s: '#ffffff',
};
export const JOGGER_FRAMES = {
  run1: ['..hhhh..', '.hffffh.', '.ffffff.', '.f.ff.f.', '..ffff..', '.jjjjjj.', 'jjjjjjjj', '.jjdjjj.', '.ll..ll.', 'l......l', 's......s', '........'],
  run2: ['..hhhh..', '.hffffh.', '.ffffff.', '.f.ff.f.', '..ffff..', '.jjjjjj.', 'jjjjjjjj', '.jjdjjj.', '..ll.ll.', '.l....l.', '.s....s.', '........'],
};
export const JOGGER_BOSS_OVERRIDE = { f: '#c97a45', h: '#ff1a1a' };

export const SUIT_PALETTE = {
  h: '#2b2320', f: '#e8b686', s: '#26324a', t: '#c8102e', g: '#1a2436', b: '#5b3a1e', o: '#111111',
};
export const SUIT_FRAMES = {
  walk1: ['..hhhh..', '.hffffh.', '.ffffff.', '.f.ff.f.', '..fftf..', '.ssssss.', 'ssssssss', '.sstsss.', '..gggg..', '.g....g.', 'o......o', 'bbb.....'],
  walk2: ['..hhhh..', '.hffffh.', '.ffffff.', '.f.ff.f.', '..fftf..', '.ssssss.', 'ssssssss', '.sstsss.', '..gggg..', 'g....g..', '.o....o.', '.....bbb'],
};
export const SUIT_BOSS_OVERRIDE = { f: '#d99a66', t: '#ffdd00' };

export const REDS_PALETTE = {
  c: '#c8102e', f: '#e8b686', u: '#ffffff', p: '#c8102e', k: '#c8102e', s: '#111111',
};
export const REDS_FRAMES = {
  walk1: ['..cccc..', '.cffffc.', '.ffffff.', '.f.ff.f.', '..uuuu..', '.uuuuuu.', 'uuuupuuu', '.uuuuuu.', '..pppp..', '.p....p.', 'k......k', 's......s'],
  walk2: ['..cccc..', '.cffffc.', '.ffffff.', '.f.ff.f.', '..uuuu..', '.uuuuuu.', 'uuuupuuu', '.uuuuuu.', '..pppp..', 'p....p..', '.k....k.', '.s....s.'],
};

// Original mascot for the away game — NOT the real Reds mascot, a fictional
// big fuzzy red "Rowdy" mascot invented for this game.
export const MASCOT_PALETTE = {
  f: '#d61f36', h: '#8f1122', w: '#ffffff', b: '#111111', y: '#ffdd00',
};
export const MASCOT_FRAMES = {
  walk1: [
    '..ffffff..',
    '.ffffffff.',
    'ffwbffwbff',
    'ffffffffff',
    'ff.hhhh.ff',
    '.ffffffff.',
    '..ffyyff..',
    '.ffffffff.',
    'ffffffffff',
    '.ff....ff.',
    '.ff....ff.',
    '.bb....bb.',
  ],
  walk2: [
    '..ffffff..',
    '.ffffffff.',
    'ffwbffwbff',
    'ffffffffff',
    'ff.hhhh.ff',
    '.ffffffff.',
    '..ffyyff..',
    '.ffffffff.',
    'ffffffffff',
    '.ff.ff.ff.',
    '.bb.ff.bb.',
    '........',
  ],
};

// ---------------------------------------------------------------------------
// Pickups
// ---------------------------------------------------------------------------

export const BUG_PALETTE = { r: '#8b3a2b', k: '#161616', w: '#ffffff' };
export const BUG_FRAME = ['.kkkk.', 'krrrrk', 'krkrkk', 'rrrrrr', 'krkrkk', '.kkkk.'];

export const GOLD_BUG_PALETTE = { r: '#ffcc00', k: '#7a5200', w: '#ffffff' };

export const POWERUP_BAT_PALETTE = { t: '#ffe08a', d: '#c9861a', g: '#ffffff' };
export const POWERUP_BAT_GRID = ['.gt', '.gt', '.gt', '.gd', '.gd', 'gdd', 'gdd', 'gdd'].map((r) =>
  r
);

export const HEART_PALETTE = { r: '#c8102e', k: '#5c0812' };
export const HEART_FULL = ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'];
export const HEART_EMPTY = ['.kk.kk.', 'kkkkkkk', 'kkkkkkk', '.kkkkk.', '..kkk..', '...k...'];

export const BRIEFCASE_PALETTE = { b: '#5b3a1e', h: '#c9a066' };
export const BRIEFCASE_GRID = ['.hhhh.', 'bbbbbb', 'bbbbbb', 'bbbbbb'];

export const WRENCH_PALETTE = { g: '#c7ccd1', d: '#6d7378' };
export const WRENCH_GRID = ['g..g', 'gg.g', '.gg.', 'g.gg', 'g..g'];
