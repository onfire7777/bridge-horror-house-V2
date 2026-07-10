export class CaptureSequence {
  constructor({
    duration = 1800,
    setTimer = setTimeout,
    clearTimer = clearTimeout,
    onStart = () => null,
    onFinish = () => {},
    onCancel = () => {},
  } = {}) {
    if (!Number.isFinite(duration) || duration < 0) throw new RangeError('duration must be non-negative');
    this.duration = duration;
    this.setTimer = setTimer;
    this.clearTimer = clearTimer;
    this.onStart = onStart;
    this.onFinish = onFinish;
    this.onCancel = onCancel;
    this.active = false;
    this.generation = 0;
    this.timer = null;
    this.cleanup = null;
  }

  start(payload) {
    if (this.active) return false;
    this.active = true;
    const generation = ++this.generation;
    try {
      this.cleanup = this.onStart(payload) || null;
    } catch (error) {
      this.active = false;
      throw error;
    }
    this.timer = this.setTimer(() => this._finish(generation), this.duration);
    return true;
  }

  _release() {
    const cleanup = this.cleanup;
    this.cleanup = null;
    this.timer = null;
    this.active = false;
    cleanup?.();
  }

  _finish(generation) {
    if (!this.active || generation !== this.generation) return;
    this._release();
    this.onFinish();
  }

  cancel() {
    if (!this.active) return false;
    this.generation++;
    if (this.timer !== null) this.clearTimer(this.timer);
    this._release();
    this.onCancel();
    return true;
  }
}
