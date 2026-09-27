/**
 * Phase 5 — circular trail buffer backed by a Float32Array.
 * Replaces the original's `trail.push(...)` + `trail.shift()` pair
 * (index.html:601–602), which allocates and shifts an O(n) array on every
 * physics step. Fixed-size ring: zero allocations after warmup.
 */
export class TrailBuffer {
  private data: Float32Array;
  /** Index where the NEXT point will be written. */
  private head = 0;
  private _count = 0;
  private _capacity: number;

  constructor(capacity: number) {
    this._capacity = Math.max(0, Math.floor(capacity));
    this.data = new Float32Array(this._capacity * 2);
  }

  get capacity(): number {
    return this._capacity;
  }

  get count(): number {
    return this._count;
  }

  push(x: number, y: number): void {
    if (this._capacity === 0) return;
    const idx = this.head * 2;
    this.data[idx] = x;
    this.data[idx + 1] = y;
    this.head = (this.head + 1) % this._capacity;
    if (this._count < this._capacity) this._count++;
  }

  /** Point i, where 0 is the oldest retained point. */
  get(i: number): readonly [number, number] {
    if (i < 0 || i >= this._count) {
      throw new RangeError(`TrailBuffer.get(${i}) out of range (count=${this._count})`);
    }
    const idx =
      (((this.head - this._count + i) % this._capacity) + this._capacity) %
      this._capacity;
    return [this.data[idx * 2], this.data[idx * 2 + 1]] as const;
  }

  /** Resize, preserving the newest points (original trims via shift, index.html:792). */
  setCapacity(capacity: number): void {
    const nextCapacity = Math.max(0, Math.floor(capacity));
    if (nextCapacity === this._capacity) return;

    const keep = Math.min(this._count, nextCapacity);
    const next = new Float32Array(nextCapacity * 2);
    for (let i = 0; i < keep; i++) {
      const [x, y] = this.get(this._count - keep + i);
      next[i * 2] = x;
      next[i * 2 + 1] = y;
    }
    this.data = next;
    this._capacity = nextCapacity;
    this._count = keep;
    this.head = keep % nextCapacity;
  }

  clear(): void {
    this.head = 0;
    this._count = 0;
  }
}
