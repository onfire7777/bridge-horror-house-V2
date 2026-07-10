---
phase: 02-ghost-routing-doors-and-spatial-validity
status: passed
score: 24/24 tests
requirements: [NAV-02, NAV-03, NAV-04, NAV-05]
verified: 2026-07-10
---

# Phase 2 Verification

## Result

Phase 2's automated and source-integration gates pass. Matt now follows legal cached routes, requests interior doors and waits for clearance, reforms at route-distant connected candidates, and captures only after motion with current line of sight.

## Evidence

- RED: the focused suite failed because `CachedRoute` and the spatial-validity exports were absent.
- GREEN: `npm test` passed 24/24 tests, including doorway routing, unreachable paths, bounded cache refresh, spawn selection, body-clearance angle, post-motion distance, and occlusion.
- Build: `npm run build` completed successfully.
- Hygiene: `git diff --check` completed successfully and the secret-pattern sweep found no matches.
- Review: `02-REVIEW.md` reports 0 critical and 0 warning findings.
- CBM: the refreshed graph contains 623 nodes and 1,384 edges; traces confirm `Ghost.update` calls `CachedRoute.next`, `moveCircleAgainstAabbs`, and `canCapture`/segment clearance through the live `Game._tick` path.
- Delivery: implementation push was fetched and verified 0 commits ahead / 0 behind `origin/main`.

## Requirement Verdicts

- **NAV-02 — PASS:** routes use authored gaps; Matt opens nearby interior doors and the door collider persists until body clearance.
- **NAV-03 — PASS:** replanning occurs on a bounded cadence; no route returns no target and no movement fallback.
- **NAV-04 — PASS:** stalk, finale, and reform use connected candidates with minimum legal route distance.
- **NAV-05 — PASS:** capture uses the post-motion position and current static/door occlusion.

Production-preview traversal in both directions remains an explicit Phase 7 manual evidence check.
