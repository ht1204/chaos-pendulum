import { describe, expect, it } from "vitest";
import { nextZoom, ZOOM_MAX, ZOOM_MIN } from "./Canvas2DRenderer";

describe("nextZoom (2D wheel zoom)", () => {
  it("zooms in on wheel-up (negative deltaY) and out on wheel-down", () => {
    expect(nextZoom(1, -100)).toBeGreaterThan(1);
    expect(nextZoom(1, 100)).toBeLessThan(1);
  });

  it("is exponential — symmetric and scale-independent", () => {
    const up = nextZoom(1, -100) / 1;
    const down = nextZoom(1, 100) / 1;
    expect(up).toBeCloseTo(1 / down, 10);
    // Same delta from a different starting zoom applies the same factor.
    expect(nextZoom(2, -100) / 2).toBeCloseTo(up, 10);
  });

  it("treats zero delta as identity", () => {
    expect(nextZoom(1.5, 0)).toBe(1.5);
  });

  it("clamps to [ZOOM_MIN, ZOOM_MAX]", () => {
    expect(nextZoom(3.9, -10000)).toBe(ZOOM_MAX);
    expect(nextZoom(0.3, 10000)).toBe(ZOOM_MIN);
    expect(ZOOM_MIN).toBeLessThan(1);
    expect(ZOOM_MAX).toBeGreaterThan(1);
  });
});
