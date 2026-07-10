# Project Research Summary

**Project:** BridgeMind Horror House
**Domain:** Brownfield first-person Three.js browser survival-horror/comedy game
**Researched:** 2026-07-10
**Confidence:** HIGH

## Executive Summary

BridgeMind Horror House already has its complete explore-key-chase-escape loop. This milestone is a hardening and enrichment pass: make Matt obey the same house geometry as the player, make the resulting legal chase tense but beatable, turn flashlight charge into a fair survival resource, provide persistent category-level audio control, and make capture and environmental presentation feel intentional. The smallest correct approach is to retain the current client-side Three.js/Vite/Web Audio application and add pure JavaScript mechanics at narrow seams rather than replatforming the game.

The roadmap must be dependency-driven. Canonical house geometry and deterministic navigation come first; Ghost routing, door actions, spawns, and catches build on that foundation; only then can difficulty, battery economy, and key fairness be tuned against real route lengths. In parallel, all sound must be brought under exclusive category buses before settings UI, expanded cues, or the new jumpscare are added. Capture should have one cancellable sequence owner, and branding should remain a late, permission-safe content pass that cannot change navigation accidentally.

The largest risk is false completion: A* can return paths while Matt still cuts corners, sliders can move while wet audio bypasses mute, and a loud jumpscare can clip or violate motion/flash constraints. Every phase therefore needs deterministic tests plus production-preview browser evidence. Final difficulty, perceived loudness, room readability, and low-end frame behavior remain human playtest questions and cannot be closed by unit tests alone.

## Key Findings

### Recommended Stack

Keep the existing stack and lockfile baseline. Implement navigation, settings normalization, balance fixtures, and placement validation as pure ECMAScript modules. Use Node's built-in test runner for deterministic mechanics and add only `@playwright/test@1.61.1` as a development dependency for Chromium verification against the production Vite preview. No new runtime dependency is justified.

**Core technologies:**
- ECMAScript modules on Node 22.x — pure, deterministic mechanics that run without DOM, WebGL, or transforms.
- Three.js `0.170.0` — retain rendering and world-space movement; it is already integrated and is not the wall-phasing cause.
- Vite `6.4.3` — retain the verified build/preview pipeline and test the built application at `127.0.0.1:4173`.
- Web Audio API — add ambience, music, effects, voice, and jumpscare gain buses under master gain and the final compressor.
- Versioned `localStorage` — persist one small normalized settings record with safe defaults and best-effort failure handling.
- `node:test` and `node:assert/strict` — cover pure route, settings, balance, and placement behavior without another package.
- `@playwright/test@1.61.1` — the sole new dependency, initially installing Chromium only.

**Explicit stack recommendation:** do not add a physics engine, navmesh/pathfinding package, UI framework, audio wrapper, IndexedDB, Vitest/Jest, or a second browser harness. Reconsider these only if future requirements introduce irregular multi-floor traversal, large dynamic worlds, Vite-only test transforms, structured saves, or explicit cross-browser support.

See [STACK.md](STACK.md) for versions, compatibility, and installation details.

### Expected Features

**Must have (table stakes):**
- Wall-respecting pursuit — Matt remains outside radius-inflated blockers and never catches through walls.
- Door-aware route execution — routes may target usable portals, but Matt must approach, open, wait for clearance, and pass physically.
- Valid spawns and reforms — every point is free, path-connected, and separated by minimum route distance.
- Escalating but survivable pressure — act-based pressure coordinates cadence, persistence, speed, and relief instead of raising one constant.
- Legible battery economy — charge use, burn surcharge, thresholds, pickups, and recovery create decisions without a soft lock.
- Fair key variability — one curated, reachable, visible, raycast-collectible candidate per authored room, covered by seeded tests.
- Complete persistent audio controls — master, ambience, music, effects, voice, and jumpscare intensity are immediate, keyboard-operable, safely persisted, and true-mute capable.
- Safe final mix and complete cue language — every dry/wet path respects its category/master, and critical events have distinct audio with visual redundancy.
- Full-viewport capture — one atomic, idempotent sequence synchronizes a layered compressor-limited sting and Matt visual before one retry transition.
- Motion/flash safety — reduced motion removes nonessential lunge/jitter/shake, and large-area flashes remain within WCAG limits.

