# Pitfalls Research

**Domain:** Brownfield first-person Three.js browser survival-horror hardening
**Researched:** 2026-07-10
**Confidence:** HIGH for code-path and browser-platform pitfalls; MEDIUM for final balance and perceived loudness until instrumented playtesting

## Roadmap Ownership Used in This Research

`ROADMAP.md` does not exist yet, so this document proposes the phase boundaries the roadmap should preserve. The numbers are dependencies, not parallel work suggestions.

| Phase | Owns |
|-------|------|
| **Phase 1 — Navigation Geometry and Collision Foundation** | Plain AABB conventions, radius inflation, grid rasterization, deterministic A*, no-corner-cut rules, substepped motion, and pure regression fixtures |
| **Phase 2 — Ghost Routing, Doors, and Spatial Validity** | Cached waypoint following, dynamic door actions/clearance, stuck/no-route handling, valid spawns/reforms, and line-of-travel-safe catches |
| **Phase 3 — Hunt Balance and Resource Fairness** | Coordinated difficulty, battery budget/feedback, deterministic key candidates, reachable interaction stances, and seeded simulations |
| **Phase 4 — Audio Buses, Persistence, and Settings UI** | Exclusive category routing, master/compressor topology, versioned storage, gain ramps, title/pause controls, and pointer-lock event isolation |
| **Phase 5 — Capture and Sound-Safety Orchestration** | One-shot capture controller, layered jumpscare mix, duck/restore behavior, full-viewport visuals, reduced motion, and flash safety |
| **Phase 6 — BridgeMind Environment and Performance** | Permission-safe branded props, detailed sound pass, collision declarations, geometry/material reuse, draw-call restraint, and room readability |
| **Phase 7 — Production Verification and Tuning** | Production-build browser tests, route/door matrix, all-seed placement checks, audio mute/persistence matrix, capture analysis, full playthroughs, and lower-powered-device profiling |

## Critical Pitfalls

### Pitfall 1: The Grid Does Not Represent the Same House the Actors Collide With

**What goes wrong:**
Matt finds routes through walls or furniture, or cannot pass through a doorway that is visibly wide enough. The reverse can also happen: the grid permits a cell-center route whose swept body overlaps an AABB between cells.

**Why it happens:**
World-to-cell rounding, inclusive/exclusive AABB edges, radius inflation, wall thickness, and bounds padding are easy to implement with slightly different conventions. This project is especially exposed because `House.staticColliders` mixes wall and furniture AABBs, intentional wall gaps are authored separately in `WALL_DEFS`, and the player currently resolves a circle against raw AABBs. Double-inflating one consumer, omitting furniture, or sampling only cell centers creates a second geometry truth.

**How to avoid:**
Define one plain AABB contract (`minX <= x <= maxX`, `minZ <= z <= maxZ`) and one agent-radius inflation function. Export an immutable navigation snapshot from `House` containing bounds, all intentional static blockers, and separately identified door portals. Rasterize a cell as blocked when the agent footprint at that cell would overlap an inflated blocker; do not infer blockers from rendered meshes. Keep the player and Ghost motion helper on the same collision semantics.

**Warning signs:**
- A route changes when grid cell size changes slightly.
- Debug cells overlap visible wall/furniture edges or leave a one-cell seam through them.
- The narrowest 1.4-unit doorway disappears after radius inflation.
- Navigation tests use hand-copied rectangles instead of the house export.
- The planner and locomotion code each contain their own AABB inflation.

**Verification:**
Render a development-only grid/AABB overlay and inspect every doorway and collidable furniture item. Unit-test world↔cell boundary points, exact-edge contacts, all four bounds, the narrowest doorway, and every wall gap. For every returned waypoint, assert the Ghost circle does not overlap any inflated static blocker. Run the same fixtures against the shared motion helper.

**Phase to address:**
**Phase 1 — Navigation Geometry and Collision Foundation.** Phase 2 must not integrate pursuit until this representation is locked by tests.

---

### Pitfall 2: Diagonal Corner Cutting and High-Speed Tunneling Reintroduce Wall Phasing

**What goes wrong:**
A* correctly marks walls blocked, yet Matt clips diagonally through two touching blockers or crosses a thin wall/closed door in one large frame step. The defect appears mostly during chase lurch peaks, slow frames, or after difficulty is increased.

**Why it happens:**
Allowing a diagonal neighbor when only the destination cell is free cuts between blocked orthogonal cells. Separately, discrete overlap resolution only tests the final position; a large `speed * dt` step can land beyond a thin AABB without ever overlapping it. The current game clamps `dt` to `0.05`, but a harder chase speed multiplied by the lurch factor can still make the authoritative step materially larger than normal.

**How to avoid:**
Prefer cardinal movement for this axis-aligned house, or permit a diagonal only when both adjacent orthogonal cells are walkable. Move the Ghost through a shared swept/substepped AABB helper with a maximum substep based on radius and the thinnest relevant blocker, not one unconstrained waypoint delta. Keep cardboard jitter on the visual child or validate it through collision too; never perturb the authoritative position through blockers.

**Warning signs:**
- Failures occur only at wall corners or at low frame rate.
- The path is legal by cell IDs but interpolated segments cross blocked cells.
- Increasing chase speed makes previously passing wall tests fail.
- Collision checks run once per animation frame regardless of movement distance.
- Burn jitter modifies `group.position` directly, as the current Ghost implementation does.

