import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y } from './constants.js';

// ---------------------------------------------------------------------------
// Background painters — simple layered, parallax-scrolling 8-bit scenery.
// Each level gets its own palette per the design brief ("beautiful color
// palette", nostalgic 8-bit). All shapes are drawn procedurally so there are
// no image assets to load.
// ---------------------------------------------------------------------------

function sky(ctx, topColor, bottomColor) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, topColor);
  g.addColorStop(1, bottomColor);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GAME_WIDTH, GROUND_Y);
}

function repeat(ctx, camX, factor, patternW, count, draw) {
  const offset = -((camX * factor) % patternW);
  for (let i = -1; i < count + 1; i++) {
    draw(offset + i * patternW);
  }
}

function ground(ctx, topColor, baseColor) {
  ctx.fillStyle = topColor;
  ctx.fillRect(0, GROUND_Y, GAME_WIDTH, 6);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, GROUND_Y + 6, GAME_WIDTH, GAME_HEIGHT - GROUND_Y - 6);
}

const BG = {
  stadium(ctx, camX, tick) {
    sky(ctx, '#7ec8ff', '#bfe8ff');
    // sun
    ctx.fillStyle = '#fff2a8';
    ctx.beginPath();
    ctx.arc(400, 40, 18, 0, Math.PI * 2);
    ctx.fill();
    // outfield wall
    repeat(ctx, camX, 0.35, 160, 4, (x) => {
      ctx.fillStyle = '#1f5c3a';
      ctx.fillRect(x, 150, 160, 40);
      ctx.fillStyle = '#164a2c';
      ctx.fillRect(x, 150, 160, 4);
    });
    // stands
    repeat(ctx, camX, 0.5, 90, 6, (x) => {
      ctx.fillStyle = '#a83244';
      ctx.fillRect(x, 110, 70, 44);
      ctx.fillStyle = '#c8102e';
      for (let row = 0; row < 5; row++) {
        ctx.fillRect(x + 4, 114 + row * 8, 62, 4);
      }
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(x + 20, 96, 6, 16); // light pole
      ctx.fillRect(x + 12, 90, 22, 6);
    });
    ground(ctx, '#3a7d3f', '#8a5a2b');
    // foul lines dashes
    repeat(ctx, camX, 1, 24, 22, (x) => {
      ctx.fillStyle = '#f5f5f0';
      ctx.fillRect(x, GROUND_Y - 2, 10, 2);
    });
  },

  factory(ctx, camX, tick) {
    sky(ctx, '#3b3350', '#c98a4b');
    repeat(ctx, camX, 0.3, 200, 4, (x) => {
      ctx.fillStyle = '#2a2333';
      ctx.fillRect(x, 90, 120, 100);
      ctx.fillStyle = '#463a55';
      ctx.fillRect(x + 10, 100, 20, 24);
      ctx.fillRect(x + 50, 100, 20, 24);
      ctx.fillRect(x + 90, 100, 16, 24);
      ctx.fillStyle = '#1c1722';
      ctx.fillRect(x + 30, 60, 10, 40); // smokestack
      // puff of smoke, gently drifting
      const puffX = x + 35 + Math.sin(tick * 0.6 + x) * 6;
      ctx.fillStyle = 'rgba(200,200,210,0.5)';
      ctx.beginPath();
      ctx.arc(puffX, 52 - (tick * 6 % 20), 8, 0, Math.PI * 2);
      ctx.fill();
    });
    repeat(ctx, camX, 0.55, 80, 8, (x) => {
      ctx.fillStyle = '#5a4a3a';
      ctx.fillRect(x, 150, 60, 64);
      ctx.fillStyle = '#c98a4b';
      ctx.fillRect(x + 8, 160, 12, 12);
      ctx.fillRect(x + 32, 160, 12, 12);
    });
    ground(ctx, '#5c4632', '#332619');
  },

  bridge(ctx, camX, tick) {
    sky(ctx, '#8fd3ff', '#d8f2ff');
    // distant skyline hint
    repeat(ctx, camX, 0.25, 220, 4, (x) => {
      ctx.fillStyle = 'rgba(90,110,140,0.55)';
      ctx.fillRect(x, 120, 30, 60);
      ctx.fillRect(x + 40, 100, 24, 80);
      ctx.fillRect(x + 76, 130, 28, 50);
    });
    // river band
    ctx.fillStyle = '#3f7fb0';
    ctx.fillRect(0, 178, GAME_WIDTH, GROUND_Y - 178);
    repeat(ctx, camX, 0.9, 30, 18, (x) => {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x, 188 + Math.sin(tick * 2 + x) * 2, 14, 2);
    });
    // truss arches overhead
    repeat(ctx, camX, 0.7, 120, 5, (x) => {
      ctx.strokeStyle = '#7a3b2b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y - 10);
      ctx.quadraticCurveTo(x + 60, 40, x + 120, GROUND_Y - 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 20, GROUND_Y - 10);
      ctx.lineTo(x + 60, 90);
      ctx.lineTo(x + 100, GROUND_Y - 10);
      ctx.stroke();
    });
    ground(ctx, '#8a8f94', '#54585c');
  },

  downtown(ctx, camX, tick) {
    sky(ctx, '#402a5c', '#e8895f');
    repeat(ctx, camX, 0.2, 140, 5, (x) => {
      ctx.fillStyle = '#241a33';
      ctx.fillRect(x, 60, 70, 154);
      ctx.fillStyle = '#ffd76a';
      for (let r = 0; r < 8; r++)
        for (let c = 0; c < 3; c++) {
          if ((r + c) % 3 !== 0) ctx.fillRect(x + 8 + c * 20, 68 + r * 16, 8, 8);
        }
    });
    repeat(ctx, camX, 0.45, 100, 6, (x) => {
      ctx.fillStyle = '#33234a';
      ctx.fillRect(x, 100, 50, 114);
      ctx.fillStyle = '#ffb366';
      for (let r = 0; r < 6; r++) ctx.fillRect(x + 8, 108 + r * 16, 34, 6);
    });
    ground(ctx, '#4a4a52', '#2c2c32');
    repeat(ctx, camX, 1, 40, 14, (x) => {
      ctx.fillStyle = '#6a6a72';
      ctx.fillRect(x, GROUND_Y + 2, 24, 3);
    });
  },

  redsStadium(ctx, camX, tick) {
    sky(ctx, '#16213a', '#5a3a63');
    repeat(ctx, camX, 0.4, 100, 6, (x) => {
      ctx.fillStyle = '#c8102e';
      ctx.fillRect(x, 100, 80, 60);
      ctx.fillStyle = '#8b0c20';
      for (let row = 0; row < 6; row++) ctx.fillRect(x + 4, 104 + row * 9, 72, 5);
      // light towers
      ctx.fillStyle = '#d8d8d8';
      ctx.fillRect(x + 30, 60, 6, 40);
      ctx.fillStyle = 'rgba(255,255,200,0.35)';
      ctx.beginPath();
      ctx.arc(x + 33, 56, 20, 0, Math.PI * 2);
      ctx.fill();
    });
    ground(ctx, '#6b4a2b', '#8a5a2b');
    repeat(ctx, camX, 1, 24, 22, (x) => {
      ctx.fillStyle = '#f5f5f0';
      ctx.fillRect(x, GROUND_Y - 2, 10, 2);
    });
  },

  ending(ctx, camX, tick) {
    const g = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    g.addColorStop(0, '#3a2a63');
    g.addColorStop(0.5, '#e8895f');
    g.addColorStop(1, '#ffd76a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = '#fff2c4';
    ctx.beginPath();
    ctx.arc(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, 46, 0, Math.PI * 2);
    ctx.fill();
  },
};

