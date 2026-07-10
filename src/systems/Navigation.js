const DEFAULT_RADIUS = 0.32;
const DEFAULT_EPSILON = 0.01;
const MAX_GRID_CELLS = 250_000;
const MAX_MOTION_SUBSTEPS = 4_096;

// North, west, east, south. A* preserves this insertion order for final ties.
const CARDINAL_DIRECTIONS = Object.freeze([
  Object.freeze({ col: 0, row: -1 }),
  Object.freeze({ col: -1, row: 0 }),
  Object.freeze({ col: 1, row: 0 }),
  Object.freeze({ col: 0, row: 1 }),
]);

function requireFinite(value, name) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}

function requireNonNegative(value, name) {
  requireFinite(value, name);
  if (value < 0) throw new RangeError(`${name} must be non-negative`);
  return value;
}

function requirePositive(value, name) {
  requireFinite(value, name);
  if (value <= 0) throw new RangeError(`${name} must be positive`);
  return value;
}

function validatePoint(point, name) {
  if (!point || typeof point !== 'object') throw new TypeError(`${name} must be a point`);
  requireFinite(point.x, `${name}.x`);
  requireFinite(point.z, `${name}.z`);
}

function validateAabb(aabb, name = 'aabb') {
  if (!aabb || typeof aabb !== 'object') throw new TypeError(`${name} must be an AABB`);
  requireFinite(aabb.minX, `${name}.minX`);
  requireFinite(aabb.maxX, `${name}.maxX`);
  requireFinite(aabb.minZ, `${name}.minZ`);
  requireFinite(aabb.maxZ, `${name}.maxZ`);
  if (aabb.minX > aabb.maxX || aabb.minZ > aabb.maxZ) {
    throw new RangeError(`${name} bounds must be ordered`);
  }
}

export function inflateAabb(aabb, radius, epsilon = DEFAULT_EPSILON) {
  validateAabb(aabb);
  const clearance = requireNonNegative(radius, 'radius') + requireNonNegative(epsilon, 'epsilon');
  requireFinite(clearance, 'clearance');
  const inflated = {
    minX: aabb.minX - clearance,
    maxX: aabb.maxX + clearance,
    minZ: aabb.minZ - clearance,
    maxZ: aabb.maxZ + clearance,
  };
  for (const [name, value] of Object.entries(inflated)) requireFinite(value, `inflated.${name}`);
  return inflated;
}

function aabbIntersectsCell(aabb, cellBounds) {
  return cellBounds.maxX >= aabb.minX && cellBounds.minX <= aabb.maxX
    && cellBounds.maxZ >= aabb.minZ && cellBounds.minZ <= aabb.maxZ;
}

function pointStrictlyInsideExpanded(point, aabb, clearance) {
  return point.x > aabb.minX - clearance && point.x < aabb.maxX + clearance
    && point.z > aabb.minZ - clearance && point.z < aabb.maxZ + clearance;
}

function segmentIntersectsAabb(start, end, aabb) {
  let minimum = 0;
  let maximum = 1;
  const delta = { x: end.x - start.x, z: end.z - start.z };

  for (const axis of ['x', 'z']) {
    const low = axis === 'x' ? aabb.minX : aabb.minZ;
    const high = axis === 'x' ? aabb.maxX : aabb.maxZ;
    if (delta[axis] === 0) {
      if (start[axis] < low || start[axis] > high) return false;
      continue;
    }
    const first = (low - start[axis]) / delta[axis];
    const second = (high - start[axis]) / delta[axis];
    const entry = Math.min(first, second);
    const exit = Math.max(first, second);
    minimum = Math.max(minimum, entry);
    maximum = Math.min(maximum, exit);
    if (minimum > maximum) return false;
  }
  return true;
}

