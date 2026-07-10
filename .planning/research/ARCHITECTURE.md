# Architecture Research

**Domain:** Brownfield single-player Three.js browser horror game
**Researched:** 2026-07-10
**Confidence:** HIGH

## Standard Architecture

### System Overview

The project should remain a small client-side monolith. `Game` stays the composition root and authoritative run-state owner, while pure/testable mechanics move behind narrow interfaces. Rendering, DOM, Web Audio, and browser persistence remain at the edges.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Browser / Presentation                                                   │
│  index.html ── main.js ── HUD ── SettingsPanel ── CaptureSequence       │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │ commands / snapshots
┌───────────────────────────────▼──────────────────────────────────────────┐
│ Game orchestration                                                       │
│  Game state + frame loop + interaction dispatch + difficulty config     │
└──────────┬────────────────────┬─────────────────────┬────────────────────┘
           │                    │                     │
┌──────────▼──────────┐ ┌───────▼────────────┐ ┌──────▼───────────────────┐
│ World / movement    │ │ Horror systems     │ │ Audio                    │
│ House               │ │ ScareDirector      │ │ AudioEngine              │
│ NavigationGrid      │ │ Ghost              │ │ category gain buses      │
│ shared AABB motion  │ │ CaptureSequence    │ │ master compressor        │
│ Player              │ │                     │ │ AudioSettingsStore        │
└──────────┬──────────┘ └────────────────────┘ └──────────┬───────────────┘
           │                                               │
┌──────────▼───────────────────────────────────────────────▼───────────────┐
│ Data / platform                                                           │
│ authored AABBs + door portals + key candidates + balance config          │
│ Vite assets + Web Audio + versioned localStorage                         │
└──────────────────────────────────────────────────────────────────────────┘
```

### Current Component Boundaries

| Component | Current responsibility | Architectural consequence |
|-----------|------------------------|---------------------------|
| `src/main.js` | Creates `Game` and starts it from the title screen | Keep as the browser entry point; do not place mechanics here. |
| `src/Game.js` | Constructs every subsystem, owns run state, dispatches interactions, and coordinates the frame | Keep as composition root. Reduce feature-specific sequencing by delegating navigation, settings, and capture behavior. |
| `src/world/House.js` | Builds walls, collidable furniture, doors, items, lighting, and decorative props | It is the authoritative source of world geometry. Export plain navigation geometry rather than letting navigation inspect Three.js meshes. |
| `src/player/Player.js` | Input, movement, AABB collision, flashlight, battery drain, footsteps | Keep player authority over charge and input. Extract/reuse the pure AABB motion rule so Matt receives the same collision guarantees. |
| `src/systems/Ghost.js` | Matt visual/state machine, burn/banish timers, direct pursuit movement, catch detection | Preserve the state machine and visuals; replace direct pursuit with cached waypoints and collision-aware locomotion. |
| `src/systems/ScareDirector.js` | Room triggers, ambient scare cadence, lightning, pre-finale stalking | Keep environmental scare scheduling here. Capture is a separate terminal sequence with different cancellation and UI concerns. |
| `src/systems/AudioEngine.js` | Web Audio graph, synthesized ambience/effects/music, stream audio, voice clips | It should exclusively own audio nodes and category routing. It must not own DOM or persistence. |
| `src/ui/HUD.js` | Non-interactive HUD and overlays | Keep transient display methods here; do not force interactive settings into a pointer-events-disabled HUD. |
| `index.html` | All current DOM/CSS for title, pause, HUD, capture, death, and win surfaces | Add the settings container here, but give behavior to `SettingsPanel`. |

### Recommended Component Responsibilities

| Component | Responsibility | Recommended implementation |
|-----------|----------------|----------------------------|
| `Game` | Compose dependencies, own `title/playing/caught/escaped`, order frame updates, translate mechanics into presentation/audio effects | Direct calls are appropriate in this small game; avoid a global event bus. |
| `House` | Own authored world geometry, door objects, interactables, and decoration | Add `getNavigationGeometry()` returning immutable/plain `{ bounds, staticAabbs, doors }`; retain `getColliders()` for current player integration. |
| `NavigationGrid` | Inflate AABBs by agent radius, build a small 2D grid once, run bounded A*, expose reachability and nearest-walkable-cell queries | Pure JavaScript; no `THREE`, DOM, timers, or randomness. |
| shared AABB motion helper | Move a circle/substepped point against AABBs without tunneling | Extract the existing axis-resolution behavior from `Player` or implement one small pure helper used by both actors. |
| `Ghost` | Own pursuit mode, cached path, waypoint cursor, replan/stuck timers, door-use intent, burn/banish lifecycle | Receive navigator, balance values, and a narrow door interface from `Game`; never import `House`. |
| `Balance` | Hold coordinated difficulty numbers for pursuit, detection cadence, banishment, battery economy, and spawn cadence | Frozen data object injected into `Player`, `Ghost`, and `ScareDirector`; no manager class unless selectable difficulties are added later. |
| `AudioEngine` | Build category buses, route every source, apply runtime settings, play named cues | `ambience`, `music`, `effects`, `voice`, and `jumpscare` buses feed `master`, then the compressor/destination. |
| `AudioSettingsStore` | Validate, migrate, load, and save versioned audio preferences | Pure schema helpers around injected storage; catch parse/security failures and fall back safely. |
| `SettingsPanel` | Render/bind accessible sliders and invoke `onChange(settings)` | Interactive on title and pause surfaces; stop clicks from bubbling to the current pause-to-lock handler. |
| `CaptureSequence` | Own capture timing, cancellation, audio duck/sting commands, visual phase changes, and completion | One sequence instance with tracked timers; `Game._onCaught` changes state, then delegates. |
| `ScareDirector` | Continue room/ambient/stalking scares and consume difficulty cadence | Do not make it the owner of persistent settings or navigation. |
| `House` + `Decor` definitions | Add BridgeMind terminals, logos, signage, props, and room storytelling | Prefer data-driven prop definitions and a few focused House factory helpers; keep scene ownership in `House`. |

## Recommended Project Structure

```text
src/
├── Game.js                         # composition root and run-state orchestration
├── main.js                         # browser entry point
├── config/
│   └── Balance.js                  # coordinated difficulty/battery/pursuit values
├── navigation/
│   ├── NavigationGrid.js           # pure grid build, A*, reachability, cell conversion
│   └── AabbMotion.js               # shared pure collision/substep helper
├── player/
│   └── Player.js                   # input, flashlight, authoritative battery charge
├── systems/
│   ├── AudioEngine.js              # Web Audio graph and cue playback
│   ├── AudioSettingsStore.js       # versioned load/validate/save helpers
│   ├── CaptureSequence.js          # terminal capture timeline
│   ├── Ghost.js                    # Matt state + waypoint locomotion
│   └── ScareDirector.js            # environmental and stalking scares
├── ui/
│   ├── HUD.js                      # non-interactive status and overlays
│   └── SettingsPanel.js            # interactive audio controls
├── world/
│   ├── House.js                    # geometry, doors, items, scene ownership
│   ├── Decor.js                    # optional authored BridgeMind prop definitions/helpers
│   └── Textures.js                 # procedural textures
└── assets/

