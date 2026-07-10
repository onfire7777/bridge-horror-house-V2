# Feature Research

**Domain:** Short-form first-person browser survival-horror comedy (brownfield milestone)
**Researched:** 2026-07-10
**Confidence:** HIGH for the live codebase and browser/audio behavior; MEDIUM for final tuning values until playtested

## Research Frame

This milestone is not a greenfield feature survey. The existing game already has the full explore-key-chase-escape loop, a flat Matt pursuer, Web Audio atmosphere, four battery pickups, three randomized room keys, and a 1.5-second capture overlay. The required work is to make those systems believable, fair, forceful, controllable, and distinctly BridgeMind.

The core feature contract is:

> The player is hunted by an entity that obeys the house, receives enough warning to make decisions, and can be delayed—but never made harmless—by spending a scarce flashlight resource.

## Feature Landscape

### Table Stakes (Users Expect These)

Missing any of these makes the game feel broken, unfair, unsafe, or unfinished rather than less ambitious.

| Feature | Why Expected | Complexity | Acceptance Notes |
|---------|--------------|------------|------------------|
| Wall-respecting pursuit | A visible monster cannot pass through geometry while the player is constrained by it; phasing destroys both fairness and dread | HIGH | Matt stays in walkable space, never enters expanded wall AABBs, catches only from an unobstructed reachable position, and replans when the player changes area or a door changes state |
| Door-aware path execution | Hallways and doors are the grammar of an indoor chase | HIGH | Routes target real openings; at a closed usable door Matt approaches, opens it once in range, waits for clearance, then continues; locked/non-usable barriers remain blocked |
| Valid spawn and return points | A pursuer appearing inside a wall or on the unreachable side of geometry is an immediate trust failure | MEDIUM | Apparition, stalk, finale, and post-banish spawns snap to unblocked path-connected cells; minimum distance is measured by route length, not only Euclidean distance |
| Escalating but survivable pressure | Survival horror needs a readable escalation curve and at least one viable response | MEDIUM | Act 1 remains atmospheric, Act 2 begins bounded stalking after key two, and Act 3 starts a sustained chase after key three; pressure rises through coordinated cadence, speed, persistence, and shorter relief—not speed alone |
| Legible battery economy | The flashlight is both sight and defense, so charge must create decisions rather than surprise failure | MEDIUM | Off means no idle drain; burn cost applies only while the beam is actually affecting Matt; 20%, 10%, empty, and recovery transitions have distinct visual and audio feedback; pickups never silently waste all value at full charge |
| Fair randomized key placement | Required objectives must be reachable and discoverable every run | MEDIUM | Exactly one key is selected for kitchen, study, and bedroom from curated candidates; every selected spot is collider-free, foyer-reachable under intended door rules, in interaction range from a reachable stance, and visible with a reasonable flashlight sweep |
| Complete persistent audio controls | Players expect to control loudness, isolate dialogue, and keep their choices after reload | MEDIUM | Master, ambience, music, effects, voice, and jumpscare intensity are available from title/pause UI; 0 is true mute; changes preview immediately; values are clamped, versioned, persisted in `localStorage`, and malformed/old data falls back safely |
| Safe final mix | “Loud” cannot mean uncontrolled clipping or bypassing the player’s master setting | MEDIUM | Every source reaches its category bus, then master, then the final compressor; jumpscare intensity never bypasses master/mute; gain changes ramp briefly to avoid clicks |
| Full-viewport capture sequence | Capture is the punishment and climax of the chase | MEDIUM | Capture atomically disables play, exits pointer lock, covers the full visual viewport above all HUD/canvas layers, synchronizes image motion with a layered sting, then transitions once to the retry screen without accepting stray gameplay input |
| Complete event sound language | Horror depends on sound for anticipation and state readability | HIGH | Doors, locks, keys, batteries, flashlight state, low/empty charge, danger proximity, chase, burn progress, banishment, capture, and room ambience each have distinct, non-conflicting cues; important state is also visible, never audio-only |
| Photosensitive and motion-safe effects | A full-screen strobe/jitter effect can cause harm before a player can disable it | MEDIUM | No large-area effect exceeds three flashes in one second; saturated red flashing is avoided; reduced-motion removes jitter/lunge and screen shake without removing capture feedback |

