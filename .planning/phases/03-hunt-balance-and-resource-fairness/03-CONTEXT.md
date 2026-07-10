# Phase 3 Context: Hunt Balance and Resource Fairness

## Scope

Phase 3 owns HUNT-01 through HUNT-03, BATT-01 through BATT-02, and KEY-01 through KEY-02.

## Decisions

- Begin routed stalking after the first key, shorten the quiet cadence after the second, and make the final chase faster and more persistent.
- Keep flashlight banishment understandable, but raise defensive drain and shorten repeated reform downtime.
- Centralize clamped charge math and low/critical/empty bands in pure rules with visible and audible transitions.
- Replace ambient `Math.random` key placement with a seedable three-room selector that uses each candidate slot once per run.
- Keep curated key positions and add explicit interaction stances for exhaustive validation.

## Evidence Gates

- Pure tests cover all hunt profiles, charge edge cases, deterministic seeds, every candidate, and every one-per-room combination.
- Full tests/build pass and live modules consume the tested rules.
- Production-preview balance remains a Phase 7 human tuning gate.
