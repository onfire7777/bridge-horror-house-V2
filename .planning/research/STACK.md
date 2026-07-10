# Stack Research

**Domain:** Brownfield first-person Three.js browser game
**Researched:** 2026-07-10
**Confidence:** HIGH

## Recommendation

Keep the existing Three.js/Vite/Web Audio stack. Implement navigation and settings as pure ECMAScript modules, test them with Node's built-in test runner, and add only `@playwright/test` for production-build browser verification.

This is the smallest stack that satisfies the milestone. The house is small and already exposes the geometry needed for navigation; the audio engine already owns a Web Audio graph and master compressor; and the repository is already an ESM Vite application. Replacing any of those foundations would add migration risk without solving an unmet platform capability.

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

Use a small fixed-cell occupancy grid derived once from the house's static AABBs, inflated by Matt's collision radius. Search it with a local A* implementation using Manhattan distance, fixed cardinal-neighbor ordering, and a stable tie-break such as `(f, h, insertionOrder)`.

- Keep the pathfinder in a pure module with plain numeric `{ x, z }` inputs/outputs; do not import WebGL, scene objects, DOM APIs, or time.
- Build the static grid once. Do not allocate/rebuild the full graph every frame.
- Replan only on a bounded cadence, when the target changes cells, when the route becomes invalid, or after door state changes.
- Cache the current path and advance waypoint by waypoint in `Ghost.update`.
- Model door openings as traversable route portals because Matt is required to open/use doors. Closed door AABBs remain physical blockers until the door-opening interaction begins; they should not permanently remove the doorway from the route graph.
- If no route exists, retain position or choose a deterministic reachable fallback. Never fall back to direct wall-phasing pursuit.
- For this small fixed house, a linear scan of the A* open set is acceptable and simpler than adding a heap package. Profile before optimizing.

Minimum unit cases: straight route, wall detour, doorway route, closed-door interaction target, unreachable target, start/goal clamping, repeated-call identical output, and no diagonal corner cutting.

### Persistent Categorized Web Audio

Keep one `AudioContext` and construct explicit gain buses:

```text
ambience ─┐
music ────┤
effects ──┤
voice ────┼─> master gain -> compressor -> destination
jumpscare ┘
```

Each sound source must connect to exactly one category input. Any reverb send should originate after the category gain so muting a category also silences its wet signal. Jumpscare intensity may shape its bus/effect mix, but it must still flow through master gain and the final compressor.

Persist one namespaced record, for example:

```json
{
  "version": 1,
  "master": 0.9,
  "ambience": 1,
  "music": 1,
  "effects": 1,
  "voice": 1,
  "jumpscare": 1
}
```

The settings codec should be pure JavaScript: parse in `try/catch`, reject non-object payloads, migrate by `version`, clamp finite values to `0..1`, fill missing keys from defaults, ignore unknown keys, and tolerate `localStorage` access failures. Apply gain changes with short `AudioParam` ramps to avoid clicks. The UI, persistence adapter, and audio graph should consume the same normalized settings object rather than maintaining parallel defaults.

Minimum unit cases: missing record, corrupt JSON, wrong types, out-of-range/non-finite values, partial legacy record, unknown fields, round trip, and migration. Browser verification should change every category, reload, and assert the UI and stored normalized record agree.

### Automated and Browser Verification

Use two layers:

1. `node --test` for fast deterministic logic tests in `test/**/*.test.js`.
2. `@playwright/test` for a small Chromium suite against the production preview.

The Playwright suite should verify at least:

- the production page loads, creates the game canvas/start UI, and reports no unexpected `pageerror` or console errors;
- the start gesture successfully resumes/uses the audio context without requiring test-time autoplay bypasses;
- each audio control updates the namespaced `localStorage` record and survives reload;
- critical HUD/settings controls remain visible and keyboard-operable;
- a controlled navigation test seam or deterministic fixture demonstrates that Matt does not cross a wall and can route through a doorway;
- traces are retained on first retry and a screenshot is retained on failure.

Pointer-lock movement, perceived loudness, distortion quality, difficulty, and jumpscare timing still require a manual in-app-browser playtest. Headless assertions are not a substitute for those experiential checks.

## Installation

No new runtime packages are recommended.

```bash
# Existing runtime/build stack: keep the lockfile-resolved versions.
npm ci

# Sole new development dependency.
npm install --save-dev @playwright/test@1.61.1
npx playwright install chromium
```

Recommended scripts when implementation begins:

```json
{
  "test": "node --test",
  "test:browser": "playwright test",
  "verify": "npm test && npm run build && npm run test:browser"
}
```

Do not install packages during research; the commands above are the implementation prescription.

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

**If the house remains a single flat, fixed-layout level:**
- Keep the local grid A* and static grid cache.
- Because this is the simplest deterministic representation of the existing AABBs.

**If the house gains stairs, multiple floors, ramps, or runtime geometry destruction:**
- Re-evaluate a waypoint graph or navmesh at that milestone.
- Because the current 2D occupancy model would no longer encode the traversable surface faithfully.

**If tests begin importing Vite-only transforms or DOM-heavy modules:**
- Re-evaluate Vitest rather than forcing complex loaders around `node:test`.
- Because test infrastructure should follow a proven need, not precede one.

**If formal cross-browser support becomes a release requirement:**
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

---
*Stack research for: BridgeMind Horror House gameplay, audio settings, tests, and browser verification*
*Researched: 2026-07-10*
