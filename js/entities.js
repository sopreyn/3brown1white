import {
  GRAVITY,
  GROUND_Y,
  MOVE_SPEED,
  JUMP_VELOCITY,
  MAX_FALL_SPEED,
  PLAYER_W,
  PLAYER_H,
  SWING_DURATION,
  SWING_COOLDOWN,
  SWING_RANGE,
  SWING_RANGE_UPGRADED,
  HURT_IFRAMES,
  INVINCIBLE_TIME,
  KNOCKBACK_VX,
  KNOCKBACK_VY,
  PIXEL,
} from './constants.js';
import * as S from './sprites.js';

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function resolveGround(entity, platforms) {
  const footY = entity.y + entity.h;
  let groundY = GROUND_Y;
  if (platforms) {
    for (const p of platforms) {
      if (entity.x + entity.w > p.x && entity.x < p.x + p.w) {
        if (footY <= p.y + 10 && entity.vy >= 0) {
          groundY = Math.min(groundY, p.y);
        }
      }
    }
  }
  if (footY >= groundY && entity.vy >= 0) {
    entity.y = groundY - entity.h;
    entity.vy = 0;
    entity.onGround = true;
  } else {
    entity.onGround = false;
  }
}

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

export class Player {
  constructor(x, y, maxHp) {
    this.x = x;
    this.y = y;
    this.w = PLAYER_W;
    this.h = PLAYER_H;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.hurtTimer = 0;
    this.invincibleTimer = 0;
    this.swingTimer = 0;
    this.swingCooldown = 0;
    this.hitThisSwing = new Set();
    this.batUpgraded = false;
    this.bobPhase = Math.random() * 10;
    this.score = 0;
    this.alive = true;
    this.justHurt = false;
    this.dead = false;
    this.knockTimer = 0;
  }

  get swingRange() {
    return this.batUpgraded ? SWING_RANGE_UPGRADED : SWING_RANGE;
  }

  getSwingHitbox() {
    if (this.swingTimer <= 0) return null;
    const range = this.swingRange;
    const hx = this.facing === 1 ? this.x + this.w : this.x - range;
    return { x: hx, y: this.y, w: range, h: this.h };
  }

  requestJump() {
    if (this.onGround) {
      this.vy = JUMP_VELOCITY;
      this.onGround = false;
      return true;
    }
    return false;
  }

  requestSwing() {
    if (this.swingCooldown <= 0) {
      this.swingTimer = SWING_DURATION;
      this.swingCooldown = SWING_COOLDOWN;
      this.hitThisSwing.clear();
      return true;
    }
    return false;
  }

  takeDamage(amount, fromX) {
    if (this.hurtTimer > 0 || this.invincibleTimer > 0) return false;
    this.hp -= amount;
    this.hurtTimer = HURT_IFRAMES;
    this.knockTimer = 0.18;
    const dir = this.x + this.w / 2 < fromX ? -1 : 1;
    this.vx = dir * KNOCKBACK_VX;
    this.vy = KNOCKBACK_VY;
    this.justHurt = true;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    }
    return true;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  grantInvincibility(seconds) {
    this.invincibleTimer = Math.max(this.invincibleTimer, seconds);
  }

  update(dt, input, levelWidth, platforms) {
    if (this.dead) {
      this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL_SPEED);
      this.y += this.vy * dt;
      return;
    }

    const knocked = this.knockTimer > 0;
    if (knocked) this.knockTimer -= dt;

    if (!knocked) {
      let moveDir = 0;
      if (input.left) moveDir -= 1;
      if (input.right) moveDir += 1;
      this.vx = moveDir * MOVE_SPEED;
      if (moveDir !== 0) this.facing = moveDir > 0 ? 1 : -1;
    } else {
      this.vx *= 0.92;
    }