**Verification:**
Add pure tests for two blockers touching at a corner, L-shaped walls, thin door slabs, and maximum-speed movement at `dt = 0.05`. Simulate the hardest configured speed and lurch peak for thousands of steps and assert every intermediate position is collision-free. Browser-test a forced chase along representative corners and closed doors under CPU throttling.

**Phase to address:**
**Phase 1 — Navigation Geometry and Collision Foundation**, with hardest-speed replay repeated in **Phase 7**.

---

### Pitfall 3: Door Planning, Door Animation, and Door Collision Disagree

**What goes wrong:**
Matt treats a closed usable door as permanently unreachable, walks through it before it clears, repeatedly toggles it, or replans forever while it is opening. Player and Ghost may also disagree about when a door is passable.

**Why it happens:**
A door is simultaneously a route portal, an animated mesh, an interaction target, and a physical blocker. The current `Door.aabb()` returns its closed slab only while `angle < 0.12`, then returns `null`; that removes collision near the start of a roughly 1.95-radian swing, well before the mesh is fully open. If a planner simply includes live door AABBs in its static grid, it cannot plan the required open-door action. If it ignores them entirely, locomotion phases through them.

**How to avoid:**
Give every door a stable ID, portal extent, queryable state (`closed`, `opening`, `clear`, `closing`), and a narrow `requestOpen()` command. Keep usable door portals traversable in the static route graph, but pause locomotion at an approach waypoint until measured geometric clearance is at least the Ghost diameter plus margin. Invalidate or resume the cached path on a door-state revision rather than rebuilding the grid. Either compute a conservative rotated-door AABB during the swing or keep the portal blocked until an explicit clearance threshold is reached. Prevent automatic closure while an actor occupies the sweep/portal.

**Warning signs:**
- Passability is based on `!door.isClosed` rather than actual clearance.
- The planner consumes `House.getColliders()` as a permanent blocked-cell source.
- Door state is inferred from mesh rotation in several systems.
- One doorway causes repeated open commands or replan spikes.
- Matt's body intersects the door mesh during the first frames of opening.

**Verification:**
Run a matrix for each door: closed, opening at several angles, clear, and closing, with Matt approaching from both sides. Assert one open request, no slab overlap, no progress through the portal before clearance, and eventual continuation after clearance. Also verify the player and Ghost use compatible passability thresholds and that a closing door cannot trap either actor in an invalid position.

**Phase to address:**
**Phase 2 — Ghost Routing, Doors, and Spatial Validity.** The conservative physical clearance contract begins in Phase 1.

---

### Pitfall 4: No-Route, Spawn, and Catch Fallbacks Violate Topology

**What goes wrong:**
When A* returns no path, Matt falls back to direct movement, teleports across a wall, reforms inside furniture, or catches through a wall/closed door because Euclidean distance is below the catch radius.

**Why it happens:**
The happy route is implemented first and fallback behavior is left as “move toward player.” The current post-banish code chooses a random point on a radius and clamps it to world bounds, which proves only that the point is inside the rectangle—not free, reachable, or route-distant. Current capture is also a distance-only decision after direct movement.

**How to avoid:**
Fail closed on route failure: hold position, choose a deterministic reachable fallback cell, or retry on the bounded replan cadence. Build spawn/reform selection from free cells in the player's connected component and enforce minimum route distance, not only straight-line distance. Catch only after collision-safe movement and require an unobstructed segment/current shared topology; never catch across a closed portal. Keep a stuck timer that triggers a bounded replan or valid-cell snap, not wall-phasing.

**Warning signs:**
- A `findPath(...) || directVectorToPlayer` branch exists.
- Spawn points are produced by random world coordinates plus `clamp`.
- Catch tests know only `Math.hypot(dx, dz)`.
- Unreachable targets cause continuous CPU use or teleporting.
- A catch can occur while a closed-door AABB separates the actors.

**Verification:**
Test disconnected fixtures, player positions inside/near blockers, all post-banish reforms, and each room pair under door-state combinations. Assert every selected spawn is free and path-connected, every no-route case stays spatially valid, and catches never cross a blocker. Instrument route distance and line-of-travel at the catch transition in a deterministic browser harness.

**Phase to address:**
**Phase 2 — Ghost Routing, Doors, and Spatial Validity.** Phase 7 repeats the full room/door matrix.

---

### Pitfall 5: Correct A* Still Produces Jitter, Nondeterminism, or Frame-Time Spikes

**What goes wrong:**
Matt oscillates between waypoints, paths change on identical inputs, or the game hitches when the player crosses cell boundaries. A “small” graph becomes expensive because it and its temporary arrays are rebuilt every frame.

**Why it happens:**
The current loop already allocates a copied collider array each frame. Adding grid construction, open/closed lists, path arrays, and replanning to every `Ghost.update` compounds garbage collection. Unstable tie-breaking makes equal-cost A* routes alternate, while replanning on raw player movement rather than target-cell/state changes creates churn.

**How to avoid:**
Build static occupancy once. Cache the path, target cell, waypoint cursor, and last relevant door revision. Replan only when the target changes cell, a relevant door/path changes, Matt is stuck, or a 250–500 ms bounded timer expires. Use fixed neighbor order and a stable `(f, h, insertionOrder)` tie-break. Reuse small buffers where clarity permits, cap expansions, and do not optimize with a new dependency before measurement.

**Warning signs:**
- Identical path queries produce different cell sequences.
- A* appears in per-frame profiles even while player and doors are stationary.
- Heap/array allocation rises continuously during a chase.
- Matt turns back toward the previous waypoint after small player motion.
- `House.getColliders()` is fed directly into grid construction each tick.

