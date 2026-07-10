# Phase 1: Navigation Geometry and Collision Foundation - Context

**Gathered:** 2026-07-10
**Status:** Ready for planning
**Mode:** Autonomous recommendations accepted from the explicit user objective and GSD research

<domain>
## Phase Boundary

Establish one deterministic, testable representation of the house's static collision geometry and use it to prevent Matt from entering or crossing walls at any supported frame rate or movement speed. This phase owns the pure grid/AABB foundation and blocker-safe motion; cached pursuit routes, dynamic door behavior, spawn/reform topology, and catch legality are Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Geometry Contract
- Reuse the plain `{ minX, maxX, minZ, maxZ }` AABBs already authored by `House`; do not inspect rendered meshes in navigation code.
- Treat actor radius as clearance by inflating blockers, with a small explicit epsilon instead of hidden magic offsets.
- Keep world/cell conversion deterministic and clamp only at explicit API boundaries.

### Route Foundation
- Use a small cardinal grid over the existing single-floor bounds; do not permit diagonal corner cutting.
- Use deterministic A* tie-breaking and return an empty path when no legal route exists.
- Build static occupancy once and expose testable world-to-cell, cell-to-world, nearest-walkable, and path functions.

### Collision-Safe Motion
- Move circles with bounded substeps smaller than the thinnest meaningful blocker clearance so high speed cannot tunnel.
- Resolve X and Z independently to support sliding along wall faces.
- Fail closed at blockers; never fall back to raw direct movement through geometry.

### Test-First Debugging
- The first code change is a regression test that dynamically imports the not-yet-created navigation module and fails with an explicit missing-contract assertion.
- Red evidence must cover a solid wall, a legal doorway gap, an unreachable target, deterministic repeated paths, corner blocking, and maximum-speed substepping.
- Only after the expected red failure may the pure navigation module and live Ghost collision integration be implemented.

### the Agent's Discretion
- Exact grid cell size, clearance epsilon, helper names, and internal data structures may be chosen from measured house geometry as long as all test and performance constraints remain true.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `House._wallBox` already records canonical static AABBs for every colliding wall segment.
- `House.getColliders` already combines static wall AABBs with dynamic door AABBs.
- `Player._resolveCollisions` proves circle-vs-AABB separation works with the current house data.
- `BOUNDS` and authored wall gaps define a compact single-floor navigation domain.

### Established Patterns
- Game systems are ES modules with small classes and direct composition in `Game`.
- The player resolves movement one axis at a time after each axis update.
- The codebase has no test framework; Node 22's built-in `node:test` is the approved zero-dependency path.

### Integration Points
- `Game._tick` currently calls `ghost.update(dt, player.position, t)` without geometry.
- `Ghost.update` directly normalizes the vector to the player and explicitly says it glides through walls; this is the confirmed root cause.
- Phase 1 will pass static collider geometry into Ghost motion so it cannot cross a blocker, while Phase 2 replaces blocked direct pursuit with cached legal routes and door actions.

</code_context>

<specifics>
## Specific Ideas

- The intentionally flat billboard wobble must remain visually unchanged.
- The player should be able to watch Matt hit or slide along a wall in this phase, never enter it; route intelligence arrives immediately afterward in Phase 2.
- Automated fixtures must use plain numeric points/AABBs and run without DOM, WebGL, or image loaders.

</specifics>

<deferred>
## Deferred Ideas

- Dynamic door portals, door opening/waiting, cached replanning, legal spawns/reforms, and through-wall catch prevention belong to Phase 2.
- Hunt difficulty, battery/key fairness, audio controls, jumpscare orchestration, and room enrichment remain in Phases 3-6.

</deferred>