    this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL_SPEED);
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.x = Math.max(0, Math.min(levelWidth - this.w, this.x));

    resolveGround(this, platforms);

    if (this.hurtTimer > 0) this.hurtTimer -= dt;
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    if (this.swingTimer > 0) this.swingTimer -= dt;
    if (this.swingCooldown > 0) this.swingCooldown -= dt;
  }

  draw(ctx, camX, tick) {
    const flicker = this.hurtTimer > 0 && Math.floor(tick * 20) % 2 === 0;
    if (flicker) return;

    // bat swing (drawn behind or in front depending on facing so it reads as an arc)
    if (this.swingTimer > 0) {
      const progress = 1 - this.swingTimer / SWING_DURATION;
      const angle = (this.facing === 1 ? 1 : -1) * (-0.9 + progress * 1.8);
      const pivotX = this.x - camX + (this.facing === 1 ? this.w * 0.85 : this.w * 0.15);
      const pivotY = this.y + this.h * 0.5;
      ctx.save();
      ctx.translate(pivotX, pivotY);
      ctx.rotate(angle);
      const len = this.batUpgraded ? 22 : 16;
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(this.facing === 1 ? 0 : -len, -2, len, 4);
      ctx.fillStyle = '#c9a066';
      ctx.fillRect(this.facing === 1 ? len - 6 : -len, -2, 6, 4);
      ctx.restore();
    }

    // The bat's natural pose already reads as mid-flight, so instead of a
    // walk-cycle it gets a bob (bigger/faster while moving) and a jump/fall
    // tilt — cheap procedural animation for a single piece of artwork.
    const moving = this.onGround && Math.abs(this.vx) > 5;
    const bobAmp = moving ? 2.2 : 1;
    const bobSpeed = moving ? 11 : 3;
    const bob = Math.sin(tick * bobSpeed + this.bobPhase) * bobAmp;
    const tilt = this.onGround ? 0 : Math.max(-0.35, Math.min(0.45, this.vy / 700));
    const tint = this.invincibleTimer > 0 ? hslCycle(tick, 0) : null;

    S.drawPlayerImage(ctx, S.getPlayerImage(), this.x - camX, this.y + bob, this.w, this.h, {
      flip: this.facing === 1, // artwork's natural pose faces left
      rotation: tilt,
      tint,
    });
  }
}

function hslCycle(tick, offset) {
  // Quantized so the sprite cache only ever holds a handful of color
  // variants during invincibility, instead of one new canvas per frame.
  const step = Math.floor(tick * 8) * 30;
  const hue = (step + offset) % 360;
  return `hsl(${hue},80%,55%)`;
}

// ---------------------------------------------------------------------------
// Enemy config (small enemy + its "big boss" variant share art)
// ---------------------------------------------------------------------------

export const ENEMY_TYPES = {
  baseball: {
    frames: [S.BASEBALL_FRAMES.roll1, S.BASEBALL_FRAMES.roll2],
    palette: S.BASEBALL_PALETTE,
    w: 16,
    h: 16,
    speed: 34,
    hp: 2,
    damage: 1,
    points: 100,
    bounce: true,
  },
  worker: {
    frames: [S.WORKER_FRAMES.walk1, S.WORKER_FRAMES.walk2],
    palette: S.WORKER_PALETTE,
    w: 16,
    h: 24,
    speed: 26,
    hp: 2,
    damage: 1,
    points: 100,
  },
  jogger: {
    frames: [S.JOGGER_FRAMES.run1, S.JOGGER_FRAMES.run2],
    palette: S.JOGGER_PALETTE,
    w: 16,
    h: 24,
    speed: 44,
    hp: 2,
    damage: 1,
    points: 100,
  },
  suit: {
    frames: [S.SUIT_FRAMES.walk1, S.SUIT_FRAMES.walk2],
    palette: S.SUIT_PALETTE,
    w: 16,
    h: 24,
    speed: 24,
    hp: 2,
    damage: 1,
    points: 100,
  },
  redsplayer: {
    frames: [S.REDS_FRAMES.walk1, S.REDS_FRAMES.walk2],
    palette: S.REDS_PALETTE,
    w: 16,
    h: 24,
    speed: 30,
    hp: 2,
    damage: 1,
    points: 100,
  },
  mascot: {
    // boss-only base stats — no small "mascot" enemy spawns in the level
    frames: [S.MASCOT_FRAMES.walk1, S.MASCOT_FRAMES.walk2],
    palette: S.MASCOT_PALETTE,
    w: 20,
    h: 24,
    speed: 26,
    hp: 2,
    damage: 1,
    points: 100,
  },
};