**Verification:**
Assert repeated-call path identity and a fixed maximum replan count during a scripted chase. Record A* expansions, replans/second, allocations, and frame time with stationary and moving targets. Verify no grid rebuild occurs after initialization unless static geometry intentionally changes. Profile the production build on a lower-powered device in Phase 7.

**Phase to address:**
**Phase 1** owns deterministic/cacheable primitives; **Phase 2** owns replan triggers and stuck behavior; **Phase 7** owns the frame-time budget.

---

### Pitfall 6: Category Sliders Exist but Audio Bypasses or Double-Feeds Them

**What goes wrong:**
Muting effects still leaves reverb tails or clicks audible, voice ignores its slider, one sound is unexpectedly twice as loud, or capture ducking affects only the dry signal. The UI appears complete while the audio graph is not.

**Why it happens:**
The current engine has many `_out(node)` calls plus direct connections from heartbeat, chase, voice, click, and a shared `reverbOut` to `master`. Retrofitting buses without auditing every `connect(this.master)` leaves bypasses. Connecting a source to both a category bus and the old helper creates parallel dry paths. A pre-category reverb send routed to master leaks around category mute.

**How to avoid:**
Make the graph topology explicit: every source belongs to exactly one semantic category, every category reaches master once, and master reaches the final compressor/destination once. Change the output helper to require a category. Ensure both dry and future wet signal are governed by that category—use category-aware sends/returns or feed the send after the category gain. Keep `AudioEngine` as the only owner of nodes; settings code calls `applySettings` rather than touching gains. Maintain a source-to-category inventory while migrating all existing cues.

**Warning signs:**
- `connect(this.master)` remains outside bus construction after the refactor.
- Muting a category leaves a tail or one representative cue audible.
- A source calls both `_out(...)` and `bus.connect(...)`.
- Voice/catchphrase uses a special direct-master path.
- Compressor or destination has more than the intended upstream connection.

**Verification:**
For each category, set its gain to zero and trigger at least one dry cue and one wet cue; only that category must disappear. Set master to zero and trigger all categories, including capture. Add a graph-routing seam or connection spy in tests, then manually listen for double feeds and lingering tails. Audit every direct `connect` site before completing Phase 4.

**Phase to address:**
**Phase 4 — Audio Buses, Persistence, and Settings UI.** Phase 5 may not add capture layers until this audit passes.

---

### Pitfall 7: Settings Persistence Becomes a Second, Unsafe Source of Truth

**What goes wrong:**
Corrupt or old storage prevents startup, sliders disagree with actual gains, values such as `NaN` or `4` reach `AudioParam`, settings work on reload but not in a new version, or storage denial throws an uncaught `SecurityError`.

**Why it happens:**
`localStorage` looks like a simple string map, so code parses and assigns it directly. Defaults are then duplicated in the UI, store, and audio engine. Browser policy, private modes, third-party contexts, and invalid/file origins can make storage access fail. Abruptly assigning gain values also creates audible zipper/click artifacts.

**How to avoid:**
Use one namespaced, versioned record and one pure normalization function. Wrap both property access and read/write in `try/catch`; reject non-objects, migrate known versions, accept only finite numbers, clamp `0..1`, fill missing fields from canonical defaults, and ignore unknown keys. Treat storage as best-effort persistence, never runtime authority. Pass the same normalized object to UI and `AudioEngine.applySettings`. Ramp gain changes with scheduled `AudioParam` transitions. Test via served HTTP, not `file:`.

**Warning signs:**
- `JSON.parse(localStorage.getItem(...))` runs during startup without a guard.
- Defaults appear in three modules.
- Slider `value` strings are passed directly to gain nodes.
- A malformed field resets all other valid fields.
- Tests use a `file:` URL or only verify stored JSON, not applied audio state.

**Verification:**
Unit-test missing, corrupt, array/null, wrong-type, non-finite, out-of-range, partial legacy, unknown-field, unavailable-storage, round-trip, and migration cases. Browser-test every control, reload, and compare normalized storage, slider values, and applied engine settings. Confirm the game still starts with storage methods forced to throw.

**Phase to address:**
**Phase 4 — Audio Buses, Persistence, and Settings UI.** Persistence is implemented before browser UI wiring.

---

### Pitfall 8: Settings Clicks Accidentally Start the Game or Reacquire Pointer Lock

**What goes wrong:**
Moving a pause-screen slider immediately hides the cursor and resumes mouse-look; opening title settings starts the game; keyboard adjustment triggers flashlight/interact input; or failed pointer lock leaves the overlay and game state inconsistent.

**Why it happens:**
The current title screen starts from a click on the entire overlay, and the current pause overlay requests pointer lock on any click. Nested interactive controls will bubble into those handlers. Pointer lock requires transient user activation and reports state asynchronously; browsers can reject requests and dispatch `pointerlockerror`. Global game key handlers also keep receiving events while form controls are focused.

**How to avoid:**
Give Start/Resume explicit buttons. Isolate the settings panel with `stopPropagation` for pointer events and ignore game bindings when an input/select/button is focused or settings is open. Closing settings should not implicitly lock; Resume should request it from its own user gesture. Drive pause/player-enabled state from `pointerlockchange`, handle `pointerlockerror`, and keep the overlay visible on failure. Preserve the title start gesture as the point that resumes `AudioContext`; preview sounds from settings must also occur only after a valid user gesture. Clear held movement keys when lock is lost.

**Warning signs:**
- Parent overlays retain catch-all `click` handlers.
- Dragging a range input causes `document.pointerLockElement` to become the canvas.
- A failed lock request has no visible recovery control.
- WASD/F/E handlers run while a slider has focus.
- The audio context is created/resumed by page load or an automated bypass rather than the real start interaction.

