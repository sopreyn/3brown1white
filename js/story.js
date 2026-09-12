// ---------------------------------------------------------------------------
// The game's narrative layer: click-through cutscene "beats" shown between
// levels (and title cards shown right before a level begins), all drawn as
// pixel/8-bit art on the same canvas the game itself uses — no DOM, no image
// assets. A beat is either:
//   { title: 'DEFEAT THE LOWLY X' }                      — a full-screen title card
//   { scene: 'cave', speaker: 'BUDDY', text: '...' }      — an art scene + dialogue box
// Playback (advancing on tap, calling back into game.js when a sequence
// finishes) lives in game.js; this file only knows how to draw one beat.
// ---------------------------------------------------------------------------

import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y } from './constants.js';
import { LEVELS, drawBackground } from './levels.js';
import { computeLighting } from './lighting.js';
import * as S from './sprites.js';

const STADIUM_LIGHTING = computeLighting('cycle', 1);

// ---------------------------------------------------------------------------
// A generic little pixel-art ballplayer, used for the "team photo" scenes.
// Not any real player — just a uniformed silhouette in Bats colors, with a
// couple of recolorable bits (cap/jersey) so a row of them reads as a team.
// ---------------------------------------------------------------------------
const TEAM_PLAYER_GRID = [
  '..hhhh..',
  '.hhhhhh.',
  '.ffffff.',
  '.f.ff.f.',
  '..ffff..',
  '.jjjjjj.',
  'jjjjjjjj',
  '.jjjjjj.',
  '..pppp..',
  '.p....p.',
  's......s',
];
const TEAM_PLAYER_PALETTE = { h: '#c8102e', f: '#e8b686', j: '#f5f5f0', p: '#d8d8d0', s: '#111111' };

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// ---------------------------------------------------------------------------
// Scenes
// ---------------------------------------------------------------------------

const CAVE_CRYSTALS = Array.from({ length: 14 }, (_, i) => ({
  x: 20 + ((i * 37) % (GAME_WIDTH - 40)),
  y: 30 + ((i * 53) % 130),
  hue: [190, 280, 320, 45][i % 4],
  phase: i * 1.3,
}));

function scCave(ctx, tick) {
  const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  grad.addColorStop(0, '#0d0a1a');
  grad.addColorStop(1, '#1c1430');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Jagged rock silhouette framing top and bottom
  ctx.fillStyle = '#08060f';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let x = 0; x <= GAME_WIDTH; x += 40) ctx.lineTo(x, 8 + Math.sin(x * 0.05) * 10 + (x % 80 === 0 ? 14 : 0));
  ctx.lineTo(GAME_WIDTH, 0);
  ctx.closePath();
  ctx.fill();

  // Glistening crystals embedded in the walls
  for (const c of CAVE_CRYSTALS) {
    const twinkle = 0.4 + 0.6 * Math.max(0, Math.sin(tick * 2.4 + c.phase));
    ctx.save();
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = `hsl(${c.hue}, 85%, 70%)`;
    ctx.translate(c.x, c.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();
  }

  ctx.fillStyle = '#241a38';
  ctx.fillRect(0, GROUND_Y + 10, GAME_WIDTH, GAME_HEIGHT - GROUND_Y - 10);

  // Buddy, asleep on the cave floor
  const cx = GAME_WIDTH / 2;
  const bob = Math.sin(tick * 2) * 1.5;
  S.drawPlayerImage(ctx, S.getPlayerImage(), cx - 30, GROUND_Y - 4 + bob, 40, 34, { rotation: Math.PI / 2 });

  ctx.save();
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = '#c9c0e8';
  ctx.textAlign = 'left';
  for (let i = 0; i < 3; i++) {
    const t = (tick * 0.9 + i * 0.6) % 3;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t / 3);
    ctx.fillText('Z', cx + 14 + i * 8, GROUND_Y - 24 - t * 16);
    ctx.restore();
  }
  ctx.restore();
}

function scStadiumInvaded(ctx, tick) {
  drawBackground(ctx, LEVELS[0], 0, tick, STADIUM_LIGHTING);

  // A handful of angry baseballs that have taken over the field
  const spots = [90, 170, 250, 330, 400];
  for (let i = 0; i < spots.length; i++) {
    const frame = Math.sin(tick * 6 + i) > 0 ? S.BASEBALL_FRAMES.roll1 : S.BASEBALL_FRAMES.roll2;
    const bounce = Math.abs(Math.sin(tick * 5 + i * 1.4)) * 6;
    S.drawSprite(ctx, 'storyball' + i, frame, S.BASEBALL_PALETTE, spots[i] - 10, GROUND_Y - 20 - bounce, {
      scale: 1.3,
    });
  }

  // Buddy, alarmed, off to the side
  S.drawPlayerImage(ctx, S.getPlayerImage(), 20, GROUND_Y - 32, 30, 27, { flip: false });
  ctx.save();
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText('?!', 50, GROUND_Y - 34 + Math.sin(tick * 8) * 2);
  ctx.restore();
}

