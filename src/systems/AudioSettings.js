export const AUDIO_SETTINGS_KEY = 'bridgemind-horror.audio.v1';

export const DEFAULT_AUDIO_SETTINGS = Object.freeze({
  version: 1,
  master: 0.85,
  ambience: 0.72,
  music: 0.8,
  effects: 0.9,
  voice: 1,
  jumpscare: 0.8,
  muted: false,
});

const LEVEL_KEYS = Object.freeze(['master', 'ambience', 'music', 'effects', 'voice', 'jumpscare']);

function level(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : fallback;
}

export function normalizeAudioSettings(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const normalized = { version: 1 };
  for (const key of LEVEL_KEYS) normalized[key] = level(source[key], DEFAULT_AUDIO_SETTINGS[key]);
  normalized.muted = typeof source.muted === 'boolean' ? source.muted : DEFAULT_AUDIO_SETTINGS.muted;
  return normalized;
}

export function loadAudioSettings(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(AUDIO_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_AUDIO_SETTINGS };
    return normalizeAudioSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

export function saveAudioSettings(settings, storage = globalThis.localStorage) {
  try {
    storage?.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(normalizeAudioSettings(settings)));
    return Boolean(storage);
  } catch {
    return false;
  }
}

export const AUDIO_LEVEL_KEYS = LEVEL_KEYS;