**Verification:**
Playwright should click and keyboard-adjust every title and pause control, assert the game state and pointer-lock state do not change, reload to verify persistence, then click explicit Resume and observe `pointerlockchange`. Force a `pointerlockerror` path and assert the pause UI remains usable. Manually test Escape → settings → Resume and start audio on the production preview.

**Phase to address:**
**Phase 4 — Audio Buses, Persistence, and Settings UI**, with production-browser confirmation in **Phase 7**.

---

### Pitfall 9: “Loud and Distorted” Means Clipped, Unintelligible, or Uncontrollable

**What goes wrong:**
The capture sting flat-tops into harsh digital clipping, voice disappears under noise, output varies dangerously by layer count, or jumpscare audio bypasses master/mute. A compressor is present but driven without headroom and treated as a guarantee.

**Why it happens:**
Layering oscillators, noise, an already-hot `stinger(1.2)`, and a voice gain above unity sums energy rapidly. Distortion is often implemented by raising gain rather than waveshaping/filtering. `DynamicsCompressorNode` helps control combined peaks but is not permission to feed arbitrary levels, and the current voice/stinger paths connect directly to master.

**How to avoid:**
Create a dedicated jumpscare bus that still flows through master and the final compressor. Build perceived impact from a brief pre-hit duck, spectral contrast, a filtered transient, controlled waveshaping, a tonal body, and one intelligible voice layer. Set conservative per-layer gains and preserve output headroom before compression. Make intensity scale bounded layer mix/distortion/motion; master zero must still silence capture. Track and restore temporary ducking on completion/cancel. Test on headphones from a low system level and raise deliberately.

**Warning signs:**
- The only tuning change is increasing gain above 1.
- Waveforms show sustained flat tops or the compressor stays in heavy reduction for the whole sequence.
- Voice comprehension drops when the sting is added.
- Jumpscare methods contain direct destination/master connections.
- Jumpscare intensity or master zero does not produce the specified quiet/mute behavior.

**Verification:**
Render or capture the controlled sequence through the actual graph, inspect peaks/flat-topping and compressor reduction, and compare all intensity settings plus master zero. Trigger the maximum layer combination repeatedly; it must not accumulate sources or become louder each run. Perform a calibrated manual headphone/speaker listen for impact, voice intelligibility, and absence of painful high-frequency dominance.

**Phase to address:**
**Phase 5 — Capture and Sound-Safety Orchestration**, after the Phase 4 bus topology is verified.

---

### Pitfall 10: Capture Timing Leaks State or Uses Unsafe Full-Screen Motion/Flashes

**What goes wrong:**
Repeated caught frames start multiple stings/timers, ducking never restores, retry inherits stale audio, the 86%-contained image reads as a card rather than a hit, or rapid full-screen flashing/jitter harms users. Reduced-motion users still receive lunge, shake, or high-frequency movement.

**Why it happens:**
The current `_onCaught` sequences independent audio/HUD calls and one unmanaged timeout. Expanding it with more timeouts makes cancellation and idempotence brittle. The existing scare image uses 86% containment plus an infinite 80 ms jitter, and no reduced-motion branch exists. Visual intensity is easily confused with flash frequency.

**How to avoid:**
Move capture into one controller with named phases, a one-shot guard, tracked timers/sources, and a `cancel/dispose` path that restores all temporary bus values. Change game state before starting the sequence and ignore gameplay input thereafter. Use a viewport-covering layer with focal positioning. Keep large-area flashes at no more than three per second and avoid saturated red flash patterns. Honor `prefers-reduced-motion` by replacing lunge/jitter/shake with a static cut or restrained crossfade while retaining clear capture feedback.

**Warning signs:**
- More `setTimeout` calls accumulate in `Game._onCaught`.
- Two capture triggers produce two death transitions or overlapping voices.
- CSS has an infinite rapid full-screen animation with no reduced-motion override.
- The death screen appears before ducking or sources are restored/stopped.
- A retry requires a page reload to clean up audio state.

**Verification:**
Trigger capture repeatedly in the same frame and assert one sequence, one voice/sting, and one death transition. Cancel at every phase and assert timers/sources/ducking are restored. Test common desktop viewport ratios, reduced-motion emulation, and intensity zero/max. Count full-screen luminance flashes over each one-second window and manually inspect the production build.

**Phase to address:**
**Phase 5 — Capture and Sound-Safety Orchestration.** Phase 7 owns viewport and reduced-motion browser coverage.

---

### Pitfall 11: Difficulty Is Tuned by Speed Before Legal Routing Is Proven

**What goes wrong:**
The repaired Matt becomes impossible in narrow halls, instantly recatches after banishment, or alternates between dead air and unavoidable pressure. A faster number hides route/stuck defects and makes battery balance meaningless.

**Why it happens:**
Direct phasing movement currently takes illegal short paths, so existing speed and downtime are not calibrated to legal house route lengths. Difficulty constants are scattered across `Ghost`, `ScareDirector`, `Player`, and `Game`. Adjusting chase speed alone does not coordinate stalk grace, replan cadence, catch distance, burn time, banishment relief, or resource supply.

**How to avoid:**
Freeze navigation correctness first. Centralize one balance object and tune the whole act curve: first pressure, stalk recurrence, chase speed, route persistence, catch radius, burn requirement, battery costs, and banishment downtime. Preserve explicit counterplay—sprint can gain distance on favorable routes and a completed burn buys measurable route-progress time. Use route time/distance, not straight-line distance, for scenarios.

