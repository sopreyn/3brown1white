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
// Buddy the Bat (player) — hand-drawn artwork (assets/player-bat.png),
// supplied by the user, used both as the game's icon and as the actual
// on-screen player character. Its natural pose faces left.
// ---------------------------------------------------------------------------

let playerImage = null;

/** Kick off (or reuse) loading the player sprite. Safe to call repeatedly. */
export function getPlayerImage() {
  if (!playerImage) {
    playerImage = new Image();
    playerImage.src = 'assets/player-bat.png';
  }
  return playerImage;
}

const tintScratch = document.createElement('canvas');

/**
 * Draw the player image centered at (x + w/2, y + h/2), optionally flipped,
 * rotated (radians, around its own center), and tinted (used for the
 * golden-bug invincibility rainbow flash — recolors only the sprite's own
 * opaque pixels, via a small offscreen composite, so it doesn't bleed onto
 * the rest of the scene).
 */
export function drawPlayerImage(ctx, img, x, y, w, h, opts = {}) {
  if (!img.complete || img.naturalWidth === 0) return;
  const { flip = false, rotation = 0, tint = null, tintAlpha = 0.55 } = opts;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (flip) ctx.scale(-1, 1);
  if (rotation) ctx.rotate(rotation);
  if (tint) {
    tintScratch.width = img.naturalWidth;
    tintScratch.height = img.naturalHeight;
    const tctx = tintScratch.getContext('2d');
    tctx.imageSmoothingEnabled = false;
    tctx.clearRect(0, 0, tintScratch.width, tintScratch.height);
    tctx.drawImage(img, 0, 0);
    tctx.globalCompositeOperation = 'source-atop';
    tctx.globalAlpha = tintAlpha;
    tctx.fillStyle = tint;
    tctx.fillRect(0, 0, tintScratch.width, tintScratch.height);
    ctx.drawImage(tintScratch, -w / 2, -h / 2, w, h);
  } else {
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Small enemies + bosses. Bosses reuse the same grid at a larger pixel size
// with recolored eyes, per the "big version of the little guy" design.
// ---------------------------------------------------------------------------

export const BASEBALL_PALETTE = { w: '#f5f5f0', s: '#c8102e', e: '#111111' };
export const BASEBALL_FRAMES = {
  // Red stitch marks ringing the ball like real baseball seams, with an
  // angry eyebrow "face"; the two frames rotate the stitch/eyebrow rows to
  // sell a spinning roll.
  roll1: ['.wwwwww.', 'we.ww.ew', 'wwswwsww', 'swwwwwws', 'swwwwwws', 'wwswwsww', 'wwwwwwww', '.wwwwww.'],
  roll2: ['.wwwwww.', 'wwswwsww', 'we.ww.ew', 'wwwwwwww', 'swwwwwws', 'swwwwwws', 'wwswwsww', '.wwwwww.'],
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
  h: '#141110', // black hair
  f: '#f0be96', // tan skin
  j: '#faf9f6', // white tank top
  b: '#3a64af', // blue shorts
  s: '#d21e23', // red running shoes
};
export const JOGGER_FRAMES = {
  run1: ['..hhhh..', '.hffffh.', '.ffffff.', '.f.ff.f.', '..ffff..', '.jjjjjj.', 'fjjjjjjf', '.jjjjjj.', '..bbbb..', '.bb..bb.', 'f....f..', 's....ss.'],
  run2: ['..hhhh..', '.hffffh.', '.ffffff.', '.f.ff.f.', '..ffff..', '.jjjjjj.', 'jjjjjjjf', '.jjjjjj.', '..bbbb..', '.bb..bb.', '..f....f', '.ss....s'],
};
export const JOGGER_BOSS_OVERRIDE = { f: '#c97a45', h: '#8a1414' };

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
