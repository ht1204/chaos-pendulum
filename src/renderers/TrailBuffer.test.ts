import { describe, expect, it } from "vitest";
import { TrailBuffer } from "@/renderers/TrailBuffer";

describe("TrailBuffer (Float32Array ring)", () => {
  it("returns points in insertion order before wrapping", () => {
    const b = new TrailBuffer(4);
    b.push(1, 1);
    b.push(2, 2);
    b.push(3, 3);
    expect(b.count).toBe(3);
    expect(b.get(0)).toEqual([1, 1]);
    expect(b.get(2)).toEqual([3, 3]);
  });

  it("wraps and drops the oldest point", () => {
    const b = new TrailBuffer(3);
    for (let i = 1; i <= 5; i++) b.push(i, -i);
    expect(b.count).toBe(3);
    expect(b.get(0)).toEqual([3, -3]);
    expect(b.get(2)).toEqual([5, -5]);
  });

  it("handles capacity 1", () => {
    const b = new TrailBuffer(1);
    b.push(1, 1);
    b.push(2, 2);
    expect(b.count).toBe(1);
    expect(b.get(0)).toEqual([2, 2]);
  });

  it("shrinking capacity keeps the newest points (trail slider parity)", () => {
    const b = new TrailBuffer(5);
    for (let i = 1; i <= 5; i++) b.push(i, i);
    b.setCapacity(2);
    expect(b.count).toBe(2);
    expect(b.get(0)).toEqual([4, 4]);
    expect(b.get(1)).toEqual([5, 5]);
    // continues from the retained tail
    b.push(6, 6);
    expect(b.count).toBe(2);
    expect(b.get(0)).toEqual([5, 5]);
    expect(b.get(1)).toEqual([6, 6]);
  });

  it("growing capacity preserves order", () => {
    const b = new TrailBuffer(2);
    b.push(1, 1);
    b.push(2, 2);
    b.setCapacity(5);
    expect(b.count).toBe(2);
    expect(b.get(0)).toEqual([1, 1]);
    expect(b.get(1)).toEqual([2, 2]);
    b.push(3, 3);
    expect(b.get(2)).toEqual([3, 3]);
  });

  it("clear resets state", () => {
    const b = new TrailBuffer(3);
    b.push(1, 1);
    b.clear();
    expect(b.count).toBe(0);
    expect(() => b.get(0)).toThrow(RangeError);
  });

  it("stores Float32 values", () => {
    const b = new TrailBuffer(2);
    b.push(0.1, 0.2);
    expect(b.get(0)[0]).toBe(Math.fround(0.1));
  });
});
