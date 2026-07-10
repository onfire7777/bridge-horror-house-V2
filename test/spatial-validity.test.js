import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CachedRoute,
  NavigationGrid,
  canCapture,
  doorBlocksAtAngle,
  isSegmentClear,
  selectReachableSpawn,
} from '../src/systems/Navigation.js';

const bounds = { minX: 0, maxX: 8, minZ: 0, maxZ: 8 };

test('segment clearance treats walls and closed-door slabs as occluders', () => {
  const slab = { minX: 3.8, maxX: 4.2, minZ: 2, maxZ: 6 };
  assert.equal(isSegmentClear({ x: 2, z: 4 }, { x: 6, z: 4 }, [slab]), false);
  assert.equal(isSegmentClear({ x: 2, z: 1 }, { x: 6, z: 1 }, [slab]), true);
  assert.equal(isSegmentClear({ x: 2, z: 2 }, { x: 6, z: 2 }, [slab]), false);
});

test('capture uses the supplied post-motion position and rejects occluded proximity', () => {
  const wall = { minX: 0.2, maxX: 0.3, minZ: -1, maxZ: 1 };
  const player = { x: 0.6, z: 0 };
  assert.equal(canCapture({ x: 0, z: 0 }, player, [], { catchDistance: 0.75 }), true);
  assert.equal(canCapture({ x: -0.2, z: 0 }, player, [], { catchDistance: 0.75 }), false);
  assert.equal(canCapture({ x: 0, z: 0 }, player, [wall], { catchDistance: 0.75 }), false);
});

test('a door blocks until its swing has reached body-clearance angle', () => {
  assert.equal(doorBlocksAtAngle(0, 1.95), true);
  assert.equal(doorBlocksAtAngle(1.89, 1.95), true);
  assert.equal(doorBlocksAtAngle(1.9, 1.95), false);
  assert.equal(doorBlocksAtAngle(1.95, 1.95), false);
});

test('cached routes replan on a bounded cadence and never invent a direct fallback', () => {
  let calls = 0;
  const grid = {
    findPath() {
      calls++;
      return calls === 1 ? [{ x: 0, z: 0 }, { x: 1, z: 0 }, { x: 2, z: 0 }] : [];
    },
  };
  const route = new CachedRoute(grid, { replanInterval: 0.5, arrivalRadius: 0.15 });

  assert.deepEqual(route.next({ x: 0, z: 0 }, { x: 3, z: 0 }, 0.01), { x: 1, z: 0 });
  assert.deepEqual(route.next({ x: 0.2, z: 0 }, { x: 3, z: 0 }, 0.2), { x: 1, z: 0 });
  assert.equal(calls, 1);
  assert.equal(route.next({ x: 0.2, z: 0 }, { x: 3, z: 0 }, 0.31), null);
  assert.equal(calls, 2);
});

test('spawn selection requires a connected route with minimum legal distance', () => {
  const wallWithDoor = [
    { minX: 3.8, maxX: 4.2, minZ: 0, maxZ: 3 },
    { minX: 3.8, maxX: 4.2, minZ: 5, maxZ: 8 },
  ];
  const grid = new NavigationGrid({ bounds, blockers: wallWithDoor, cellSize: 0.4, radius: 0.2, epsilon: 0.01 });
  const player = { x: 1, z: 1 };
  const candidates = [{ x: 2, z: 1 }, { x: 7, z: 1 }, { x: 7, z: 7 }];
  const spawn = selectReachableSpawn(grid, player, candidates, { minRouteDistance: 8, random: () => 0 });

  assert.ok(spawn.position.x > 4);
  assert.equal(grid.isWalkable(grid.worldToCell(spawn.position)), true);
  assert.ok(spawn.routeDistance >= 8);
});

test('spawn selection fails closed when candidates are unreachable or too close', () => {
  const solidWall = [{ minX: 3.8, maxX: 4.2, minZ: 0, maxZ: 8 }];
  const grid = new NavigationGrid({ bounds, blockers: solidWall, cellSize: 0.4, radius: 0.2, epsilon: 0.01 });
  const result = selectReachableSpawn(
    grid,
    { x: 1, z: 1 },
    [{ x: 2, z: 1 }, { x: 7, z: 7 }],
    { minRouteDistance: 4, random: () => 0 },
  );
  assert.equal(result, null);
});

test('production-resolution grid preserves the authored 1.4 meter door portal', () => {
  const wallSegments = [
    { minX: -10, maxX: -7.9, minZ: -1.125, maxZ: -0.875 },
    { minX: -6.5, maxX: 10, minZ: -1.125, maxZ: -0.875 },
  ];
  const grid = new NavigationGrid({
    bounds: { minX: -10, maxX: 10, minZ: -8, maxZ: 8 },
    blockers: wallSegments,
    cellSize: 0.25,
    radius: 0.32,
    epsilon: 0.01,
  });
  const path = grid.findPath({ x: -7.2, z: -5 }, { x: -7.2, z: 0.5 });
  assert.ok(path.length > 0);
  assert.ok(path.some((point) => point.z > -0.875));
});
