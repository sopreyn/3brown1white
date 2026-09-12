import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y, STORAGE_KEY, PEACEFUL_MODE, HAZARD_DAMAGE } from './constants.js';
import { Player, Enemy, Boss, Pickup, Projectile, aabb, drawFireHazard, drawMeatHazard } from './entities.js';
import { LEVELS, drawBackground, drawEndingBackground, drawBridgeForegroundBeams } from './levels.js';
import * as S from './sprites.js';
import { Input, setupInput, consumeJump, consumeSwing, consumePause } from './input.js';
import { sfx, resumeAudio, setMuted, isMuted, startMusic, playLevelMusic, playEndingMusic } from './audio.js';
import { computeLighting, drawAmbientAtmosphereOverlay } from './lighting.js';
import { STORY_INTRO, STORY_BEFORE, STORY_AFTER, renderStoryBeat, renderBossTaunt } from './story.js';

// Title screen reuses level 1's background at its "story cycle" time of day.
const TITLE_LIGHTING = computeLighting('cycle', 1);

const el = (id) => document.getElementById(id);

const dom = {
  canvas: el('gameCanvas'),
  title: el('titleScreen'),
  instructions: el('instructionsScreen'),
  beginPlayBtn: el('beginPlayBtn'),
  pause: el('pauseScreen'),
  levelComplete: el('levelCompleteScreen'),
  gameOver: el('gameOverScreen'),
  win: el('winScreen'),
  nameEntry: el('nameEntryScreen'),
  bestScore: el('bestScore'),
  levelCompleteTitle: el('levelCompleteTitle'),
  confettiLayer: el('confettiLayer'),
  levelCompleteScore: el('levelCompleteScore'),
  gameOverScore: el('gameOverScore'),
  winScore: el('winScore'),
  nameEntryScore: el('nameEntryScore'),
  nameInput: el('nameInput'),
  saveScoreBtn: el('saveScoreBtn'),
  scoreboardList: el('scoreboardList'),
  startBtn: el('startBtn'),
  muteBtn: el('muteBtn'),
  resumeBtn: el('resumeBtn'),
  restartLevelBtn: el('restartLevelBtn'),
  quitBtn: el('quitBtn'),
  nextLevelBtn: el('nextLevelBtn'),
  retryLevelBtn: el('retryLevelBtn'),
  restartGameBtn: el('restartGameBtn'),
  playAgainBtn: el('playAgainBtn'),
  pauseBtn: el('pauseBtn'),
  touchControls: el('touchControls'),
};

const ctx = dom.canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const world = {
  state: 'title', // title | playing | paused | levelComplete | gameOver | ending | win | story | bossTaunt | nameEntry
  levelIndex: 0,
  level: null,
  player: null,
  enemies: [],
  boss: null,
  pickups: [],
  projectiles: [],
  camX: 0,
  tick: 0,
  lighting: TITLE_LIGHTING,
  banner: null, // {text, sub, timer}
  deathTimer: 0,
  cutsceneTimer: 0,
  storyBeats: [],
  storyIndex: 0,
  storyOnDone: null,
  bossTaunt: null, // {name, text} while state === 'bossTaunt'
};

function loadBest() {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}
function saveBest(score) {
  try {
    const b = loadBest();
    if (score > b) localStorage.setItem(STORAGE_KEY, String(score));
  } catch {
    /* storage unavailable — ignore */
  }
}

const SCOREBOARD_KEY = 'buddyBatScoreboard.v1';
const SCOREBOARD_SIZE = 10;