### Differentiators (Competitive Advantage)

These features express this game's identity and should reinforce the core value rather than become separate subsystems.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Flashlight as shared navigation and combat currency | Every second of safety consumes the same resource needed to see, creating a compact survival-horror economy | MEDIUM | Tune drain, pickup supply, burn time, and banishment relief together; the intended decision is “see now, save for defense, or spend to buy distance?” |
| Cheap cutout, physically credible hunter | The joke is that Matt looks like cardboard; the fear comes from the fact that the cardboard follows the same house rules as the player | HIGH | Keep snapped low-frame-rate wobble and white outline while path motion, doorway turns, and catches remain spatially honest |
| BridgeMind diegetic environment | Brand humor becomes worldbuilding rather than a title-screen skin | MEDIUM | Give each major room one primary branded story prop and one quieter detail: damaged BridgeMind marks, build terminals, token-budget warnings, access-control signs, shipping artifacts, or corrupted system copy |
| Category-specific horror controls | Ambience and jumpscare intensity controls go beyond the common master/music/SFX/dialogue baseline | MEDIUM | Jumpscare intensity scales transient gain, distortion, motion, and shake within safe bounds; it does not alter game outcome or fully suppress capture acknowledgement |
| Distance-readable pursuit mix | Players can infer danger without a minimap while the mix itself tightens the chase | HIGH | Breathing, heartbeat, techno loop, and threat texture crossfade by state and distance; environmental sounds remain spatial while UI/critical state cues stay centered and legible |
| Curated variability instead of opaque procedural generation | Replays vary without sacrificing authored pacing or solvability | MEDIUM | Randomize among validated placements and scare timings; expose a seed/test hook so every candidate combination can be regression-tested |
| Comedic vocabulary under serious pressure | “Tokens,” “shipping,” “production agents,” and access keys make the premise memorable without deflating the chase | LOW | Keep jokes on props, notes, end-state copy, and occasional voice lines; during immediate danger, prioritize short actionable cues and oppressive atmosphere |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Phasing, teleport catches, or off-screen catch radii | Cheap way to keep Matt close | Breaks the spatial rules, makes player route choices meaningless, and reads as a bug | Use path-connected spawn points, bounded replans, door actions, and an unobstructed catch check |
| Speed-only difficulty | One constant is easy to raise | Produces unavoidable deaths in narrow halls and does not create varied pressure | Tune detection timing, route persistence, stalk frequency, burn resistance, battery cost, and banishment downtime as a coordinated curve |
| Per-frame nav graph rebuild or heavy new AI dependency | Appears robust and future-proof | Violates the small-house performance/testability constraint and adds more system than the game needs | Precompute a small 2D grid/graph, cache paths, and replan on bounded cadence or meaningful state change |
| Fully random coordinates for keys or batteries | Maximizes run variety | Creates unreachable, clipped, trivial, or practically invisible objectives | Randomly choose among authored, validated slots with deterministic seeded tests |
| Unlimited batteries or a no-recovery darkness soft lock | Makes the game easier or harsher | Unlimited power removes the core decision; a depleted run with no reachable recovery becomes unwinnable | Fixed finite pickups, conservative reachability, clear warnings, and enough total charge for a disciplined completion plus limited banishes |
| One global loudness boost for the jumpscare | Makes capture “feel louder” quickly | Clips, ignores category controls, masks the voice layer, and can harm headphone users | Use contrast, a short pre-hit dip, filtered transient, distortion layer, voice, and compressor-limited output routed through the jumpscare bus |
| Rapid full-screen strobe and mandatory camera shake | Looks intense in a quick demo | Violates flash safety, creates vestibular discomfort, and can obscure the actual face | One forceful lunge with bounded flashes; honor reduced motion and jumpscare intensity settings |
| Sound-only gameplay information | Preserves a minimal HUD | Excludes players who cannot hear or distinguish the mix and becomes unreadable when categories are muted | Pair danger, battery, burn, pickup, and lock sounds with restrained HUD/light feedback |
| Branding on every wall or constant meme callouts | Maximizes recognizability | Turns dread into an advertisement and exhausts the joke | Use sparse diegetic hero props, system signage, terminals, and environmental evidence |
| New inventory, crafting, multiplayer, save system, or 3D Matt model | Familiar genre expansion | Expands scope without improving the short hunt; a 3D Matt removes the central visual joke | Keep keys as objective state, batteries as immediate charge, a self-contained run, and the intentional billboard |
| Unlicensed new stream/likeness assets | Adds more authentic references | The existing repository explicitly excludes Matt/stream/BridgeMind rights from its MIT license | Prefer procedural graphics and text; reuse existing documented assets only within confirmed permission boundaries |

