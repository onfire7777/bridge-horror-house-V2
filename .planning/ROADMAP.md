# Roadmap: BridgeMind Horror House Gameplay Hardening

## Overview

This milestone hardens the existing browser game in dependency order: establish one spatial truth for navigation and collision, make Matt obey it through doors and terminal interactions, tune pressure and resources against legal routes, place all sound under persistent semantic controls, orchestrate a safe forceful capture, enrich the BridgeMind environment and cue language, and close with production-preview verification and coordinated tuning.

## Phases

- [x] **Phase 1: Navigation Geometry and Collision Foundation** - Establish deterministic house geometry, legal routes, and blocker-safe movement primitives.
- [x] **Phase 2: Ghost Routing Doors and Spatial Validity** - Make Matt execute cached routes, use doors, reform legally, and capture only through valid space.
- [x] **Phase 3: Hunt Balance and Resource Fairness** - Tune escalating pursuit, flashlight economy, and seeded key placement against legal route lengths.
- [x] **Phase 4: Audio Buses Persistence and Settings UI** - Put every source under persistent, accessible semantic controls and a safe final mix.
- [x] **Phase 5: Capture and Sound-Safety Orchestration** - Deliver one cancellable full-screen jumpscare with controlled layered loudness and motion safety.
- [x] **Phase 6: BridgeMind Environment and Detailed Sound** - Add readable branded storytelling and a complete category-safe gameplay cue language.
- [ ] **Phase 7: Production Verification and Tuning** - Prove the integrated experience in the production build, tune it from evidence, and verify Git parity.

## Phase Details

### Phase 1: Navigation Geometry and Collision Foundation

**Goal**: Matt's movement is governed by the same authoritative house geometry as the player, with deterministic and testable collision behavior at every configured speed.
**Depends on**: Nothing (first phase)
**Mode:** mvp
**Requirements**: NAV-01
**Success Criteria** (what must be TRUE):
  1. During stalking, chasing, and burn-slowed movement, the player never sees Matt enter or cross a static wall.
  2. Matt remains outside wall boundaries even at the maximum configured movement speed instead of tunneling through thin geometry.
  3. When Matt reaches a blocker, the player sees him stop or move along its boundary rather than pop through it, become embedded, or behave differently with frame rate.
**Plans**: 1/1 complete

### Phase 2: Ghost Routing Doors and Spatial Validity

**Goal**: The live hunter follows legal cached routes through the house, interacts with doors physically, and uses topology-safe spawn and capture rules.
**Depends on**: Phase 1
**Mode:** mvp
**Requirements**: NAV-02, NAV-03, NAV-04, NAV-05
**Success Criteria** (what must be TRUE):
  1. The player can lead Matt around walls and through authored hallways without him cutting through geometry or corners.
  2. From either side of a closed door, Matt approaches it, opens it, waits for body clearance, and then crosses through the opening.
  3. If the player becomes unreachable, Matt stops or retries on a bounded cadence instead of reverting to wall-phasing pursuit.
  4. Matt manifests and reforms only at free, connected locations a legal route distance from the player, and cannot capture through a wall or closed door.
**Plans**: 1/1 complete

### Phase 3: Hunt Balance and Resource Fairness

**Goal**: Legal pursuit becomes substantially tenser while remaining beatable through understandable flashlight costs, recoverable supply, and fair varied key searches.
**Depends on**: Phase 2
**Mode:** mvp
**Requirements**: HUNT-01, HUNT-02, HUNT-03, BATT-01, BATT-02, KEY-01, KEY-02
**Success Criteria** (what must be TRUE):
  1. The player encounters meaningful stalking earlier, feels coordinated pressure rise after keys, and faces a distinctly harder final-key chase that practiced play can survive.
  2. Sustained flashlight contact still banishes Matt, but doing so requires deliberate exposure and produces shorter late-run relief before a legal reform.
  3. Flashlight use and defensive burning consume visible charge predictably, with distinct low and critical warnings and a reliable failure state at zero.
  4. Disciplined play can recover from low charge through capped pickups, while wasteful use creates real danger without producing invalid charge or an unavoidable soft lock.
  5. Each run presents one reachable, visible, collectable key in each authored room, varies candidates without repetition, and reproduces the same selection from the same seed.
**Plans**: 1/1 complete

### Phase 4: Audio Buses Persistence and Settings UI

