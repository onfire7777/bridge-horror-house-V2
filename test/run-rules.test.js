import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KEY_CANDIDATES,
  batteryBand,
  drainBattery,
  huntTuning,
  refillBattery,
  selectKeyPlacements,
} from '../src/systems/RunRules.js';

test('hunt tiers start after one key and escalate across the run', () => {
  const quiet = huntTuning(0, 0);
  const first = huntTuning(1, 0);
  const second = huntTuning(2, 0);
  const finale = huntTuning(3, 0);
  assert.equal(quiet.stalkEnabled, false);
  assert.equal(first.stalkEnabled, true);
  assert.ok(second.stalkDelayMin < first.stalkDelayMin);
  assert.ok(second.stalkSpeed > first.stalkSpeed);
  assert.ok(finale.chaseSpeed >= 3.8);
  assert.ok(finale.burnTime >= 2.7);
  assert.ok(huntTuning(3, 4).reformDelay < finale.reformDelay);
  assert.ok(huntTuning(3, 99).reformDelay >= 2.5);
});

test('battery drain and refill remain finite and clamped', () => {
  assert.equal(drainBattery(50, 10, { flashlightOn: false, burning: true }), 50);
  assert.equal(drainBattery(50, 10, { flashlightOn: true, burning: false }), 42);
  assert.equal(drainBattery(50, 10, { flashlightOn: true, burning: true }), 0);
  assert.equal(drainBattery(1, 100, { flashlightOn: true, burning: true }), 0);
  assert.equal(refillBattery(85, 32), 100);
  assert.equal(refillBattery(0, 32), 32);
});

test('battery bands distinguish low, critical, and empty states', () => {
  assert.equal(batteryBand(100), 'normal');
  assert.equal(batteryBand(29.9), 'low');
  assert.equal(batteryBand(11.9), 'critical');
  assert.equal(batteryBand(0), 'empty');
});

test('seeded key selection is reproducible and never repeats a slot index', () => {
  const first = selectKeyPlacements(KEY_CANDIDATES, 'bridge-run-42');
  const again = selectKeyPlacements(KEY_CANDIDATES, 'bridge-run-42');
  assert.deepEqual(first, again);
  assert.equal(new Set(Object.values(first).map((candidate) => candidate.index)).size, 3);

  const layouts = new Set();
  for (let seed = 0; seed < 20; seed++) {
    const layout = selectKeyPlacements(KEY_CANDIDATES, seed);
    layouts.add(Object.values(layout).map((candidate) => candidate.index).join(','));
  }
  assert.ok(layouts.size > 1);
});

test('all 27 room combinations expose a nearby interaction stance', () => {
  let combinations = 0;
  for (const kitchen of KEY_CANDIDATES.kitchen) {
    for (const study of KEY_CANDIDATES.study) {
      for (const bedroom of KEY_CANDIDATES.bedroom) {
        for (const candidate of [kitchen, study, bedroom]) {
          const distance = Math.hypot(
            candidate.position.x - candidate.stance.x,
            candidate.position.z - candidate.stance.z,
          );
          assert.ok(distance <= 1.6, `${candidate.id} needs a reachable interaction stance`);
          assert.ok(candidate.position.y >= 0.1 && candidate.position.y <= 1.2);
        }
        combinations++;
      }
    }
  }
  assert.equal(combinations, 27);
});
