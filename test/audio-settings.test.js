import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUDIO_SETTINGS_KEY,
  DEFAULT_AUDIO_SETTINGS,
  loadAudioSettings,
  normalizeAudioSettings,
  saveAudioSettings,
} from '../src/systems/AudioSettings.js';

test('audio settings normalize every semantic category and mute', () => {
  assert.deepEqual(normalizeAudioSettings({
    master: 2,
    ambience: -1,
    music: 0.25,
    effects: '0.5',
    voice: null,
    jumpscare: 0,
    muted: true,
  }), {
    version: 1,
    master: 1,
    ambience: 0,
    music: 0.25,
    effects: 0.5,
    voice: DEFAULT_AUDIO_SETTINGS.voice,
    jumpscare: 0,
    muted: true,
  });
});

test('missing, corrupt, and unavailable storage falls back safely', () => {
  assert.deepEqual(loadAudioSettings({ getItem: () => null }), DEFAULT_AUDIO_SETTINGS);
  assert.deepEqual(loadAudioSettings({ getItem: () => '{broken' }), DEFAULT_AUDIO_SETTINGS);
  assert.deepEqual(loadAudioSettings({ getItem: () => { throw new Error('denied'); } }), DEFAULT_AUDIO_SETTINGS);
});

test('settings persist in one versioned record and tolerate write failure', () => {
  const records = new Map();
  const storage = {
    getItem: (key) => records.get(key) ?? null,
    setItem: (key, value) => records.set(key, value),
  };
  assert.equal(saveAudioSettings({ master: 0.4, muted: true }, storage), true);
  const raw = JSON.parse(records.get(AUDIO_SETTINGS_KEY));
  assert.equal(raw.version, 1);
  assert.equal(raw.master, 0.4);
  assert.equal(raw.muted, true);
  assert.deepEqual(loadAudioSettings(storage), normalizeAudioSettings(raw));
  assert.equal(saveAudioSettings({}, { setItem: () => { throw new Error('full'); } }), false);
});
