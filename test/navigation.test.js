import test from 'node:test';
import assert from 'node:assert/strict';

async function loadNavigation() {
  try {
    const module = await import('../src/systems/Navigation.js');
    for (const name of ['inflateAabb', 'NavigationGrid', 'moveCircleAgainstAabbs']) {
      assert.equal(typeof module[name], 'function', `Navigation contract missing: export ${name}`);
    }
    return module;
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') {
      assert.fail(`Navigation contract missing: ${error.message}`);
    }
    throw error;
  }
}

const BOUNDS = { minX: 0, maxX: 4, minZ: 0, maxZ: 4 };

function assertCardinal(path) {
  for (let i = 1; i < path.length; i++) {
    const dx = Math.abs(path[i].x - path[i - 1].x);
    const dz = Math.abs(path[i].z - path[i - 1].z);
    assert.ok((dx > 0 && dz === 0) || (dz > 0 && dx === 0), 'path edges must be cardinal');
  }
}

test('exports the pure navigation contract', async () => {
  await loadNavigation();
});

test('inflateAabb expands by radius plus epsilon without mutation', async () => {
  const { inflateAabb } = await loadNavigation();
  const source = { minX: 1, maxX: 2, minZ: 3, maxZ: 4 };
  assert.deepEqual(inflateAabb(source, 0.25, 0.05), {
    minX: 0.7,
    maxX: 2.3,
    minZ: 2.7,
    maxZ: 4.3,
  });
  assert.deepEqual(source, { minX: 1, maxX: 2, minZ: 3, maxZ: 4 });
});

test('findPath returns a deterministic cardinal straight path', async () => {
  const { NavigationGrid } = await loadNavigation();
  const grid = new NavigationGrid({ bounds: BOUNDS, blockers: [], cellSize: 0.5, radius: 0, epsilon: 0 });
  const start = { x: 0.25, z: 0.25 };
  const goal = { x: 3.75, z: 0.25 };
  const path = grid.findPath(start, goal);
  assert.ok(path.length > 1);
  assertCardinal(path);
  assert.deepEqual(path, grid.findPath(start, goal));
});

test('findPath detours around a solid wall', async () => {
  const { NavigationGrid } = await loadNavigation();
  const grid = new NavigationGrid({
    bounds: BOUNDS,
    blockers: [{ minX: 1.75, maxX: 2.25, minZ: 0, maxZ: 3.25 }],
    cellSize: 0.25,
    radius: 0.1,
    epsilon: 0.01,
  });
  const path = grid.findPath({ x: 0.5, z: 0.5 }, { x: 3.5, z: 0.5 });
  assert.ok(path.length > 0);
  assert.ok(path.some((point) => point.z > 3.35), 'path should use the open end of the wall');
  assertCardinal(path);
});

test('findPath crosses an authored doorway gap', async () => {
  const { NavigationGrid } = await loadNavigation();
  const grid = new NavigationGrid({
    bounds: BOUNDS,
    blockers: [
      { minX: 1.75, maxX: 2.25, minZ: 0, maxZ: 1.35 },
      { minX: 1.75, maxX: 2.25, minZ: 2.65, maxZ: 4 },
    ],
    cellSize: 0.25,
    radius: 0.2,
    epsilon: 0.01,
  });
  const path = grid.findPath({ x: 0.5, z: 2 }, { x: 3.5, z: 2 });
  assert.ok(path.length > 0);
  assert.ok(path.some((point) => point.x > 1.75 && point.x < 2.25 && point.z > 1.5 && point.z < 2.5));
  assertCardinal(path);
});

test('findPath returns empty when a wall fully separates the goal', async () => {
  const { NavigationGrid } = await loadNavigation();
  const grid = new NavigationGrid({
    bounds: BOUNDS,
    blockers: [{ minX: 1.75, maxX: 2.25, minZ: 0, maxZ: 4 }],
    cellSize: 0.25,
    radius: 0.1,
    epsilon: 0.01,
  });
  assert.deepEqual(grid.findPath({ x: 0.5, z: 2 }, { x: 3.5, z: 2 }), []);
});