## Detailed Acceptance Behavior

### 1. Horror-Game Audio Controls

- The title screen exposes audio settings before the first ambient sound; the pause screen exposes the same values without restarting the run.
- Controls: `master`, `ambience`, `music`, `effects`, `voice`, and `jumpscareIntensity`, each normalized and clamped to `0..1`; master/category zero must produce silence for that path.
- Category routing is exclusive and auditable: room beds/weather → ambience; BridgeMind techno/score → music; interactions/footsteps/threat foley → effects; Matt clips → voice; capture-only layers → jumpscare; all converge through master and the final compressor.
- Adjustments use short `AudioParam` ramps rather than discontinuous gain changes. Settings show their current value, respond to keyboard input, and have clear labels.
- A versioned settings object survives reload through `localStorage`. Missing, malformed, non-finite, or out-of-range values fall back or clamp without preventing startup.
- Acceptance test: set each category to zero in turn and trigger one representative sound; only the intended category is suppressed, master suppresses all, and a reload restores the exact values.

### 2. Wall-Respecting Pursuer AI

- Build navigation from the house's static wall AABBs expanded by Matt's footprint. Preserve intentional doorway gaps; do not infer walkability only from rendered meshes.
- Use dynamic doors as action-bearing blockers. A route may plan through a usable door connection, but Matt must physically reach it, request it open, wait until the opening clears his radius, and then advance.
- Reuse a cached route until the player changes navigation cell, a relevant door changes state, the route expires on a bounded interval, or Matt is detectably stuck. Navigation work must not allocate/rebuild the whole graph every animation frame.
- Movement follows waypoints with a maximum step that cannot tunnel through blockers. The lurch/wobble may perturb presentation, but the authoritative position remains valid.
- Catch requires both range and spatial validity: no catch through a wall/closed door, and no catch from a position the player could not reach under the same room topology.
- All spawn paths, including post-banish return, select a free cell with a route to the player and a minimum route-distance buffer.
- Acceptance test: for every room pair and each door open/closed combination, a pure-JS simulation either finds a legal route or reports none; sampled movement positions never overlap blockers.

### 3. Full-Screen Jumpscare

- The capture transition is one-shot and idempotent: state changes to `caught` before any timers or audio can fire twice.
- The Matt image fills/crops the viewport rather than sitting as an 86% contained card. Its focal face remains visible across common desktop aspect ratios.
- The audio hit layers a short contrast dip, transient/noise impact, distorted tonal body, and one selected Matt voice clip. Layers begin within a perceptually unified window and remain compressor-limited.
- The visual hit lasts long enough to register (roughly 1.2–1.6 seconds), then cleanly yields to the retry screen. No click/key from the capture frame can dismiss or restart it accidentally.
- Jumpscare intensity changes safe motion/transient depth, not the outcome. Reduced motion uses a static or simple crossfade; flash rate stays within WCAG thresholds.
- Acceptance test: trigger capture repeatedly from a harness at multiple viewport sizes and settings; exactly one overlay, one audio sequence, and one death transition occur per capture.

### 4. Difficulty Pressure

- Difficulty is a state curve: pre-key exploration → post-key-two stalk → post-key-three chase. Each transition has an audible/visual tell before lethal pressure.
- Raise default pressure by bringing the first stalk earlier, shortening long dead-air recurrence, modestly increasing valid-route pursuit, and reducing repeat banishment downtime only after the finale begins.
- Preserve counterplay: sprint must create distance on favorable routes, door decisions remain meaningful, and a successful burn buys a measurable route-progress window rather than an instant recatch.
- Do not compensate for better navigation by blindly retaining phasing-era speed. Tune route-aware Matt against measured house path lengths.
- Acceptance test: scripted runs show increasing encounter frequency and threat, while a skilled route using finite charge can still collect all keys and reach the front door without relying on AI failure.