export const BOSS_TYPES = {
  baseball_boss: {
    base: 'baseball',
    name: 'Big League Ball',
    scale: 3,
    hp: 22,
    damage: 1,
    speed: 40,
    points: 1000,
    override: S.BASEBALL_BOSS_OVERRIDE,
    attack: 'slam',
  },
  worker_boss: {
    base: 'worker',
    name: 'Foreman Slugger',
    scale: 2.6,
    hp: 26,
    damage: 1,
    speed: 22,
    points: 1200,
    override: S.WORKER_BOSS_OVERRIDE,
    attack: 'throw_wrench',
  },
  jogger_boss: {
    base: 'jogger',
    name: 'Marathon Mike',
    scale: 2.6,
    hp: 24,
    damage: 1,
    speed: 30,
    points: 1200,
    override: S.JOGGER_BOSS_OVERRIDE,
    attack: 'dash',
  },
  suit_boss: {
    base: 'suit',
    name: 'The Chairman',
    scale: 2.6,
    hp: 28,
    damage: 1,
    speed: 20,
    points: 1400,
    override: S.SUIT_BOSS_OVERRIDE,
    attack: 'throw_briefcase',
  },
  mascot_boss: {
    base: 'mascot',
    name: 'Rowdy the Riverboat',
    scale: 2.4,
    hp: 32,
    damage: 1,
    speed: 26,
    points: 2000,
    override: null,
    attack: 'throw_ball',
  },
};

let idCounter = 1;

export class Enemy {
  constructor(type, x, spawnMinX, spawnMaxX) {
    const cfg = ENEMY_TYPES[type];
    this.id = idCounter++;
    this.type = type;
    this.cfg = cfg;
    this.x = x;
    this.y = GROUND_Y - cfg.h;
    this.w = cfg.w;
    this.h = cfg.h;
    this.vx = -cfg.speed;
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.minX = spawnMinX;
    this.maxX = spawnMaxX;
    this.facing = -1;
    this.animTimer = 0;
    this.frameIdx = 0;
    this.hurtFlash = 0;
    this.alive = true;
    this.deathTimer = 0;
    this.bounceT = Math.random() * 10;
    this.justDied = false;
    this.contactCooldown = 0;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hurtFlash = 0.15;
    if (this.hp <= 0 && this.alive) {
      this.alive = false;
      this.justDied = true;
      this.deathTimer = 0.35;
    }
  }

  update(dt, playerX) {
    if (!this.alive) {
      this.deathTimer -= dt;
      return;
    }
    if (this.hurtFlash > 0) this.hurtFlash -= dt;
    if (this.contactCooldown > 0) this.contactCooldown -= dt;

    const chaseRange = 70;
    const dx = playerX - this.x;
    if (Math.abs(dx) < chaseRange) {
      this.vx = Math.sign(dx) * this.cfg.speed || this.vx;
      this.facing = dx < 0 ? -1 : 1;
    } else {
      if (this.x <= this.minX) this.vx = Math.abs(this.cfg.speed);
      if (this.x >= this.maxX) this.vx = -Math.abs(this.cfg.speed);
      this.facing = this.vx < 0 ? -1 : 1;
    }
    this.x += this.vx * dt;
    this.x = Math.max(this.minX - 20, Math.min(this.maxX + 20, this.x));

    this.animTimer += dt;
    if (this.animTimer > 0.18) {
      this.animTimer = 0;
      this.frameIdx = 1 - this.frameIdx;
    }
    if (this.cfg.bounce) {
      this.bounceT += dt * 8;
    }
  }

