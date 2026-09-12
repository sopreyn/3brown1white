// ---------------------------------------------------------------------------
// Dynamic time-of-day lighting: presets (sunrise/day/goldenHour/dusk/night),
// a per-level "story cycle" that assigns each level a time of day, and the
// shared rendering passes (sky/sun/moon, entity ground shadows, stadium
// floodlight beams, ambient tint) that the level backgrounds build on.
// Ported from a richer prototype of this game's background system.
// ---------------------------------------------------------------------------

import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y } from './constants.js';

export const LIGHTING_PRESETS = {
  sunrise: {
    id: 'sunrise',
    name: 'Sunrise / Dawn',
    hour: 6.5,
    skyTop: '#5b548a',
    skyBottom: '#ffaa77',
    sunPosition: { xRatio: 0.18, yRatio: 0.65 },
    sunColor: '#fff5cf',
    sunGlowColor: 'rgba(255, 170, 90, 0.45)',
    sunRadius: 18,
    sunVisible: true,
    moonVisible: false,
    moonColor: '#e0e5ea',
    moonRadius: 12,
    starsOpacity: 0.05,
    ambientLight: 'rgba(255, 195, 150, 0.22)',
    ambientIntensity: 0.35,
    shadowLength: 2.2,
    shadowAngle: 0.42,
    shadowOpacity: 0.45,
    stadiumLightsOn: false,
    stadiumLightIntensity: 0,
    windowGlowIntensity: 0.2,
    streetlampIntensity: 0.1,
    rimLightIntensity: 0.6,
    warmth: 0.65,
  },
  day: {
    id: 'day',
    name: 'Day / Afternoon',
    hour: 13.5,
    skyTop: '#4ea8de',
    skyBottom: '#90e0ef',
    sunColor: '#fff9d6',
    sunGlowColor: 'rgba(255, 250, 200, 0.3)',
    sunRadius: 20,
    sunVisible: true,
    moonVisible: false,
    moonColor: '#e0e5ea',
    moonRadius: 10,
    starsOpacity: 0,
    ambientLight: 'rgba(255, 255, 255, 0)',
    ambientIntensity: 0,
    shadowLength: 0.45,
    shadowAngle: 0.05,
    shadowOpacity: 0.35,
    stadiumLightsOn: false,
    stadiumLightIntensity: 0,
    windowGlowIntensity: 0,
    streetlampIntensity: 0,
    rimLightIntensity: 0.1,
    warmth: 0.1,
  },
  goldenHour: {
    id: 'goldenHour',
    name: 'Golden Hour / Sunset',
    hour: 18.75,
    skyTop: '#3a256a',
    skyBottom: '#f77f00',
    sunColor: '#fff0c2',
    sunGlowColor: 'rgba(247, 127, 0, 0.6)',
    sunRadius: 22,
    sunVisible: true,
    moonVisible: true,
    moonColor: '#f1e3d3',
    moonRadius: 12,
    starsOpacity: 0.15,
    ambientLight: 'rgba(255, 120, 40, 0.28)',
    ambientIntensity: 0.4,
    shadowLength: 2.6,
    shadowAngle: -0.45,
    shadowOpacity: 0.5,
    stadiumLightsOn: true,
    stadiumLightIntensity: 0.35,
    windowGlowIntensity: 0.55,
    streetlampIntensity: 0.45,
    rimLightIntensity: 0.85,
    warmth: 0.9,
  },
  dusk: {
    id: 'dusk',
    name: 'Dusk / Twilight',
    hour: 20.5,
    skyTop: '#1a1838',
    skyBottom: '#7b337d',
    sunColor: '#e06040',
    sunGlowColor: 'rgba(224, 96, 64, 0.4)',
    sunRadius: 18,
    sunVisible: false,
    moonVisible: true,
    moonColor: '#fff0b3',
    moonRadius: 14,
    starsOpacity: 0.65,
    ambientLight: 'rgba(70, 50, 120, 0.42)',
    ambientIntensity: 0.55,
    shadowLength: 1.2,
    shadowAngle: 0.1,
    shadowOpacity: 0.55,
    stadiumLightsOn: true,
    stadiumLightIntensity: 0.85,
    windowGlowIntensity: 0.85,
    streetlampIntensity: 0.9,
    rimLightIntensity: 0.4,
    warmth: -0.3,
  },
  night: {
    id: 'night',
    name: 'Night Game',
    hour: 22.5,
    skyTop: '#060814',
    skyBottom: '#181b30',
    sunColor: '#111111',
    sunGlowColor: 'rgba(0,0,0,0)',
    sunRadius: 0,
    sunVisible: false,
    moonVisible: true,
    moonColor: '#fffae0',
    moonRadius: 16,
    starsOpacity: 0.95,
    ambientLight: 'rgba(20, 25, 55, 0.62)',
    ambientIntensity: 0.75,
    shadowLength: 0.8,
    shadowAngle: 0,
    shadowOpacity: 0.65,
    stadiumLightsOn: true,
    stadiumLightIntensity: 1.0,
    windowGlowIntensity: 1.0,
    streetlampIntensity: 1.0,
    rimLightIntensity: 0.2,
    warmth: -0.6,
  },
};