test/
├── navigation-grid.test.js
├── aabb-motion.test.js
├── audio-settings.test.js
├── balance.test.js
└── key-placement.test.js
```

### Structure Rationale

- **`navigation/`:** Navigation must be deterministic and testable without WebGL. Keeping it free of Three.js also prevents `Ghost` from importing `House` constants, which is the current direction of coupling.
- **`config/Balance.js`:** The current difficulty values are scattered across `Game`, `Player`, `Ghost`, and `ScareDirector`. One injected object makes the hunt tunable as a coordinated system.
- **`systems/AudioSettingsStore.js`:** Persistence is not an audio-node concern. Separating it lets malformed `localStorage` data be tested without constructing `AudioContext`.
- **`ui/SettingsPanel.js`:** The existing HUD is intentionally non-interactive. Settings need keyboard labels, pointer events, and pause-screen propagation handling.
- **`systems/CaptureSequence.js`:** The current capture is several independent `Game._onCaught` calls plus an unmanaged timeout. A dedicated sequence creates one owner for timing and cleanup.
- **`world/Decor.js`:** Optional. Use it only if the environment definitions materially enlarge the already-long `House._buildFurniture`; do not introduce a scene/entity framework.
- **`test/`:** The repository has no test command today. Pure modules can use the Node built-in test runner, avoiding a new runtime dependency.

## Architectural Patterns

### Pattern 1: Static Navigation Graph + Dynamic Portal Handling

**What:** Build a small occupancy grid once from `BOUNDS` and the complete static AABB set (walls plus collidable furniture). Inflate blockers by Matt's collision radius. Treat authored door gaps as traversable graph portals even when the physical door is closed. The locomotion layer detects a closed door on the next segment, opens it, then continues through once its AABB clears.

**When to use:** For all stalking, chase, reformation spawn, and reachability checks.

**Trade-offs:** A grid is less geometrically exact than a navmesh, but this house is axis-aligned and small. It is deterministic, cheap, and easy to test. Cell size must be small enough for the narrowest 1.4-unit doorway after radius inflation. Diagonal moves must forbid corner cutting.

**Example:**

```js
const geometry = house.getNavigationGeometry();
const navigation = new NavigationGrid({
  bounds: geometry.bounds,
  blockers: geometry.staticAabbs,
  radius: balance.ghost.radius,
  cellSize: 0.4,
});