### 5. Battery Economy

- Budget the system from expected run duration and encounters: initial charge plus four fixed pickups must support a disciplined first completion and a small number of intentional banishes, but not continuous flashlight use through the whole house.
- Keep base exploration drain, active-burn drain, pickup refill, burn duration, and post-banish relief in one tuning table/test fixture; changing one requires rechecking the others.
- Warning cues fire on threshold crossing, not every frame. Low-charge flicker remains intermittent and readable; empty emits a distinct failed-switch cue; pickup reports recovery visually and sonically.
- A pickup is removed only when it grants meaningful charge, or the UI clearly confirms any capped result. No inventory system is required.
- Acceptance test: deterministic economy simulations cover always-on failure, disciplined success, two/three banishes, empty-to-recovery, and pickup-at-full behavior.

### 6. Fair Key Placement

- Maintain one independently selected candidate per authored room. Randomization changes search locations, not room assignment or objective count.
- Validate every candidate offline against: world bounds, wall/furniture/door collision, reachable player stance, interaction distance (`<= 2.6` units in the current game), clear raycast target, supported height, and intended visibility.
- A fair spot requires entering/searching its room but is not hidden behind an opaque mesh, under the floor, at foot-level in total darkness, or reachable only through a closed non-interactable barrier.
- Candidate validation fails closed: reject invalid slots at build/test time; runtime selection falls back to a known-good slot rather than spawning an invalid key.
- Acceptance test: iterate every candidate and seeded combination, navigate from the foyer under intended door rules, and prove all three keys can be raycast-collected before escape.

### 7. BridgeMind Environmental Branding

- Title branding is already present; the milestone should move identity into the house. Each major room gets one readable focal artifact and one secondary detail rather than repeated logos.
- Favor diegetic pieces: an incident terminal, build queue/status screen, access-control placard, token meter, production checklist, corrupted BridgeMind mark, shipping label, or abandoned agent workstation.
- Props must contribute silhouette, navigation landmarking, story, or scare setup. Pure decals that cannot be read in the flashlight and do not affect composition are low value.
- Humor stays mostly in exploration spaces. Finale/capture cues use shorter, more threatening variants so the joke does not erase dread.
- Any new likeness, voice, stream frame, or official brand artwork remains permission-gated; procedural/text treatments are the safe default.
- Acceptance test: browser playtesters can name at least one distinct BridgeMind story detail from each major room without reporting that the environment feels like a repeated ad.

### 8. Detailed Sound Cues

| Event/State | Expected Cue | Required Visual Pair |
|-------------|--------------|----------------------|
| Door open/close | Positional hinge/wood movement with state-appropriate timing | Door animation |
| Door slam/locked | Sharper impact or multi-rattle, not the generic creak | Shake/flash or locked toast |
| Key pickup | Bright metallic confirmation distinct from batteries | Key counter and brief glint/flash |
| Battery pickup | Plastic/electric recovery cue | Battery meter increase/toast |
| Flashlight toggle/empty | Working switch differs from failed dead-cell click | Beam state and battery meter |
| Low/critical battery | One-shot threshold cues plus sparse sputter | Color/level change and flicker |
| Stalk/chase proximity | Breathing, heartbeat, and techno/threat layers scale smoothly by state/distance | Danger treatment without a minimap |
| Beam on Matt | Continuous burn/sizzle that grows with progress | Burn meter and Matt reaction |
| Banishment | Build-up, release impact, then a deliberate relief gap | Matt disappearance and HUD release |
| Capture | Contrast dip + layered sting + selected voice | Full-viewport Matt sequence |
| Room atmosphere | Sparse positional creaks, knocks, rain, wind, and room-specific beds | Environmental source/room context where applicable |

Mix rules: environmental/transient sources may be positional; UI confirmations remain stable and centered; voice must duck competing beds enough to stay intelligible; repeated one-shots need cooldowns/variation; no important cue is sound-only.

## Feature Dependencies