**Warning signs:**
- “Harder” is a single `CHASE_SPEED` diff.
- Balance changes occur while wall/door tests are still failing.
- Post-banish spawn is within immediate catch route distance.
- A successful burn does not create enough time to make one meaningful decision.
- Test outcomes depend on random scare timing without a seed.

**Verification:**
Script deterministic act-1/2/3 scenarios and record time-to-first-pressure, encounter cadence, route closure rate, catch time, burn cost, and post-banish relief. Verify a disciplined route with finite charge can win, while always-on use fails or creates severe pressure. Manual playtests must include novice and practiced routes; no completion claim comes from constants or unit tests alone.

**Phase to address:**
**Phase 3 — Hunt Balance and Resource Fairness**, only after Phase 2 spatial acceptance passes. Phase 7 finalizes values.

---

### Pitfall 12: Battery Pressure Creates Either Infinite Safety or an Unwinnable Dark Run

**What goes wrong:**
Players can hold the flashlight continuously with no tradeoff, or an unlucky/inefficient run reaches zero charge with no recoverable route. Threshold sounds spam every frame, a full-charge pickup is consumed for no value, or burn drain applies when the beam is not actually affecting Matt.

**Why it happens:**
Drain, burn surcharge, refill amount, pickup count, expected run duration, banish duration, and encounter cadence are tuned independently. Current pickups grant a fixed refill capped at 100, so taking one near full can silently waste most of it. Current HUD low state is frame-updated, which is fine visually but unsuitable for one-shot warnings without transition tracking.

**How to avoid:**
Budget charge from expected route time and intended banish count. Keep capacity, base drain, active-hit burn drain, refill, warning thresholds, and relief time in the balance fixture. Fire low/critical/empty/recovered cues only on threshold crossings. Apply burn surcharge only while a validated beam hit affects Matt. Do not remove a pickup when it grants no meaningful value, or explicitly communicate the capped result. Ensure at least one conservative recovery path remains reachable before the terminal chase.

**Warning signs:**
- No deterministic economy simulation exists.
- Warning audio is called from a `pct < threshold` frame branch.
- Pickups disappear at 100% without feedback.
- A single difficulty tweak invalidates the total charge budget.
- Testers hoard every pickup or never need any pickup.

**Verification:**
Simulate always-on, disciplined exploration, multiple burns, empty-to-recovery, pickup-at-full, and worst accepted key-route cases. Assert exact threshold transition counts and charge never becomes negative/non-finite. In browser playthroughs, verify the player receives enough warning to change behavior and that finite supply supports the intended skilled completion without guaranteeing it.

**Phase to address:**
**Phase 3 — Hunt Balance and Resource Fairness.** Final subjective pressure is verified in Phase 7.

---

### Pitfall 13: A Key Coordinate Is Valid but the Key Is Not Fairly Collectible

**What goes wrong:**
A key is inside bounds and visually present yet cannot be reached, is occluded by furniture, fails the interaction raycast, sits below/inside a surface, or becomes impossible under a particular random combination.

**Why it happens:**
Keys deliberately sit on collidable furniture, so validating the key's own coordinate against navigation incorrectly marks good props blocked—or ignores that the player needs a nearby free stance. Current selection uses `Math.random()` over three candidates per room with no seed/test hook. Reachability alone also does not prove visibility or that the key is the first raycast target within the current 2.6-unit range.

**How to avoid:**
Store authored candidates as data with room, support height, expected approach stances, and optional visibility direction. Inject seeded randomness for tests. Validate at least one free, foyer-connected player stance within interaction range, the intended door rules, an unobstructed ray to the key, and correct mesh/support placement. Fail closed at build/test time and keep one known-good fallback per room. Test candidate combinations, not only candidates independently.

**Warning signs:**
- Validation checks only the key point or only grid reachability.
- Tests cannot select a specific candidate/seed.
- A candidate is technically reachable only by looking through another mesh.
- Runtime random selection has no fallback.
- Player reports cluster around one room/spot despite all unit tests passing.

**Verification:**
Enumerate all candidates and all current 3×3×3 combinations. For each selected key, prove a reachable stance, distance `<= 2.6`, clear interaction ray, correct support height, and eventual collection from the foyer under intended door behavior. Add production-browser fixtures that force each slot and confirm the counter reaches three before escape.

**Phase to address:**
**Phase 3 — Hunt Balance and Resource Fairness**, reusing the Phase 1 navigation truth.

---

### Pitfall 14: Branding Enrichment Damages Navigation, Performance, Readability, or Rights Boundaries

**What goes wrong:**
New terminals/signage silently block routes or key sightlines, repeated props inflate draw calls, extra shadow lights and bloom effects degrade frame rate, logos are unreadable in the flashlight, or unapproved Matt/stream/BridgeMind media ships publicly.

**Why it happens:**
Environmental polish is visually easy to add one mesh/material/light at a time. `House` owns both scene and colliders, so decorative additions can accidentally enter or fail to enter navigation. The current renderer already uses shadows, capped pixel ratio, bloom, procedural canvas textures, grain updates, and many lights; enrichment consumes existing headroom. The repository's asset README explicitly separates code licensing from likeness/stream/brand permission.

**How to avoid:**
Make decorative props non-colliding by default; intentional blockers must declare an AABB and trigger navigation/key-placement tests. Reuse geometry/materials/textures, use `InstancedMesh` for truly repeated props, avoid per-prop dynamic lights/shadows, and create procedural textures once rather than per frame. Give each major room one readable focal artifact and one secondary detail instead of logo wallpaper. Profile before/after using production build frame time, renderer draw-call/triangle counts, and a lower-powered device. Keep new media permission-safe and record approval before redistribution.

