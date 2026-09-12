# Buddy the Bat 🦇⚾

An original 8-bit, Super-Mario-style side-scrolling game starring **Buddy the
Bat**, a fan-made mascot for the Louisville Bats. Buddy walks and jumps
through five levels, swinging his baseball bat at enemies, collecting little
bugs for health, grabbing golden bugs for temporary invincibility, and facing
a "big version of the small enemy" boss at the end of every level.

It's a plain HTML5 Canvas + JavaScript game — no build step, no frameworks,
no external art files. Everything (art, sound, levels) is generated in code,
so it's light, fast, and trivial to host.

## Levels

1. **Louisville Slugger Stadium** — angry baseball enemies, giant baseball boss.
2. **Louisville Slugger Factory** — factory workers, giant foreman boss. Clearing
   the boss drops a bat power-up that permanently increases Buddy's swing range
   and damage.
3. **Big Four Walking Bridge** — joggers, a giant marathoner boss who dashes.
4. **Downtown Louisville** — businessmen, a giant "Chairman" boss who throws briefcases.
5. **Away Game: Cincinnati** — rival baseball players, and a big fictional
   mascot boss who throws baseballs.

Each level is a bit longer than the last, and Buddy's max HP goes up by one
every level (6 → 10). Beat the final boss and watch Buddy fly off into a
sunset "YOU WON!" ending.

Each level also has its own moment in the story's day — a dynamic
time-of-day lighting system (`js/lighting.js`) drives the sky/sun/moon,
window and streetlamp glow, entity shadows, and stadium floodlights, so
the game visually progresses from a sunny afternoon opener through a
golden-hour sunset on the bridge to a Friday-night away game under the
lights in Cincinnati.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Move | Arrow keys / A,D | ◀ ▶ on-screen buttons |
| Jump | Space / Up / W | ▲ on-screen button |
| Swing bat | Click the screen, or Z / X / Enter | Tap the screen |
| Pause | Esc / P | Pause button (top-right) |

## Running it locally

No build tools needed — it's static files. From the project root:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

or use any other static file server (e.g. `npx serve`).

## Deploying to GitHub Pages (recommended — free, and mobile browsers open it directly)

1. Push this repo to GitHub (all files are already at the repo root, so no
   extra configuration is needed).
2. In the GitHub repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`.
4. Pick the branch you want live (e.g. `main`) and folder `/ (root)`, then **Save**.
5. GitHub will publish the site at `https://<your-username>.github.io/<repo-name>/`
   within a minute or two. That URL works great on phones — open it in
   Safari/Chrome and use **Share → Add to Home Screen** for an app-like,
   full-screen launch icon (the game includes a `manifest.json` + a small
   service worker so it also works after the first load without a signal).

No app-store submission, server, or backend is required for this to work as
a mobile game — GitHub Pages plus "Add to Home Screen" is genuinely the
easiest path. If you later want a real App Store / Play Store listing, this
same code can be wrapped as-is with [Capacitor](https://capacitorjs.com/) or
[Cordova](https://cordova.apache.org/) with minimal changes.

## Project structure

```
index.html          Markup + all UI overlays (title, pause, level-complete, game-over, win)
css/style.css        Mobile-friendly layout, on-screen controls, retro styling
js/constants.js       All the tunable numbers (physics, timings, sizes)
js/sprites.js         Original 8-bit pixel art, authored as ASCII grids + a tiny renderer
js/audio.js           Synthesized 8-bit sound effects (Web Audio, no audio files)
js/entities.js        Player, Enemy, Boss, Pickup, Projectile classes
js/levels.js          The 5 level definitions + landmark-styled parallax backgrounds
js/lighting.js         Time-of-day presets, sun/moon, shadows, stadium floodlights
js/input.js            Keyboard + touch input, unified
js/game.js             State machine, game loop, collisions, HUD, UI wiring
js/main.js             Bootstraps the game + registers the service worker
manifest.json / sw.js  "Add to Home Screen" support and basic offline caching
assets/icon-favicon.png  Custom bat artwork (transparent bg) — favicon + title-screen logo
assets/icon-192.png      Same artwork on a solid background — apple-touch-icon + manifest
assets/icon-512.png      Larger version for manifest/PWA icons
```

## Tuning

Everything that affects feel — move speed, jump height, gravity, swing
range/cooldown, invulnerability windows, how long the golden bug's
invincibility lasts, level lengths, how many enemies/pickups spawn — lives in
`js/constants.js` and the `buildLevel(...)` calls at the bottom of
`js/levels.js`. Nothing needs a rebuild; just edit and refresh.

## Notes on the art

The game's icon/logo is custom pixel art supplied for this project. The
in-game sprites (enemies, bosses, backgrounds) are original pixel art drawn
in code for this game, using the Louisville Bats' public red/black/white
color scheme — not a reproduction of any official team logo or artwork. If
you plan to publish this under the Louisville Bats name, it's worth running
the final art past the team/MiLB for sign-off before a public launch.