```text
[House collider + door-state model]
    ├──requires──> [Static navigation grid/graph]
    │                  └──requires──> [Cached A* route planning]
    │                                      └──requires──> [Waypoint movement]
    │                                                          └──requires──> [Door action execution]
    └──requires──> [Placement validation]
                           └──enables──> [Fair seeded key selection]

[Audio settings schema + persistence]
    └──requires──> [Category gain buses]
                       ├──enables──> [Detailed cue mix]
                       └──enables──> [Compressor-limited jumpscare]

[Route-correct pursuer] ──requires-before-tuning──> [Difficulty pressure]
[Difficulty pressure] + [Burn timing] + [Expected run duration]
    └──requires-together──> [Battery economy]

[Reduced motion + flash safety] ──constrains──> [Full-screen jumpscare]
[Asset permission boundary] ──constrains──> [BridgeMind environmental branding]
```

### Dependency Notes

- **Navigation precedes difficulty tuning:** Current direct movement shortens routes illegally. Speed and banishment numbers tuned before legal routing will be misleading.
- **Door-state modeling serves both movement and tests:** The player collider already includes dynamic door AABBs; Matt needs the same physical truth plus an explicit open-door action.
- **Placement validation should reuse navigation/collision data:** A key is fair only if a player stance can reach and raycast it, so hand-maintained duplicate geometry rules will drift.
- **Category buses precede controls and the new scare:** Retrofitting sliders after more sources are added risks bypass paths and inconsistent muting.
- **Battery tuning follows threat tuning:** Charge value depends on how often Matt appears, how long a burn takes, and how much route progress banishment buys.
- **Branding is mostly parallel:** Environmental art can proceed once room landmarks and asset-rights boundaries are clear, but it should not block the mechanical core.

## MVP Definition

For this brownfield milestone, “MVP” means the smallest shippable hardening pass that fulfills the active project contract—not the already-existing base game.

### Launch With (Milestone v1)

- [ ] Legal, cached pursuer navigation with valid spawns, door use, and no wall catches — core value
- [ ] Route-aware default difficulty and tuned banishment window — makes the repaired AI tense but beatable
- [ ] Tested battery economy with threshold/recovery feedback — preserves player agency under pressure
- [ ] Validated per-room key candidates with seeded regression coverage — prevents unwinnable or trivial runs
- [ ] Persistent master/ambience/music/effects/voice/jumpscare controls — baseline completeness and safety
- [ ] Full-viewport, layered, compressor-limited capture with reduced-motion/flash-safe behavior — required climax
- [ ] Complete critical-event cue map — makes game state readable and the house feel finished
- [ ] BridgeMind environmental story pass using permission-safe assets — delivers the promised identity

### Add After Validation (v1.x)

- [ ] User-selectable difficulty presets/modifiers — add after the default curve is proven; expose meaningful grouped parameters rather than arbitrary multipliers
- [ ] Mono mode and optional captions for major environmental sounds/voice — add when accessibility QA expands beyond this milestone's visual redundancy
- [ ] Seed display/replay code — add if testers need exact run sharing beyond automated fixtures
- [ ] Additional room-specific acoustic zones/occlusion — add if the base positional cue mix remains clear and performance headroom is verified

### Future Consideration (v2+)

- [ ] Additional authored key/scare candidates — only after every current slot and pacing combination is verified
- [ ] More approved BridgeMind media clips — permission and redistribution rights are the gate
- [ ] Adaptive tension director using player performance — only if fixed act pacing produces repeatable data showing a need

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Wall- and door-respecting pursuit | HIGH | HIGH | P1 |
| Valid spawn/catch rules | HIGH | MEDIUM | P1 |
| Route-aware difficulty pressure | HIGH | MEDIUM | P1 |
| Battery economy and warnings | HIGH | MEDIUM | P1 |
| Fair key placement validation | HIGH | MEDIUM | P1 |
| Persistent category audio controls | HIGH | MEDIUM | P1 |
| Full-screen safe jumpscare | HIGH | MEDIUM | P1 |
| Detailed critical-event sound cues | HIGH | HIGH | P1 |
| BridgeMind environmental branding | HIGH | MEDIUM | P1 |
| Difficulty presets | MEDIUM | MEDIUM | P2 |
| Mono/caption expansion | MEDIUM | MEDIUM | P2 |
| Advanced acoustic occlusion | MEDIUM | HIGH | P3 |
| Adaptive tension director | LOW for current short run | HIGH | P3 |