**Warning signs:**
- A new visual prop changes movement without a collider/navigation fixture.
- Every logo/terminal creates unique geometry, material, canvas texture, or shadow-casting light.
- `renderer.info.render.calls`, triangles, or frame time jump after the art pass.
- Bloom makes text illegible or dark-room signage cannot be found with the flashlight.
- New downloaded/stream-derived assets have no documented permission source.

**Verification:**
Compare production-build frame-time percentiles and renderer counts before/after the environment pass; walk every route and forced key slot. Test focal props at gameplay distance under normal flashlight exposure. Confirm decorative colliders are explicit, navigation snapshot/tests remain green, and every new non-procedural brand/likeness/audio asset has a documented rights decision.

**Phase to address:**
**Phase 6 — BridgeMind Environment and Performance**, with final profiling and rights review in **Phase 7**.

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hand-copy wall rectangles into navigation tests | Fast first fixture | Geometry drifts from `House`; tests bless a different map | Only for isolated algorithm unit tests, never integration truth |
| Use current `getColliders()` as the grid input every frame | Reuses an existing API | Allocations, door portals become permanently blocked, static/dynamic truth is mixed | Never for navigation construction |
| Fall back to direct pursuit when A* fails | Matt keeps moving | Restores the core wall-phasing bug and hides invalid geometry | Never |
| Treat `!isClosed` as “door clear” | Very simple state check | Actors cross a mostly closed swinging mesh | Never; clearance must be geometric/conservative |
| Scatter balance constants across systems | Local edits are easy | No reproducible difficulty/economy contract | Only while values are consumed from one injected frozen object |
| Keep special audio paths connected to master | Avoids migrating one cue | Mute/duck/settings lie to the player | Never after Phase 4 |
| Save raw slider JSON | Minimal persistence code | Corrupt/old values break startup or audio | Never; normalization is small and required |
| Add capture phases as more `setTimeout`s | Quick visual iteration | Duplicate sequences and unrecoverable duck/timer state | Only inside one tracked sequence owner |
| Add decorative unique meshes/materials | Fast authoring | Draw-call and memory growth | Acceptable for a few hero props after profiling, not repeated props |
| Tune only on a high-end desktop | Fast feedback | Production build stutters elsewhere; path/audio bugs appear under slow frames | Never as release evidence |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `House` → `NavigationGrid` | Pass live Three.js meshes or copied per-frame colliders | Export immutable plain bounds/static AABBs plus stable door portal metadata once |
| `NavigationGrid` → `Ghost` | Return a path but let Ghost interpolate unconstrained | Follow cached waypoints through shared substepped AABB motion |
| `Ghost` ↔ `Door` | Toggle mesh directly or use only `isClosed` | Query stable door state/clearance and issue one idempotent open request |
| `Ghost` → capture | Return distance-only caught every frame | Return one transition after collision-safe movement and blocker/portal validation |
| Web Audio buses | Route dry to category but wet/direct exceptions to master | Require one category per source and keep dry/wet governed by that category before master/compression |
| `localStorage` → runtime | Treat stored JSON as trusted complete settings | Load best-effort, migrate/normalize/clamp, then share one normalized object |
| Settings panel → pause/title overlays | Let input events bubble to catch-all click handlers | Use explicit Start/Resume controls and isolate settings events/focus |
| Pointer Lock → game state | Assume `requestPointerLock()` succeeds synchronously | React to `pointerlockchange`, handle `pointerlockerror`, keep recovery UI visible |
| Capture → audio buses | Duck buses without tracked restoration | Sequence owns a settings snapshot/duck token and restores on complete/cancel |
| Decor → navigation/key placement | Add collidable visuals without geometry revision | Non-colliding by default; intentional blockers enter the shared snapshot and regressions |
| Vite assets → public release | Assume MIT code license covers stream/likeness/brand media | Verify and document redistribution permission per asset |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Rebuild occupancy/A* every frame | Chase hitching, GC spikes, route jitter | Static grid, cached path, bounded/event-driven replan | Immediately in the animation loop, especially under chase/audio load |
| Copy/allocate collider and vector data in hot loops | Periodic frame spikes | Separate immutable geometry, reuse small buffers/vectors where clear | Sustained chase on lower-powered hardware |
| Unbounded one-shot nodes, intervals, and capture timers | Duplicated audio, rising CPU/memory after retries | Stop sources/intervals; one idempotent sequence owner | Repeated catches, retries, or long sessions |
| Unique mesh/material/texture for every branded prop | High draw calls and GPU memory | Share/instance repeated assets; a few hero uniques only | Environment enrichment pass |
| Additional shadow-casting lights for each prop | GPU-bound frame time, inconsistent darkness | Baked/emissive materials and very few deliberate lights | As soon as several rooms are visible/processed |
| Always-on full-resolution postprocessing/effects | Low-end stutter and unsafe motion intensity | Retain pixel-ratio cap, profile bloom/shadows, reduce nonessential motion | High-DPI screens and integrated GPUs |
| Per-frame DOM/style writes for unchanged values | Layout/style churn | Update HUD only on value/state changes or meaningful thresholds | Combined with new settings/capture UI and 60 FPS loop |

## Security Mistakes

