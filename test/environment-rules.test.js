import test from 'node:test';
import assert from 'node:assert/strict';
import { BRIDGEMIND_ROOM_DETAILS, ROOM_TONE_FREQUENCIES } from '../src/systems/EnvironmentRules.js';

test('every major room has a unique focal sign, terminal detail, and room tone', () => {
  const expected = ['living', 'foyer', 'dining', 'hallway', 'kitchen', 'bedroom', 'study'];
  assert.deepEqual(Object.keys(BRIDGEMIND_ROOM_DETAILS).sort(), expected.slice().sort());
  assert.deepEqual(Object.keys(ROOM_TONE_FREQUENCIES).sort(), expected.slice().sort());
  const titles = new Set();
  for (const room of expected) {
    const detail = BRIDGEMIND_ROOM_DETAILS[room];
    assert.ok(detail.sign.title.startsWith('BRIDGEMIND'));
    assert.ok(detail.sign.subtitle.length > 5);
    titles.add(detail.sign.title);
    for (const point of [detail.sign.position, detail.terminal.position]) {
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z));
    }
    assert.equal(detail.collide, false);
    assert.ok(ROOM_TONE_FREQUENCIES[room] >= 36 && ROOM_TONE_FREQUENCIES[room] <= 92);
  }
  assert.equal(titles.size, expected.length);
});