export function isSegmentClear(start, end, blockers = [], { clearance = 0 } = {}) {
  validatePoint(start, 'start');
  validatePoint(end, 'end');
  if (!Array.isArray(blockers)) throw new TypeError('blockers must be an array');
  requireNonNegative(clearance, 'clearance');
  return !blockers.some((blocker, index) => {
    validateAabb(blocker, `blockers[${index}]`);
    return segmentIntersectsAabb(start, end, inflateAabb(blocker, clearance, 0));
  });
}

export function canCapture(ghostPosition, playerPosition, blockers = [], {
  catchDistance = 0.75,
  clearance = 0.02,
} = {}) {
  validatePoint(ghostPosition, 'ghostPosition');
  validatePoint(playerPosition, 'playerPosition');
  requirePositive(catchDistance, 'catchDistance');
  return Math.hypot(
    playerPosition.x - ghostPosition.x,
    playerPosition.z - ghostPosition.z,
  ) < catchDistance && isSegmentClear(ghostPosition, playerPosition, blockers, { clearance });
}

export function doorBlocksAtAngle(angle, openAngle, clearanceAngle = 0.05) {
  requireNonNegative(angle, 'angle');
  requirePositive(openAngle, 'openAngle');
  requireNonNegative(clearanceAngle, 'clearanceAngle');
  if (clearanceAngle >= openAngle) throw new RangeError('clearanceAngle must be smaller than openAngle');
  return angle + Number.EPSILON < openAngle - clearanceAngle;
}

function routeDistance(path, start, end) {
  if (path.length === 0) return Infinity;
  let distance = Math.hypot(path[0].x - start.x, path[0].z - start.z);
  for (let index = 1; index < path.length; index++) {
    distance += Math.hypot(path[index].x - path[index - 1].x, path[index].z - path[index - 1].z);
  }
  const last = path[path.length - 1];
  return distance + Math.hypot(end.x - last.x, end.z - last.z);
}

export function selectReachableSpawn(grid, playerPosition, candidates, {
  minRouteDistance = 6,
  random = Math.random,
} = {}) {
  if (!grid || typeof grid.findPath !== 'function') throw new TypeError('grid must support findPath');
  validatePoint(playerPosition, 'playerPosition');
  if (!Array.isArray(candidates)) throw new TypeError('candidates must be an array');
  requireNonNegative(minRouteDistance, 'minRouteDistance');
  if (typeof random !== 'function') throw new TypeError('random must be a function');

  const eligible = [];
  for (let index = 0; index < candidates.length; index++) {
    const candidate = candidates[index];
    validatePoint(candidate, `candidates[${index}]`);
    const path = grid.findPath(candidate, playerPosition);
    const distance = routeDistance(path, candidate, playerPosition);
    if (Number.isFinite(distance) && distance >= minRouteDistance) {
      eligible.push({ position: { x: candidate.x, z: candidate.z }, routeDistance: distance });
    }
  }
  if (eligible.length === 0) return null;
  const sample = random();
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
    throw new RangeError('random must return a finite value in [0, 1)');
  }
  return eligible[Math.floor(sample * eligible.length)];
}

export class CachedRoute {
  constructor(grid, { replanInterval = 0.45, arrivalRadius = 0.22 } = {}) {
    if (!grid || typeof grid.findPath !== 'function') throw new TypeError('grid must support findPath');
    this.grid = grid;
    this.replanInterval = requirePositive(replanInterval, 'replanInterval');
    this.arrivalRadius = requireNonNegative(arrivalRadius, 'arrivalRadius');
    this.reset();
  }

  reset() {
    this.path = [];
    this.index = 0;
    this.replanTimer = 0;
  }

  next(position, goal, dt) {
    validatePoint(position, 'position');
    validatePoint(goal, 'goal');
    requireNonNegative(dt, 'dt');
    this.replanTimer -= dt;
    if (this.replanTimer <= 0 || this.index >= this.path.length) {
      this.path = this.grid.findPath(position, goal);
      if (this.path.length > 0) this.path[this.path.length - 1] = { x: goal.x, z: goal.z };
      this.index = this.path.length > 1 ? 1 : 0;
      this.replanTimer = this.replanInterval;
    }

    while (this.index < this.path.length) {
      const target = this.path[this.index];
      if (Math.hypot(target.x - position.x, target.z - position.z) > this.arrivalRadius) return target;
      this.index++;
    }
    return null;
  }
}