/** Get the system's real-time hour (0.00 to 23.99) */
export function getRealTimeHour() {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}

/** Story cycle: each level gets its own time of day, so the "road trip"
 * visually progresses from an afternoon game into a Friday night away game. */
export function getLevelCycleHour(levelId) {
  switch (levelId) {
    case 1:
      return 14.0; // Louisville Slugger Stadium, sunny afternoon
    case 2:
      return 17.0; // Historic Factory, late afternoon
    case 3:
      return 19.2; // Big Four Bridge, golden sunset
    case 4:
      return 20.8; // Downtown Louisville, neon twilight
    case 5:
      return 21.3; // Butchertown, deep dusk (stays readable, not pitch dark)
    case 6:
      return 22.5; // Away game in Cincinnati, under Friday night floodlights
    default:
      return 15.0;
  }
}

/** Compute dynamic lighting parameters for a mode ('cycle' | 'auto' | a preset key). */
export function computeLighting(mode, currentLevelId = 1, manualHour) {
  let targetHour;
  if (mode === 'auto') {
    targetHour = getRealTimeHour();
  } else if (mode === 'cycle') {
    targetHour = getLevelCycleHour(currentLevelId);
  } else if (manualHour !== undefined) {
    targetHour = manualHour;
  } else {
    targetHour = LIGHTING_PRESETS[mode].hour;
  }

  let presetKey = 'day';
  if (targetHour >= 5 && targetHour < 9.5) presetKey = 'sunrise';
  else if (targetHour >= 9.5 && targetHour < 17.5) presetKey = 'day';
  else if (targetHour >= 17.5 && targetHour < 20.0) presetKey = 'goldenHour';
  else if (targetHour >= 20.0 && targetHour < 21.75) presetKey = 'dusk';
  else presetKey = 'night';

  const basePreset = LIGHTING_PRESETS[presetKey];

  const isDaytime = targetHour >= 6 && targetHour <= 20;
  let sunProgress = (targetHour - 6) / 14;
  sunProgress = Math.max(0, Math.min(1, sunProgress));
  const sunX = 40 + sunProgress * (GAME_WIDTH - 80);
  const sunY = 40 + Math.pow((sunProgress - 0.5) * 2, 2) * 110;

  let moonProgress = (targetHour > 18 ? targetHour - 18 : targetHour + 6) / 12;
  moonProgress = Math.max(0, Math.min(1, moonProgress));
  const moonX = 50 + moonProgress * (GAME_WIDTH - 100);
  const moonY = 35 + Math.pow((moonProgress - 0.5) * 2, 2) * 80;

  let shadowLength = basePreset.shadowLength;
  let shadowAngle = basePreset.shadowAngle;
  if (isDaytime) {
    const sunAngleFromNoon = (targetHour - 13) / 7;
    shadowAngle = -sunAngleFromNoon * 0.55;
    shadowLength = 0.4 + Math.abs(sunAngleFromNoon) * 2.2;
  }

  return {
    hour: targetHour,
    mode,
    preset: basePreset,
    skyTop: basePreset.skyTop,
    skyBottom: basePreset.skyBottom,
    ambientColor: basePreset.ambientLight,
    ambientIntensity: basePreset.ambientIntensity,
    sun: {
      x: sunX,
      y: sunY,
      radius: basePreset.sunRadius,
      color: basePreset.sunColor,
      glowColor: basePreset.sunGlowColor,
      visible: basePreset.sunVisible,
    },
    moon: {
      x: moonX,
      y: moonY,
      radius: basePreset.moonRadius,
      color: basePreset.moonColor,
      visible: basePreset.moonVisible,
      phase: 0.75,
    },
    starsAlpha: basePreset.starsOpacity,
    shadowLength,
    shadowAngle,
    shadowOpacity: basePreset.shadowOpacity,
    stadiumLightsOn: basePreset.stadiumLightsOn,
    stadiumLightIntensity: basePreset.stadiumLightIntensity,
    windowGlowIntensity: basePreset.windowGlowIntensity,
    streetlampIntensity: basePreset.streetlampIntensity,
    rimLightIntensity: basePreset.rimLightIntensity,
    warmth: basePreset.warmth,
  };
}

