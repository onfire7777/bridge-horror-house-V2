<!-- GSD:project-start source:PROJECT.md -->

## Project

**BridgeMind Horror House**

BridgeMind Horror House is a first-person browser horror-comedy game where the player searches a haunted house for three access keys while a deliberately flat, white-outlined Matt cutout hunts them. The experience should be funny in its BridgeMind references but mechanically tense, visually oppressive, and capable of a genuinely forceful jumpscare.

**Core Value:** The player must feel hunted by a monster that obeys the house, becomes more dangerous over time, and can be driven back—but never permanently neutralized—by carefully managed flashlight power.

### Constraints

- **Stack**: Reuse Three.js, Vite, Web Audio, and browser APIs; avoid unnecessary dependencies.
- **Navigation**: Pursuit must remain deterministic and testable outside WebGL; route planning belongs in a pure JavaScript module.
- **Performance**: Navigation may not allocate a large graph every animation frame; paths must be cached and recalculated on a bounded cadence.
- **Audio safety**: The jumpscare should feel loud through contrast, distortion, and compression while the final output remains compressor-limited.
- **Persistence**: Sound preferences must survive reloads through versioned `localStorage` data with safe defaults.
- **Git**: Each substantial increment is verified, committed, pushed to `main`, fetched, and compared against `origin/main`.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommendation

## Brownfield Evidence

| Surface | Current evidence | Implication | Confidence |
|---------|------------------|-------------|------------|
| Rendering/build | `package.json` declares `three@^0.170.0` and `vite@^6.0.0`; `package-lock.json` resolves Three.js `0.170.0` and Vite `6.4.3` | Retain both versions for this milestone | HIGH |
| Runtime | Local verification used Node `v22.23.1`; Vite 6 supports Node 18, 20, and 22+ | Standardize project work on Node 22.x for the current milestone; no runtime migration is required | HIGH |
| Pursuit | `src/systems/Ghost.js:114-191` moves directly toward the player's `x/z` position and explicitly says it glides through walls | Replace only the movement decision with a pure deterministic route planner; retain Three.js for world-space movement/rendering | HIGH |
| Navigation inputs | `src/world/House.js:553-560` returns static wall AABBs plus dynamic door AABBs; `src/Game.js:303-369` already passes those colliders to the player | Derive a reusable 2D occupancy grid from existing AABBs instead of introducing a physics/navmesh engine | HIGH |
| Audio | `src/systems/AudioEngine.js:22-825` creates `AudioContext`, a master `GainNode`, and a `DynamicsCompressorNode`; most sources route to the single master | Add category gain buses inside the existing graph; do not replace Web Audio | HIGH |
| Persistence/tests | No `localStorage`, unit-test framework, browser-test configuration, or test files are present | Add a tiny settings codec and test scripts; add only one test dependency | HIGH |

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| ECMAScript modules | Browser-native / Node 22.x | Pure grid construction, deterministic A* search, settings validation and migration | The project is already `"type": "module"`; pure modules keep navigation testable without DOM or WebGL | HIGH |
| Three.js | `0.170.0` locked | Rendering, vectors, scene/world positions | Already integrated and not the source of wall traversal; upgrading is unrelated scope | HIGH |
| Vite | `6.4.3` locked | Development server, production build, preview server | Existing scripts already build and preview successfully; Playwright can drive the preview server | HIGH |
| Web Audio API | Browser platform | Category buses, effects, mixing, compression | Existing engine already uses the correct platform primitives; `GainNode` is the native volume control and `DynamicsCompressorNode` limits combined peaks | HIGH |
| Web Storage API (`localStorage`) | Browser platform | Persist versioned sound preferences by origin across reloads | Settings are a tiny synchronous JSON object; IndexedDB would be unnecessary machinery | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| `node:test` + `node:assert/strict` | Built into Node 22.x | Unit tests for route planning and settings normalization/migration | Use for all pure JavaScript tests; no package installation is needed | HIGH |
| `@playwright/test` | `1.61.1` | Chromium smoke tests against the built Vite app, persistence checks, console/page-error capture, screenshots/traces | Add as the sole new dev dependency for automated browser verification | HIGH |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vite production preview | Serve the actual `dist/` output for browser tests | Prefer `npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` in Playwright `webServer`; testing the build catches asset/bundling failures that a dev-server-only test can miss |
| Chromium installed by Playwright | Stable automated browser target | Install only Chromium initially; expand to Firefox/WebKit only if cross-browser support becomes a product requirement |
| Codex in-app browser/manual playtest | Pointer-lock feel, audio mix, pursuit pressure, jumpscare quality | Automation should verify invariants; a human/browser session must still verify subjective audio and game feel |

## Prescribed Patterns

### Deterministic 2D Navigation

- Keep the pathfinder in a pure module with plain numeric `{ x, z }` inputs/outputs; do not import WebGL, scene objects, DOM APIs, or time.
- Build the static grid once. Do not allocate/rebuild the full graph every frame.
- Replan only on a bounded cadence, when the target changes cells, when the route becomes invalid, or after door state changes.
- Cache the current path and advance waypoint by waypoint in `Ghost.update`.
- Model door openings as traversable route portals because Matt is required to open/use doors. Closed door AABBs remain physical blockers until the door-opening interaction begins; they should not permanently remove the doorway from the route graph.
- If no route exists, retain position or choose a deterministic reachable fallback. Never fall back to direct wall-phasing pursuit.
- For this small fixed house, a linear scan of the A* open set is acceptable and simpler than adding a heap package. Profile before optimizing.

### Persistent Categorized Web Audio

### Automated and Browser Verification