const ghost = new Ghost(scene, { navigation, doors: geometry.doors, balance });
```

Replan only when the target cell changes, a door/path becomes invalid, Matt is stuck, or a bounded cadence expires (roughly 250-500 ms). Never allocate/rebuild the grid every animation frame. Cache the path and advance a waypoint cursor in `Ghost.update`.

### Pattern 2: Dependency Injection Through the Composition Root

**What:** `Game` constructs concrete browser/world dependencies and passes narrow collaborators/configuration into systems. Pure modules receive plain data and functions instead of reaching into `Game`, global DOM, or Three.js scene state.

**When to use:** Navigation, balance, settings persistence, and capture sequencing.

**Trade-offs:** Constructor signatures grow slightly, but the dependency graph becomes explicit and testable. A container/framework would be overkill.

**Example:**

```js
this.balance = BALANCE.hard;
this.audioSettings = loadAudioSettings(window.localStorage);
this.audio = new AudioEngine(this.audioSettings);
this.settings = new SettingsPanel({
  initial: this.audioSettings,
  onChange: (next) => {
    this.audio.applySettings(next);
    saveAudioSettings(window.localStorage, next);
  },
});
```

### Pattern 3: Category Bus Audio Graph

**What:** Every sound connects to exactly one semantic category bus before the master/compressor. `AudioEngine` exposes cue-level methods and one `applySettings` method; callers never touch gain nodes.

```text
ambience ─┐
music ────┤
effects ──┼── master gain ── dynamics compressor ── destination
voice ────┤
jumpscare ┘
```

**When to use:** All existing synthesized sounds, stream loop, voice buffers, new room sounds, and capture layers.

**Trade-offs:** Existing direct connections at heartbeat, voice, click, chase, and reverb return sites must all be audited. A shared reverb return connected straight to master can leak sound around a muted category; feed reverb from category buses or otherwise ensure category gain affects both dry and wet paths.

Recommended settings schema:

```js
{
  version: 1,
  master: 0.9,
  ambience: 0.8,
  music: 0.8,
  effects: 0.9,
  voice: 1.0,
  jumpscareIntensity: 0.85,
}
```

Clamp every numeric value to `[0, 1]`, ignore unknown keys, and fall back field-by-field rather than rejecting the whole record. Use short gain ramps (`cancelScheduledValues` plus `setTargetAtTime`/linear ramps) to prevent zipper noise.

### Pattern 4: Explicit Sequence Controller for Capture

**What:** Represent capture as named phases owned by `CaptureSequence`: freeze gameplay, contrast/duck, layered sting and animated full-screen Matt, impact/shake, decay, then death-screen handoff. Track all timers so retry/disposal can cancel them.

**When to use:** Only terminal capture. Ambient room scares remain in `ScareDirector`.

**Trade-offs:** Adds one class, but removes timing and cleanup from `Game._onCaught`. A general-purpose timeline library is unnecessary.

The `jumpscareIntensity` setting should affect capture layer count/distortion/controlled bus gain, not bypass the final compressor. Loudness should come from contrast and spectral density, not clipping.

### Pattern 5: Data-Driven Balance and Placement

**What:** Centralize coordinated difficulty values and make key candidates authored data. Select one candidate per room through injected randomness, then validate that an adjacent interaction cell is reachable on the navigation grid.

**When to use:** Ghost speed/replan cadence, stalk grace, catch distance, banish downtime, battery drain/refill/warnings, and key spawn selection.

**Trade-offs:** Avoid a sprawling difficulty service. A frozen object plus small pure selection functions is sufficient.

Key validation must test the player's approach position, not the key's exact coordinate, because keys deliberately sit on collidable furniture. Ghost reformation should likewise sample reachable walkable cells rather than clamping a random world coordinate that may land inside furniture or behind a wall.

## Data Flow

### Frame / Pursuit Flow

```text
requestAnimationFrame / renderer loop
    ↓