// ---------------------------------------------------------------------------
// Lighting renderer passes
// ---------------------------------------------------------------------------

const STARS = Array.from({ length: 48 }, (_, i) => ({
  x: (i * 73 + 19) % GAME_WIDTH,
  y: (i * 37 + 11) % (GROUND_Y - 50),
  size: i % 3 === 0 ? 1.5 : 1,
  twinkleOffset: i * 1.3,
}));

/** Sky gradient, twinkling stars, sun and moon with soft glows. */
export function drawSkyAndCelestial(ctx, lighting, tick) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  skyGrad.addColorStop(0, lighting.skyTop);
  skyGrad.addColorStop(1, lighting.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, GAME_WIDTH, GROUND_Y);

  if (lighting.starsAlpha > 0.05) {
    ctx.save();
    for (const star of STARS) {
      const twinkle = 0.5 + 0.5 * Math.sin(tick * 2.5 + star.twinkleOffset);
      ctx.fillStyle = `rgba(255, 255, 255, ${lighting.starsAlpha * twinkle})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.restore();
  }

  if (lighting.sun.visible && lighting.sun.radius > 0) {
    ctx.save();
    const sunGlow = ctx.createRadialGradient(
      lighting.sun.x, lighting.sun.y, lighting.sun.radius * 0.4,
      lighting.sun.x, lighting.sun.y, lighting.sun.radius * 3.5
    );
    sunGlow.addColorStop(0, lighting.sun.glowColor);
    sunGlow.addColorStop(1, 'rgba(255, 200, 100, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(lighting.sun.x, lighting.sun.y, lighting.sun.radius * 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = lighting.sun.color;
    ctx.beginPath();
    ctx.arc(lighting.sun.x, lighting.sun.y, lighting.sun.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (lighting.moon.visible && lighting.moon.radius > 0) {
    ctx.save();
    const moonGlow = ctx.createRadialGradient(
      lighting.moon.x, lighting.moon.y, lighting.moon.radius * 0.5,
      lighting.moon.x, lighting.moon.y, lighting.moon.radius * 2.8
    );
    moonGlow.addColorStop(0, 'rgba(230, 240, 255, 0.25)');
    moonGlow.addColorStop(1, 'rgba(200, 220, 255, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(lighting.moon.x, lighting.moon.y, lighting.moon.radius * 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = lighting.moon.color;
    ctx.beginPath();
    ctx.arc(lighting.moon.x, lighting.moon.y, lighting.moon.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(160, 175, 195, 0.28)';
    ctx.beginPath();
    ctx.arc(lighting.moon.x - 3, lighting.moon.y - 2, lighting.moon.radius * 0.35, 0, Math.PI * 2);
    ctx.arc(lighting.moon.x + 3, lighting.moon.y + 3, lighting.moon.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    if (lighting.moon.phase < 0.9) {
      ctx.fillStyle = lighting.skyTop;
      ctx.beginPath();
      ctx.arc(lighting.moon.x + 4, lighting.moon.y - 2, lighting.moon.radius * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/** Soft ground shadows under player/enemies/boss/pickups — multi-source
 * cross-shadows under stadium floodlights, a single directional shadow
 * otherwise. */
export function drawEntityShadows(ctx, entities, camX, lighting) {
  ctx.save();

  if (lighting.stadiumLightsOn && lighting.stadiumLightIntensity > 0.4) {
    const lightSources = [
      { x: 60, intensity: 0.35 * lighting.stadiumLightIntensity },
      { x: 240, intensity: 0.4 * lighting.stadiumLightIntensity },
      { x: 420, intensity: 0.35 * lighting.stadiumLightIntensity },
    ];

    for (const ent of entities) {
      if (!ent || ent.alive === false || ent.collected) continue;
      const screenX = ent.x - camX + ent.w / 2;
      const footY = Math.min(GROUND_Y, ent.y + ent.h);
      if (screenX < -50 || screenX > GAME_WIDTH + 50) continue;

      for (const light of lightSources) {
        const dx = screenX - light.x;
        const shadowOffset = Math.max(-28, Math.min(28, dx * 0.14));
        const shadowW = ent.w * 0.9 + Math.abs(shadowOffset) * 0.4;
        const shadowH = 3.5;

        ctx.fillStyle = `rgba(10, 10, 20, ${light.intensity * lighting.shadowOpacity})`;
        ctx.beginPath();
        ctx.ellipse(screenX + shadowOffset, footY + 1, shadowW / 2, shadowH / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    const length = Math.max(0.3, lighting.shadowLength);
    const angle = lighting.shadowAngle;
    const alpha = lighting.shadowOpacity;

    for (const ent of entities) {
      if (!ent || ent.alive === false || ent.collected) continue;
      const screenX = ent.x - camX + ent.w / 2;
      const footY = Math.min(GROUND_Y, ent.y + ent.h);
      if (screenX < -60 || screenX > GAME_WIDTH + 60) continue;

      const shadowOffsetX = angle * 40 * length;
      const shadowW = ent.w * (0.8 + length * 0.4);
      const shadowH = 3 + length * 1.2;

      ctx.fillStyle = `rgba(12, 12, 22, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.ellipse(screenX + shadowOffsetX, footY + 1, shadowW / 2, shadowH / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/** Volumetric stadium floodlight beams + lens flares, when lights are on. */
export function drawStadiumFloodlightBeams(ctx, lighting, camX, tick) {
  if (!lighting.stadiumLightsOn || lighting.stadiumLightIntensity <= 0.05) return;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const intensity = lighting.stadiumLightIntensity;

  const towerSpacing = 220;
  const startTowerIdx = Math.floor((camX - 100) / towerSpacing);
  const endTowerIdx = Math.ceil((camX + GAME_WIDTH + 100) / towerSpacing);

  for (let i = startTowerIdx; i <= endTowerIdx; i++) {
    const towerWorldX = i * towerSpacing + 60;
    const towerScreenX = towerWorldX - camX * 0.5;
    const towerTopY = 40;

    if (towerScreenX < -100 || towerScreenX > GAME_WIDTH + 100) continue;

    const beamAngle = i % 2 === 0 ? 0.25 : -0.25;
    const groundTargetX = towerScreenX + beamAngle * 120;
    const coneGrad = ctx.createLinearGradient(towerScreenX, towerTopY, groundTargetX, GROUND_Y);
    coneGrad.addColorStop(0, `rgba(255, 255, 235, ${0.45 * intensity})`);
    coneGrad.addColorStop(0.35, `rgba(240, 245, 255, ${0.22 * intensity})`);
    coneGrad.addColorStop(1, `rgba(220, 235, 255, ${0.02 * intensity})`);

    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(towerScreenX - 8, towerTopY);
    ctx.lineTo(towerScreenX + 8, towerTopY);
    ctx.lineTo(groundTargetX + 70, GROUND_Y);
    ctx.lineTo(groundTargetX - 70, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    const flareGrad = ctx.createRadialGradient(towerScreenX, towerTopY, 2, towerScreenX, towerTopY, 24);
    flareGrad.addColorStop(0, `rgba(255, 255, 250, ${0.9 * intensity})`);
    flareGrad.addColorStop(0.3, `rgba(255, 250, 210, ${0.5 * intensity})`);
    flareGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = flareGrad;
    ctx.beginPath();
    ctx.arc(towerScreenX, towerTopY, 24, 0, Math.PI * 2);
    ctx.fill();

    if (intensity > 0.6) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.65 * intensity})`;
      ctx.lineWidth = 1;
      const flareLen = 14 + Math.sin(tick * 4 + i) * 2;
      ctx.beginPath();
      ctx.moveTo(towerScreenX - flareLen, towerTopY);
      ctx.lineTo(towerScreenX + flareLen, towerTopY);
      ctx.moveTo(towerScreenX, towerTopY - flareLen);
      ctx.lineTo(towerScreenX, towerTopY + flareLen);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/** Full-screen ambient color tint + vignette, unifying the scene's mood. */
export function drawAmbientAtmosphereOverlay(ctx, lighting) {
  if (lighting.ambientIntensity <= 0.05) return;

  ctx.save();
  ctx.fillStyle = lighting.ambientColor;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  if (lighting.hour >= 19.5 || lighting.hour < 5.5) {
    const vignette = ctx.createRadialGradient(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH * 0.35,
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH * 0.75
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, `rgba(4, 4, 12, ${0.45 * lighting.ambientIntensity})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  ctx.restore();
}
