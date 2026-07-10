# Requirements: BridgeMind Horror House Gameplay Hardening

**Defined:** 2026-07-10
**Core Value:** The player feels hunted by a spatially honest, escalating monster and survives by making meaningful flashlight-resource decisions.

## User Stories

- As a player, I can trust that Matt follows the same house layout I do instead of cheating through walls.
- As a player, I can tune every major class of sound without losing the intended horror mix.
- As a player, I receive a forceful full-screen capture moment that remains controllable and safe.
- As a player, I face sustained pressure, scarce but recoverable battery power, and fair varied key searches.
- As a player, I recognize BridgeMind’s identity throughout the house rather than only in the monster.

## v1 Requirements

### Navigation and Pursuit

- [x] **NAV-01**: Matt remains outside radius-inflated wall AABBs during stalk, chase, and burn-slowed movement at the maximum configured speed.
- [x] **NAV-02**: Matt routes through authored hallway and doorway gaps, approaches closed doors, opens them, waits for body clearance, and crosses without phasing through the door mesh.
- [x] **NAV-03**: Matt replans toward the moving player on a bounded cadence and fails closed—stopping or retrying—when no legal route exists instead of reverting to direct wall traversal.
- [x] **NAV-04**: Matt’s initial manifestations and post-banish reforms select free, path-connected positions with a minimum legal route distance from the player.
- [x] **NAV-05**: A capture can occur only when Matt is within the catch radius on a legal unobstructed path segment; walls and closed doors prevent through-geometry capture.

### Hunt Difficulty

- [x] **HUNT-01**: Pressure escalates across the run through coordinated encounter cadence, pursuit persistence, speed, audio proximity, and post-key behavior rather than speed alone.
- [x] **HUNT-02**: Matt begins meaningful stalking earlier, continues following the player through the house, and the final-key chase is substantially harder while remaining beatable.
- [x] **HUNT-03**: Sustained flashlight contact still banishes Matt, but burn buildup is deliberate and chase banishment downtime is shorter so he returns sooner at a valid routed position.

### Battery and Keys

- [x] **BATT-01**: Flashlight use drains charge continuously, defensive burning consumes an additional surcharge, sprinting or panic use does not produce negative/invalid charge, and the light fails predictably at zero.
- [x] **BATT-02**: Low and critical battery thresholds have distinct visual and audio warnings, pickups provide meaningful charge without exceeding the cap, and authored supply prevents an unavoidable soft lock under disciplined play.
- [x] **KEY-01**: Each run selects one key from curated candidates in the kitchen, study, and bedroom using non-repeating seeded selection suitable for deterministic tests.
- [x] **KEY-02**: Every key candidate is path-reachable, visually findable, and collectable from at least one unobstructed player interaction stance; no key may spawn inside geometry or behind an unusable surface.

### Sound Settings and Mix

- [x] **AUD-01**: The game exposes master, ambience, music, effects, voice, and jumpscare-intensity controls plus a master mute action from both the title and in-game/pause state.
- [x] **AUD-02**: Sound controls are labeled, keyboard-operable, applied immediately with smooth gain ramps, safely normalized, and persisted in a versioned `localStorage` record that tolerates missing, corrupt, or unavailable storage.
- [x] **AUD-03**: Every dry and reverberated source routes through exactly one semantic category before master compression; setting master or a category to zero produces a true mute with no bypass path.
- [ ] **AUD-04**: Doors, pickups, key collection, battery thresholds, flashlight failure, stalking, pursuit, burn, banishment, capture, room ambience, and escape use distinct sound cues with visual redundancy for critical state.

### Jumpscare

- [ ] **SCARE-01**: Capture triggers one atomic full-viewport Matt jumpscare whose layered sting combines contrast ducking, distortion, voice, impact/noise, and compressor-limited loudness scaled by the jumpscare setting.
- [ ] **SCARE-02**: The capture sequence is idempotent and cancellable, freezes gameplay/input, fills common viewport sizes without letterboxing the threat, cleans up timers/audio/ducking, and transitions exactly once to retry/death state.
- [ ] **SCARE-03**: Reduced-motion preference removes nonessential lunge/jitter/shake and the effect avoids unsafe large-area flashing while preserving a strong static impact.

### BridgeMind Environment

