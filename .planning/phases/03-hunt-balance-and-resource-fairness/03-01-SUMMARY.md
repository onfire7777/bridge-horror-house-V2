---
phase: 03-hunt-balance-and-resource-fairness
plan: 01
subsystem: run-balance
tags: [hunt-tiers, battery, seeded-keys, fairness]
requires: [NAV-01, NAV-02, NAV-03, NAV-04, NAV-05]
provides: [early-stalking, escalating-chase, bounded-charge-economy, deterministic-room-keys]
affects: [phase-06-cues, phase-07-tuning]
tech-stack:
  added: []
  patterns: [pure-run-rules, seeded-permutation, battery-state-machine]
key-files:
  created: [src/systems/RunRules.js, test/run-rules.test.js]
  modified: [src/Game.js, src/player/Player.js, src/systems/Ghost.js, src/systems/ScareDirector.js, src/world/House.js, src/ui/HUD.js, index.html]
requirements-completed: [HUNT-01, HUNT-02, HUNT-03, BATT-01, BATT-02, KEY-01, KEY-02]
completed: 2026-07-10
---

# Phase 3 Plan 01 Summary

The first key now wakes routed stalking, the second compresses its cadence, and the final chase is substantially faster with longer burn commitment and much shorter repeated relief. Charge math is explicit and capped, while seeded keys remain fair and reproducible.

## Delivery

- `8c09cac` — Phase 3 execution plan
- `84fc833` — failing run-rules contract (RED)
- `197ae9e` — hunt, charge, warning, and seeded-key implementation (GREEN)

30 tests and the production build pass; local and remote `main` are synchronized.