function loadScoreboard() {
  try {
    const raw = JSON.parse(localStorage.getItem(SCOREBOARD_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function addToScoreboard(name, score) {
  const board = loadScoreboard();
  board.push({ name, score });
  board.sort((a, b) => b.score - a.score);
  board.length = Math.min(board.length, SCOREBOARD_SIZE);
  try {
    localStorage.setItem(SCOREBOARD_KEY, JSON.stringify(board));
  } catch {
    /* storage unavailable — ignore */
  }
  return board;
}

function renderScoreboard(board) {
  dom.scoreboardList.innerHTML = '';
  board.forEach((entry, i) => {
    const row = document.createElement('div');
    row.className = 'scoreboard-row';
    row.textContent = `${i + 1}. ${entry.name} — ${entry.score}`;
    dom.scoreboardList.appendChild(row);
  });
}

const OVERLAY_KEYS = ['title', 'instructions', 'pause', 'levelComplete', 'gameOver', 'win', 'nameEntry'];

function showOverlay(name) {
  for (const key of OVERLAY_KEYS) {
    dom[key].classList.toggle('hidden', key !== name);
  }
}
function hideAllOverlays() {
  for (const key of OVERLAY_KEYS) {
    dom[key].classList.add('hidden');
  }
}

function setBanner(text, sub, duration, onComplete) {
  world.banner = { text, sub, timer: duration, duration, onComplete };
}

const CONFETTI_COLORS = ['#c8102e', '#ffd76a', '#f5f5f0', '#5b3aa0', '#3c8546', '#7ec8ff'];

function spawnConfetti(layer, count = 46) {
  layer.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    const round = Math.random() < 0.4;
    piece.className = round ? 'confetti-piece round' : 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.animationDuration = `${1.6 + Math.random() * 1.4}s`;
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    if (round) {
      piece.style.width = '7px';
      piece.style.height = '7px';
    }
    layer.appendChild(piece);
  }
}

/** Play a click-through sequence of story beats, then call onDone. Freezes
 * gameplay (or plays before any level is loaded, for the opening cutscene) —
 * see the 'story' branch in update()/render(). */
function playStory(beats, onDone) {
  if (!beats || beats.length === 0) {
    onDone();
    return;
  }
  world.storyBeats = beats;
  world.storyIndex = 0;
  world.storyOnDone = onDone;
  world.state = 'story';
}

function advanceStory() {
  world.storyIndex += 1;
  if (world.storyIndex >= world.storyBeats.length) {
    const cb = world.storyOnDone;
    world.storyBeats = [];
    world.storyOnDone = null;
    if (cb) cb();
  }
}

function startNewGame() {
  world.levelIndex = 0;
  world.player = new Player(40, GROUND_Y - 24, LEVELS[0].maxHp);
  loadLevel(0, true);
  hideAllOverlays();
  world.state = 'playing';
}

function loadLevel(index, resetPosition) {
  const level = LEVELS[index];
  world.level = level;
  world.lighting = computeLighting('cycle', level.id);
  playLevelMusic(level.id);
  world.camX = 0;
  world.enemies = level.enemySpawns.map((s) => new Enemy(s.type, s.x, s.x - 90, s.x + 90));
  world.boss = new Boss(level.bossKey, level.bossX, level.arena.minX, level.arena.maxX);
  world.pickups = level.pickupSpawns.map((p) => new Pickup(p.kind, p.x, p.y));
  world.projectiles = [];
  world.deathTimer = 0;
  world.levelWinTriggered = false;

  const p = world.player;
  p.maxHp = level.maxHp;
  p.hp = level.maxHp;
  p.dead = false;
  p.alive = true;
  p.hurtTimer = 0;
  p.invincibleTimer = 0;
  p.knockTimer = 0;
  p.vx = 0;
  p.vy = 0;
  if (resetPosition !== false) {
    p.x = 40;
    p.y = GROUND_Y - p.h;
  }

  setBanner(`LEVEL ${level.id}`, level.name.toUpperCase(), 2.2);
}

function retryCurrentLevel() {
  loadLevel(world.levelIndex, true);
}

/** After a level's win screen: play that level's "after" story beats plus
 * the next level's "before" title card (if any), then actually advance. */
function advanceToNextLevelOrEnding() {
  const finishedIndex = world.levelIndex;
  const isLast = finishedIndex >= LEVELS.length - 1;
  const beats = [...(STORY_AFTER[finishedIndex] || []), ...(isLast ? [] : STORY_BEFORE[finishedIndex + 1] || [])];
  hideAllOverlays();
  playStory(beats, () => {
    if (isLast) {
      startEndingCutscene();
    } else {
      world.levelIndex += 1;
      loadLevel(world.levelIndex, true);
      world.state = 'playing';
    }
  });
}

function startEndingCutscene() {
  world.state = 'ending';
  world.cutsceneTimer = 0;
  hideAllOverlays();
  playEndingMusic();
  sfx.win();
}

function finishEndingCutscene() {
  saveBest(world.player.score);
  dom.nameEntryScore.textContent = `FINAL SCORE: ${world.player.score}`;
  dom.nameInput.value = '';
  showOverlay('nameEntry');
  world.state = 'nameEntry';
  dom.nameInput.focus();
}

function submitScore() {
  const name = (dom.nameInput.value || 'BUDDY').trim().slice(0, 12).toUpperCase() || 'BUDDY';
  const board = addToScoreboard(name, world.player.score);
  renderScoreboard(board);
  dom.winScore.textContent = `FINAL SCORE: ${world.player.score}`;
  showOverlay('win');
  world.state = 'win';
}

/** Spawns a thrown projectile from any entity with x/y/w/h — a boss's
 * signature attack, or a small enemy's ranged throw (away-game players). */
function spawnThrownProjectile(thrower, kind, player) {
  const bx = thrower.x + thrower.w / 2;
  const by = thrower.y + thrower.h * 0.35;
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  const dirX = px - bx;
  const dist = Math.max(40, Math.abs(dirX));
  let vx, vy, projKind;
  if (kind === 'throw_wrench') {
    vx = (dirX / dist) * 175;
    vy = (py - by) / dist * 175;
    projKind = 'wrench';
  } else if (kind === 'throw_briefcase') {
    vx = Math.sign(dirX || 1) * 120;
    vy = -230;
    projKind = 'briefcase';
  } else if (kind === 'throw_ham') {
    vx = Math.sign(dirX || 1) * 130;
    vy = -220;
    projKind = 'ham';
  } else {
    vx = (dirX / dist) * 215;
    vy = (py - by) / dist * 215;
    projKind = 'ball';
  }
  world.projectiles.push(new Projectile(projKind, bx, by, vx, vy, 1));
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

function update(dt) {
  world.tick += dt;

  if (consumePause() && world.state === 'playing') {
    world.state = 'paused';
    showOverlay('pause');
    return;
  }

  if (world.state === 'story') {
    if (consumeSwing() || consumeJump()) {
      sfx.uiSelect();
      advanceStory();
    }
    return;
  }
  if (world.state === 'bossTaunt') {
    if (consumeSwing() || consumeJump()) {
      sfx.uiSelect();
      world.boss.introDone = true;
      world.bossTaunt = null;
      world.state = 'playing';
    }
    return;
  }

  if (world.state === 'playing') updatePlaying(dt);
  else if (world.state === 'ending') updateEnding(dt);
}

function updatePlaying(dt) {
  const { player, level } = world;

  if (world.banner) {
    world.banner.timer -= dt;
    if (world.banner.timer <= 0) {
      const cb = world.banner.onComplete;
      world.banner = null;
      if (cb) cb();
    }
  }

  if (consumeJump()) {
    if (player.requestJump()) sfx.jump();
  }
  if (consumeSwing()) {
    if (player.requestSwing()) sfx.swing();
  }

  player.update(dt, Input, level.width, level.platforms);

  // Boss arena entry: bosses with a signature taunt get a click-through
  // dialogue box (frozen gameplay behind it); the rest keep the quick
  // auto-dismissing "BOSS BATTLE!" banner.
  if (world.boss.alive && !world.boss.arenaBannerShown && player.x + player.w > level.arena.minX) {
    world.boss.arenaBannerShown = true;
    if (world.boss.cfg.taunt) {
      world.bossTaunt = { name: world.boss.name, text: world.boss.cfg.taunt };
      world.state = 'bossTaunt';
      return;
    }
    setBanner(world.boss.name.toUpperCase(), 'BOSS BATTLE!', 1.8, () => {
      world.boss.introDone = true;
    });
  }

  for (const en of world.enemies) {
    en.update(dt, player.x + player.w / 2);
    if (en.projectileRequest) {
      spawnThrownProjectile(en, en.projectileRequest, player);
    }
  }
  world.enemies = world.enemies.filter((en) => en.alive || en.deathTimer > 0);

  world.boss.update(dt, player.x + player.w / 2);
  if (world.boss.projectileRequest) {
    spawnThrownProjectile(world.boss, world.boss.projectileRequest, player);
  }

  for (const pk of world.pickups) pk.update(dt);
  for (const pr of world.projectiles) pr.update(dt);
  world.projectiles = world.projectiles.filter(
    (pr) => !pr.dead && pr.x > -60 && pr.x < level.width + 60
  );

  resolveCollisions();

  // camera
  world.camX = Math.max(0, Math.min(level.width - GAME_WIDTH, player.x - GAME_WIDTH / 2));

  // level complete check
  if (!world.levelWinTriggered && !world.boss.alive && world.boss.deathTimer <= 0) {
    world.levelWinTriggered = true;
    sfx.levelComplete();
    dom.levelCompleteTitle.textContent = `YOU BEAT ${level.name.toUpperCase()}!`;
    dom.levelCompleteScore.textContent = `SCORE: ${player.score}`;
    spawnConfetti(dom.confettiLayer);
    showOverlay('levelComplete');
    world.state = 'levelComplete';
    return;
  }

  // player death check
  if (player.dead) {
    world.deathTimer += dt;
    if (world.deathTimer > 1.1) {
      sfx.gameOver();
      dom.gameOverScore.textContent = `SCORE: ${player.score}`;
      showOverlay('gameOver');
      world.state = 'gameOver';
    }
  }
}

function resolveCollisions() {
  const { player, level } = world;
  const hitbox = player.getSwingHitbox();

  // Swing vs enemies
  if (hitbox) {
    for (const en of world.enemies) {
      if (!en.alive) continue;
      if (player.hitThisSwing.has(en.id)) continue;
      if (aabb(hitbox, en)) {
        player.hitThisSwing.add(en.id);
        const dmg = player.batUpgraded ? 2 : 1;
        en.takeDamage(dmg);
        sfx.hitEnemy();
        if (en.justDied) {
          en.justDied = false;
          player.score += en.cfg.points;
          sfx.enemyDefeat();
        }
      }
    }
    // Swing vs boss
    if (world.boss.alive && world.boss.introDone && !player.hitThisSwing.has('boss')) {
      if (aabb(hitbox, world.boss)) {
        player.hitThisSwing.add('boss');
        const dmg = player.batUpgraded ? 2 : 1;
        world.boss.takeDamage(dmg);
        sfx.bossHit();
        if (world.boss.justDied) {
          world.boss.justDied = false;
          player.score += world.boss.cfg.points;
          sfx.bossDefeat();
        }
      }
    }
    // Swing vs projectiles (knock them out of the air)
    for (const pr of world.projectiles) {
      if (aabb(hitbox, pr)) {
        pr.dead = true;
        player.score += 25;
        sfx.hitEnemy();
      }
    }
    // reset the "already hit" memory a bit into the swing so a long swing can
    // still hit something that walks into it late — but not the same target twice
  }

  if (!PEACEFUL_MODE) {
    // Contact damage: enemies
    for (const en of world.enemies) {
      if (!en.alive || en.hurtFlash > 0) continue;
      if (aabb(player, en)) {
        if (player.takeDamage(en.cfg.damage, en.x + en.w / 2)) sfx.hurt();
      }
    }
    // Contact damage: boss
    if (world.boss.alive && world.boss.introDone && world.boss.hurtFlash <= 0) {
      if (aabb(player, world.boss)) {
        if (player.takeDamage(world.boss.cfg.damage, world.boss.x + world.boss.w / 2)) sfx.hurt();
      }
    }
    // Projectiles vs player
    for (const pr of world.projectiles) {
      if (pr.dead) continue;
      if (aabb(player, pr)) {
        pr.dead = true;
        if (player.takeDamage(pr.damage, pr.x)) sfx.hurt();
      }
    }
    // Ground hazards (fire, meat piles, ...) — jump over them
    for (const hz of level.hazards) {
      if (aabb(player, hz)) {
        if (player.takeDamage(HAZARD_DAMAGE, hz.x + hz.w / 2)) sfx.hurt();
      }
    }
  }
  // Pickups
  for (const pk of world.pickups) {
    if (pk.collected) continue;
    if (aabb(player, { x: pk.x, y: pk.drawY, w: pk.w, h: pk.h })) {
      pk.collected = true;
      if (pk.kind === 'bug') {
        player.heal(1);
        player.score += 50;
        sfx.pickupBug();
      } else if (pk.kind === 'goldbug') {
        player.grantInvincibility(7);
        player.score += 150;
        sfx.goldenBug();
      } else if (pk.kind === 'bat') {
        player.batUpgraded = true;
        player.score += 300;
        sfx.powerup();
      }
    }
  }
}

function updateEnding(dt) {
  world.cutsceneTimer += dt;
  if (world.cutsceneTimer > 4.6) finishEndingCutscene();
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function render() {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // The movement/jump/pause buttons only make sense during actual gameplay —
  // hide them for cutscenes, boss taunts, and the ending/name-entry/win
  // sequence so they don't sit on top of the dialogue box or cutscene art.
  const hudVisible = world.state === 'playing';
  dom.pauseBtn.hidden = !hudVisible;
  dom.touchControls.hidden = !hudVisible;

  if (world.state === 'title' || world.state === 'instructions') {
    drawBackground(ctx, LEVELS[0], 0, world.tick, TITLE_LIGHTING);
    drawAmbientAtmosphereOverlay(ctx, TITLE_LIGHTING);
    return;
  }

  if (world.state === 'ending' || world.state === 'win' || world.state === 'nameEntry') {
    renderEnding();
    return;
  }

  if (world.state === 'story') {
    renderStoryBeat(ctx, world.storyBeats[world.storyIndex], world.tick);
    return;
  }

  if (!world.level) return;
  const { level, camX, player, lighting } = world;
  drawBackground(ctx, level, camX, world.tick, lighting);
  drawPlatforms(level, camX);
  for (const hz of level.hazards) {
    if (hz.type === 'meat') drawMeatHazard(ctx, hz, camX, world.tick);
    else drawFireHazard(ctx, hz, camX, world.tick);
  }

  for (const pk of world.pickups) pk.draw(ctx, camX);
  for (const en of world.enemies) en.draw(ctx, camX, world.tick);
  world.boss.draw(ctx, camX, world.tick);
  for (const pr of world.projectiles) pr.draw(ctx, camX);
  player.draw(ctx, camX, world.tick);

  drawAmbientAtmosphereOverlay(ctx, lighting);
  if (level.bg === 'bridge') drawBridgeForegroundBeams(ctx, camX, world.tick);

  drawBossHealthBar();
  drawHud();
  drawBanner();
  if (world.state === 'bossTaunt' && world.bossTaunt) {
    renderBossTaunt(ctx, world.bossTaunt, world.tick);
  }
}

function drawPlatforms(level, camX) {
  for (const p of level.platforms) {
    const x = p.x - camX;
    if (x + p.w < 0 || x > GAME_WIDTH) continue;
    ctx.fillStyle = '#6b4a2b';
    ctx.fillRect(x, p.y, p.w, 8);
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(x, p.y, p.w, 3);
  }
}

function drawHud() {
  const p = world.player;
  // hearts
  for (let i = 0; i < p.maxHp; i++) {
    const grid = i < p.hp ? S.HEART_FULL : S.HEART_EMPTY;
    S.drawSprite(ctx, 'heart' + (i < p.hp), grid, S.HEART_PALETTE, 8 + i * 15, 8, {});
  }
  // score
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#000';
  ctx.fillText(`${p.score}`, GAME_WIDTH - 9, 19);
  ctx.fillStyle = '#ffd76a';
  ctx.fillText(`${p.score}`, GAME_WIDTH - 10, 18);
  ctx.textAlign = 'left';

  if (p.batUpgraded) {
    ctx.font = '8px monospace';
    ctx.fillStyle = '#c9a066';
    ctx.fillText('BIG BAT', GAME_WIDTH - 60, 30);
  }
  if (p.invincibleTimer > 0) {
    ctx.font = '8px monospace';
    ctx.fillStyle = '#ffdd00';
    ctx.fillText('INVINCIBLE!', 8, 34);
  }
}

function drawBossHealthBar() {
  const b = world.boss;
  if (!b.arenaBannerShown || !b.alive) return;
  const barW = 200;
  const x = GAME_WIDTH / 2 - barW / 2;
  const y = 10;
  ctx.fillStyle = '#000';
  ctx.fillRect(x - 2, y - 2, barW + 4, 10);
  ctx.fillStyle = '#3a1a1a';
  ctx.fillRect(x, y, barW, 6);
  const pct = Math.max(0, b.hp / b.maxHp);
  ctx.fillStyle = '#c8102e';
  ctx.fillRect(x, y, barW * pct, 6);
  ctx.font = '7px monospace';
  ctx.fillStyle = '#f5f5f0';
  ctx.textAlign = 'center';
  ctx.fillText(b.name.toUpperCase(), GAME_WIDTH / 2, y - 4);
  ctx.textAlign = 'left';
}

function drawBanner() {
  if (!world.banner) return;
  const alpha = Math.min(1, world.banner.timer / 0.3, (world.banner.duration - world.banner.timer) / 0.3 + 0.3);
  ctx.save();
  ctx.globalAlpha = Math.max(0.15, Math.min(1, alpha));
  ctx.fillStyle = 'rgba(10,8,14,0.75)';
  ctx.fillRect(0, GAME_HEIGHT / 2 - 26, GAME_WIDTH, 52);
  ctx.textAlign = 'center';
  ctx.font = '14px monospace';
  ctx.fillStyle = '#c8102e';
  ctx.fillText(world.banner.text, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 2);
  ctx.font = '9px monospace';
  ctx.fillStyle = '#f5f5f0';
  ctx.fillText(world.banner.sub || '', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 14);
  ctx.textAlign = 'left';
  ctx.restore();
}

function renderEnding() {
  drawEndingBackground(ctx, world.tick);
  const t = Math.min(1, world.cutsceneTimer / 4.2);
  const x = -40 + t * (GAME_WIDTH + 80);
  const y = GAME_HEIGHT / 2 - 10 + Math.sin(world.tick * 5) * 14;
  const wingFlap = Math.sin(world.tick * 14) * 0.08;
  S.drawPlayerImage(ctx, S.getPlayerImage(), x - 14, y - 12, 28, 25, {
    flip: false, // flying left-to-right; artwork's natural pose already faces right
    rotation: -0.15 + wingFlap,
  });

  if (world.state === 'win' || world.cutsceneTimer > 1.4) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, (world.cutsceneTimer - 1.4) / 0.8);
    ctx.textAlign = 'center';
    ctx.font = 'bold 26px monospace';
    ctx.fillStyle = '#111';
    ctx.fillText('YOU WON!', GAME_WIDTH / 2 + 2, GAME_HEIGHT / 2 + 42);
    ctx.fillStyle = '#f5f5f0';
    ctx.fillText('YOU WON!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
    ctx.textAlign = 'left';
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------

let lastTime = 0;
function loop(ts) {
  const dt = Math.min(0.05, (ts - lastTime) / 1000 || 0);
  lastTime = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Wire up UI
// ---------------------------------------------------------------------------

function initUI() {
  dom.bestScore.textContent = loadBest() > 0 ? `BEST: ${loadBest()}` : '';

  dom.startBtn.addEventListener('click', () => {
    resumeAudio();
    startMusic();
    sfx.uiSelect();
    showOverlay('instructions');
    world.state = 'instructions';
  });

  dom.beginPlayBtn.addEventListener('click', () => {
    sfx.uiSelect();
    hideAllOverlays();
    playStory([...STORY_INTRO, ...(STORY_BEFORE[0] || [])], () => {
      startNewGame();
    });
  });

  dom.muteBtn.addEventListener('click', () => {
    setMuted(!isMuted());
    dom.muteBtn.textContent = isMuted() ? '🔇 MUTED' : '🔊 SOUND';
  });

  dom.resumeBtn.addEventListener('click', () => {
    sfx.uiSelect();
    hideAllOverlays();
    world.state = 'playing';
  });
  dom.restartLevelBtn.addEventListener('click', () => {
    sfx.uiSelect();
    retryCurrentLevel();
    hideAllOverlays();
    world.state = 'playing';
  });
  dom.quitBtn.addEventListener('click', () => {
    sfx.uiSelect();
    startMusic();
    showOverlay('title');
    world.state = 'title';
  });

  dom.nextLevelBtn.addEventListener('click', () => {
    sfx.uiSelect();
    world.levelWinTriggered = false;
    advanceToNextLevelOrEnding();
  });

  dom.retryLevelBtn.addEventListener('click', () => {
    sfx.uiSelect();
    world.levelWinTriggered = false;
    retryCurrentLevel();
    hideAllOverlays();
    world.state = 'playing';
  });
  dom.restartGameBtn.addEventListener('click', () => {
    sfx.uiSelect();
    saveBest(world.player ? world.player.score : 0);
    world.levelWinTriggered = false;
    startNewGame();
  });
  dom.playAgainBtn.addEventListener('click', () => {
    sfx.uiSelect();
    world.levelWinTriggered = false;
    startNewGame();
  });

  dom.saveScoreBtn.addEventListener('click', () => {
    sfx.uiSelect();
    submitScore();
  });
  dom.nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sfx.uiSelect();
      submitScore();
    }
  });

  dom.pauseBtn.addEventListener('click', () => {
    if (world.state === 'playing') {
      sfx.uiSelect();
      world.state = 'paused';
      showOverlay('pause');
    }
  });

  setupInput({
    canvas: dom.canvas,
    leftBtn: el('leftBtn'),
    rightBtn: el('rightBtn'),
    jumpBtn: el('jumpBtn'),
    pauseBtn: dom.pauseBtn,
  });
}

export function initGame() {
  S.getPlayerImage(); // kick off loading now, not on the first draw call
  initUI();
  showOverlay('title');
  requestAnimationFrame((ts) => {
    lastTime = ts;
    requestAnimationFrame(loop);
  });
  // Harmless debug hook — lets anyone poke at live state from devtools.
  window.__buddyDebug = world;
  window.__buddyInput = Input;
  window.__buddyLoadLevel = (i) => {
    if (!world.player) world.player = new Player(40, GROUND_Y - 18, LEVELS[i].maxHp);
    world.levelIndex = i;
    loadLevel(i, true);
    hideAllOverlays();
    world.state = 'playing';
  };
}