**Should have (competitive):**
- Flashlight as both visibility and defense currency — the central survival decision.
- A visually cheap but physically credible hunter — preserve the billboard joke while making movement spatially honest.
- Sparse BridgeMind diegetic storytelling — one focal artifact and one secondary detail per major room.
- Distance-readable pursuit mix — breathing, heartbeat, techno, and threat layers communicate danger without a minimap.
- Curated seeded variability — replay value without sacrificing solvability or regression coverage.
- Category-specific horror controls — ambience and jumpscare intensity exceed the baseline music/SFX/dialogue split.

**Defer (v1.x/v2+):**
- Difficulty presets, mono mode, captions, seed display, and extra acoustic zones — add only after the default experience is proven.
- More key/scare candidates and approved media — expand only after current combinations and rights are verified.
- Adaptive tension direction, new inventory/crafting/save systems, multiplayer, and a 3D Matt — no demonstrated need for this milestone.

See [FEATURES.md](FEATURES.md) for acceptance behavior and the full anti-feature list.

### Architecture Approach

Remain a small client-side monolith. `Game` is the composition root and authoritative run-state owner; `House` owns canonical geometry and door meshes; pure modules own navigation, shared AABB motion, settings normalization, balance, and placement selection; `Ghost` consumes injected navigation/door contracts; `AudioEngine` alone owns the audio graph; and `CaptureSequence` alone owns terminal capture timing and cleanup. Browser APIs and UI stay at the edges, and no mechanic should inspect Three.js meshes or DOM state directly.

**Major components:**
1. `Game` — constructs collaborators, owns run state/frame order, dispatches interactions, and passes subsystem snapshots/configuration.
2. `House` plus authored navigation data — single source of truth for static AABBs, dynamic door portal IDs/extents, interactables, and placement candidates.
3. `NavigationGrid` plus shared `AabbMotion` — radius-inflated occupancy, deterministic cardinal A*, nearest walkable cells, cached route inputs, and substepped collision-safe movement.
4. `Ghost` plus narrow door interface — waypoint following, bounded replanning, stuck/no-route handling, physical door use, topology-safe spawn/reform, and blocker-safe catch transitions.
5. Frozen balance and placement fixtures — coordinated threat/battery values and seeded candidate selection/validation.
6. `AudioEngine` plus `AudioSettingsStore`/`SettingsPanel` — exclusive category routing, final compression, normalized persistence, and UI application through named methods.
7. `CaptureSequence` — idempotent freeze, duck, layered impact, safe full-viewport motion, tracked cancellation, cleanup, and death-screen handoff.

See [ARCHITECTURE.md](ARCHITECTURE.md) for boundaries, data flow, and anti-patterns.

### Dependency Order

```text
canonical geometry/AABB conventions
  -> deterministic static grid and shared motion
  -> cached Ghost routes and door actions
  -> topology-safe spawns/reforms/catches
  -> route-aware difficulty
  -> battery economy and fair key placement

normalized audio settings schema
  -> exclusive category buses
  -> settings UI and persistence
  -> detailed cue mix and capture bus
  -> safe full-viewport capture

asset-rights boundary + stable room/navigation layout
  -> BridgeMind environmental enrichment

all systems
  -> production verification and final tuning
```

Navigation must precede balance because direct phasing currently creates illegally short routes. Battery tuning follows threat tuning because burn frequency and banishment relief define charge value. Placement validation must reuse canonical navigation/collision data. Audio buses must precede controls and new sources so no dry or wet path bypasses category mute. Branding can proceed late and mostly independently, but intentional colliders must re-enter the geometry tests.

### Critical Pitfalls