This is a local client-only game, so the security surface is small. The relevant risks are browser trust-boundary and distribution mistakes rather than server auth.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Treating `localStorage` as trusted data | Malformed values can cause startup failure, invalid gains, or prototype-shaped payload surprises | Copy only allowlisted scalar fields into a fresh object; version, finite-check, clamp, and catch access/parse errors |
| Extending current `innerHTML` note rendering to external/user content | Script/markup injection if notes ever stop being authored constants | Keep content authored/local or render as `textContent` with explicit line breaks; sanitize any future external HTML |
| Logging storage payloads or future user/device diagnostics by default | Unnecessary exposure in shared console/traces | Log only high-signal normalized errors; do not add telemetry without an explicit privacy decision |
| Shipping unverified stream/likeness/brand assets | Legal/distribution takedown risk despite technically valid build | Treat `src/assets/README.md` as a release gate and record per-asset permission/provenance |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Wall-respecting but visibly jittery Matt | Correctness still reads as broken AI | Stable tie-breaks, waypoint tolerances, bounded replans, and visual-only cardboard wobble |
| Door opens instantly for collision but animates slowly | Player sees phasing and loses trust | Wait for measured clearance; synchronize creak/action/locomotion |
| Settings hidden until after sound starts | Headphone users cannot protect themselves | Put persistent controls on title and pause before ambient/capture playback |
| Range sliders steal/reacquire pointer lock | Settings become unusable | Explicit Start/Resume, isolated events, focus-aware input routing |
| Audio-only danger/battery information | Muted or hearing-impaired players miss state | Pair cues with restrained HUD/light feedback |
| Full-screen jitter/strobe as the only intensity tool | Motion/photosensitivity harm and reduced readability | Controlled lunge/cut, safe flash rate, reduced-motion alternative, intensity control |
| “Hard” means unavoidable hallway death | Player decisions stop mattering | Route-aware coordinated tuning with measurable counterplay |
| Pickup consumed at full charge | Feels punitive and opaque | Leave it, grant meaningful value, or clearly report the cap |
| Key is reachable but requires pixel hunting | Randomization feels unfair | Validate visible approach/raycast stance and playtest each forced candidate |
| Branding on every surface | Horror becomes an ad and landmarks blur | One strong focal story prop plus one quiet detail per major room |

## "Looks Done But Isn't" Checklist

- [ ] **Navigation grid:** A* returns paths, but every cell/segment has not been checked against radius-inflated live house AABBs.
- [ ] **Corner safety:** Destination cells are free, but diagonal adjacency and swept/substepped motion have not been tested.
- [ ] **Doors:** Matt can request open, but cannot yet prove he waits for real body clearance through every swing state.
- [ ] **No-route handling:** The happy path works, but unreachable/stuck behavior still falls back to direct pursuit or teleport.
- [ ] **Spawns/reforms:** Points are inside bounds, but not proven free, path-connected, and route-distant.
- [ ] **Capture:** Catch radius works, but wall/closed-door separation is not rejected.
- [ ] **Performance:** Unit tests pass, but replans/second, allocations, draw calls, and production frame time are unmeasured.
- [ ] **Audio buses:** Sliders move, but every direct master, voice, chase, click, and wet-return path has not been audited.
- [ ] **Mute:** Category zero silences one dry sample, but wet tails and capture have not been tested.
- [ ] **Persistence:** Reload works with valid JSON, but corrupt/legacy/denied storage has not been exercised.
- [ ] **Pointer lock:** Settings render, but title/pause slider clicks and keyboard focus have not been tested against game handlers.
- [ ] **Autoplay:** Tests force audio permission, but the real user start gesture has not resumed and produced audio in production preview.
- [ ] **Jumpscare loudness:** It sounds loud on one system, but graph peaks, compressor behavior, master zero, and voice intelligibility are unverified.
- [ ] **Capture lifecycle:** One capture works, but repeated start/cancel/retry does not prove timers, sources, and ducking clean up.
- [ ] **Motion/flash safety:** Reduced-motion CSS exists, but jitter/lunge/shake and flash count are not verified at runtime.
- [ ] **Difficulty:** Matt is faster, but deterministic legal-route scenarios do not prove the hunt remains beatable.
- [ ] **Battery:** HUD updates, but the whole run budget and threshold edge counts are not simulated.
- [ ] **Keys:** Each coordinate looks plausible, but all 27 combinations do not prove reachable stance, raycast, and collection.
- [ ] **Branding:** Props appear in screenshots, but room readability, collision effects, performance delta, and rights provenance are unverified.
- [ ] **Release:** Dev mode is green, but production build, preview browser, console/page errors, and a complete human playthrough remain unchecked.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Grid and collision truths diverged | HIGH | Freeze integration; export canonical geometry; add overlay/fixtures; correct rasterization and shared motion before retuning |
| Corner cutting/tunneling found late | MEDIUM | Add cardinal/no-cut policy and substeps; replay hardest-speed traces; then retune waypoint tolerances/speed |
| Door state model is wrong | HIGH | Introduce stable portal/state/clearance contract; remove `!isClosed` passability; rerun every-door both-side matrix |
| Direct fallback/spawn phasing remains | MEDIUM | Remove fallback, fail closed, add reachable-cell sampling and topology-safe catches; instrument no-route reasons |
| Audio bus leaks | MEDIUM | Inventory every source/connect site; migrate one category at a time; verify dry/wet mute matrix after each group |
| Storage/UI states diverge | LOW | Make normalization canonical; reload normalized settings into both UI and engine; add malformed/denied storage tests |
| Pointer lock swallows settings | LOW | Replace overlay-wide handlers with explicit buttons; stop propagation; add focus guards and error recovery |
| Jumpscare clips or leaks state | MEDIUM | Lower layer gains, restore headroom, route through bus/master/compressor, centralize sequence cleanup, re-render/listen |
| Difficulty/battery became unfair | MEDIUM | Revert to last measured balance fixture; collect route/economy metrics; retune coordinated values rather than one speed/gain |
| Invalid key candidate shipped | LOW | Disable candidate, use known-good fallback, add forced-seed stance/raycast fixture before re-enabling |
| Branding pass regressed performance | MEDIUM | Disable newest groups, inspect renderer counts, share/instance geometry/materials, remove decorative shadows/lights, reprofile |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Grid does not match collision geometry | Phase 1 | Overlay + world/cell edge fixtures + all doorway/static-blocker assertions |
| Corner cutting and tunneling | Phase 1 | No-cut diagonal fixtures + hardest-speed `dt=0.05` substep simulation |
| Door planning/animation/collision drift | Phase 2 | Every-door, both-side, multi-angle clearance matrix |
| Invalid no-route/spawn/catch fallbacks | Phase 2 | Disconnected fixtures + connected-component spawn checks + blocker-safe capture |
| A* churn/nondeterminism | Phases 1–2 | Repeated path identity + bounded replans/second and expansion counts |
| Category bus bypass/double feed | Phase 4 | Full dry/wet/category/master mute matrix and direct-connect audit |
| Unsafe/divergent persistence | Phase 4 | Codec migration/error suite + browser reload/applied-state agreement |
| Pointer-lock/settings gesture conflict | Phase 4 | Playwright title/pause input isolation + real Resume/pointerlockerror paths |
| Clipped/uncontrollable jumpscare mix | Phase 5 | Render/analyze max layers, compressor reduction, master zero, manual calibrated listen |
| Capture lifecycle and unsafe motion/flash | Phase 5 | Idempotence/cancel suite + viewport/reduced-motion/flash-count checks |
| Speed-only difficulty | Phase 3 | Seeded act scenarios and practiced/novice legal-route playthroughs |
| Battery soft lock or infinite safety | Phase 3 | Deterministic economy matrix and threshold transition counts |
| Technically valid but unfair keys | Phase 3 | All candidates and all 27 current combinations with stance/raycast/collection proof |
| Branding harms routes/performance/rights | Phase 6 | Route regression + renderer/frame delta + gameplay-distance review + asset provenance |
| Cross-system release gaps | Phase 7 | Unit suite, production build/preview, browser smoke, full human playthrough, low-end profile |

