# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-10)

**Core value:** The player must feel hunted by a monster that obeys the house, becomes more dangerous over time, and can be driven back—but never permanently neutralized—by carefully managed flashlight power.
**Current focus:** Phase 3 — Hunt Balance and Resource Fairness

## Current Position

Phase: 3 of 7 (Hunt Balance and Resource Fairness)
Plan: 0 of 1 in current phase
Status: Implementing
Last activity: 2026-07-10 — Planned early hunt pressure, charge economy, warnings, and deterministic room keys.

Progress: [███░░░░░░░] 29%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 1 | 1 | 1 | — |
| Phase 2 | 1 | 1 | — |

**Recent Trend:**
- Last 5 plans: 01-01, 02-01
- Trend: Two verified increments complete

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table. Recent decisions affecting current work:

- [Roadmap]: Use the research-backed seven-phase dependency order; preserve the separate spatial and audio dependency branches while executing phases sequentially.
- [Delivery]: Verify each substantial increment before committing and pushing to `main`; Phase 7 owns GIT-01 traceability and final local/remote parity proof.
- [Scope]: Treat final balance, perceived jumpscare force, asset permission, room readability, and representative-device performance as evidence gates rather than assumed implementation outcomes.
- [Navigation]: Use conservative grid rasterization and bounded collision substeps; blocked motion fails closed instead of phasing.
- [Routing]: Use cached A* waypoints, full-open door clearance, route-distance manifestations, and post-motion visibility-gated capture.

### Pending Todos

None yet.

### Blockers/Concerns

No blockers.

### Delivery Discipline

- Planning and implementation proceed sequentially because `parallelization` is disabled.
- Each substantial increment requires its runnable verification before commit and push.
- Completion claims require production-preview evidence and confirmed `main` / `origin/main` parity.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| v2 | Difficulty presets, captions, mono audio, seed display, and expanded approved content | Deferred | Project initialization |

## Session Continuity

Last session: 2026-07-10
Stopped at: Phase 2 verified and pushed; Phase 3 is ready for hunt/resource planning.
Resume file: .planning/phases/02-ghost-routing-doors-and-spatial-validity/02-01-SUMMARY.md
