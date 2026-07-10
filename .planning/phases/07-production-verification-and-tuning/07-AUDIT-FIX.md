---
phase: 07-production-verification-and-tuning
status: fixed
gaps_found: 5
gaps_remaining: 0
audited: 2026-07-10
---

# GSD Audit-Fix Report

The production audit found five concrete gaps and fixed all five before handoff.

1. **Missing favicon produced a production console 404.** Added an inline permission-safe SVG favicon; rerun has zero console errors.
2. **Headless/unsupported pointer lock rejected as an uncaught promise.** Centralized pointer-lock requests and safely consumes unsupported-environment rejection without changing real-browser behavior.
3. **Capture timer threw `Illegal invocation` in a real browser.** Timer adapters now preserve an undefined receiver with `Reflect.apply`; added a regression test.
4. **0.4 m production navigation cells conservatively sealed the authored 1.4 m doors.** Production grid now uses 0.25 m cells; the exact authored portal has a regression fixture and the live path contains 75 legal cells.
5. **A manifestation candidate could be inside furniture.** Spawn selection now returns the first free connected route cell rather than the unsnapped authored hint.

## Re-audit Evidence

- 38/38 Node tests pass.
- Production build passes.
- Browser: HTTP 200, 14 settings controls, synchronized persistence, controls do not start play, HUD starts, mute reaches exact master gain 0, reduced-motion animation is `none`, full-screen capture is 1280×800, death transitions once, capture becomes inactive, and console errors are empty.
- Live routed pursuit: snapped free start `(-6.875, -5.125)`; study door advances `0 -> 1.95`; Matt exits through the study portal, traverses the hallway, enters the bedroom portal, and never crosses the separating wall.
- CBM refreshed to 769 nodes and 1,617 edges; changed production/test surfaces were re-indexed and inspected.
