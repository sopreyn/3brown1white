// Core tunables for the whole game. Keep world units in "game pixels" —
// the internal canvas is GAME_WIDTH x GAME_HEIGHT and gets scaled to fit
// whatever screen it renders on (see main.js).

export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;

export const GROUND_Y = 214; // y of the ground surface (top of the dirt/floor)

export const GRAVITY = 1500; // game-px / s^2
export const MOVE_SPEED = 92; // game-px / s
export const JUMP_VELOCITY = -335; // game-px / s
export const MAX_FALL_SPEED = 620;

export const PLAYER_W = 16;
export const PLAYER_H = 24;

export const SWING_DURATION = 0.22; // seconds the bat hitbox is active
export const SWING_COOLDOWN = 0.22; // seconds before another swing can start
export const SWING_RANGE = 26; // extra reach in front of the player
export const SWING_RANGE_UPGRADED = 36;

export const HURT_IFRAMES = 1.6; // seconds of flicker/invulnerability after being hit
export const INVINCIBLE_TIME = 7; // seconds of star-power from a golden bug

export const KNOCKBACK_VX = 110;
export const KNOCKBACK_VY = -180;

export const PIXEL = 2; // size (in game px) of one "art pixel" for character sprites

export const STORAGE_KEY = 'buddyBatSave.v1';