export class NavigationGrid {
  constructor({
    bounds,
    blockers = [],
    cellSize = 0.4,
    radius = DEFAULT_RADIUS,
    epsilon = DEFAULT_EPSILON,
  }) {
    validateAabb(bounds, 'bounds');
    if (bounds.minX === bounds.maxX || bounds.minZ === bounds.maxZ) {
      throw new RangeError('bounds must have positive area');
    }
    if (!Array.isArray(blockers)) throw new TypeError('blockers must be an array');

    this.bounds = { ...bounds };
    this.cellSize = requirePositive(cellSize, 'cellSize');
    this.radius = requireNonNegative(radius, 'radius');
    this.epsilon = requireNonNegative(epsilon, 'epsilon');
    const spanX = bounds.maxX - bounds.minX;
    const spanZ = bounds.maxZ - bounds.minZ;
    requirePositive(spanX, 'bounds width');
    requirePositive(spanZ, 'bounds depth');
    this.columns = Math.ceil(spanX / this.cellSize);
    this.rows = Math.ceil(spanZ / this.cellSize);
    if (!Number.isSafeInteger(this.columns) || !Number.isSafeInteger(this.rows)) {
      throw new RangeError('navigation grid dimensions are unsafe');
    }

    const cellCount = this.columns * this.rows;
    if (!Number.isSafeInteger(cellCount) || cellCount <= 0 || cellCount > MAX_GRID_CELLS) {
      throw new RangeError(`navigation grid exceeds ${MAX_GRID_CELLS} cells`);
    }

    this.blockers = blockers.map((blocker, index) => {
      validateAabb(blocker, `blockers[${index}]`);
      return inflateAabb(blocker, this.radius, this.epsilon);
    });
    this.occupied = new Uint8Array(cellCount);

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        const cell = { col, row };
        if (this.blockers.some((blocker) => aabbIntersectsCell(blocker, this._cellBounds(cell)))) {
          this.occupied[this._index(col, row)] = 1;
        }
      }
    }
  }

  _index(col, row) {
    return row * this.columns + col;
  }

  _cell(index) {
    return { col: index % this.columns, row: Math.floor(index / this.columns) };
  }

  _inBounds(cell) {
    return Number.isInteger(cell?.col) && Number.isInteger(cell?.row)
      && cell.col >= 0 && cell.col < this.columns
      && cell.row >= 0 && cell.row < this.rows;
  }

  _cellBounds(cell) {
    const minX = this.bounds.minX + cell.col * this.cellSize;
    const minZ = this.bounds.minZ + cell.row * this.cellSize;
    return {
      minX,
      maxX: Math.min(minX + this.cellSize, this.bounds.maxX),
      minZ,
      maxZ: Math.min(minZ + this.cellSize, this.bounds.maxZ),
    };
  }

  worldToCell(point) {
    validatePoint(point, 'point');
    if (point.x < this.bounds.minX || point.x > this.bounds.maxX
      || point.z < this.bounds.minZ || point.z > this.bounds.maxZ) {
      return null;
    }
    return {
      col: Math.min(this.columns - 1, Math.floor((point.x - this.bounds.minX) / this.cellSize)),
      row: Math.min(this.rows - 1, Math.floor((point.z - this.bounds.minZ) / this.cellSize)),
    };
  }

  cellToWorld(cell) {
    if (!this._inBounds(cell)) return null;
    const cellBounds = this._cellBounds(cell);
    return {
      x: (cellBounds.minX + cellBounds.maxX) / 2,
      z: (cellBounds.minZ + cellBounds.maxZ) / 2,
    };
  }

  isWalkable(cell) {
    return this._inBounds(cell) && this.occupied[this._index(cell.col, cell.row)] === 0;
  }

  _nearestWalkableCell(start) {
    if (this.isWalkable(start)) return start;

    const seen = new Uint8Array(this.occupied.length);
    const queue = [start];
    seen[this._index(start.col, start.row)] = 1;

    for (let cursor = 0; cursor < queue.length; cursor++) {
      const current = queue[cursor];
      for (const direction of CARDINAL_DIRECTIONS) {
        const next = { col: current.col + direction.col, row: current.row + direction.row };
        if (!this._inBounds(next)) continue;
        const index = this._index(next.col, next.row);
        if (seen[index]) continue;
        if (this.isWalkable(next)) return next;
        seen[index] = 1;
        queue.push(next);
      }
    }
    return null;
  }

  nearestWalkable(point) {
    const cell = this.worldToCell(point);
    return cell ? this._nearestWalkableCell(cell) : null;
  }

  findPath(startPoint, goalPoint) {
    validatePoint(startPoint, 'start');
    validatePoint(goalPoint, 'goal');
    const start = this.nearestWalkable(startPoint);
    const goal = this.nearestWalkable(goalPoint);
    if (!start || !goal) return [];

    const startIndex = this._index(start.col, start.row);
    const goalIndex = this._index(goal.col, goal.row);
    const size = this.occupied.length;
    const gScore = new Float64Array(size);
    const cameFrom = new Int32Array(size);
    const closed = new Uint8Array(size);
    const inOpen = new Uint8Array(size);
    gScore.fill(Infinity);
    cameFrom.fill(-1);
    gScore[startIndex] = 0;

    const heuristic = (index) => {
      const cell = this._cell(index);
      return Math.abs(cell.col - goal.col) + Math.abs(cell.row - goal.row);
    };

    const open = [startIndex];
    const insertionOrder = new Int32Array(size);
    insertionOrder.fill(-1);
    insertionOrder[startIndex] = 0;
    let nextInsertionOrder = 1;
    inOpen[startIndex] = 1;

    while (open.length > 0) {
      let bestAt = 0;
      for (let i = 1; i < open.length; i++) {
        const candidate = open[i];
        const best = open[bestAt];
        const candidateH = heuristic(candidate);
        const bestH = heuristic(best);
        const candidateF = gScore[candidate] + candidateH;
        const bestF = gScore[best] + bestH;
        if (candidateF < bestF
          || (candidateF === bestF && candidateH < bestH)
          || (candidateF === bestF && candidateH === bestH
            && insertionOrder[candidate] < insertionOrder[best])) {
          bestAt = i;
        }
      }

      const currentIndex = open.splice(bestAt, 1)[0];
      inOpen[currentIndex] = 0;
      if (closed[currentIndex]) continue;
      if (currentIndex === goalIndex) {
        const reversed = [];
        let index = currentIndex;
        while (index !== -1) {
          reversed.push(this.cellToWorld(this._cell(index)));
          if (index === startIndex) break;
          index = cameFrom[index];
        }
        return index === startIndex ? reversed.reverse() : [];
      }

      closed[currentIndex] = 1;
      const current = this._cell(currentIndex);
      for (const direction of CARDINAL_DIRECTIONS) {
        const neighbor = {
          col: current.col + direction.col,
          row: current.row + direction.row,
        };
        if (!this.isWalkable(neighbor)) continue;
        const neighborIndex = this._index(neighbor.col, neighbor.row);
        if (closed[neighborIndex]) continue;
        const tentative = gScore[currentIndex] + 1;
        if (tentative >= gScore[neighborIndex]) continue;
        cameFrom[neighborIndex] = currentIndex;
        gScore[neighborIndex] = tentative;
        if (!inOpen[neighborIndex]) {
          open.push(neighborIndex);
          inOpen[neighborIndex] = 1;
          insertionOrder[neighborIndex] = nextInsertionOrder++;
        }
      }
    }

    return [];
  }
}

