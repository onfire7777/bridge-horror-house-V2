const MAX_BATTERY = 100;
const BASE_DRAIN_PER_SECOND = 0.8;
const BURN_DRAIN_PER_SECOND = 7;
const ROOM_ORDER = Object.freeze(['kitchen', 'study', 'bedroom']);

function finite(value, name) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}

function nonNegative(value, name) {
  finite(value, name);
  if (value < 0) throw new RangeError(`${name} must be non-negative`);
  return value;
}

function clampBattery(value) {
  return Math.min(MAX_BATTERY, Math.max(0, finite(value, 'battery')));
}

function candidate(id, index, x, y, z, stanceX, stanceZ) {
  return Object.freeze({
    id,
    index,
    position: Object.freeze({ x, y, z }),
    stance: Object.freeze({ x: stanceX, z: stanceZ }),
  });
}

export const KEY_CANDIDATES = Object.freeze({
  kitchen: Object.freeze([
    candidate('kitchen-0', 0, 8.9, 1.03, -7.3, 8.0, -6.4),
    candidate('kitchen-1', 1, 5.6, 0.86, -3.6, 5.0, -2.6),
    candidate('kitchen-2', 2, 9.5, 1.03, -5.6, 8.4, -5.2),
  ]),
  study: Object.freeze([
    candidate('study-0', 0, -6.7, 0.86, -6.2, -6.2, -5.2),
    candidate('study-1', 1, -7.1, 1.03, -5.2, -6.2, -4.4),
    candidate('study-2', 2, -8.9, 0.1, -7.4, -8.0, -6.7),
  ]),
  bedroom: Object.freeze([
    candidate('bedroom-0', 0, -3.45, 1.18, -7.25, -2.5, -6.5),
    candidate('bedroom-1', 1, 0.9, 0.68, -7.5, 0.2, -6.5),
    candidate('bedroom-2', 2, -0.6, 0.63, -6.2, 0.2, -5.3),
  ]),
});

export function huntTuning(keysFound, banishCount = 0) {
  nonNegative(keysFound, 'keysFound');
  nonNegative(banishCount, 'banishCount');
  const tier = Math.min(3, Math.floor(keysFound));
  const tiers = [
    { stalkEnabled: false, stalkDelayMin: Infinity, stalkDelayRange: 0, stalkLifespan: 0, stalkSpeed: 0 },
    { stalkEnabled: true, stalkDelayMin: 6, stalkDelayRange: 5, stalkLifespan: 22, stalkSpeed: 1.45 },
    { stalkEnabled: true, stalkDelayMin: 3.5, stalkDelayRange: 4, stalkLifespan: 28, stalkSpeed: 1.7 },
    { stalkEnabled: false, stalkDelayMin: 0, stalkDelayRange: 0, stalkLifespan: 0, stalkSpeed: 0 },
  ];
  const reformDelay = Math.max(2.5, 5.5 - Math.min(6, Math.floor(banishCount)) * 0.5);
  return Object.freeze({
    tier,
    ...tiers[tier],
    chaseSpeed: 3.9,
    burnTime: tier >= 3 ? 2.8 : 1.85,
    reformDelay,
  });
}

export function drainBattery(battery, dt, {
  flashlightOn = true,
  burning = false,
  baseDrain = BASE_DRAIN_PER_SECOND,
  burnDrain = BURN_DRAIN_PER_SECOND,
} = {}) {
  const current = clampBattery(battery);
  nonNegative(dt, 'dt');
  nonNegative(baseDrain, 'baseDrain');
  nonNegative(burnDrain, 'burnDrain');
  if (!flashlightOn || current === 0) return current;
  const rate = baseDrain + (burning ? burnDrain : 0);
  return clampBattery(current - dt * rate);
}

export function refillBattery(battery, amount) {
  return clampBattery(clampBattery(battery) + nonNegative(amount, 'amount'));
}

export function batteryBand(battery) {
  const value = clampBattery(battery);
  if (value === 0) return 'empty';
  if (value < 12) return 'critical';
  if (value < 30) return 'low';
  return 'normal';
}

function hashSeed(seed) {
  const text = String(seed);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let state = hashSeed(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function selectKeyPlacements(candidates, seed) {
  if (!candidates || typeof candidates !== 'object') throw new TypeError('candidates must be an object');
  const random = seededRandom(seed);
  const indices = [0, 1, 2];
  for (let index = indices.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [indices[index], indices[swap]] = [indices[swap], indices[index]];
  }

  const placements = {};
  ROOM_ORDER.forEach((room, roomIndex) => {
    const roomCandidates = candidates[room];
    if (!Array.isArray(roomCandidates) || roomCandidates.length < indices.length) {
      throw new RangeError(`${room} must define at least ${indices.length} candidates`);
    }
    placements[room] = roomCandidates[indices[roomIndex]];
  });
  return placements;
}

export const BATTERY_RULES = Object.freeze({
  maximum: MAX_BATTERY,
  baseDrainPerSecond: BASE_DRAIN_PER_SECOND,
  burnDrainPerSecond: BURN_DRAIN_PER_SECOND,
  refillAmount: 32,
  authoredPickups: 4,
});