**Goal**: Players can immediately and persistently control every major sound category while every dry and reverberated source obeys the same safe master path.
**Depends on**: Phase 2
**Mode:** mvp
**Requirements**: AUD-01, AUD-02, AUD-03
**Success Criteria** (what must be TRUE):
  1. From both the title screen and the in-game pause state, the player can adjust master, ambience, music, effects, voice, and jumpscare intensity or mute everything.
  2. Every control is labeled, keyboard-operable, changes the mix smoothly and immediately, and does not accidentally start play or capture pointer lock.
  3. Reloading restores normalized sound preferences, while missing, corrupt, or unavailable storage falls back to safe defaults without breaking play.
  4. Setting any category or master to zero creates a true mute, including reverberated and future capture audio, with no bypass or duplicate feed.
**Plans**: 1/1 complete
**UI hint**: yes

### Phase 5: Capture and Sound-Safety Orchestration

**Goal**: Capture produces one forceful, controllable, full-viewport Matt climax that owns its lifecycle and always cleans up safely.
**Depends on**: Phase 4
**Mode:** mvp
**Requirements**: SCARE-01, SCARE-02, SCARE-03
**Success Criteria** (what must be TRUE):
  1. A legal capture freezes gameplay and input, fills common viewport sizes with an animated Matt threat, and plays one synchronized layered sting before one retry/death transition.
  2. Jumpscare intensity changes the force of the sting, master mute silences it completely, and the final mix feels loud without uncontrolled clipping.
  3. Repeated or cancelled capture calls never stack transitions, timers, sounds, ducking, or stale screen state, and a new run starts cleanly.
  4. Reduced-motion preference removes nonessential lunge, jitter, and shake, while the static impact remains strong without unsafe large-area flashing.
**Plans**: 1/1 complete
**UI hint**: yes

### Phase 6: BridgeMind Environment and Detailed Sound

**Goal**: Players can read game state through distinct sound cues and recognize BridgeMind's identity throughout richer rooms without losing navigation or interaction clarity.
**Depends on**: Phase 3, Phase 4, Phase 5
**Mode:** mvp
**Requirements**: AUD-04, ENV-01, ENV-02
**Success Criteria** (what must be TRUE):
  1. Doors, pickups, keys, battery thresholds, flashlight failure, stalking, pursuit, burning, banishment, capture, room atmosphere, and escape have distinguishable category-controlled cues.
  2. Critical audio states also have visible feedback, so the player can understand danger, battery, collection, and capture information without sound alone.
  3. Every major room contains a readable BridgeMind focal artifact and a secondary permission-safe detail that support environmental storytelling rather than decorative noise.
  4. The player can still traverse, find keys, read interactions, and track Matt after enrichment, with no new accidental blocker or material performance regression.
**Plans**: 1/1 complete
**UI hint**: yes

### Phase 7: Production Verification and Tuning

**Goal**: The built game is proven spatially honest, tense but fair, controllable, safe, readable, and reproducibly delivered through automated and human evidence.
**Depends on**: Phases 1-6
**Mode:** mvp
**Requirements**: QUAL-01, QUAL-02, QUAL-03, GIT-01
**Success Criteria** (what must be TRUE):
  1. The user can run the fresh automated verification and see passing evidence for routes, collision substeps, doors, settings persistence, balance fixtures, spawn validity, and every authored key candidate and combination.
  2. In the production Vite preview, the player can adjust and reload settings, enter and leave pointer lock, survive legal wall/door pursuit, trigger capture, mute sound, use reduced motion, and retry without unexpected console errors or leaked state.
  3. Novice and practiced players can complete full runs with sustained legal pressure, meaningful battery decisions, findable keys, intelligible voice, forceful capture, readable rooms, and a beatable escape path on representative hardware.
  4. The user can inspect independent verification and pushed GitHub history for every substantial increment, then confirm local `main` is zero commits ahead or behind `origin/main`.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute sequentially in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7. Although Phase 4 has no technical dependency on Phase 3, project configuration keeps delivery sequential and each substantial increment must be verified before commit and push.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Navigation Geometry and Collision Foundation | 1/1 | Complete | 2026-07-10 |
| 2. Ghost Routing Doors and Spatial Validity | 1/1 | Complete | 2026-07-10 |
| 3. Hunt Balance and Resource Fairness | 1/1 | Complete | 2026-07-10 |
| 4. Audio Buses Persistence and Settings UI | 1/1 | Complete | 2026-07-10 |
| 5. Capture and Sound-Safety Orchestration | 1/1 | Complete | 2026-07-10 |
| 6. BridgeMind Environment and Detailed Sound | 1/1 | Complete | 2026-07-10 |
| 7. Production Verification and Tuning | 0/TBD | Not started | - |
