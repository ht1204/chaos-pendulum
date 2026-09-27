import type { ThemeMode } from "@/lib/theme";

/** Options shared by every renderer; owned by the dashboard, pushed on change. */
export interface RendererOptions {
  trailLength: number;
  color: string;
  theme: ThemeMode;
  m1: number;
  m2: number;
}


export interface IRenderer {
  resize(width: number, height: number): void;
  render(frames: Float32Array, pendulumCount: number, steps: number): void;
  setOptions(options: RendererOptions): void;
  dispose(): void;
}
