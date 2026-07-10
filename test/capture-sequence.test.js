import test from 'node:test';
import assert from 'node:assert/strict';
import { CaptureSequence } from '../src/systems/CaptureSequence.js';

test('capture starts once, finishes once, and releases cleanup', () => {
  const events = [];
  let scheduled;
  const sequence = new CaptureSequence({
    duration: 1500,
    setTimer: (callback) => { scheduled = callback; return 7; },
    clearTimer: () => events.push('clear'),
    onStart: () => { events.push('start'); return () => events.push('cleanup'); },
    onFinish: () => events.push('finish'),
    onCancel: () => events.push('cancel'),
  });
  assert.equal(sequence.start(), true);
  assert.equal(sequence.start(), false);
  scheduled();
  scheduled();
  assert.deepEqual(events, ['start', 'cleanup', 'finish']);
  assert.equal(sequence.active, false);
});

test('cancel invalidates a stale timer and permits a clean restart', () => {
  const events = [];
  let scheduled;
  const sequence = new CaptureSequence({
    setTimer: (callback) => { scheduled = callback; return 9; },
    clearTimer: (id) => events.push(`clear:${id}`),
    onStart: () => () => events.push('cleanup'),
    onFinish: () => events.push('finish'),
    onCancel: () => events.push('cancel'),
  });
  sequence.start();
  const stale = scheduled;
  assert.equal(sequence.cancel(), true);
  stale();
  assert.equal(sequence.start(), true);
  scheduled();
  assert.deepEqual(events, ['clear:9', 'cleanup', 'cancel', 'cleanup', 'finish']);
});

test('timer adapters are invoked without rebinding their receiver', () => {
  let scheduled;
  const sequence = new CaptureSequence({
    setTimer: function setTimer(callback) {
      assert.equal(this, undefined);
      scheduled = callback;
      return 1;
    },
    clearTimer: function clearTimer() { assert.equal(this, undefined); },
  });
  sequence.start();
  sequence.cancel();
  scheduled();
});
