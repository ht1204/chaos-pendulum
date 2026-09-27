import type { ThemeMode } from "@/lib/theme";

/** Options shared by every renderer; owned by the dashboard, pushed on change. */
export interface RendererOptions {
  trailLength: number;
  color: string;
  theme: ThemeMode;
  m1: number;
  m2: number;
}

/**
 * Phase 5/6 — renderer contract (AGENTS.v2.md architecture decision).
 * Every renderer MUST implement dispose() so the 2D↔3D swap leaks nothing.
 */
export interface IRenderer {
  resize(width: number, height: number): void;
  /**
   * Consume one batched frame message. `frames` holds
   * steps × pendulumCount × STRIDE floats — renderers must iterate ALL
   * steps so trails record every physics point (resolved finding #1).
   */
  render(frames: Float32Array, pendulumCount: number, steps: number): void;
  setOptions(options: RendererOptions): void;
  dispose(): void;
}