test('cardinal routing cannot squeeze diagonally through blocked corners', async () => {
  const { NavigationGrid } = await loadNavigation();
  const grid = new NavigationGrid({
    bounds: { minX: 0, maxX: 2, minZ: 0, maxZ: 2 },
    blockers: [
      { minX: 1, maxX: 2, minZ: 0, maxZ: 1 },
      { minX: 0, maxX: 1, minZ: 1, maxZ: 2 },
    ],
    cellSize: 1,
    radius: 0,
    epsilon: 0,
  });
  assert.deepEqual(grid.findPath({ x: 0.5, z: 0.5 }, { x: 1.5, z: 1.5 }), []);
});

test('nearestWalkable is deterministic and reports a completely blocked grid', async () => {
  const { NavigationGrid } = await loadNavigation();
  const blocker = { minX: 1, maxX: 3, minZ: 1, maxZ: 3 };
  const grid = new NavigationGrid({ bounds: BOUNDS, blockers: [blocker], cellSize: 0.5, radius: 0, epsilon: 0 });
  const blockedCell = grid.worldToCell({ x: 2, z: 2 });
  const resolved = grid.nearestWalkable(blockedCell);
  assert.ok(resolved);
  assert.equal(grid.isWalkable(resolved), true);
  assert.deepEqual(resolved, grid.nearestWalkable(blockedCell));

  const sealed = new NavigationGrid({
    bounds: { minX: 0, maxX: 1, minZ: 0, maxZ: 1 },
    blockers: [{ minX: 0, maxX: 1, minZ: 0, maxZ: 1 }],
    cellSize: 0.5,
    radius: 0,
    epsilon: 0,
  });
  assert.equal(sealed.nearestWalkable({ x: 0, z: 0 }), null);
});

test('NavigationGrid rejects malformed or excessive allocation inputs', async () => {
  const { NavigationGrid } = await loadNavigation();
  assert.throws(() => new NavigationGrid({ bounds: BOUNDS, blockers: [], cellSize: 0 }));
  assert.throws(() => new NavigationGrid({ bounds: { ...BOUNDS, maxX: Infinity }, blockers: [] }));
  assert.throws(() => new NavigationGrid({ bounds: BOUNDS, blockers: [], radius: -1 }));
  assert.throws(() => new NavigationGrid({
    bounds: { minX: 0, maxX: 10000, minZ: 0, maxZ: 10000 },
    blockers: [],
    cellSize: 0.01,
  }));
});

test('substepped circle motion cannot tunnel through a thin wall', async () => {
  const { moveCircleAgainstAabbs } = await loadNavigation();
  const wall = { minX: 1.9, maxX: 2.1, minZ: -1, maxZ: 1 };
  const result = moveCircleAgainstAabbs({ x: 0, z: 0 }, { x: 4, z: 0 }, [wall], {
    radius: 0.3,
    epsilon: 0.01,
    maxSubstep: 0.1,
  });
  assert.ok(result.x <= 1.59 + 1e-9);
  assert.equal(result.z, 0);
});

test('circle motion slides along a blocked axis', async () => {
  const { moveCircleAgainstAabbs } = await loadNavigation();
  const wall = { minX: 1.9, maxX: 2.1, minZ: -2, maxZ: 2 };
  const result = moveCircleAgainstAabbs({ x: 0, z: 0 }, { x: 4, z: 1 }, [wall], {
    radius: 0.3,
    epsilon: 0.01,
    maxSubstep: 0.1,
  });
  assert.ok(result.x <= 1.59 + 1e-9);
  assert.ok(result.z > 0.9);
});

test('motion starting inside a blocker fails closed', async () => {
  const { moveCircleAgainstAabbs } = await loadNavigation();
  const wall = { minX: -0.5, maxX: 0.5, minZ: -0.5, maxZ: 0.5 };
  assert.deepEqual(
    moveCircleAgainstAabbs({ x: 0, z: 0 }, { x: 3, z: 0 }, [wall]),
    { x: 0, z: 0 },
  );
});