export function drawBackground(ctx, level, camX, tick) {
  BG[level.bg](ctx, camX, tick);
}
export function drawEndingBackground(ctx, tick) {
  BG.ending(ctx, 0, tick);
}

// ---------------------------------------------------------------------------
// Level data
// ---------------------------------------------------------------------------

function spread(count, startX, endX) {
  const arr = [];
  const step = (endX - startX) / (count + 1);
  for (let i = 1; i <= count; i++) arr.push(startX + step * i);
  return arr;
}

function buildLevel(cfg) {
  const bossArenaStart = cfg.width - 480;
  const enemySpawns = spread(cfg.enemyCount, 260, bossArenaStart - 60).map((x, i) => ({
    type: cfg.enemyType,
    x,
    id: i,
  }));
  const bugSpawns = spread(cfg.bugCount, 200, bossArenaStart - 100).map((x) => ({
    kind: 'bug',
    x,
    y: GROUND_Y - 60,
  }));
  const goldBugSpawns = spread(cfg.goldBugCount, 400, bossArenaStart - 200).map((x) => ({
    kind: 'goldbug',
    x,
    y: GROUND_Y - 80,
  }));
  const pickupSpawns = [...bugSpawns, ...goldBugSpawns];
  if (cfg.endPowerup) {
    pickupSpawns.push({ kind: 'bat', x: bossArenaStart + 60, y: GROUND_Y - 50 });
  }

  return {
    id: cfg.id,
    name: cfg.name,
    bg: cfg.bg,
    width: cfg.width,
    maxHp: cfg.maxHp,
    platforms: cfg.platforms,
    enemySpawns,
    pickupSpawns,
    bossKey: cfg.bossKey,
    bossX: cfg.width - 220,
    arena: { minX: bossArenaStart, maxX: cfg.width - 20 },
    endPowerup: !!cfg.endPowerup,
  };
}

