# BridgeMind Horror House

## What This Is

BridgeMind Horror House is a first-person browser horror-comedy game where the player searches a haunted house for three access keys while a deliberately flat, white-outlined Matt cutout hunts them. The experience should be funny in its BridgeMind references but mechanically tense, visually oppressive, and capable of a genuinely forceful jumpscare.

## Core Value

The player must feel hunted by a monster that obeys the house, becomes more dangerous over time, and can be driven back—but never permanently neutralized—by carefully managed flashlight power.

## Requirements

### Validated

- ✓ The game runs as a Three.js/Vite browser experience with first-person movement and pointer-lock controls — existing
- ✓ The house contains three collectible access keys, batteries, doors, notes, and an escape condition — existing
- ✓ Matt appears as a deliberately flat 2D billboard with a thick white outline — existing
- ✓ BridgeMind stream music and voice clips respond to monster proximity and capture — existing
- ✓ The flashlight can burn and temporarily banish Matt — existing
- ✓ A production build completes and is playable in the in-app browser — existing

### Active

- [ ] Matt follows the player through valid walkable space and cannot cross walls
- [ ] Matt routes through hallways and door openings and opens/uses doors instead of phasing through geometry
- [ ] The hunt is substantially harder through faster pursuit, earlier pressure, and shorter banishment downtime
- [ ] Flashlight battery drain, warning feedback, pickups, and recovery create meaningful resource pressure
- [ ] Key locations remain varied while avoiding trivial, hidden, or unreachable placements
- [ ] The game exposes complete persistent sound controls for master, ambience, music, effects, voice, and jumpscare intensity
- [ ] Capture produces a distorted, loud, layered audio sting and a full-screen animated Matt jumpscare
- [ ] General sound design communicates doors, pickups, danger, battery state, pursuit, banishment, and room atmosphere
- [ ] Rooms contain richer BridgeMind branding, logos, terminal props, signage, and environmental storytelling
- [ ] Automated regression tests, a production build, and browser playtesting verify the completed experience
- [ ] Every substantial increment is committed and pushed to `main`, with local and GitHub state verified consistent

### Out of Scope

- A 3D Matt character model — the intentionally cheap flat cutout is central to the joke and visual identity
- Multiplayer or network services — the project remains a self-contained browser game
- Replacing Three.js or Vite — the existing stack is sufficient and stable
- Unbounded raw output volume — loudness is achieved with distortion, layering, compression, and contrast without uncontrolled digital clipping

## Context

- The live CBM graph contains 250 nodes and 801 edges across the `Game`, `systems`, `world`, `player`, and `ui` packages.
- `Game._tick` updates the player with `house.getColliders()` but calls `ghost.update` with only time and player position.
- `Ghost.update` explicitly performs direct vector movement toward the player and contains a comment that it “glides through walls.” This is the confirmed source of wall traversal.
- The player already has circle-vs-AABB collision resolution, proving the house collider data is usable.
- The house builds wall colliders with intentional gaps for doors and exposes dynamic door AABBs.
- Audio currently feeds most sources directly into one master gain, so category controls require explicit ambience, music, SFX, voice, and jumpscare buses.
- Existing assets derived from Matt’s stream are documented in `src/assets/README.md`; permission should be confirmed before public redistribution.

## Constraints

- **Stack**: Reuse Three.js, Vite, Web Audio, and browser APIs; avoid unnecessary dependencies.
- **Navigation**: Pursuit must remain deterministic and testable outside WebGL; route planning belongs in a pure JavaScript module.
- **Performance**: Navigation may not allocate a large graph every animation frame; paths must be cached and recalculated on a bounded cadence.
- **Audio safety**: The jumpscare should feel loud through contrast, distortion, and compression while the final output remains compressor-limited.
- **Persistence**: Sound preferences must survive reloads through versioned `localStorage` data with safe defaults.
- **Git**: Each substantial increment is verified, committed, pushed to `main`, fetched, and compared against `origin/main`.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use a small 2D navigation grid over house AABBs | Routes Matt through real wall gaps while remaining deterministic and testable | — Pending |
| Treat static walls as path blockers and dynamic doors as physical blockers Matt can open | Allows routes to target doorways without phasing through closed door meshes | — Pending |
| Add explicit Web Audio category buses with a master compressor | Supports full controls and a forceful jumpscare without uncontrolled clipping | — Pending |
| Make difficulty a coordinated system, not only a speed increase | Pressure must come from detection timing, pursuit persistence, battery economy, and return cadence | — Pending |
| Deliver sequential increments with red-green tests and pushed commits | Matches the requested iterative workflow and keeps GitHub continuously recoverable | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Move verified Active requirements to Validated with the phase reference.
2. Record any invalidated or deferred requirements in Out of Scope with reasoning.
3. Add newly discovered requirements and architecture decisions.
4. Recheck that the Core Value still drives tradeoffs.

**After each milestone:**
1. Review every requirement against test and runtime evidence.
2. Update Key Decisions with proven outcomes.
3. Refresh Context with the shipped architecture and remaining debt.

---
*Last updated: 2026-07-10 after GSD initialization from the live brownfield repository*
