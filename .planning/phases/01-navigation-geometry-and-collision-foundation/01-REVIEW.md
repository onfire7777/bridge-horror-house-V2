---
status: clean
files_reviewed:
  - src/systems/Navigation.js
  - src/systems/Ghost.js
  - src/Game.js
  - test/navigation.test.js
  - package.json
critical: 0
warning: 0
info: 1
total: 1
---

# Phase 1 Deep Code Review

## Result

Phase 1 is clean at Critical and Warning severity. The corrected navigation foundation satisfies the approved Phase 1 contract, and the one remaining Info item is explicitly owned by Phase 2/NAV-05.

Fresh verification completed during re-review:

- `node --test test/navigation.test.js`: 18 passed, 0 failed.
- `npm test`: 18 passed, 0 failed.
- `npm run build`: passed; Vite reported only its non-blocking chunk-size warning.
- `git diff --check`: passed.

## Resolved Findings

### RESOLVED CRITICAL-01: Separating blockers cannot be crossed between cell centers

- **Evidence:** `src/systems/Navigation.js:62-65`, `src/systems/Navigation.js:105-118`; `test/navigation.test.js:127-138`
- **Disposition:** Occupancy now rasterizes intersection between every clipped cell area and each radius-inflated blocker. The regression fixture proves a thin wall between adjacent centers returns no path.

### RESOLVED CRITICAL-02: Public cell and out-of-bounds behavior matches the contract

- **Evidence:** `src/systems/Navigation.js:121-168`, `src/systems/Navigation.js:193-203`; `test/navigation.test.js:56-67`
- **Disposition:** Cells consistently use `{ col, row }`; outside world points and invalid cells return `null` at the documented boundaries; `nearestWalkable` accepts a world point; and `findPath` fails closed with `[]` when either endpoint is outside.

### RESOLVED WARNING-01: Partial boundary cells remain inside configured bounds

- **Evidence:** `src/systems/Navigation.js:135-164`; `test/navigation.test.js:69-80`
- **Disposition:** Final cells are clipped to the configured maximum before their centers are calculated. The non-divisible `0..0.5` fixture now emits `{x:0.45,z:0.45}`.

### RESOLVED WARNING-02: Deterministic ordering is the prescribed ordering

- **Evidence:** `src/systems/Navigation.js:6-12`, `src/systems/Navigation.js:171-189`, `src/systems/Navigation.js:221-240`, `src/systems/Navigation.js:261-277`; `test/navigation.test.js:154-174`
- **Disposition:** Neighbor traversal is north, west, east, south, and A* records a monotonic insertion sequence for the final tie. Tests assert both the exact nearest-walkable result and an exact equal-cost path.

### RESOLVED WARNING-03: Motion uses the approved 4096-substep cap

- **Evidence:** `src/systems/Navigation.js:3-4`, `src/systems/Navigation.js:336-345`; `test/navigation.test.js:255-267`
- **Disposition:** Exactly 4096 substeps are accepted and 4097 are rejected.

### RESOLVED WARNING-04: Derived arithmetic fails closed on overflow

- **Evidence:** `src/systems/Navigation.js:48-59`, `src/systems/Navigation.js:90-103`, `src/systems/Navigation.js:317-329`, `src/systems/Navigation.js:336-358`; `test/navigation.test.js:188-205`, `test/navigation.test.js:269-282`
- **Disposition:** Clearance, inflated endpoints, grid spans/dimensions, expanded blocker endpoints, step components, and attempted/resolved positions are checked for finiteness before use or return. Finite-extreme regression cases throw instead of producing `Infinity`.

## Info Finding — Phase 2 Scope

### INFO-01: Capture uses pre-motion distance and can be overtaken by burn side effects

- **Location:** `src/systems/Ghost.js:132-134`, `src/systems/Ghost.js:182-205`; `src/Game.js:313-320`
- **Issue:** `dist` is captured before collision-resolved movement and returned as the catch decision after movement. A move into catch radius is observed on the following frame, allowing `_updateBurn` to run first; a pre-motion in-range position can likewise remain a catch after jitter moves Matt out.
- **Disposition:** Explicitly deferred to Phase 2/NAV-05, which owns legal unobstructed capture. Recompute post-motion separation and evaluate capture atomically against the legal path segment before burn side effects. This is not a Phase 1 blocker and must not be implemented in this phase.

## Scope Confirmation

- `Game._tick` passes the stable `house.staticColliders` array without allocating a second collider copy for Ghost.
- Pursuit, chase sway, and burn jitter are accumulated and resolved through one `moveCircleAgainstAabbs` call before the only engaged x/z assignment.
- Start-overlap remains fail-closed, exact-radius contact remains non-penetrating, and motion remains bounded without per-frame graph construction.
- Dynamic doors, cached route following, spawn/reform validity, and catch legality remain Phase 2 work.
- No dependency, lockfile, difficulty, audio, visual, or authored-geometry scope entered Phase 1.
