---
phase: 02-ghost-routing-doors-and-spatial-validity
plan: 01
subsystem: ghost-navigation
tags: [astar, doors, spawn-validity, capture-occlusion]
requires: [NAV-01]
provides:
  - cached legal ghost routes
  - full-clearance automatic door opening
  - connected route-distance manifestations
  - post-motion unobstructed capture
affects: [phase-03-balance, phase-07-playtest]
tech-stack:
  added: []
  patterns: [cached-route, fail-closed-pursuit, authored-spawn-candidates]
key-files:
  modified: [src/systems/Navigation.js, src/systems/Ghost.js, src/world/House.js, src/Game.js, src/systems/ScareDirector.js]
  tests: [test/spatial-validity.test.js]
requirements-completed: [NAV-02, NAV-03, NAV-04, NAV-05]
completed: 2026-07-10
---

# Phase 2 Plan 01 Summary

Matt no longer points through the house and waits at walls. He follows a cached deterministic route, approaches and opens the relevant interior door, waits behind its collider until the swing clears, and resumes through the doorway.

## Delivery

- `9750bc9` — Phase 2 execution plan
- `1f692f2` — failing spatial-validity contract (RED)
- `b70ad88` — live routed pursuit, door, spawn, and capture implementation (GREEN)

## Verification

- 24/24 tests pass.
- Production Vite build passes.
- CBM impact and live call-chain traces cover all five modified production modules.
- Review is clean at critical and warning severity.
- Local and remote `main` were synchronized after the implementation push.

## Next Phase

Phase 3 will tune early pressure, final-chase persistence, flashlight burn/reform timing, battery warning/recovery, and seeded room-specific key placement on top of legal route distances.