## Sources

### Live project evidence

- `.planning/PROJECT.md` — active contract, navigation/performance/audio/persistence constraints, and pending decisions.
- `.planning/research/STACK.md` — prescribed pure grid/settings modules, test layers, bus topology, and production-preview verification.
- `.planning/research/FEATURES.md` — table-stakes acceptance behavior, dependencies, accessibility, fairness, and asset-rights boundary.
- `.planning/research/ARCHITECTURE.md` — canonical boundaries, build order, data flow, anti-patterns, and performance priorities.
- `src/player/Player.js:93-191` — current per-axis circle/AABB movement, battery drain, and direct position allocations/updates.
- `src/world/House.js:33-86` — current door state and early collider disappearance; `src/world/House.js:156-190` — static wall AABBs; `src/world/House.js:436-456` — random key/fixed battery placements; `src/world/House.js:553-560` — per-frame collider copy plus closed doors.
- `src/systems/Ghost.js:114-191` — direct wall-phasing pursuit, visual jitter on authoritative position, distance-only catch, and bounds-only random reformation.
- `src/Game.js:83-106` — pointer-lock/pause click behavior; `src/Game.js:111-145` — user-gesture start and current timeout capture; `src/Game.js:303-369` — frame ordering and live collider path.
- `src/systems/AudioEngine.js:23-56`, `124-139`, and direct `connect(this.master)` sites — current master/compressor, shared reverb return, output helper, and bypass inventory.
- `src/ui/HUD.js:28-36`, `75-103`, and `index.html:1-231` — repeating visual timers, capture/shake methods, 86%-contained jittering scare, catch-all title/pause overlays, and absence of settings/reduced-motion UI.
- `src/assets/README.md` — permission boundary for Matt, stream, and BridgeMind-derived assets.
- Live CBM project `Users-admin-Documents-bridge-horror-house` — ready on 2026-07-10 with 373 nodes and 919 edges; used to constrain inspection to movement, door, item, audio, capture, and UI symbols.

### Browser/platform references

- [MDN — Web Audio API best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) — resume/create audio context from a user gesture, provide user controls, and schedule `AudioParam` changes.
- [MDN — DynamicsCompressorNode](https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode) — compression lowers loud signal parts and helps prevent clipping when sounds combine.
- [MDN — AudioParam.setTargetAtTime](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime) — smooth gain transitions.
- [MDN — Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API) and [`requestPointerLock()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestPointerLock) — transient activation, asynchronous state changes, and `pointerlockerror` handling.
- [MDN — `localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) — origin/session persistence and `SecurityError`/file-origin caveats.
- [W3C Technique G19](https://www.w3.org/WAI/WCAG21/Techniques/general/G19) — keep flashes to no more than three in any one-second period.
- [MDN — `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion) — reduce or replace nonessential motion for the user's OS preference.
- [Three.js — `InstancedMesh`](https://threejs.org/docs/pages/InstancedMesh.html) — reduce draw calls for repeated geometry/materials.

---
*Pitfalls research for: BridgeMind Horror House hardening milestone*
*Researched: 2026-07-10*
