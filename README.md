# BridgeMind Horror House

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A first-person parody-horror escape game that runs entirely in the browser. You wake
up locked inside an abandoned BridgeMind production build. Recover three access keys,
survive a deliberately cheap 2D Matt cutout, and ship yourself out of the house.

Built by [BridgeMind](https://bridgemind.ai) using the design constitution in
[`SYSTEM_PROMPT.md`](./SYSTEM_PROMPT.md) — the exact system prompt used to create
this game. Graphics and atmosphere first, functionality second.

**Headphones strongly recommended.** Contains sudden loud sounds and flashing imagery.

## Quick start

```bash
npm install
npm run dev
```

Open the printed localhost URL and click **Enter**.

```bash
npm run build    # production bundle → dist/
npm run preview  # serve the production build
```

## Controls

| Input | Action |
|---|---|
| Mouse | Look |
| W A S D | Move |
| Shift | Sprint |
| E | Interact (keys, batteries, notes, doors) |
| F | Flashlight on/off |
| Esc | Pause (release mouse) |

## How to play

1. Explore the dark rooms with your flashlight
2. Find the 3 brass keys — locations are **randomized each run** within the kitchen,
   study, and bedroom
3. Read the notes for lore and hints
4. After the 2nd key, Matt starts **stalking** you — his flat cutout manifests nearby and drifts
   toward you through walls
5. Taking the final key wakes him fully — blackout, then a chase to the front door

### Fighting back

- **The light burns him.** Hold your flashlight beam on him — the burn meter above
  the crosshair fills, and when it completes he shrieks apart
- During the finale chase, a banish only buys time — he **reforms** and resumes
- The beam drains your **battery** (bottom-left bar); burning him drains it fast
- Spare batteries are scattered through the house (living room, dining room,
  hallway, kitchen)
- Below 20% the bulb sputters; at 0% you're in the dark until you find spares

If he touches you, the build token-maxxes you. Click **Run The Loop Again**.

## Tech

- **Three.js** (WebGL2) + **Vite**, vanilla JavaScript — `three` is the only dependency
- A hybrid asset pipeline: the house textures and most audio remain procedural, while
  the Matt billboard and short stream-sourced music/voice clips are bundled locally;
  see [`src/assets/README.md`](./src/assets/README.md) for provenance and timestamps
- ACES filmic tone mapping, exponential fog, bloom post-processing, PCF soft shadows
  from a single swaying flashlight, dust motes, film grain + vignette overlays
- One-shot scripted scares, randomized ambient dread, lightning through windows,
  stalking phase, a proximity-mixed BridgeMind techno loop, and a finale chase where
  the camera-facing cutout glides through walls

## Project structure

```
bridge-horror-house/
├── SYSTEM_PROMPT.md   # design constitution used to build this game
├── index.html         # UI overlays (title, HUD, death, win)
├── src/
│   ├── main.js
│   ├── Game.js
│   ├── assets/        # Matt billboard + short, source-documented stream clips
│   ├── world/         # House.js, Textures.js
│   ├── player/        # Player.js
│   ├── systems/       # AudioEngine, Ghost, ScareDirector
│   └── ui/            # HUD.js
```

## Contributing

Issues and pull requests are welcome. Keep changes scoped to this game — see
`SYSTEM_PROMPT.md` for design intent and scope guardrails.

## License

[MIT](./LICENSE) — Copyright (c) 2026 BridgeMind. Third-party likeness, branding,
and stream excerpts under `src/assets/` are excluded; see the asset notice.