1. **Navigation and collision describe different houses** — export canonical plain geometry from `House`, inflate it with the same actor radius semantics, and prove world/cell boundaries and every doorway in fixtures and a debug overlay.
2. **Corner cutting, tunneling, and unsafe fallbacks restore phasing** — use cardinal/no-cut routing, capped/substepped movement, fail-closed no-route behavior, connected-cell spawn sampling, and unobstructed topology-aware catches. Never fall back to direct pursuit or teleport.
3. **Door planning, animation, and clearance disagree** — represent stable portal IDs and states; a route can target a doorway, but movement waits for conservative body clearance rather than trusting `!isClosed`.
4. **Correct A* is still jittery or expensive** — use stable tie-breaking, cached static occupancy, bounded replanning triggers, path reuse, and measured expansions/replans/allocations rather than rebuilding each frame.
5. **Audio controls lie or become unsafe** — route every dry and wet source through exactly one category, normalize versioned storage field by field, ramp gains, isolate settings events from pointer lock, and keep jumpscare/master mute ahead of the final compressor.
6. **Capture appears forceful but leaks or harms** — make capture idempotent and cancellable, track timers/sources/duck restoration, achieve loudness through contrast and density instead of clipping, and runtime-test reduced motion and flash counts.
7. **Difficulty/resources/keys are tuned by intuition** — freeze legal routing first, centralize balance, simulate deterministic run economies and all 27 current key combinations, then validate novice/practiced playthroughs.
8. **Branding breaks gameplay or rights boundaries** — prefer procedural/text artifacts, verify provenance, keep decoration non-colliding by default, reuse geometry/materials, and profile routes/readability/draw calls after enrichment.

See [PITFALLS.md](PITFALLS.md) for warning signs, recovery costs, and phase ownership.

### Verification Strategy

Use a layered evidence model; no single layer is sufficient.

**Pure unit tests (`node --test`):**
- Grid rasterization, radius inflation, straight/detour/doorway/unreachable routes, start/goal clamping, stable repeated output, and no corner cutting.
- Substepped movement and hardest-speed blocker separation.
- Settings parsing, migration, finite-number clamps, corrupt/denied storage, unknown fields, defaults, and round trips.
- Seeded spawn/reform and key selection, reachable interaction stances, all candidates, and all 27 current key combinations.
- Deterministic difficulty/battery scenarios: always-on failure, disciplined success, burns, threshold edge counts, empty-to-recovery, and pickup-at-full.
- Capture idempotence, cancellation, transition order, and cleanup through injected test doubles.

**Integration/instrumentation:**
- Every-door, both-side, multi-angle route/animation/clearance matrix.
- Connected-component and blocker-safe spawn/catch validation.
- Bounded replans/second, A* expansions, allocations, audio node/timer cleanup, renderer calls, and production frame-time deltas.
- Full dry/wet/category/master mute matrix and audit of all direct audio connections.

**Playwright against production preview:**
- Build and load the real `dist/`, use the real start gesture, and fail on unexpected page/console errors.
- Verify title/pause settings are visible, labeled, keyboard-operable, event-isolated from pointer lock, persisted, and applied after reload.
- Exercise controlled wall/door navigation fixtures, deterministic placements, repeated capture, viewports, master zero, reduced motion, and screenshot/trace retention on failure.

**Manual browser/playtest gates:**
- Pointer-lock feel, legal pursuit pressure, novice/practiced beatability, battery decision quality, key discoverability, voice intelligibility, perceived jumpscare force, room readability, full-run cleanup, and lower-powered-device performance.

Recommended implementation scripts: `test` (`node --test`), `test:browser` (`playwright test`), and `verify` (`npm test && npm run build && npm run test:browser`).

## Implications for Roadmap

Based on research, preserve the following dependency sequence.

### Phase 1: Navigation Geometry and Collision Foundation
**Rationale:** Every downstream chase, placement, and balance decision depends on one authoritative representation of the house.
**Delivers:** Plain AABB conventions, radius-inflated grid generation, deterministic A*, no-corner-cut rules, shared substepped motion, debug visibility, and pure regression fixtures.
**Addresses:** Wall-respecting pursuit foundation and reusable reachability.
**Avoids:** Geometry drift, corner cutting, tunneling, nondeterminism, and per-frame graph rebuilds.