export const LEVELS = [
  buildLevel({
    id: 1,
    name: 'Louisville Slugger Stadium',
    bg: 'stadium',
    width: 2600,
    maxHp: 5,
    enemyType: 'baseball',
    enemyCount: 6,
    bugCount: 4,
    goldBugCount: 1,
    bossKey: 'baseball_boss',
    platforms: [
      { x: 520, y: GROUND_Y - 40, w: 70 },
      { x: 1200, y: GROUND_Y - 50, w: 70 },
      { x: 1850, y: GROUND_Y - 40, w: 70 },
    ],
  }),
  buildLevel({
    id: 2,
    name: 'Louisville Slugger Factory',
    bg: 'factory',
    width: 3100,
    maxHp: 6,
    enemyType: 'worker',
    enemyCount: 7,
    bugCount: 4,
    goldBugCount: 1,
    bossKey: 'worker_boss',
    endPowerup: true,
    platforms: [
      { x: 460, y: GROUND_Y - 40, w: 80 },
      { x: 1000, y: GROUND_Y - 60, w: 60 },
      { x: 1600, y: GROUND_Y - 40, w: 80 },
      { x: 2200, y: GROUND_Y - 50, w: 70 },
    ],
  }),
  buildLevel({
    id: 3,
    name: 'Big Four Walking Bridge',
    bg: 'bridge',
    width: 3600,
    maxHp: 7,
    enemyType: 'jogger',
    enemyCount: 8,
    bugCount: 5,
    goldBugCount: 2,
    bossKey: 'jogger_boss',
    platforms: [
      { x: 500, y: GROUND_Y - 40, w: 70 },
      { x: 1100, y: GROUND_Y - 40, w: 70 },
      { x: 1700, y: GROUND_Y - 50, w: 70 },
      { x: 2300, y: GROUND_Y - 40, w: 70 },
      { x: 2900, y: GROUND_Y - 50, w: 70 },
    ],
  }),
  buildLevel({
    id: 4,
    name: 'Downtown Louisville',
    bg: 'downtown',
    width: 4100,
    maxHp: 8,
    enemyType: 'suit',
    enemyCount: 9,
    bugCount: 5,
    goldBugCount: 2,
    bossKey: 'suit_boss',
    platforms: [
      { x: 480, y: GROUND_Y - 40, w: 80 },
      { x: 1050, y: GROUND_Y - 50, w: 60 },
      { x: 1650, y: GROUND_Y - 40, w: 80 },
      { x: 2250, y: GROUND_Y - 50, w: 70 },
      { x: 2900, y: GROUND_Y - 40, w: 80 },
      { x: 3450, y: GROUND_Y - 50, w: 70 },
    ],
  }),
  buildLevel({
    id: 5,
    name: 'Away Game: Cincinnati',
    bg: 'redsStadium',
    width: 4700,
    maxHp: 9,
    enemyType: 'redsplayer',
    enemyCount: 10,
    bugCount: 6,
    goldBugCount: 2,
    bossKey: 'mascot_boss',
    platforms: [
      { x: 500, y: GROUND_Y - 40, w: 80 },
      { x: 1100, y: GROUND_Y - 50, w: 60 },
      { x: 1700, y: GROUND_Y - 40, w: 80 },
      { x: 2300, y: GROUND_Y - 50, w: 70 },
      { x: 2900, y: GROUND_Y - 40, w: 80 },
      { x: 3500, y: GROUND_Y - 50, w: 70 },
      { x: 4050, y: GROUND_Y - 40, w: 80 },
    ],
  }),
];
