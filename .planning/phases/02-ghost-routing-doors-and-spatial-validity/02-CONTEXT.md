# Phase 2 Context: Ghost Routing, Doors, and Spatial Validity

## Scope

Phase 2 owns NAV-02 through NAV-05. It converts the collision-safe but still direct-aimed hunter into a topology-aware route follower without adding a physics or pathfinding dependency.

## Live Root Causes

- `Ghost.update` computes movement from the direct player delta, so a wall blocks him but he does not seek a doorway.
- Closed doors are absent from the static navigation topology but become non-colliding before their swing is fully open.
- Stalk and reform positions are chosen by straight-line offsets rather than legal route distance.
- Catch uses the distance measured before movement and has no wall/door visibility test.

## Decisions

- Build one `NavigationGrid` from the house bounds and static colliders; doors remain traversable portals in route topology.
- Replan on a bounded cadence and follow cell-center waypoints. An empty route means stop and retry, never direct pursuit.
- A nearby routed Matt may request a door to open. The door remains a collider until fully open, so he physically waits for clearance.
- Select manifestations from authored candidates by legal route length; fail closed if no candidate qualifies.
- Evaluate capture after movement and require a clear segment against current static and door colliders.

## Verification Targets

- Legal detour and doorway routes.
- Bounded route refresh and no-path stop behavior.
- Closed-door wait until full clearance.
- Connected spawn selection with minimum route distance.
- Post-motion catch blocked by a wall or closed door.