### Phase 2: Ghost Routing, Doors, and Spatial Validity
**Rationale:** The route planner has value only after the live Ghost executes it safely through dynamic doors and all fallback paths obey topology.
**Delivers:** Cached waypoint following, bounded replanning, door request/clearance behavior, stuck/no-route handling, valid spawns/reforms, and blocker-safe catches.
**Uses:** Phase 1 navigation and shared movement primitives.
**Implements:** Injected `Game -> Ghost -> navigation/door` boundaries.

### Phase 3: Hunt Balance and Resource Fairness
**Rationale:** Legal route lengths are required before speed, encounter cadence, banishment relief, charge supply, or placement fairness can be measured.
**Delivers:** One frozen balance fixture, route-aware act pressure, battery thresholds/economy, curated key data, reachable interaction validation, and seeded simulations.
**Addresses:** Escalating but survivable pressure, meaningful flashlight economy, and fair varied keys.
**Avoids:** Speed-only difficulty, infinite safety/dark-run soft locks, and technically valid but uncollectible keys.

### Phase 4: Audio Buses, Persistence, and Settings UI
**Rationale:** All existing paths must obey semantic categories before adding more cues or a capture mix.
**Delivers:** Exclusive ambience/music/effects/voice/jumpscare buses, audited wet/dry routing, final master compression, normalized versioned storage, gain ramps, and title/pause settings with pointer-lock isolation.
**Uses:** Native Web Audio, `localStorage`, pure settings modules, and Node/Playwright tests.
**Avoids:** Bypass/double-feed audio, corrupt persistence as runtime truth, zipper noise, and settings clicks starting/resuming play.

### Phase 5: Capture and Sound-Safety Orchestration
**Rationale:** Capture depends on the category graph and settings contract and needs a dedicated lifecycle owner before its presentation becomes more complex.
**Delivers:** One-shot `CaptureSequence`, contrast/duck/impact/restore phases, layered compressor-limited audio, full-viewport Matt, intensity scaling, reduced-motion behavior, flash safety, cleanup, and retry handoff.
**Addresses:** The required forceful but controllable climax.
**Avoids:** Duplicate timers/sources, stuck ducking, clipping, mute bypass, stray input, and unsafe motion/flashes.

### Phase 6: BridgeMind Environment and Detailed Sound
**Rationale:** Content enrichment is safest after mechanical layouts and audio routing are stable.
**Delivers:** Critical-event cue coverage, room atmosphere, permission-safe branded props/signage/terminals, reusable geometry/materials, and preserved room readability.
**Addresses:** Game-state legibility and distinct BridgeMind identity.
**Avoids:** Branding spam, rights ambiguity, accidental blockers, draw-call growth, and audio category regressions.

### Phase 7: Production Verification and Tuning
**Rationale:** Cross-system behavior and subjective experience can only be accepted in the built game after every dependency is integrated.
**Delivers:** Full unit/browser suites, production build/preview evidence, route/door and placement matrices, audio mute/persistence/capture analysis, complete novice/practiced playthroughs, lower-powered-device profiling, and final coordinated tuning.
**Addresses:** The active requirement for automated regression, production build, and browser playtesting.
**Avoids:** Declaring success from dev mode, isolated tests, or one high-end-machine playthrough.

### Phase Ordering Rationale

- Phase 1 creates canonical spatial truth; Phase 2 proves that the live pursuer obeys it; Phase 3 tunes only against that legal behavior.
- Phase 4 establishes the audio/settings contract; Phase 5 builds capture on it; Phase 6 adds content without inventing bypass paths.
- Phase 3 and Phase 4 may be planned as separate workstreams only after Phase 2 spatial acceptance, but each should remain internally sequential.
- Phase 6 is intentionally late so decoration cannot destabilize routing and new sounds cannot escape the established bus graph.
- Phase 7 is a real integration and experiential gate, not a documentation phase.

### Research Flags