- the production page loads, creates the game canvas/start UI, and reports no unexpected `pageerror` or console errors;
- the start gesture successfully resumes/uses the audio context without requiring test-time autoplay bypasses;
- each audio control updates the namespaced `localStorage` record and survives reload;
- critical HUD/settings controls remain visible and keyboard-operable;
- a controlled navigation test seam or deterministic fixture demonstrates that Matt does not cross a wall and can route through a doorway;
- traces are retained on first retry and a screenshot is retained on failure.

## Installation

# Existing runtime/build stack: keep the lockfile-resolved versions.

# Sole new development dependency.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Local deterministic grid A* | Navmesh/Recast | Use a navmesh only if the house becomes irregular 3D terrain with ramps, multiple floors, or dynamic topology that a small 2D grid cannot represent |
| Local grid A* | `pathfinding`, EasyStar.js, or another pathfinding package | Use a package only if later requirements need multiple algorithms, weighted terrain, or large maps and the local implementation becomes a measured maintenance/performance problem |
| Web Audio gain buses | Howler.js | Use Howler for a mostly file-playback application that does not already have a substantial native Web Audio graph |
| Web Audio gain buses | Tone.js | Use Tone.js for transport/synthesis-heavy music tooling; this game already implements its required synthesis and effects directly |
| `node:test` | Vitest | Add Vitest if tests later need Vite transforms, DOM emulation, module mocking, coverage/reporters, or a large frontend unit-test suite |
| Playwright Chromium | Full Chromium/Firefox/WebKit matrix | Expand after browser support requirements are explicit or incompatibilities are found |
| `localStorage` | IndexedDB | Use IndexedDB only for large/structured saves, blobs, transactional data, or queryable collections—not six volume values |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| New physics engine | The defect is route selection, not rigid-body simulation; the house already supplies collision AABBs | Existing colliders plus pure grid A* |
| New navmesh/pathfinding dependency now | Adds API/maintenance surface for a small fixed 2D floor plan and weakens direct deterministic control | A small pure module with stable ordering and focused tests |
| Howler.js or Tone.js migration | Would duplicate or replace an 800-line working Web Audio engine and complicate category routing | Native `GainNode` buses in `AudioEngine` |
| React/Vue/state-management framework | Settings controls do not justify replatforming the existing imperative HUD/game | Existing DOM UI plus one normalized settings object |
| Vitest/Jest now | Duplicates functionality already present in Node 22 for pure modules | `node:test` and `node:assert/strict` |
| Cypress or Puppeteer beside Playwright | A second browser harness creates duplicate configuration and CI/browser downloads | One Playwright suite |
| `sessionStorage` | Settings disappear with the tab session | Versioned `localStorage` |
| Unversioned raw `localStorage` values | Makes migrations, validation, and recovery from corrupt data brittle | One namespaced, versioned JSON record with defaults |
| Upgrade Three.js or Vite during this milestone | No active requirement needs an upgrade; it broadens regression risk while gameplay systems are changing | Keep locked Three `0.170.0` and Vite `6.4.3` |
| Test-only autoplay bypasses as proof of sound | They can hide the required user-gesture/audio-resume behavior | Click the real start control, then inspect state and manually listen |

## Stack Patterns by Variant

- Keep the local grid A* and static grid cache.
- Because this is the simplest deterministic representation of the existing AABBs.
- Re-evaluate a waypoint graph or navmesh at that milestone.
- Because the current 2D occupancy model would no longer encode the traversable surface faithfully.
- Re-evaluate Vitest rather than forcing complex loaders around `node:test`.
- Because test infrastructure should follow a proven need, not precede one.
- Add Playwright Firefox and WebKit projects using the same specs.
- Because Playwright already provides the expansion path without adding another framework.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Node `22.x` (verified locally at `22.23.1`) | Vite `6.4.3` | Vite 6 officially supports Node 18, 20, and 22+ |
| Node `22.x` | `@playwright/test@1.61.1` | Current package metadata declares Node `>=18` |
| Three.js `0.170.0` | Vite `6.4.3` | This exact lockfile combination is the current brownfield baseline; retain it |
| `node:test` | ESM package (`"type": "module"`) | Import from `node:test` and `node:assert/strict`; no transform layer is required for pure `.js` modules |
| Playwright web server | Vite preview on `127.0.0.1:4173` | Use `url`, a strict port, and `reuseExistingServer: !process.env.CI`; build before preview |
| `localStorage` | Served HTTP(S) origin | Do not verify persistence via `file:` URLs; behavior there is undefined and origin-specific |

## Sources

- Live repository evidence: `.planning/PROJECT.md`, `package.json`, `package-lock.json`, `src/Game.js`, `src/systems/Ghost.js`, `src/systems/AudioEngine.js`, and `src/world/House.js` — inspected 2026-07-10.
- Live CBM index `Users-admin-Documents-bridge-horror-house` — ready with 290 nodes and 839 edges; used to locate movement, collider, game-loop, and audio symbols.
- Context7 `/nodejs/node/v22.17.0` — built-in `node:test`, `--test`, ESM imports, and strict assertions.
- Context7 `/microsoft/playwright/v1.61.0` — `webServer`, base URL, tracing, and browser-test configuration; npm registry metadata verified current `@playwright/test` as `1.61.1` with Node `>=18` on 2026-07-10.
- Context7 `/websites/v6_vite_dev` — Vite 6 build/preview scripts and supported Node versions.
- [Playwright web server documentation](https://playwright.dev/docs/test-webserver) — production/dev server orchestration and base URL behavior.
- [Playwright configuration documentation](https://playwright.dev/docs/test-configuration) — Chromium projects, tracing, and test configuration.
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — native gain, compression, effects, and audio graph capabilities.
- [MDN DynamicsCompressorNode](https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode) — limiting combined peaks and game-audio dynamics.
- [MDN `localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) — persistence across browser sessions, origin scoping, and failure/file-URL caveats.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
