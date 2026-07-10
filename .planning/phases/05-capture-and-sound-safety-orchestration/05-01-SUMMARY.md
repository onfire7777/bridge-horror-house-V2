---
phase: 05-capture-and-sound-safety-orchestration
plan: 01
subsystem: capture
tags: [jumpscare, lifecycle, audio-safety, reduced-motion]
requires: [AUD-01, AUD-02, AUD-03]
provides: [atomic-capture, layered-jumpscare, full-viewport-matt]
affects: [phase-07-playtest]
tech-stack:
  added: []
  patterns: [owned-cancellable-sequence]
key-files:
  created: [src/systems/CaptureSequence.js, test/capture-sequence.test.js]
  modified: [src/Game.js, src/systems/AudioEngine.js, index.html]
requirements-completed: [SCARE-01, SCARE-02, SCARE-03]
completed: 2026-07-10
---

# Phase 5 Summary

Matt now fills the viewport while a ducked, distorted, compressor-limited voice/impact/noise stack fires exactly once and always cleans up. Commits: `5fee18e`, `065e0ac`, `f6be565`.