function scTeamPhoto(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  grad.addColorStop(0, '#1a5432');
  grad.addColorStop(1, '#2e7a44');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = '#8a5a34';
  ctx.beginPath();
  ctx.ellipse(GAME_WIDTH / 2, GAME_HEIGHT - 30, 170, 40, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#111';
  ctx.fillText('LOUISVILLE BATS', GAME_WIDTH / 2 + 1, 40 + 1);
  ctx.fillStyle = '#f5f5f0';
  ctx.fillText('LOUISVILLE BATS', GAME_WIDTH / 2, 40);
  ctx.restore();

  const count = 5;
  const spacing = 70;
  const startX = GAME_WIDTH / 2 - ((count - 1) * spacing) / 2;
  for (let i = 0; i < count; i++) {
    const capNavy = i % 2 === 0;
    const overrides = capNavy ? { h: '#1a2f5c' } : null;
    S.drawSprite(ctx, 'teamplayer' + i, TEAM_PLAYER_GRID, TEAM_PLAYER_PALETTE, startX + i * spacing - 18, 130, {
      pixelSize: 4,
      overrides,
    });
  }
}

function scCopScene(ctx, tick) {
  const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  grad.addColorStop(0, '#0a0a14');
  grad.addColorStop(1, '#20202c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.fillStyle = '#141418';
  ctx.fillRect(0, 165, GAME_WIDTH, GAME_HEIGHT - 165);

  const carX = GAME_WIDTH / 2 - 60;
  const carY = 90;
  ctx.fillStyle = '#1c1c22';
  ctx.fillRect(carX, carY + 14, 120, 26);
  ctx.fillStyle = '#26262e';
  ctx.fillRect(carX + 20, carY, 80, 18);
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(carX + 26, carY + 40, 8, 0, Math.PI * 2);
  ctx.arc(carX + 94, carY + 40, 8, 0, Math.PI * 2);
  ctx.fill();

  const flashOn = Math.sin(tick * 14) > 0;
  ctx.fillStyle = flashOn ? '#ff2a2a' : '#2a3aff';
  ctx.fillRect(carX + 40, carY - 8, 18, 8);
  ctx.fillStyle = flashOn ? '#2a3aff' : '#ff2a2a';
  ctx.fillRect(carX + 62, carY - 8, 18, 8);
  if (Math.abs(Math.sin(tick * 14)) > 0.85) {
    const glow = ctx.createRadialGradient(carX + 60, carY - 6, 2, carX + 60, carY - 6, 60);
    glow.addColorStop(0, flashOn ? 'rgba(255,40,40,0.35)' : 'rgba(40,60,255,0.35)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(carX + 60, carY - 6, 60, 0, Math.PI * 2);
    ctx.fill();
  }
}

function scBuddyPortrait(ctx, tick, opts = {}) {
  const grad = ctx.createRadialGradient(
    GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, 10,
    GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, 200
  );
  grad.addColorStop(0, '#4a1522');
  grad.addColorStop(1, '#150810');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  const bob = Math.sin(tick * 2.2) * 2;
  const w = 76, h = 66;
  S.drawPlayerImage(ctx, S.getPlayerImage(), GAME_WIDTH / 2 - w / 2, GAME_HEIGHT / 2 - h / 2 - 16 + bob, w, h, {});

  if (opts.sweat) {
    const dropY = GAME_HEIGHT / 2 - 44 + Math.sin(tick * 5) * 2 + (Math.sin(tick * 1.5) * 0.5 + 0.5) * 6;
    ctx.save();
    ctx.fillStyle = '#7ec8ff';
    for (const dx of [26, 34]) {
      ctx.beginPath();
      ctx.ellipse(GAME_WIDTH / 2 + dx, dropY + (dx === 34 ? 4 : 0), 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

const SCENES = {
  cave: scCave,
  stadiumInvaded: scStadiumInvaded,
  teamPhoto: scTeamPhoto,
  copScene: scCopScene,
  buddyPortrait: scBuddyPortrait,
};

// ---------------------------------------------------------------------------
// Title cards + dialogue box chrome
// ---------------------------------------------------------------------------

function drawTitleCard(ctx, text, tick) {
  const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  grad.addColorStop(0, '#1a0508');
  grad.addColorStop(0.5, '#3a0a12');
  grad.addColorStop(1, '#1a0508');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.save();
  ctx.strokeStyle = 'rgba(245,245,240,0.25)';
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, GAME_WIDTH - 28, GAME_HEIGHT - 28);
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 18px monospace';
  const maxWidth = GAME_WIDTH - 60;
  const lines = wrapText(ctx, text, maxWidth);
  const lineH = 24;
  const startY = GAME_HEIGHT / 2 - ((lines.length - 1) * lineH) / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillStyle = '#000';
    ctx.fillText(lines[i], GAME_WIDTH / 2 + 2, startY + i * lineH + 2);
    ctx.fillStyle = '#f5f5f0';
    ctx.fillText(lines[i], GAME_WIDTH / 2, startY + i * lineH);
  }
  ctx.restore();

  drawTapPrompt(ctx, tick);
}

function drawDialogueBox(ctx, speaker, text, tick) {
  const boxH = speaker ? 64 : 52;
  const boxY = GAME_HEIGHT - boxH - 10;
  ctx.save();
  ctx.fillStyle = 'rgba(8, 6, 12, 0.88)';
  ctx.fillRect(10, boxY, GAME_WIDTH - 20, boxH);
  ctx.strokeStyle = '#f5f5f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, boxY, GAME_WIDTH - 20, boxH);

  let textTop = boxY + 10;
  if (speaker) {
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#c8102e';
    ctx.textAlign = 'left';
    ctx.fillText(speaker, 20, boxY + 16);
    textTop = boxY + 28;
  }

  ctx.font = '9px monospace';
  ctx.fillStyle = '#f5f5f0';
  ctx.textAlign = 'left';
  const lines = wrapText(ctx, text, GAME_WIDTH - 44);
  for (let i = 0; i < Math.min(lines.length, 3); i++) {
    ctx.fillText(lines[i], 20, textTop + i * 13);
  }
  ctx.restore();

  drawTapPrompt(ctx, tick, boxY - 2);
}

function drawTapPrompt(ctx, tick, aboveY) {
  if (Math.sin(tick * 5) < 0) return;
  ctx.save();
  ctx.font = '8px monospace';
  ctx.fillStyle = '#ffd76a';
  ctx.textAlign = 'right';
  const y = aboveY !== undefined ? aboveY : GAME_HEIGHT - 16;
  ctx.fillText('TAP TO CONTINUE ▶', GAME_WIDTH - 16, y);
  ctx.restore();
}

/** Draw one story beat (title card or scene+dialogue). */
export function renderStoryBeat(ctx, beat, tick) {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  if (beat.title) {
    drawTitleCard(ctx, beat.title, tick);
    return;
  }
  const sceneFn = SCENES[beat.scene];
  if (sceneFn) sceneFn(ctx, tick, beat.sceneOpts || {});
  drawDialogueBox(ctx, beat.speaker, beat.text, tick);
}

/** Draw a boss's pre-fight taunt over the (frozen) gameplay scene beneath it. */
export function renderBossTaunt(ctx, taunt, tick) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.restore();
  drawDialogueBox(ctx, taunt.name.toUpperCase(), taunt.text, tick);
}

// ---------------------------------------------------------------------------
// Narrative content
// ---------------------------------------------------------------------------

export const STORY_INTRO = [
  { scene: 'cave', text: 'Deep in a glistening cave, Buddy the Bat blinks awake for another day...' },
  { scene: 'stadiumInvaded', text: "...and heads to work at Louisville Slugger Field, only to find EVIL BASEBALLS have taken over the field!" },
];

export const STORY_BEFORE = {
  0: [{ title: 'DEFEAT THE EVIL BASEBALLS' }],
  1: [{ title: 'DEFEAT THE LOWLY EMPLOYEES' }],
  2: [{ title: "ESCAPE TO INDIANA AND DEFEAT THE LOWLY JOGGERS" }],
  3: [{ title: 'DEFEAT THE LOWLY BUSINESSMEN' }],
  4: [{ title: 'DEFEAT THE LOWLY PIGS.' }],
  5: [{ title: 'DEFEAT THE COLUMBUS CLIPPERS' }],
};

export const STORY_AFTER = {
  0: [
    {
      scene: 'teamPhoto',
      speaker: 'THE LOUISVILLE BATS',
      text: 'Thanks for clearing the field, Buddy! Could you grab us a new bat from the Louisville Slugger Museum?',
    },
  ],
  1: [
    { scene: 'copScene', speaker: 'POLICE', text: 'WHO DESTROYED THESE EMPLOYEES?!' },
    { scene: 'buddyPortrait', sceneOpts: { sweat: true }, speaker: 'BUDDY', text: '...gotta go. Bye!' },
  ],
  2: [
    { scene: 'buddyPortrait', speaker: 'BUDDY', text: "I'm bored. I want to go back to Louisville now." },
  ],
  3: [
    {
      scene: 'buddyPortrait',
      speaker: 'BUDDY',
      text: "I've got to get back to the Bats in time for the away game!! But first I have to go through Butchertown.....",
    },
  ],
  4: [
    {
      scene: 'teamPhoto',
      speaker: 'THE LOUISVILLE BATS',
      text: 'Now we have to defeat our main rivals, the Columbus Clippers!',
    },
  ],
};