function clampX(currentX, attemptedX, z, blocker, clearance) {
  const minX = blocker.minX - clearance;
  const maxX = blocker.maxX + clearance;
  const minZ = blocker.minZ - clearance;
  const maxZ = blocker.maxZ + clearance;
  if (z <= minZ || z >= maxZ || attemptedX === currentX) return attemptedX;
  if (attemptedX > currentX && currentX <= minX && attemptedX > minX) return Math.min(attemptedX, minX);
  if (attemptedX < currentX && currentX >= maxX && attemptedX < maxX) return Math.max(attemptedX, maxX);
  if (attemptedX > minX && attemptedX < maxX) return currentX;
  return attemptedX;
}

function clampZ(currentZ, attemptedZ, x, blocker, clearance) {
  const minX = blocker.minX - clearance;
  const maxX = blocker.maxX + clearance;
  const minZ = blocker.minZ - clearance;
  const maxZ = blocker.maxZ + clearance;
  if (x <= minX || x >= maxX || attemptedZ === currentZ) return attemptedZ;
  if (attemptedZ > currentZ && currentZ <= minZ && attemptedZ > minZ) return Math.min(attemptedZ, minZ);
  if (attemptedZ < currentZ && currentZ >= maxZ && attemptedZ < maxZ) return Math.max(attemptedZ, maxZ);
  if (attemptedZ > minZ && attemptedZ < maxZ) return currentZ;
  return attemptedZ;
}