  get drawY() {
    if (this.cfg.bounce && this.alive) {
      return this.y - Math.abs(Math.sin(this.bounceT)) * 6;
    }
    return this.y;
  }

  draw(ctx, camX) {
    if (!this.alive && this.deathTimer <= 0) return;
    const frame = this.cfg.frames[this.frameIdx];
    const alpha = this.alive ? 1 : Math.max(0, this.deathTimer / 0.35);
    const overrides = this.hurtFlash > 0 ? { ...flashOverride(this.cfg.palette) } : null;
    S.drawSprite(ctx, 'enemy_' + this.type, frame, this.cfg.palette, this.x - camX, this.drawY, {
      flip: this.facing === 1,
      overrides,
      alpha,
    });
  }
}

function flashOverride(palette) {
  const o = {};
  for (const k in palette) o[k] = '#ffffff';
  return o;
}

export class Boss {
  constructor(bossKey, x, arenaMinX, arenaMaxX) {
    const cfg = BOSS_TYPES[bossKey];
    const baseCfg = ENEMY_TYPES[cfg.base];
    this.key = bossKey;
    this.cfg = cfg;
    this.baseCfg = baseCfg;
    this.name = cfg.name;
    this.scale = cfg.scale;
    this.w = baseCfg.w * cfg.scale;
    this.h = baseCfg.h * cfg.scale;
    this.x = x;
    this.y = GROUND_Y - this.h;
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.minX = arenaMinX;
    this.maxX = arenaMaxX;
    this.vx = -cfg.speed;
    this.facing = -1;
    this.animTimer = 0;
    this.frameIdx = 0;
    this.hurtFlash = 0;
    this.alive = true;
    this.justDied = false;
    this.deathTimer = 0;
    this.attackTimer = 2;
    this.bounceT = 0;
    this.dashTimer = 0;
    this.contactCooldown = 0;
    this.projectileRequest = null; // set during update, consumed by game.js
    this.introDone = false;
    this.arenaBannerShown = false;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hurtFlash = 0.15;
    if (this.hp <= 0 && this.alive) {
      this.alive = false;
      this.justDied = true;
      this.deathTimer = 0.6;
    }
  }

  update(dt, playerX) {
    this.projectileRequest = null;
    if (!this.alive) {
      this.deathTimer -= dt;
      return;
    }
    if (this.hurtFlash > 0) this.hurtFlash -= dt;
    if (this.contactCooldown > 0) this.contactCooldown -= dt;
    if (!this.introDone) return; // held in place until the intro banner clears

    const dx = playerX - (this.x + this.w / 2);
    this.facing = dx < 0 ? -1 : 1;

    const attack = this.cfg.attack;
    if (attack === 'dash') {
      if (this.dashTimer > 0) {
        this.dashTimer -= dt;
        this.x += this.vx * dt;
      } else {
        this.attackTimer -= dt;
        this.x += Math.sign(dx) * this.cfg.speed * 0.5 * dt;
        if (this.attackTimer <= 0) {
          this.attackTimer = 2.6 + Math.random();
          this.dashTimer = 0.6;
          this.vx = Math.sign(dx) * this.cfg.speed * 4;
        }
      }
    } else if (attack === 'slam') {
      this.x += Math.sign(dx) * this.cfg.speed * dt;
      this.bounceT += dt * 6;
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.attackTimer = 2.2;
      }
    } else {
      // throwers stay mid-range and lob projectiles
      const desired = Math.abs(dx) < 90 ? -Math.sign(dx) : Math.sign(dx);
      this.x += desired * this.cfg.speed * 0.6 * dt;
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.attackTimer = 2.4 + Math.random() * 0.6;
        this.projectileRequest = attack;
      }
    }

    this.x = Math.max(this.minX, Math.min(this.maxX - this.w, this.x));

    this.animTimer += dt;
    if (this.animTimer > 0.2) {
      this.animTimer = 0;
      this.frameIdx = 1 - this.frameIdx;
    }
  }

  get drawY() {
    if (this.cfg.attack === 'slam' && this.alive) {
      return this.y - Math.abs(Math.sin(this.bounceT)) * 8;
    }
    return this.y;
  }

  draw(ctx, camX) {
    if (!this.alive && this.deathTimer <= 0) return;
    const frame = this.baseCfg.frames[this.frameIdx];
    const alpha = this.alive ? 1 : Math.max(0, this.deathTimer / 0.6);
    let overrides = this.cfg.override;
    if (this.hurtFlash > 0) overrides = flashOverride(this.baseCfg.palette);
    S.drawSprite(ctx, 'boss_' + this.key, frame, this.baseCfg.palette, this.x - camX, this.drawY, {
      pixelSize: PIXEL,
      scale: this.scale,
      flip: this.facing === 1,
      overrides,
      alpha,
    });
  }
}