Phases likely needing deeper research or instrumentation during planning:
- **Phase 1:** choose and document cell size/radius inflation from measured doorway clearance; use a debug overlay to validate the authored map.
- **Phase 2:** define the exact door portal/clearance contract and catch line-of-travel rule against current animation geometry.
- **Phase 3:** collect real route times and playtest evidence before finalizing pressure, burn, refill, and banishment values.
- **Phase 5:** render/analyze the final audio mix and runtime-count motion/flashes; perceived force remains subjective.
- **Phase 6:** confirm redistribution rights for every non-procedural likeness, voice, stream, logo, or brand asset.
- **Phase 7:** define the representative lower-powered device and the performance acceptance budget.

Phases with established patterns that do not need a separate research phase:
- **Phase 4:** native Web Audio buses, versioned `localStorage`, gain ramps, and imperative DOM controls are well documented; implementation still needs exhaustive routing audit/tests.
- **Browser harness setup:** Vite preview plus Playwright Chromium is standard and already supported by the retained stack.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing lockfile/runtime was inspected; official Node, Vite, Playwright, Web Audio, and storage behavior supports the minimal recommendation. |
| Features | HIGH | Active requirements and live game behavior define the milestone; platform accessibility guidance supports the safety baseline. |
| Architecture | HIGH | Recommendations follow current component ownership and confirmed movement/audio seams; no replatforming is required. |
| Pitfalls | HIGH | Code paths and browser hazards are concrete; final balance and perceived loudness remain playtest-dependent. |

**Overall confidence:** HIGH

### Gaps to Address

- **Navigation resolution:** select cell size, actor radius, and clearance tolerances from live geometry and overlay evidence during Phase 1.
- **Default balance:** route-aware speed, encounter cadence, charge budget, and banishment relief require deterministic metrics plus novice/practiced playtests in Phase 3/7.
- **Audio target:** objective routing/peak/mute checks can be automated, but perceived loudness and voice intelligibility require calibrated manual listening.
- **Asset permission:** public redistribution rights for Matt/stream/BridgeMind-derived assets must be confirmed before Phase 6 release acceptance.
- **Performance budget:** establish target hardware and measurable frame/draw-call/allocation thresholds before final profiling.
- **Browser scope:** Chromium is the current verification target; add Firefox/WebKit only if product requirements explicitly demand cross-browser support.

## Sources

### Primary (HIGH confidence)
- Live repository and CBM index — current `Game`, `House`, `Player`, `Ghost`, `ScareDirector`, `AudioEngine`, `HUD`, assets, package, and planning evidence inspected 2026-07-10.
- [STACK.md](STACK.md) — retained stack, versions, prescribed patterns, and verification setup.
- [FEATURES.md](FEATURES.md) — table stakes, differentiators, acceptance behavior, MVP, and dependency graph.
- [ARCHITECTURE.md](ARCHITECTURE.md) — component boundaries, data flow, build order, and integration contracts.
- [PITFALLS.md](PITFALLS.md) — failure modes, warning signs, recovery, test gates, and phase mapping.
- Context7 `/nodejs/node/v22.17.0`, `/microsoft/playwright/v1.61.0`, and `/websites/v6_vite_dev` — Node test, Playwright, and Vite guidance.
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API), [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage), and [Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API) — browser platform contracts.
- [W3C Three Flashes or Below Threshold](https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold.html) and [W3C reduced-motion technique C39](https://www.w3.org/WAI/WCAG21/Techniques/css/C39) — capture safety constraints.

### Secondary (MEDIUM confidence)
- Game Accessibility Guidelines — separate audio controls and difficulty-control patterns.
- Amnesia: The Bunker and Alien: Isolation published design references — survival resource pressure and credible persistent-pursuer patterns.
- Manual in-app-browser observations from the brownfield baseline — current game feel and presentation evidence.

### Tertiary (LOW confidence)
- None used for roadmap-critical conclusions. Subjective balance, perceived loudness, and final visual readability are explicitly deferred to instrumented playtesting.

---
*Research completed: 2026-07-10*
*Ready for roadmap: yes*