export function moveCircleAgainstAabbs(position, delta, blockers = [], {
  radius = DEFAULT_RADIUS,
  epsilon = DEFAULT_EPSILON,
  maxSubstep = 0.1,
} = {}) {
  validatePoint(position, 'position');
  validatePoint(delta, 'delta');
  if (!Array.isArray(blockers)) throw new TypeError('blockers must be an array');
  const clearance = requireNonNegative(radius, 'radius') + requireNonNegative(epsilon, 'epsilon');
  requireFinite(clearance, 'clearance');
  requirePositive(maxSubstep, 'maxSubstep');
  for (let i = 0; i < blockers.length; i++) {
    const blocker = blockers[i];
    validateAabb(blocker, `blockers[${i}]`);
    for (const [name, value] of Object.entries({
      minX: blocker.minX - clearance,
      maxX: blocker.maxX + clearance,
      minZ: blocker.minZ - clearance,
      maxZ: blocker.maxZ + clearance,
    })) requireFinite(value, `expanded blocker ${i}.${name}`);
  }

  const result = { x: position.x, z: position.z };
  if (blockers.some((blocker) => pointStrictlyInsideExpanded(result, blocker, clearance))) {
    return result;
  }

  const distance = Math.max(Math.abs(delta.x), Math.abs(delta.z));
  if (distance === 0) return result;
  const substeps = Math.ceil(distance / maxSubstep);
  if (substeps > MAX_MOTION_SUBSTEPS) {
    throw new RangeError(`motion exceeds ${MAX_MOTION_SUBSTEPS} substeps`);
  }
  const stepX = delta.x / substeps;
  const stepZ = delta.z / substeps;
  requireFinite(stepX, 'stepX');
  requireFinite(stepZ, 'stepZ');

  for (let step = 0; step < substeps; step++) {
    let attemptedX = result.x + stepX;
    requireFinite(attemptedX, 'attemptedX');
    for (const blocker of blockers) attemptedX = clampX(result.x, attemptedX, result.z, blocker, clearance);
    requireFinite(attemptedX, 'resolvedX');
    result.x = attemptedX;

    let attemptedZ = result.z + stepZ;
    requireFinite(attemptedZ, 'attemptedZ');
    for (const blocker of blockers) attemptedZ = clampZ(result.z, attemptedZ, result.x, blocker, clearance);
    requireFinite(attemptedZ, 'resolvedZ');
    result.z = attemptedZ;
  }

  return result;
}