**Priority key:**
- P1: Must have for this milestone
- P2: Should have after the default experience is validated
- P3: Valuable only after measured need and performance headroom

## Competitor/Reference Pattern Analysis

| Feature Pattern | Amnesia: The Bunker | Alien: Isolation | Our Approach |
|-----------------|---------------------|------------------|--------------|
| Persistent pursuer | One monster drives an open-ended survival loop; scarce light/fuel increases urgency | Cat-and-mouse tension depends on a believable, reactive hunter | A smaller deterministic house lets us prove every route/door combination while keeping Matt visually crude and mechanically credible |
| Resource pressure | Light/fuel is both safety and time pressure | Limited tools preserve threat rather than killing it | Flashlight charge is visibility plus the only banishment weapon; finite pickups buy decisions, not permanent safety |
| Environmental identity | Authored bunker spaces support systemic encounters | Strong lo-fi station identity and reactive sound make navigation memorable | BridgeMind terminals, access control, token/build artifacts, and room-specific audio turn parody into place |
| Threat communication | Sound and light warn of danger before contact | Reactive music/audio and proximity feedback sustain tension | Breathing, heartbeat, techno, burn sizzle, and room cues form a distance-readable mix with visual redundancy |
| Accessibility/safety reference | — | — | Follow contemporary game-audio controls plus web flash/reduced-motion constraints; jumpscare intensity controls presentation, never basic state feedback |

## Sources

### Live project evidence

- `.planning/PROJECT.md` — active requirements, core value, constraints, and decisions
- `src/systems/Ghost.js` — direct wall-phasing movement, chase/stalk speeds, burn and 8-second banishment
- `src/Game.js` — orchestration, capture sequence, interaction range, key progression, battery refill, and chase mix
- `src/world/House.js` — wall/door colliders, three-by-three key candidates, four battery placements, and current BridgeMind notes
- `src/player/Player.js` — current 100 charge, base/burn drain, low-charge flicker, and collision behavior
- `src/systems/AudioEngine.js` — single-master routing, compressor, procedural cues, techno loop, and voice clips
- `src/ui/HUD.js` and `index.html` — current 86%-contained jumpscare overlay and existing HUD/page structure
- `src/assets/README.md` — likeness, stream, and BridgeMind permission boundary

### External standards and genre references

- [Game Accessibility Guidelines — separate effects, speech, and music controls](https://gameaccessibilityguidelines.com/provide-separate-volume-controls-or-mutes-for-effects-speech-and-background-music/)
- [Game Accessibility Guidelines — allow difficulty changes during play](https://gameaccessibilityguidelines.com/allow-difficulty-level-to-be-altered-during-gameplay-either-through-settings-or-adaptive-difficulty/)
- [W3C Understanding SC 2.3.1 — Three Flashes or Below Threshold](https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold.html)
- [W3C Technique C39 — respect `prefers-reduced-motion`](https://www.w3.org/WAI/WCAG21/Techniques/css/C39)
- [MDN `GainNode` — category/master gain control and smooth parameter changes](https://developer.mozilla.org/en-US/docs/Web/API/GainNode)
- [MDN `DynamicsCompressorNode` — limiting loud combined game audio](https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode)
- [MDN Web Storage API — origin-scoped settings persistence](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [Unity AI Navigation — pathfinding with dynamic obstacles and action links](https://docs.unity3d.com/ja/current/Manual/com.unity.ai.navigation.html)
- [Unity navigation internals — global routing, local avoidance, and door traversal links](https://docs.unity3d.com/cn/2022.3/Manual/nav-InnerWorkings.html)
- [PlayStation Blog — Amnesia: The Bunker single-monster/resource-pressure design](https://blog.playstation.com/2023/06/01/amnesia-the-bunker-launches-june-6/)
- [Xbox Wire — Alien: Isolation cat-and-mouse AI reference](https://news.xbox.com/en-us/2024/10/08/how-alien-isolation-terrified-xbox-players/)
- [EA — Dead Space accessibility choices including disabling camera shake](https://www.ea.com/news/accessibility-and-player-choice-in-dead-space)

---
*Feature research for: BridgeMind Horror House hardening milestone*
*Researched: 2026-07-10*