- [ ] **ENV-01**: Every major room contains at least one readable BridgeMind focal artifact and one secondary detail using reusable procedural or permission-safe signage, terminals, logos, warnings, or lore.
- [ ] **ENV-02**: Environmental enrichment preserves navigation clearance, interaction readability, draw-call discipline, and existing asset provenance boundaries.

### Verification and Delivery

- [ ] **QUAL-01**: Pure Node tests cover navigation, collision substeps, routes, settings normalization/persistence, balance fixtures, spawn validity, and all key candidates/combinations.
- [ ] **QUAL-02**: The production Vite build and preview pass browser checks for settings, persistence, pointer-lock isolation, wall/door pursuit, capture, mute behavior, reduced motion, and unexpected console errors.
- [ ] **QUAL-03**: Manual playtests verify legal pursuit pressure, novice/practiced beatability, battery decisions, key discoverability, perceived jumpscare force, voice intelligibility, room readability, and full-run cleanup.
- [ ] **GIT-01**: Each substantial increment is independently verified, committed, pushed to `main`, fetched, and confirmed zero commits ahead/behind `origin/main`.

## Acceptance Criteria

- Automated route fixtures include straight paths, wall detours, doorway traversal, unreachable targets, no corner cutting, and maximum-speed tunneling checks.
- Door verification covers both approach sides and requires clearance before crossing.
- Settings verification covers every category, master mute, reload persistence, corrupt stored values, keyboard use, and pointer-lock isolation.
- Capture verification covers repeated calls, cancellation/restart, master mute, intensity scaling, reduced motion, timer/source cleanup, and one death transition.
- Placement verification covers every authored candidate and every combination of one kitchen, study, and bedroom key.
- Completion requires fresh `npm test`, `npm run build`, browser evidence against the production preview, and clean local/remote Git parity.

## v2 Requirements

### Optional Accessibility and Replay Features

- **V2-01**: Player can choose named difficulty presets after the default balance is proven.
- **V2-02**: Player can enable captions for voice and critical environmental cues.
- **V2-03**: Player can enable mono audio output and expanded motion/flash controls.
- **V2-04**: Player can view or enter a run seed after deterministic placement behavior is stable.
- **V2-05**: Additional approved Matt voice clips, key candidates, and room-specific scare variants expand replayability.

## Out of Scope

| Feature | Reason |
|---------|--------|
| 3D Matt model | The low-fi flat billboard is the intended comic-horror identity. |
| Physics engine or navmesh dependency | The authored single-floor AABB house is small enough for a tested pure-JS grid. |
| UI framework | The settings surface is small and fits the existing imperative HUD/DOM architecture. |
| Multiplayer, inventory crafting, or save slots | They do not support the requested hardening milestone. |
| Unrestricted clipping loudness | Force comes from contrast, distortion, density, and compression rather than unsafe output. |

## Traceability

Each v1 requirement has one owning roadmap phase. `GIT-01` is cross-cutting delivery discipline, but Phase 7 owns its traceability and final parity evidence.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | Phase 1 | Complete |
| NAV-02 | Phase 2 | Complete |
| NAV-03 | Phase 2 | Complete |
| NAV-04 | Phase 2 | Complete |
| NAV-05 | Phase 2 | Complete |
| HUNT-01 | Phase 3 | Complete |
| HUNT-02 | Phase 3 | Complete |
| HUNT-03 | Phase 3 | Complete |
| BATT-01 | Phase 3 | Complete |
| BATT-02 | Phase 3 | Complete |
| KEY-01 | Phase 3 | Complete |
| KEY-02 | Phase 3 | Complete |
| AUD-01 | Phase 4 | Complete |
| AUD-02 | Phase 4 | Complete |
| AUD-03 | Phase 4 | Complete |
| AUD-04 | Phase 6 | Pending |
| SCARE-01 | Phase 5 | Pending |
| SCARE-02 | Phase 5 | Pending |
| SCARE-03 | Phase 5 | Pending |
| ENV-01 | Phase 6 | Pending |
| ENV-02 | Phase 6 | Pending |
| QUAL-01 | Phase 7 | Pending |
| QUAL-02 | Phase 7 | Pending |
| QUAL-03 | Phase 7 | Pending |
| GIT-01 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0
- Duplicate ownership: 0

---
*Requirements defined: 2026-07-10*
*Last updated: 2026-07-10 after Phase 3 verification*
