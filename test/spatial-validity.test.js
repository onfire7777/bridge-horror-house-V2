import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CachedRoute,
  NavigationGrid,
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

  assert.deepEqual(spawn.position, candidates[1]);
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
