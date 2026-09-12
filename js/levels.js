import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y, FIRE_HAZARD_W, FIRE_HAZARD_H } from './constants.js';
import { drawSkyAndCelestial, drawStadiumFloodlightBeams } from './lighting.js';

// ---------------------------------------------------------------------------
// Background painters — layered, parallax-scrolling scenery styled after the
// real Louisville landmarks (plus a generic away-city skyline for the road
// trip finale) for each level, lit by the dynamic time-of-day system in
// lighting.js (each level gets its own hour via the "story cycle": stadium
// in the afternoon -> factory late day -> the bridge at golden sunset ->
// downtown at neon twilight -> the away game under Friday-night floodlights).
// Everything is drawn procedurally — no image assets to load.
// ---------------------------------------------------------------------------

/** Repeat a draw callback across the visible width, offset by parallax. */
function repeatParallax(camX, factor, patternW, renderWidth, draw) {
  const offset = -((camX * factor) % patternW);
  const endIdx = Math.ceil(renderWidth / patternW) + 1;
  for (let i = -1; i <= endIdx; i++) {
    draw(offset + i * patternW, i);
  }
}

const BG = {
  // -------------------------------------------------------------------
  // Louisville Slugger Field: brick depot grandstand, steel light towers,
  // a giant bat leaning in the outfield backdrop, and the downtown skyline.
  // -------------------------------------------------------------------
  stadium(ctx, camX, tick, lighting) {
    drawSkyAndCelestial(ctx, lighting, tick);

    // Drifting cumulus clouds
    repeatParallax(camX, 0.12, 280, GAME_WIDTH, (x, i) => {
      const cloudX = x + Math.sin(tick * 0.2 + i * 1.5) * 8;
      const cloudY = 28 + (i % 3) * 14;
      ctx.save();
      ctx.fillStyle = lighting.hour >= 18 || lighting.hour < 6 ? 'rgba(80, 85, 110, 0.45)' : 'rgba(255, 255, 255, 0.68)';
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, 16, 0, Math.PI * 2);
      ctx.arc(cloudX + 18, cloudY - 6, 20, 0, Math.PI * 2);
      ctx.arc(cloudX + 38, cloudY - 2, 17, 0, Math.PI * 2);
      ctx.arc(cloudX + 54, cloudY + 4, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = lighting.hour >= 18 || lighting.hour < 6 ? 'rgba(50, 55, 80, 0.35)' : 'rgba(215, 225, 235, 0.55)';
      ctx.beginPath();
      ctx.arc(cloudX + 18, cloudY + 6, 16, 0, Math.PI);
      ctx.arc(cloudX + 38, cloudY + 7, 14, 0, Math.PI);
      ctx.fill();
      ctx.restore();
    });

    // Distant downtown skyline silhouettes
    repeatParallax(camX, 0.18, 320, GAME_WIDTH, (x) => {
      ctx.save();
      const skyTone = lighting.hour >= 20 || lighting.hour < 5 ? '#151726' : lighting.hour >= 18 ? '#4a3055' : '#729cb5';
      ctx.fillStyle = skyTone;
      ctx.fillRect(x + 20, 100, 36, 60);
      ctx.beginPath();
      ctx.moveTo(x + 20, 100);
      ctx.lineTo(x + 38, 76);
      ctx.lineTo(x + 56, 100);
      ctx.fill();
      ctx.fillRect(x + 75, 92, 42, 68);
      ctx.beginPath();
      ctx.arc(x + 96, 92, 14, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(x + 130, 115, 28, 45);
      ctx.fillRect(x + 170, 105, 50, 55);
      ctx.fillRect(x + 235, 120, 40, 40);

      if (lighting.windowGlowIntensity > 0.1) {
        ctx.fillStyle = `rgba(255, 225, 120, ${0.75 * lighting.windowGlowIntensity})`;
        for (let r = 0; r < 5; r++) {
          ctx.fillRect(x + 24, 106 + r * 8, 3, 3);
          ctx.fillRect(x + 32, 106 + r * 8, 3, 3);
          ctx.fillRect(x + 82, 102 + r * 9, 4, 3);
          ctx.fillRect(x + 98, 102 + r * 9, 4, 3);
          ctx.fillRect(x + 180, 112 + r * 7, 3, 3);
        }
      }
      ctx.restore();
    });

    // Giant Louisville Slugger bat landmark leaning in the outfield backdrop
    repeatParallax(camX, 0.28, 440, GAME_WIDTH, (x) => {
      ctx.save();
      const batX = x + 340;
      ctx.translate(batX, 70);
      ctx.rotate(-0.22);
      ctx.fillStyle = '#b8894d';
      ctx.fillRect(-6, 0, 12, 75);
      ctx.fillStyle = '#8f6230';
      ctx.fillRect(-6, 0, 3, 75);
      ctx.fillStyle = '#caa369';
      ctx.fillRect(-4, 75, 8, 45);
      ctx.fillStyle = '#a6773b';
      ctx.fillRect(-6, 120, 12, 5);
      ctx.restore();
    });

    // Brick depot grandstand with arches, crowd, and steel light towers
    repeatParallax(camX, 0.45, 180, GAME_WIDTH, (x) => {
      ctx.save();
      ctx.fillStyle = '#6b2628';
      ctx.fillRect(x, 110, 180, 50);
      for (let a = 0; a < 3; a++) {
        const archX = x + 16 + a * 56;
        ctx.fillStyle = '#3a1416';
        ctx.beginPath();
        ctx.arc(archX + 16, 126, 14, Math.PI, 0);
        ctx.fillRect(archX + 2, 126, 28, 34);
        ctx.fill();
        if (lighting.windowGlowIntensity > 0.1) {
          ctx.fillStyle = `rgba(255, 200, 100, ${0.65 * lighting.windowGlowIntensity})`;
          ctx.fillRect(archX + 6, 134, 20, 18);
        }
      }

      ctx.fillStyle = '#22232a';
      ctx.fillRect(x, 88, 180, 24);
      ctx.strokeStyle = '#c4c8cc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, 88);
      ctx.lineTo(x + 180, 88);
      ctx.stroke();

      for (let c = 0; c < 22; c++) {
        const fanX = x + 4 + c * 8;
        const bob = Math.sin(tick * 3 + c * 1.7) > 0.6 ? -1.5 : 0;
        const fanColor = c % 3 === 0 ? '#c8102e' : c % 3 === 1 ? '#5b3aa0' : '#f5f5f0';
        ctx.fillStyle = fanColor;
        ctx.fillRect(fanX, 92 + bob, 5, 4);
        ctx.fillStyle = '#1c1d24';
        ctx.fillRect(fanX - 1, 96 + bob, 7, 6);
      }

      const towerX = x + 140;
      ctx.strokeStyle = '#8a9299';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(towerX - 6, 110);
      ctx.lineTo(towerX - 3, 40);
      ctx.lineTo(towerX + 3, 40);
      ctx.lineTo(towerX + 6, 110);
      for (let yb = 50; yb < 105; yb += 14) {
        ctx.moveTo(towerX - 5, yb);
        ctx.lineTo(towerX + 5, yb + 8);
        ctx.moveTo(towerX + 5, yb);
        ctx.lineTo(towerX - 5, yb + 8);
      }
      ctx.stroke();

      ctx.fillStyle = '#3a4046';
      ctx.fillRect(towerX - 12, 34, 24, 8);
      for (let lx = 0; lx < 4; lx++) {
        const lampX = towerX - 9 + lx * 6;
        ctx.fillStyle = lighting.stadiumLightsOn
          ? `rgba(255, 255, 240, ${0.9 * lighting.stadiumLightIntensity + 0.1})`
          : '#4d555c';
        ctx.fillRect(lampX, 36, 4, 4);
      }
      ctx.restore();
    });

    // Outfield wall with sponsor billboard / scoreboard
    repeatParallax(camX, 0.7, 240, GAME_WIDTH, (x, i) => {
      ctx.save();
      ctx.fillStyle = '#542022';
      ctx.fillRect(x, 150, 240, 44);
      ctx.fillStyle = '#1a5432';
      ctx.fillRect(x, 146, 240, 6);

      if (i % 2 === 0) {
        ctx.fillStyle = '#0f1216';
        ctx.fillRect(x + 12, 154, 100, 26);
        ctx.strokeStyle = '#c9a066';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 12, 154, 100, 26);
        ctx.fillStyle = '#f5f5f0';
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('LOUISVILLE SLUGGER', x + 62, 166);
        ctx.font = '5px monospace';
        ctx.fillStyle = '#c9a066';
        ctx.fillText('GENUINE • 1884', x + 62, 174);
      } else {
        ctx.fillStyle = '#0a0d12';
        ctx.fillRect(x + 10, 152, 110, 30);
        ctx.strokeStyle = '#c8102e';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 10, 152, 110, 30);
        ctx.font = '6px monospace';
        ctx.fillStyle = '#ffd76a';
        ctx.textAlign = 'left';
        ctx.fillText('BATS 4   RIVALS 2', x + 16, 163);
        ctx.fillStyle = '#7ec8ff';
        ctx.fillText('INN 7  ▲  B:3 S:2 O:1', x + 16, 174);
      }
      ctx.restore();
    });

    drawStadiumFloodlightBeams(ctx, lighting, camX, tick);
    drawBaseballTurf(ctx, camX, lighting);
  },

  // -------------------------------------------------------------------
  // INSIDE the Louisville Slugger Factory: a warm-lit workshop floor with
  // overhead pipes and hanging lamps, conveyor belts carrying freshly-turned
  // bats past in the background, stacked timber, and a sawdust-covered floor.
  // -------------------------------------------------------------------
  factory(ctx, camX, tick, lighting) {
    // Warm interior back wall instead of a sky — late-shift lighting still
    // nudges the tone via `lighting`, just without sun/moon/clouds.
    const wallTop = lighting.hour >= 19 ? '#2a2018' : '#352a1f';
    const wallBot = lighting.hour >= 19 ? '#3a2c1e' : '#4a3a28';
    const wallGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    wallGrad.addColorStop(0, wallTop);
    wallGrad.addColorStop(1, wallBot);
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, GROUND_Y);

    // Vertical support beams along the back wall
    repeatParallax(camX, 0.15, 130, GAME_WIDTH, (x) => {
      ctx.fillStyle = 'rgba(20, 14, 10, 0.55)';
      ctx.fillRect(x, 0, 10, GROUND_Y);
    });

    // Overhead pipe/duct run with hanging work lamps
    repeatParallax(camX, 0.25, 140, GAME_WIDTH, (x, i) => {
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(x, 22, 140, 7);
      ctx.fillStyle = '#333';
      ctx.fillRect(x + 30, 29, 3, 6);
      ctx.fillRect(x + 95, 29, 3, 6);

      // hanging lamp
      const lampX = x + 60;
      const lampY = 46;
      ctx.fillStyle = '#1a1512';
      ctx.fillRect(lampX - 1, 29, 2, 12);
      ctx.fillStyle = '#caa066';
      ctx.beginPath();
      ctx.moveTo(lampX - 8, lampY);
      ctx.lineTo(lampX + 8, lampY);
      ctx.lineTo(lampX + 5, lampY + 6);
      ctx.lineTo(lampX - 5, lampY + 6);
      ctx.fill();
      const glow = ctx.createRadialGradient(lampX, lampY + 8, 2, lampX, lampY + 8, 34);
      const glowAlpha = 0.5 + 0.3 * lighting.windowGlowIntensity;
      glow.addColorStop(0, `rgba(255, 210, 130, ${glowAlpha})`);
      glow.addColorStop(1, 'rgba(255, 210, 130, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(lampX, lampY + 10, 34, 0, Math.PI * 2);
      ctx.fill();
    });

    // Background stock shelves of stacked bat blanks
    repeatParallax(camX, 0.35, 170, GAME_WIDTH, (x) => {
      ctx.fillStyle = '#3a2e22';
      ctx.fillRect(x, 96, 70, 60);
      for (let row = 0; row < 5; row++) {
        ctx.fillStyle = row % 2 === 0 ? '#caa066' : '#b58b4f';
        ctx.fillRect(x + 4, 100 + row * 11, 62, 6);
      }
    });

    drawFactoryConveyor(ctx, camX, tick, 168, { factor: 0.55, speed: 26, spacing: 46, flip: false });
    drawFactoryConveyor(ctx, camX, tick, 190, { factor: 0.8, speed: -34, spacing: 40, flip: true });

    // Sawdust-covered wood-plank factory floor
    ctx.save();
    const floorTop = lighting.hour >= 19 ? '#5c4630' : '#6e5438';
    const floorBase = lighting.hour >= 19 ? '#3a2c1d' : '#463522';
    ctx.fillStyle = floorTop;
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, 6);
    repeatParallax(camX, 1.0, 26, GAME_WIDTH, (x) => {
      ctx.fillStyle = 'rgba(20, 14, 8, 0.35)';
      ctx.fillRect(x, GROUND_Y, 2, 6);
    });
    ctx.fillStyle = floorBase;
    ctx.fillRect(0, GROUND_Y + 6, GAME_WIDTH, GAME_HEIGHT - GROUND_Y - 6);
    // sawdust specks
    repeatParallax(camX, 1.0, 18, GAME_WIDTH, (x, i) => {
      ctx.fillStyle = 'rgba(210, 175, 120, 0.55)';
      ctx.fillRect(x + (i % 3) * 5, GROUND_Y + 9 + (i % 2) * 4, 2, 1.5);
    });
    ctx.restore();
  },

  // -------------------------------------------------------------------
  // Big Four Walking Bridge over the Ohio River: river bluffs, a passing
  // riverboat, the bridge's steel truss arches (with LED lighting at
  // night), wooden deck promenade with lampposts.
  // -------------------------------------------------------------------
  bridge(ctx, camX, tick, lighting) {
    drawSkyAndCelestial(ctx, lighting, tick);

    repeatParallax(camX, 0.15, 300, GAME_WIDTH, (x) => {
      ctx.save();
      const hillTone = lighting.hour >= 20 || lighting.hour < 5 ? '#15202b' : lighting.hour >= 18 ? '#404555' : '#6d8a9e';
      ctx.fillStyle = hillTone;
      ctx.beginPath();
      ctx.moveTo(x, 145);
      ctx.quadraticCurveTo(x + 80, 125, x + 160, 142);
      ctx.quadraticCurveTo(x + 230, 120, x + 300, 145);
      ctx.lineTo(x + 300, 165);
      ctx.lineTo(x, 165);
      ctx.fill();

      const treeTone = lighting.hour >= 19 || lighting.hour < 6 ? '#13281d' : '#2b5c3e';
      ctx.fillStyle = treeTone;
      for (let t = 0; t < 6; t++) {
        ctx.beginPath();
        ctx.arc(x + 25 + t * 45, 142, 14, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    ctx.save();
    const waterGrad = ctx.createLinearGradient(0, 155, 0, GROUND_Y);
    if (lighting.hour >= 20 || lighting.hour < 5) {
      waterGrad.addColorStop(0, '#0f1828');
      waterGrad.addColorStop(1, '#1b2c45');
    } else if (lighting.hour >= 17.5) {
      waterGrad.addColorStop(0, '#4a2642');
      waterGrad.addColorStop(0.6, '#b85433');
      waterGrad.addColorStop(1, '#e0833a');
    } else {
      waterGrad.addColorStop(0, '#35688f');
      waterGrad.addColorStop(1, '#5390bd');
    }
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 155, GAME_WIDTH, GROUND_Y - 155);

    // Passing riverboat
    repeatParallax(camX, 0.35, 480, GAME_WIDTH, (x) => {
      const boatX = x + 180;
      const boatY = 162 + Math.sin(tick * 1.5) * 1.5;
      ctx.fillStyle = '#1e242b';
      ctx.fillRect(boatX, boatY + 6, 44, 8);
      ctx.fillStyle = '#f0f3f5';
      ctx.fillRect(boatX + 12, boatY - 2, 18, 9);
      ctx.fillStyle = '#c8102e';
      ctx.fillRect(boatX + 24, boatY - 7, 4, 6);
      ctx.fillStyle = '#39ff14';
      ctx.fillRect(boatX + 42, boatY + 6, 2, 2);
      ctx.fillStyle = '#ff3131';
      ctx.fillRect(boatX, boatY + 6, 2, 2);
    });

    // Reflective river ripples
    repeatParallax(camX, 0.75, 48, GAME_WIDTH, (x, i) => {
      const waveY = 168 + (i % 5) * 8 + Math.sin(tick * 3 + x) * 2;
      const waveW = 18 + (i % 3) * 10;
      ctx.fillStyle = lighting.hour >= 18 && lighting.hour < 20
        ? 'rgba(255, 215, 120, 0.45)'
        : lighting.hour >= 20 || lighting.hour < 5
        ? 'rgba(200, 230, 255, 0.22)'
        : 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(x, waveY, waveW, 2);
    });
    ctx.restore();

    // Big Four Bridge steel through-truss — solid blocky beam segments (a
    // stepped arch of straight members, not a smooth curve) in the same
    // rust-steel finish as the foreground beams, for a cohesive look.
    repeatParallax(camX, 0.55, 200, GAME_WIDTH, (x) => {
      ctx.save();
      ctx.fillStyle = '#54585c';
      ctx.fillRect(x + 185, 150, 28, GROUND_Y - 150 + 10);
      ctx.fillStyle = '#3e4246';
      ctx.fillRect(x + 183, 146, 32, 5);

      const baseY = GROUND_Y - 8;
      // Stepped-arch top-chord nodes: a blocky hump, not a bezier curve.
      const nodeX = [0, 40, 80, 120, 160, 200].map((n) => x + n);
      const topY = [126, 92, 62, 62, 92, 126];
      const ledOn = lighting.stadiumLightsOn || lighting.hour >= 19.5 || lighting.hour < 6;
      const ledColor = ledOn ? `hsl(${(tick * 40 + x * 0.5) % 360}, 85%, 60%)` : null;

      // Bottom chord (one solid beam the full span)
      drawTrussBeam(ctx, x, baseY, x + 200, baseY, 6, '#4a2f22', '#6b4630');
      // Top chord segments (the stepped arch)
      for (let i = 0; i < nodeX.length - 1; i++) {
        drawTrussBeam(ctx, nodeX[i], topY[i], nodeX[i + 1], topY[i + 1], 6, '#4a2f22', ledColor || '#6b4630');
      }
      // Verticals + diagonals (Warren-style zigzag) between the chords
      for (let i = 0; i < nodeX.length; i++) {
        drawTrussBeam(ctx, nodeX[i], topY[i], nodeX[i], baseY, 4, '#3e2a1e', '#5a3c2a');
        if (i < nodeX.length - 1) {
          drawTrussBeam(ctx, nodeX[i], topY[i], nodeX[i + 1], baseY, 3.5, '#3e2a1e', '#5a3c2a');
        }
      }
      // Rivets at every joint
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      for (let i = 0; i < nodeX.length; i++) {
        ctx.beginPath();
        ctx.arc(nodeX[i], topY[i], 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(nodeX[i], baseY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Wooden deck promenade with lampposts
    ctx.save();
    const deckTop = lighting.hour >= 19 || lighting.hour < 6 ? '#54463a' : '#8f7762';
    const deckBase = lighting.hour >= 19 || lighting.hour < 6 ? '#332920' : '#574636';
    ctx.fillStyle = deckTop;
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, 6);
    ctx.fillStyle = deckBase;
    ctx.fillRect(0, GROUND_Y + 6, GAME_WIDTH, GAME_HEIGHT - GROUND_Y - 6);

    repeatParallax(camX, 1.0, 14, GAME_WIDTH, (x) => {
      ctx.fillStyle = 'rgba(20, 15, 10, 0.4)';
      ctx.fillRect(x, GROUND_Y, 1.5, 6);
    });

    repeatParallax(camX, 0.9, 110, GAME_WIDTH, (x) => {
      const lampX = x + 40;
      ctx.fillStyle = '#1c2024';
      ctx.fillRect(lampX, GROUND_Y - 32, 3, 32);
      ctx.fillRect(lampX - 4, GROUND_Y - 35, 11, 4);

      if (lighting.streetlampIntensity > 0.1) {
        const lampGrad = ctx.createRadialGradient(lampX + 1, GROUND_Y - 34, 1, lampX + 1, GROUND_Y - 34, 18);
        lampGrad.addColorStop(0, `rgba(255, 235, 160, ${0.85 * lighting.streetlampIntensity})`);
        lampGrad.addColorStop(0.4, `rgba(255, 200, 100, ${0.4 * lighting.streetlampIntensity})`);
        lampGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
        ctx.fillStyle = lampGrad;
        ctx.beginPath();
        ctx.arc(lampX + 1, GROUND_Y - 34, 18, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  },

  // -------------------------------------------------------------------
  // Downtown Louisville skyline: 400 West Market's cathedral dome, the
  // Humana Building's cantilever, neon entertainment marquees, streetlamps.
  // -------------------------------------------------------------------
  downtown(ctx, camX, tick, lighting) {
    drawSkyAndCelestial(ctx, lighting, tick);

    repeatParallax(camX, 0.18, 260, GAME_WIDTH, (x) => {
      ctx.save();
      const skyBldgTone = lighting.hour >= 20 || lighting.hour < 5 ? '#151424' : lighting.hour >= 18 ? '#3d2547' : '#57556f';
      ctx.fillStyle = skyBldgTone;

      const aegonX = x + 15;
      ctx.fillRect(aegonX, 60, 48, 140);
      ctx.beginPath();
      ctx.arc(aegonX + 24, 60, 20, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(aegonX + 22, 34, 4, 10);

      const humanaX = x + 110;
      ctx.fillRect(humanaX, 68, 56, 132);
      ctx.beginPath();
      ctx.arc(humanaX + 28, 68, 18, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(humanaX - 6, 78, 68, 6);

      ctx.fillRect(x + 195, 82, 44, 118);

      if (lighting.windowGlowIntensity > 0.1) {
        ctx.fillStyle = `rgba(255, 230, 140, ${0.7 * lighting.windowGlowIntensity})`;
        ctx.fillRect(aegonX + 16, 48, 16, 5);
        for (let r = 0; r < 8; r++) {
          ctx.fillRect(aegonX + 8, 70 + r * 14, 6, 5);
          ctx.fillRect(aegonX + 22, 70 + r * 14, 6, 5);
          ctx.fillRect(aegonX + 36, 70 + r * 14, 6, 5);
          ctx.fillRect(humanaX + 10, 88 + r * 12, 8, 5);
          ctx.fillRect(humanaX + 28, 88 + r * 12, 8, 5);
          ctx.fillRect(humanaX + 44, 88 + r * 12, 8, 5);
        }
      }

      const blink = Math.sin(tick * 3) > 0.2;
      if (blink) {
        ctx.fillStyle = '#ff2222';
        ctx.fillRect(aegonX + 23, 33, 2, 2);
        ctx.fillRect(humanaX + 27, 49, 2, 2);
      }
      ctx.restore();
    });

    // Mid-rise buildings with neon marquees
    repeatParallax(camX, 0.45, 180, GAME_WIDTH, (x, i) => {
      ctx.save();
      const bldgTone = lighting.hour >= 20 || lighting.hour < 5 ? '#242336' : lighting.hour >= 18 ? '#4d3959' : '#69647d';
      ctx.fillStyle = bldgTone;
      ctx.fillRect(x, 110, 140, 94);
      ctx.fillStyle = '#1d1b2b';
      ctx.fillRect(x - 2, 107, 144, 4);

      if (i % 2 === 0) {
        ctx.fillStyle = '#11131a';
        ctx.fillRect(x + 15, 145, 110, 20);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 15, 145, 110, 20);
        ctx.font = 'bold 7px sans-serif';
        ctx.fillStyle = '#00f0ff';
        ctx.textAlign = 'center';
        ctx.fillText('★ 4TH STREET LIVE! ★', x + 70, 158);
      } else {
        ctx.fillStyle = '#1a0b12';
        ctx.fillRect(x + 20, 146, 100, 18);
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 20, 146, 100, 18);
        ctx.font = 'bold 6px sans-serif';
        ctx.fillStyle = '#ff5599';
        ctx.textAlign = 'center';
        ctx.fillText('LOUISVILLE PALACE', x + 70, 158);
      }
      ctx.restore();
    });

    // Street: curb, crosswalk, streetlamps
    ctx.save();
    const roadTop = lighting.hour >= 19 || lighting.hour < 6 ? '#282830' : '#454550';
    const roadBase = lighting.hour >= 19 || lighting.hour < 6 ? '#181820' : '#282830';
    ctx.fillStyle = roadTop;
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);

    ctx.fillStyle = '#6b6b78';
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, 4);

    repeatParallax(camX, 1.0, 36, GAME_WIDTH, (x) => {
      ctx.fillStyle = '#f5f5f0';
      ctx.fillRect(x, GROUND_Y + 8, 20, 3);
    });

    repeatParallax(camX, 0.85, 120, GAME_WIDTH, (x) => {
      const lx = x + 30;
      ctx.fillStyle = '#181920';
      ctx.fillRect(lx, GROUND_Y - 38, 3, 38);
      ctx.fillRect(lx - 4, GROUND_Y - 42, 11, 4);

      if (lighting.streetlampIntensity > 0.1) {
        const lampGrad = ctx.createRadialGradient(lx + 1, GROUND_Y - 40, 2, lx + 1, GROUND_Y - 40, 22);
        lampGrad.addColorStop(0, `rgba(255, 240, 180, ${0.9 * lighting.streetlampIntensity})`);
        lampGrad.addColorStop(0.45, `rgba(255, 200, 100, ${0.35 * lighting.streetlampIntensity})`);
        lampGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
        ctx.fillStyle = lampGrad;
        ctx.beginPath();
        ctx.arc(lx + 1, GROUND_Y - 40, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 220, 140, ${0.18 * lighting.streetlampIntensity})`;
        ctx.beginPath();
        ctx.ellipse(lx + 1, GROUND_Y + 2, 28, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.fillStyle = roadBase;
    ctx.fillRect(0, GROUND_Y + 18, GAME_WIDTH, GAME_HEIGHT - GROUND_Y - 18);
    ctx.restore();
  },

  // -------------------------------------------------------------------
  // Butchertown: a historic brick street with the pork rendering plant
  // looming behind a chain-link fence, loading docks, and a faintly
  // greenish haze drifting from its stacks.
  // -------------------------------------------------------------------
  butchertown(ctx, camX, tick, lighting) {
    drawSkyAndCelestial(ctx, lighting, tick);

    // The rendering plant itself, far back
    repeatParallax(camX, 0.18, 300, GAME_WIDTH, (x) => {
      ctx.save();
      const plantTone = lighting.hour >= 20 || lighting.hour < 5 ? '#171a1e' : lighting.hour >= 18 ? '#2c2f33' : '#3f4348';
      ctx.fillStyle = plantTone;
      ctx.fillRect(x, 90, 260, 110);
      ctx.fillStyle = '#252a2e';
      ctx.fillRect(x - 4, 86, 268, 6);

      // three squat smokestacks with a faint sickly-green haze
      for (let s = 0; s < 3; s++) {
        const sx = x + 30 + s * 90;
        ctx.fillStyle = '#33383d';
        ctx.fillRect(sx, 55, 16, 38);
        for (let p = 0; p < 3; p++) {
          const age = (tick * 0.6 + s * 0.7 + p) % 2.2;
          const prog = age / 2.2;
          const puffX = sx + 8 + Math.sin(tick * 0.7 + s + p) * 8;
          const puffY = 52 - prog * 40;
          const puffR = 5 + prog * 10;
          const alpha = Math.max(0, 0.32 * (1 - prog));
          ctx.fillStyle = `rgba(150, 190, 120, ${alpha})`;
          ctx.beginPath();
          ctx.arc(puffX, puffY, puffR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // grid of small dark windows
      if (lighting.windowGlowIntensity > 0.1) {
        ctx.fillStyle = `rgba(200, 220, 180, ${0.5 * lighting.windowGlowIntensity})`;
        for (let r = 0; r < 4; r++)
          for (let c = 0; c < 8; c++) {
            if ((r + c) % 3 === 0) ctx.fillRect(x + 14 + c * 30, 100 + r * 20, 10, 10);
          }
      }
      ctx.restore();
    });

    // Chain-link fence between the street and the plant yard
    repeatParallax(camX, 0.5, 24, GAME_WIDTH, (x) => {
      ctx.strokeStyle = 'rgba(140, 140, 140, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 172);
      ctx.lineTo(x + 12, 196);
      ctx.moveTo(x + 12, 172);
      ctx.lineTo(x, 196);
      ctx.stroke();
    });
    ctx.fillStyle = 'rgba(90, 90, 90, 0.6)';
    ctx.fillRect(0, 170, GAME_WIDTH, 3);
    ctx.fillRect(0, 195, GAME_WIDTH, 3);

    // Loading dock with a parked delivery truck and stacked barrels
    repeatParallax(camX, 0.4, 260, GAME_WIDTH, (x) => {
      ctx.save();
      ctx.fillStyle = '#4a4038';
      ctx.fillRect(x + 10, 150, 90, 50);
      // truck
      ctx.fillStyle = '#8a1f24';
      ctx.fillRect(x + 130, 158, 64, 32);
      ctx.fillStyle = '#d8d8d4';
      ctx.fillRect(x + 130, 158, 20, 32);
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(x + 142, 190, 5, 0, Math.PI * 2);
      ctx.arc(x + 182, 190, 5, 0, Math.PI * 2);
      ctx.fill();
      // stacked barrels
      for (let b = 0; b < 3; b++) {
        ctx.fillStyle = b % 2 === 0 ? '#6b5a3a' : '#7a6944';
        ctx.fillRect(x + 20 + b * 22, 168, 16, 20);
        ctx.fillStyle = '#3a3020';
        ctx.fillRect(x + 20 + b * 22, 172, 16, 2);
      }
      ctx.restore();
    });

    // Historic brick street
    ctx.save();
    const brickTop = lighting.hour >= 19 || lighting.hour < 6 ? '#3a2624' : '#5c3c38';
    const brickBase = lighting.hour >= 19 || lighting.hour < 6 ? '#241614' : '#3a2622';
    ctx.fillStyle = brickTop;
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, 6);
    repeatParallax(camX, 1.0, 18, GAME_WIDTH, (x, i) => {
      ctx.fillStyle = 'rgba(20, 10, 8, 0.35)';
      ctx.fillRect(x + (i % 2) * 9, GROUND_Y + 1, 16, 2);
    });
    ctx.fillStyle = brickBase;
    ctx.fillRect(0, GROUND_Y + 6, GAME_WIDTH, GAME_HEIGHT - GROUND_Y - 6);
    ctx.restore();
  },

  // -------------------------------------------------------------------
  // Away game — Columbus Clippers' home turf: a generic downtown skyline,
  // a river overlook, and the iconic power-stack smokestacks with shooting
  // flames shared with the home stadium's design language.
  // -------------------------------------------------------------------
  clippersStadium(ctx, camX, tick, lighting) {
    drawSkyAndCelestial(ctx, lighting, tick);

    repeatParallax(camX, 0.16, 280, GAME_WIDTH, (x) => {
      ctx.save();
      const awayTone = lighting.hour >= 20 || lighting.hour < 5 ? '#101726' : lighting.hour >= 18 ? '#332742' : '#526982';
      ctx.fillStyle = awayTone;

      const towerX = x + 30;
      ctx.fillRect(towerX, 60, 50, 130);
      ctx.beginPath();
      ctx.moveTo(towerX, 60);
      ctx.lineTo(towerX + 12, 38);
      ctx.lineTo(towerX + 25, 48);
      ctx.lineTo(towerX + 38, 38);
      ctx.lineTo(towerX + 50, 60);
      ctx.fill();

      ctx.fillRect(x + 110, 72, 40, 118);
      ctx.fillRect(x + 180, 85, 36, 105);

      const bridgeX = x + 80;
      ctx.strokeStyle = '#5a6b7d';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#3a4450';
      ctx.fillRect(bridgeX, 90, 22, 60);
      ctx.beginPath();
      ctx.moveTo(bridgeX - 60, 135);
      ctx.quadraticCurveTo(bridgeX - 30, 150, bridgeX, 95);
      ctx.quadraticCurveTo(bridgeX + 30, 150, bridgeX + 60, 135);
      ctx.stroke();

      if (lighting.windowGlowIntensity > 0.2) {
        ctx.strokeStyle = `rgba(180, 230, 255, ${0.8 * lighting.windowGlowIntensity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    });

    // Riverboat "power stacks" with shooting flames + stadium seating + videoboard
    repeatParallax(camX, 0.45, 240, GAME_WIDTH, (x) => {
      ctx.save();
      for (let stack = 0; stack < 2; stack++) {
        const psX = x + 50 + stack * 28;
        ctx.fillStyle = '#f0f3f6';
        ctx.fillRect(psX, 70, 16, 80);
        ctx.fillStyle = '#c8102e';
        ctx.fillRect(psX - 2, 68, 20, 4);

        const flameHeight = 16 + Math.sin(tick * 10 + stack) * 8;
        const flameGrad = ctx.createLinearGradient(psX + 8, 68, psX + 8, 68 - flameHeight);
        flameGrad.addColorStop(0, '#ffff00');
        flameGrad.addColorStop(0.5, '#ff6600');
        flameGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(psX + 1, 68);
        ctx.lineTo(psX + 8, 68 - flameHeight);
        ctx.lineTo(psX + 15, 68);
        ctx.fill();
      }

      ctx.fillStyle = '#8f0d20';
      ctx.fillRect(x + 110, 95, 120, 65);
      ctx.fillStyle = '#c8102e';
      for (let row = 0; row < 6; row++) {
        ctx.fillRect(x + 114, 100 + row * 9, 112, 4);
      }

      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(x + 120, 60, 90, 32);
      ctx.strokeStyle = '#c8102e';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 120, 60, 90, 32);
      ctx.font = 'bold 7px sans-serif';
      ctx.fillStyle = '#ffdd00';
      ctx.textAlign = 'center';
      ctx.fillText('AWAY GAME: COLUMBUS', x + 165, 72);
      ctx.font = '5px monospace';
      ctx.fillStyle = '#f5f5f0';
      ctx.fillText('BATS VS RIVALS', x + 165, 82);
      ctx.restore();
    });

    drawStadiumFloodlightBeams(ctx, lighting, camX, tick);
    drawBaseballTurf(ctx, camX, lighting);
  },

  ending(ctx, camX, tick) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    skyGrad.addColorStop(0, '#2d1b4e');
    skyGrad.addColorStop(0.35, '#9d3266');
    skyGrad.addColorStop(0.65, '#e3683a');
    skyGrad.addColorStop(1, '#ffc04d');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#fff4d0';
    ctx.beginPath();
    ctx.arc(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 18, 48, 0, Math.PI * 2);
    ctx.fill();

    const riverGrad = ctx.createLinearGradient(0, GAME_HEIGHT - 65, 0, GAME_HEIGHT);
    riverGrad.addColorStop(0, 'rgba(180, 70, 50, 0.85)');
    riverGrad.addColorStop(1, 'rgba(255, 180, 80, 0.95)');
    ctx.fillStyle = riverGrad;
    ctx.fillRect(0, GAME_HEIGHT - 65, GAME_WIDTH, 65);

    ctx.strokeStyle = '#221428';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT - 60);
    ctx.quadraticCurveTo(GAME_WIDTH * 0.25, GAME_HEIGHT - 85, GAME_WIDTH * 0.5, GAME_HEIGHT - 60);
    ctx.quadraticCurveTo(GAME_WIDTH * 0.75, GAME_HEIGHT - 85, GAME_WIDTH, GAME_HEIGHT - 60);
    ctx.stroke();

    // A swirl of little bats flying off into the twilight sky
    for (let b = 0; b < 12; b++) {
      const batX = ((b * 44 + tick * 35) % (GAME_WIDTH + 60)) - 30;
      const batY = 50 + (b % 4) * 22 + Math.sin(tick * 5 + b) * 12;
      const flap = Math.sin(tick * 16 + b) > 0;
      ctx.fillStyle = '#160d20';
      ctx.beginPath();
      ctx.ellipse(batX, batY, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(batX - 4, batY);
      ctx.lineTo(batX - 8, flap ? batY - 4 : batY + 4);
      ctx.lineTo(batX - 1, batY);
      ctx.moveTo(batX + 4, batY);
      ctx.lineTo(batX + 8, flap ? batY - 4 : batY + 4);
      ctx.lineTo(batX + 1, batY);
      ctx.stroke();
    }
  },
};

/**
 * A conveyor belt running the width of the screen with little bats sliding
 * along it — independent of camera parallax, the bats keep flowing over
 * time via `speed` (world px/s; negative runs right-to-left).
 */
function drawFactoryConveyor(ctx, camX, tick, y, opts) {
  const { factor, speed, spacing, flip } = opts;
  ctx.save();

  // Belt structure (parallaxes with camera like everything else on this layer)
  repeatParallax(camX, factor, 90, GAME_WIDTH, (x) => {
    ctx.fillStyle = '#241c14';
    ctx.fillRect(x + 6, y + 10, 6, 22);
    ctx.fillRect(x + 66, y + 10, 6, 22);
  });
  ctx.fillStyle = '#3a3028';
  ctx.fillRect(0, y, GAME_WIDTH, 10);
  ctx.fillStyle = '#161210';
  ctx.fillRect(0, y + 8, GAME_WIDTH, 2);

  // Bats flowing along the belt: parallax offset (camera) plus a continuous
  // time-based shift (the belt actually moving), combined in one modulo.
  const shift = camX * factor - tick * speed;
  const offset = -(shift % spacing);
  const count = Math.ceil(GAME_WIDTH / spacing) + 2;
  for (let i = -1; i <= count; i++) {
    const bx = offset + i * spacing + 20;
    ctx.save();
    ctx.translate(bx, y - 2);
    if (flip) ctx.scale(-1, 1);
    ctx.rotate(-0.08);
    ctx.fillStyle = '#caa066';
    ctx.fillRect(-14, -2, 22, 4);
    ctx.fillStyle = '#8f6834';
    ctx.fillRect(8, -2, 6, 4);
    ctx.restore();
  }
  ctx.restore();
}

/** A solid rectangular steel-beam segment between two points, any angle —
 * chunky and outlined, matching the foreground bridge beams' style. */
function drawTrussBeam(ctx, x1, y1, x2, y2, thickness, edgeColor, faceColor) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * (thickness / 2);
  const ny = (dx / len) * (thickness / 2);
  ctx.beginPath();
  ctx.moveTo(x1 + nx, y1 + ny);
  ctx.lineTo(x2 + nx, y2 + ny);
  ctx.lineTo(x2 - nx, y2 - ny);
  ctx.lineTo(x1 - nx, y1 - ny);
  ctx.closePath();
  ctx.fillStyle = faceColor;
  ctx.fill();
  ctx.strokeStyle = edgeColor;
  ctx.lineWidth = 1;
  ctx.stroke();
}

/** Clay warning track + mowed-stripe turf, shared by both stadium levels. */
function drawBaseballTurf(ctx, camX, lighting) {
  ctx.save();
  ctx.fillStyle = '#9e5e32';
  ctx.fillRect(0, 190, GAME_WIDTH, 14);
  ctx.fillStyle = '#7d4620';
  ctx.fillRect(0, 190, GAME_WIDTH, 2);

  const turfBase = lighting.hour >= 20 || lighting.hour < 5 ? '#1b4028' : lighting.hour >= 18 ? '#2e633a' : '#3c8546';
  const turfStripe = lighting.hour >= 20 || lighting.hour < 5 ? '#244f33' : lighting.hour >= 18 ? '#397847' : '#499b54';

  ctx.fillStyle = turfBase;
  ctx.fillRect(0, 204, GAME_WIDTH, GROUND_Y - 204 + 6);

  repeatParallax(camX, 1.0, 32, GAME_WIDTH, (x) => {
    ctx.fillStyle = turfStripe;
    ctx.beginPath();
    ctx.moveTo(x, 204);
    ctx.lineTo(x + 16, 204);
    ctx.lineTo(x + 6, GROUND_Y);
    ctx.lineTo(x - 10, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  });

  repeatParallax(camX, 1.0, 24, GAME_WIDTH, (x) => {
    ctx.fillStyle = '#f5f5f0';
    ctx.fillRect(x, GROUND_Y - 2, 12, 2);
  });

  const dirtTop = lighting.hour >= 19 || lighting.hour < 6 ? '#422818' : '#6e4425';
  const dirtBase = lighting.hour >= 19 || lighting.hour < 6 ? '#26160c' : '#402613';
  ctx.fillStyle = dirtTop;
  ctx.fillRect(0, GROUND_Y + 6, GAME_WIDTH, 8);
  ctx.fillStyle = dirtBase;
  ctx.fillRect(0, GROUND_Y + 14, GAME_WIDTH, GAME_HEIGHT - GROUND_Y - 14);

  ctx.restore();
}

export function drawBackground(ctx, level, camX, tick, lighting) {
  BG[level.bg](ctx, camX, tick, lighting);
}
export function drawEndingBackground(ctx, tick) {
  BG.ending(ctx, 0, tick);
}

/**
 * Big Four Bridge only: occasionally sweep a big steel support beam across
 * the whole foreground, as if you're walking right past one of the truss's
 * diagonal members — closer to the camera than anything else on screen, so
 * it briefly obstructs the view the way the real structure would from
 * outside/beside the bridge. Drawn on top of everything except the HUD.
 */
export function drawBridgeForegroundBeams(ctx, camX, tick) {
  const patternW = 950;
  const beamW = 46;
  const lean = 30; // px the beam tilts from top to bottom

  repeatParallax(camX, 1.25, patternW, GAME_WIDTH, (x) => {
    const beamX = x + 60;
    if (beamX + lean < -beamW || beamX > GAME_WIDTH + beamW) return;

    ctx.save();
    const grad = ctx.createLinearGradient(beamX, 0, beamX + beamW, 0);
    grad.addColorStop(0, 'rgba(8, 6, 5, 0.96)');
    grad.addColorStop(0.4, 'rgba(58, 36, 26, 0.95)');
    grad.addColorStop(0.6, 'rgba(94, 62, 42, 0.92)');
    grad.addColorStop(1, 'rgba(8, 6, 5, 0.96)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(beamX, 0);
    ctx.lineTo(beamX + beamW, 0);
    ctx.lineTo(beamX + beamW + lean, GAME_HEIGHT);
    ctx.lineTo(beamX + lean, GAME_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Rivets down the centerline, sunlight catching one edge
    ctx.fillStyle = 'rgba(255, 220, 180, 0.12)';
    ctx.fillRect(beamX + beamW - 6, 0, 3, GAME_HEIGHT);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    for (let ry = 14; ry < GAME_HEIGHT; ry += 30) {
      const t = ry / GAME_HEIGHT;
      const rx = beamX + beamW / 2 + lean * t;
      ctx.beginPath();
      ctx.arc(rx, ry, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
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
  // Max jump rise is ~37px (JUMP_VELOCITY^2 / 2*GRAVITY), so pickups need to
  // sit well under that from a flat-ground jump, not just "up in the air".
  const bugSpawns = spread(cfg.bugCount, 200, bossArenaStart - 100).map((x) => ({
    kind: 'bug',
    x,
    y: GROUND_Y - 34,
  }));
  const goldBugSpawns = spread(cfg.goldBugCount, 400, bossArenaStart - 200).map((x) => ({
    kind: 'goldbug',
    x,
    y: GROUND_Y - 44,
  }));
  const pickupSpawns = [...bugSpawns, ...goldBugSpawns];
  if (cfg.endPowerup) {
    pickupSpawns.push({ kind: 'bat', x: bossArenaStart + 60, y: GROUND_Y - 50 });
  }

  const hazards = (cfg.hazardXs || []).map((x) => ({
    x,
    y: GROUND_Y - FIRE_HAZARD_H,
    w: FIRE_HAZARD_W,
    h: FIRE_HAZARD_H,
  }));

  return {
    id: cfg.id,
    name: cfg.name,
    bg: cfg.bg,
    width: cfg.width,
    maxHp: cfg.maxHp,
    platforms: cfg.platforms,
    hazards,
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
    maxHp: 6,
    enemyType: 'baseball',
    enemyCount: 6,
    bugCount: 5,
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
    maxHp: 7,
    enemyType: 'worker',
    enemyCount: 7,
    bugCount: 5,
    goldBugCount: 1,
    bossKey: 'worker_boss',
    endPowerup: true,
    hazardXs: [750, 1350, 1900, 2420],
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
    maxHp: 8,
    enemyType: 'jogger',
    enemyCount: 8,
    bugCount: 6,
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
    maxHp: 9,
    enemyType: 'suit',
    enemyCount: 9,
    bugCount: 6,
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
    name: 'Butchertown',
    bg: 'butchertown',
    width: 4400,
    maxHp: 10,
    enemyType: 'pig',
    enemyCount: 10,
    bugCount: 7,
    goldBugCount: 2,
    bossKey: 'butcher_boss',
    platforms: [
      { x: 490, y: GROUND_Y - 40, w: 80 },
      { x: 1080, y: GROUND_Y - 50, w: 60 },
      { x: 1680, y: GROUND_Y - 40, w: 80 },
      { x: 2280, y: GROUND_Y - 50, w: 70 },
      { x: 2900, y: GROUND_Y - 40, w: 80 },
      { x: 3480, y: GROUND_Y - 50, w: 70 },
    ],
  }),
  buildLevel({
    id: 6,
    name: 'Away Game: Columbus',
    bg: 'clippersStadium',
    width: 4900,
    maxHp: 11,
    enemyType: 'clippersplayer',
    enemyCount: 11,
    bugCount: 7,
    goldBugCount: 3,
    bossKey: 'mascot_boss',
    platforms: [
      { x: 500, y: GROUND_Y - 40, w: 80 },
      { x: 1100, y: GROUND_Y - 50, w: 60 },
      { x: 1700, y: GROUND_Y - 40, w: 80 },
      { x: 2300, y: GROUND_Y - 50, w: 70 },
      { x: 2900, y: GROUND_Y - 40, w: 80 },
      { x: 3500, y: GROUND_Y - 50, w: 70 },
      { x: 4100, y: GROUND_Y - 40, w: 80 },
      { x: 4650, y: GROUND_Y - 50, w: 70 },
    ],
  }),
];