// ---------------------------------------------------------------------------
// Pickups
// ---------------------------------------------------------------------------

export class Pickup {
  constructor(kind, x, y) {
    this.kind = kind; // 'bug' | 'goldbug' | 'bat'
    this.x = x;
    this.y = y;
    this.w = kind === 'bat' ? 12 : 10;
    this.h = kind === 'bat' ? 16 : 10;
    this.collected = false;
    this.t = Math.random() * 10;
  }

  update(dt) {
    this.t += dt;
  }

  get drawY() {
    return this.y + Math.sin(this.t * 4) * 3;
  }

  draw(ctx, camX) {
    if (this.collected) return;
    if (this.kind === 'bug') {
      S.drawSprite(ctx, 'bug', S.BUG_FRAME, S.BUG_PALETTE, this.x - camX, this.drawY, {});
    } else if (this.kind === 'goldbug') {
      S.drawSprite(ctx, 'goldbug', S.BUG_FRAME, S.GOLD_BUG_PALETTE, this.x - camX, this.drawY, {
        scale: 1.1,
      });
    } else if (this.kind === 'bat') {
      S.drawSprite(ctx, 'batpowerup', S.POWERUP_BAT_GRID, S.POWERUP_BAT_PALETTE, this.x - camX, this.drawY, {
        pixelSize: PIXEL + 1,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Projectiles (thrown by bosses)
// ---------------------------------------------------------------------------

export class Projectile {
  constructor(kind, x, y, vx, vy, damage) {
    this.kind = kind; // 'briefcase' | 'wrench' | 'ball'
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.w = 10;
    this.h = 8;
    this.dead = false;
    this.gravity = kind === 'briefcase';
    this.spin = 0;
  }

  update(dt) {
    if (this.gravity) this.vy += GRAVITY * 0.6 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.spin += dt * 20;
    if (this.y > GROUND_Y + 20) this.dead = true;
  }

  draw(ctx, camX) {
    const grid = this.kind === 'briefcase' ? S.BRIEFCASE_GRID : S.WRENCH_GRID;
    const palette = this.kind === 'briefcase' ? S.BRIEFCASE_PALETTE : S.WRENCH_PALETTE;
    if (this.kind === 'ball') {
      ctx.save();
      ctx.translate(this.x - camX + 4, this.y + 4);
      ctx.rotate(this.spin);
      ctx.fillStyle = '#f5f5f0';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c8102e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-4, -2);
      ctx.lineTo(4, 2);
      ctx.stroke();
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(this.x - camX + this.w / 2, this.y + this.h / 2);
    ctx.rotate(this.spin);
    S.drawSprite(ctx, 'proj_' + this.kind, grid, palette, -this.w / 2, -this.h / 2, {});
    ctx.restore();
  }
}

export { aabb };