Game._tick(dt)
    ├── House.update(dt, t)                         door/light animation
    ├── Player.update(dt, current colliders)       input + battery + collision
    ├── ScareDirector.update(dt, player position)  authored/ambient scares
    ├── Ghost.update(dt, target snapshot)
    │     ├── replan? → NavigationGrid.findPath(start, target)
    │     ├── closed portal ahead? → Door.setOpen(true)
    │     ├── move toward cached waypoint through shared AABB motion
    │     └── return capture transition
    ├── Game applies burn/resource/danger presentation
    └── composer.render()
```

Critical ordering:

1. Animate doors before generating current physical colliders.
2. Move the player and update the target position.
3. Replan/move Matt against the same static geometry and current door state.
4. Evaluate catch after movement with the collision-safe final positions.
5. Trigger audio/HUD only on state transitions or threshold crossings.

### Navigation Geometry Flow

```text
WALL_DEFS + collidable furniture + BOUNDS
    ↓ House construction
static AABBs ──→ NavigationGrid build (once, radius-inflated)
door definitions ──→ portal metadata (planner) + live Door.aabb() (motion)
    ↓
cached paths for Ghost + reachability for spawn/key validation
```

Do not feed `House.getColliders()` directly into grid construction every frame: it allocates a copy and appends live door AABBs. Navigation needs a stable static snapshot plus separately identified doors.

### Audio Settings Flow

```text
localStorage record
    ↓ parse / migrate / clamp
AudioSettingsStore ──→ initial settings ──→ AudioEngine.applySettings
         │                                      ↑
         └──────────── SettingsPanel changes ───┘
                              ↓
                     versioned save (best effort)
```

Use a namespaced key such as `bridge-horror-house:audio:v1`. Storage failures must not prevent the game from starting. Apply settings before audio resume; `AudioContext.resume()` remains tied to the title-screen user gesture.

### Capture Flow

```text
Ghost returns caught
    ↓
Game atomically sets state='caught' and disables control
    ↓
CaptureSequence.play(settings.jumpscareIntensity)
    ├── AudioEngine.duck(non-jumpscare buses)
    ├── AudioEngine.playCaptureSting() → jumpscare bus → compressor
    ├── HUD.show/animate capture face + flash + shake
    └── completion → HUD/death-screen transition
```

Only the first caught transition may start the sequence. Repeated frames must be idempotent, and sequence completion/cancellation must restore any temporary bus ducking.

### Battery / Difficulty / Key Flow

```text
Balance config ─┬─→ Player drain, burn surcharge, capacity/refill
                ├─→ Ghost speeds, catch radius, replan and banish timing
                └─→ ScareDirector grace/return cadence

Player battery before/after update
    ↓ threshold transition (low / critical / empty / recovered)
Game ──→ HUD warning + AudioEngine cue

authored key candidates + injected RNG + nav reachability
    ↓
one valid candidate per room → House creates interactable key meshes
```

## Recommended Build Order

1. **Establish the pure test seam.** Add the Node test script and shared plain `{x,z}`/AABB conventions. Lock current wall gaps, furniture blockers, player radius behavior, and representative door coordinates in tests.
2. **Build static navigation and collision primitives.** Implement radius-inflated grid generation, nearest walkable cell, A*, no-corner-cut diagonals, path caching inputs, and shared/substepped AABB motion. Test narrow doorways, wall separation, furniture detours, unreachable targets, and deterministic tie-breaking.
3. **Integrate Ghost routing and door use.** `Game` builds navigation from `House`; `Ghost` follows waypoints, opens a closed portal when close, replans on bounded triggers, and chooses reachable reform positions. Verify Matt cannot cross walls at the hardest speed.
4. **Centralize balance, then tune the hunt.** Inject one coordinated config into `Player`, `Ghost`, and `ScareDirector`. Increase pressure through speed, earlier stalking, shorter reform downtime, and persistence only after path correctness is proven.
5. **Harden battery and key economy.** Add edge-triggered battery feedback and balanced refills. Move key candidates to data and validate reachable approach cells using the navigation grid. This depends on navigation reachability.
6. **Refactor the AudioEngine graph.** Create category buses and route every existing source, direct connection, reverb path, stream loop, and voice clip through them. Keep the compressor last. Add a small graph/routing smoke seam where feasible.
7. **Add settings persistence and UI.** Implement schema/load/save tests first, then `SettingsPanel` on title/pause screens. Handle click propagation so sliders do not immediately reacquire pointer lock.
8. **Build capture orchestration.** Add `CaptureSequence`, layered jumpscare audio on its own bus, controlled ducking, intensity application, animated Matt overlay, cancellation, and the death-screen handoff. This depends on category buses/settings.
9. **Enrich general sound and environment.** Add door/pickup/battery/danger/banish/room cues to the correct buses, then BridgeMind logos, terminals, signs, props, and authored storytelling in `House`/`Decor`. Keep decorations out of navigation unless intentionally collidable.
10. **Run full verification.** Pure regression tests, production build, browser playthrough, pointer-lock/settings checks, low-battery and key-spawn coverage, wall/door pursuit tests, capture audio safety, and lower-powered-device frame checks.

This order isolates mechanical correctness before difficulty and content tuning, and it establishes the audio graph before jumpscare/sound-design work that depends on it.

## Scaling Considerations

| Scale | Architecture adjustments |
|-------|--------------------------|
| Current single 20x16 house | Precompute one small grid synchronously; cache one path; direct `Game` orchestration is sufficient. |
| Larger house / denser props | Rebuild only dirty grid regions or use coarser room portals plus local grids; reuse arrays to reduce garbage; cap A* expansions. |
| Multiple floors / multiple hunters | Add floor/portal IDs and independent path state per actor; consider a worker only if measured pathfinding blocks the frame. Do not introduce ECS/navmesh infrastructure preemptively. |

### Scaling Priorities

1. **First bottleneck: per-frame allocation and path churn.** `House.getColliders()` already copies arrays each frame, and naive A* would add more garbage. Cache static geometry, separate live door state, replan on events/cadence, and reuse path buffers.
2. **Second bottleneck: Web Audio node/timer accumulation.** One-shot cues create nodes and chase/heartbeat use intervals. Ensure sequences stop timers/sources, avoid duplicate starts, and audit capture retry/terminal transitions.
3. **Third bottleneck: draw calls from environment enrichment.** Prefer shared geometry/materials, `InstancedMesh` for repeated props, and decorative non-colliders unless collision is meaningful.

## Anti-Patterns

### Anti-Pattern 1: Rebuild A* Every Frame

**What people do:** Convert all colliders to a fresh grid and path from Matt to the player in every `Ghost.update`.

**Why it's wrong:** It violates the performance constraint, creates garbage, and makes behavior jitter as the target crosses cell boundaries.

**Do this instead:** Build static occupancy once; cache paths and replan on target-cell, stuck, door, or bounded timer changes.

### Anti-Pattern 2: Make Closed Doors Permanently Unwalkable

**What people do:** Include current closed-door AABBs as static grid blockers.

**Why it's wrong:** A* will route around or declare paths unreachable instead of targeting the doorway Matt is meant to open.

**Do this instead:** Model door gaps as planner portals and closed doors as dynamic physical blockers/actions.

### Anti-Pattern 3: Let `Ghost` Reach Into `House`

**What people do:** Import `House`, inspect Three.js meshes, or mutate doors from arbitrary ghost code.

**Why it's wrong:** It couples AI to scene construction and makes navigation tests require WebGL/Three.js.

**Do this instead:** Inject plain geometry, a navigation interface, and a narrow door operation contract from `Game`.

### Anti-Pattern 4: Route Reverb or Voice Around Category Buses

**What people do:** Add buses but leave current `gain.connect(master)` or `reverbOut.connect(master)` paths unchanged.

**Why it's wrong:** Muted categories remain audible, settings become misleading, and capture ducking is incomplete.

**Do this instead:** Audit every direct master connection and guarantee each dry and wet signal is governed by exactly one semantic category before master compression.

### Anti-Pattern 5: Store Raw Slider JSON

**What people do:** Parse storage and assign arbitrary values directly to gain nodes.

**Why it's wrong:** Old/corrupt values can cause `NaN`, excessive gain, missing controls, or startup failure.

**Do this instead:** Version, migrate, type-check, clamp, and merge with safe defaults field-by-field.

### Anti-Pattern 6: Scatter Difficulty Constants Further

**What people do:** Increase `CHASE_SPEED` only, add battery thresholds in HUD, and change stalk cadence in `Game`.

**Why it's wrong:** Pressure becomes incoherent, tuning is hard to reproduce, and tests cannot describe a difficulty contract.

**Do this instead:** Use one balance object and inject the relevant subset into each owner.

### Anti-Pattern 7: Put More Timers in `Game._onCaught`

**What people do:** Add more `setTimeout` calls for audio, animation, and screen changes.

**Why it's wrong:** Retries/cancellation leak state, phases drift, and temporary audio ducking may never restore.

**Do this instead:** Give the terminal sequence one owner with tracked/cancellable timers and idempotent start.

## Integration Points

### External Services / Browser Platforms

| Service | Integration pattern | Notes |
|---------|---------------------|-------|
| Web Audio API | `AudioEngine` owns `AudioContext`, nodes, scheduling, category buses, and final compressor | Resume only from a user gesture. Never let settings/UI manipulate nodes directly. |
| `localStorage` | `AudioSettingsStore` performs best-effort versioned load/save | Handle unavailable storage, JSON errors, unknown versions, and out-of-range values without blocking startup. |
| Pointer Lock API | `Game` continues owning lock/pause behavior | Settings controls on pause must stop event propagation; closing settings may request lock explicitly. |
| Vite asset URLs | Existing imported WAV/PNG URLs remain build-time assets | No network service is required; confirm redistribution permission for stream-derived assets before public release. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `Game ↔ House` | Direct API | `House` supplies scene objects, interactables, current player colliders, and a static navigation snapshot. |
| `House → NavigationGrid` | Plain immutable data | No mesh/material references; include stable door IDs/portal extents. |
| `Game → Ghost` | Per-frame target snapshot + injected collaborators | `Ghost.update` returns domain transitions such as `caught`/`door-opened`, not HUD/audio calls. |
| `Ghost ↔ Door` | Narrow command/query interface | Query state/AABB; request open. `House` retains door animation/mesh ownership. |
| `Player/Ghost ↔ AabbMotion` | Pure function | Same radius-aware collision semantics; substep at high speeds to prevent tunneling. |
| `Game ↔ Balance` | Read-only configuration | `Game` passes subsystem-specific slices; no mutable global. |
| `SettingsPanel ↔ AudioSettingsStore` | Validated settings object | UI emits values; store validates/persists; storage is never the source of unchecked runtime truth. |
| `Game/SettingsPanel → AudioEngine` | Named methods + `applySettings` | No public gain nodes. |
| `Game → CaptureSequence` | One terminal command with completion callback | Sequence talks to HUD/AudioEngine through injected interfaces and restores temporary audio state. |
| `ScareDirector → Game subsystems` | Existing direct commands, gradually narrowed | Appropriate for this small game; keep capture, persistence, and navigation outside it. |
| `House/Decor → Navigation` | Collision flag / static AABB only | Decorative props are non-blocking by default; intentional blockers must enter the static snapshot and tests. |

## Sources

- `.planning/PROJECT.md` — active requirements, constraints, and pending architecture decisions.
- `src/Game.js:19-48` — live composition root; `src/Game.js:126-145` — current capture orchestration; `src/Game.js:303-369` — frame/data flow.
- `src/world/House.js:4-31` — bounds, zones, wall gaps; `src/world/House.js:170-190` — static wall AABBs; `src/world/House.js:208-234` — doors and collidable box construction; `src/world/House.js:436-456` — key/battery candidates; `src/world/House.js:553-560` — live collider aggregation.
- `src/player/Player.js:13-34` and `src/player/Player.js:93-191` — battery authority, movement, collision, and flashlight behavior.
- `src/systems/Ghost.js:13-28` and `src/systems/Ghost.js:84-191` — current hunt/burn/banish state and confirmed direct wall-phasing pursuit.
- `src/systems/ScareDirector.js:13-27` and `src/systems/ScareDirector.js:107-158` — room triggers, stalking cadence, and ambient scheduling.
- `src/systems/AudioEngine.js:23-56`, `src/systems/AudioEngine.js:124-139`, and direct master connections throughout the file — current master/compressor graph and routing seam.
- `src/ui/HUD.js:4-26` and `src/ui/HUD.js:98-103`; `index.html:169-231` — current non-interactive HUD, minimal jumpscare overlay, and title/pause DOM.
- `package.json` — Three.js/Vite-only dependency surface and absence of a test script.
- Live CBM index refreshed 2026-07-10 — 290 nodes, 839 edges; dominant boundaries are `Game → systems` (45 calls) and `Game → ui` (31 calls).

---
*Architecture research for: BridgeMind Horror House hardening and enrichment*
*Researched: 2026-07-10*
