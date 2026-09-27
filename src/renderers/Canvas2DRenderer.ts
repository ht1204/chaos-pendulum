/**
 * Phase 5 — Canvas 2D renderer.
 * Faithful port of drawPendulum/render (index.html:626–717): background
 * fill per theme, center crosshair, fading trails, ghost minimal rods,
 * main rods/pivot/bobs with mass-proportional radii.
 *
 * Performance notes (AGENTS.v2.md Phase 5 acceptance):
 *  - trails live in TrailBuffer (Float32Array ring) — no per-step allocations
 *  - rgba() strings are memoized per (color, quantized alpha) — bounded cache
 *  - ALL batched steps are consumed per message (resolved finding #1)
 */
import { STRIDE } from "@/physics/types";
import type { IRenderer, RendererOptions } from "./IRenderer";
import { TrailBuffer } from "./TrailBuffer";

const BG: Record<string, string> = { dark: "#0a0a0f", light: "#f0f0f8" };
const ROD: Record<string, string> = {
  dark: "rgba(200,200,220,0.6)",
  light: "rgba(60,60,80,0.5)",
};
const CROSSHAIR: Record<string, string> = {
  dark: "rgba(255,255,255,0.04)",
  light: "rgba(0,0,0,0.06)",
};

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

/** 2D wheel-zoom range (view transform only — physics are unaffected). */
export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 4;

/**
 * Exponential zoom step from a wheel delta: symmetric in/out, independent
 * of the current zoom level. Clamped to [ZOOM_MIN, ZOOM_MAX].
 */
export function nextZoom(current: number, deltaY: number): number {
  const factor = Math.exp(-deltaY * 0.0015);
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, current * factor));
}

export class Canvas2DRenderer implements IRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly canvas: HTMLCanvasElement;
  private size = 0;
  private dpr = 1;
  private zoom = 1;
  private trails: TrailBuffer[] = [];
  private pendulumCount = 0;
  /** Last known tip positions per pendulum: [x1, y1, x2, y2]. */
  private last: Float64Array[] = [];
  private options: RendererOptions;
  private readonly rgbCache = new Map<string, string>();
  private readonly styleCache = new Map<string, string>();

  private readonly handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    this.setZoom(nextZoom(this.zoom, event.deltaY));
  };

  private readonly handleDblClick = () => {
    this.setZoom(1);
  };

  constructor(canvas: HTMLCanvasElement, options: RendererOptions) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas2DRenderer: 2D context unavailable");
    this.ctx = ctx;
    this.options = options;
    // Wheel zoom (2D counterpart of OrbitControls' scroll zoom).
    // passive:false is required for preventDefault() to stop page scroll.
    canvas.addEventListener("wheel", this.handleWheel, { passive: false });
    canvas.addEventListener("dblclick", this.handleDblClick);
    this.canvas.dataset.zoom = "1.00";
  }

  resize(width: number, height: number): void {
    const size = Math.min(width, height);
    const dpr = Math.min(
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
      2
    );
    this.size = size;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.floor(size * dpr));
    this.canvas.height = Math.max(1, Math.floor(size * dpr));
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    this.redraw();
  }

  setOptions(options: RendererOptions): void {
    const trailChanged = options.trailLength !== this.options.trailLength;
    const colorChanged = options.color !== this.options.color;
    this.options = options;
    if (colorChanged) this.styleCache.clear();
    if (trailChanged) {
      for (const trail of this.trails) trail.setCapacity(options.trailLength);
    }
    this.redraw();
  }

  render(frames: Float32Array, pendulumCount: number, steps: number): void {
    if (pendulumCount !== this.pendulumCount) {
      this.pendulumCount = pendulumCount;
      this.trails = Array.from(
        { length: pendulumCount },
        () => new TrailBuffer(this.options.trailLength)
      );
      this.last = Array.from(
        { length: pendulumCount },
        () => new Float64Array(4)
      );
    }

    // Consume EVERY step of the batch (resolved finding #1) — this is what
    // keeps trails complete when speed > 1.
    for (let s = 0; s < steps; s++) {
      for (let p = 0; p < pendulumCount; p++) {
        const base = (s * pendulumCount + p) * STRIDE;
        this.trails[p].push(frames[base + 6], frames[base + 7]);
        const last = this.last[p];
        last[0] = frames[base + 4];
        last[1] = frames[base + 5];
        last[2] = frames[base + 6];
        last[3] = frames[base + 7];
      }
    }

    this.redraw();
  }

  dispose(): void {
    this.canvas.removeEventListener("wheel", this.handleWheel);
    this.canvas.removeEventListener("dblclick", this.handleDblClick);
    delete this.canvas.dataset.zoom;
    this.trails = [];
    this.last = [];
    this.pendulumCount = 0;
    this.rgbCache.clear();
    this.styleCache.clear();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** View zoom — scales the scene around the canvas center. */
  private setZoom(zoom: number): void {
    this.zoom = zoom;
    this.canvas.dataset.zoom = zoom.toFixed(2);
    this.redraw();
  }

  private rgba(color: string, alpha: number): string {
    let rgb = this.rgbCache.get(color);
    if (rgb === undefined) {
      rgb = hexToRgb(color);
      this.rgbCache.set(color, rgb);
    }
    // Quantize alpha to 1/256 so the memo stays bounded across trail fades.
    const q = Math.max(0, Math.min(255, Math.round(alpha * 256)));
    const key = `${rgb}|${q}`;
    let style = this.styleCache.get(key);
    if (style === undefined) {
      style = `rgba(${rgb},${(q / 256).toFixed(4)})`;
      this.styleCache.set(key, style);
    }
    return style;
  }

  private redraw(): void {
    const { ctx, size } = this;
    if (size <= 0) return;

    // Background covers the full canvas regardless of zoom (identity dpr).
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = BG[this.options.theme];
    ctx.fillRect(0, 0, size, size);

    // Scene transform: dpr × zoom, anchored at the canvas center so the
    // pivot stays fixed while zooming (mirrors OrbitControls' target).
    const cx = size / 2;
    const cy = size / 2;
    const z = this.zoom;
    ctx.setTransform(
      this.dpr * z,
      0,
      0,
      this.dpr * z,
      this.dpr * cx * (1 - z),
      this.dpr * cy * (1 - z)
    );

    // Subtle crosshair at center (index.html:710–714)
    ctx.strokeStyle = CROSSHAIR[this.options.theme];
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy);
    ctx.lineTo(cx + 20, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 20);
    ctx.lineTo(cx, cy + 20);
    ctx.stroke();

    const total = this.pendulumCount;
    for (let idx = 0; idx < total; idx++) {
      this.drawPendulum(idx, total);
    }
  }

  private drawPendulum(idx: number, total: number): void {
    const { ctx } = this;
    const color = this.options.color;
    const isMain = idx === 0 || total === 1;
    const ghostAlpha = total > 1 ? 0.25 + 0.6 * (idx / (total - 1)) : 1;

    const trail = this.trails[idx];
    const last = this.last[idx];
    if (!trail || !last) return;

    // Trail — alpha ramps with t² like the original (index.html:644–656)
    if (trail.count > 1) {
      const count = trail.count;
      ctx.lineCap = "round";
      ctx.lineWidth = isMain ? 1.5 : 1;
      let [px, py] = trail.get(0);
      for (let i = 1; i < count; i++) {
        const [x, y] = trail.get(i);
        const t = i / count;
        ctx.strokeStyle = this.rgba(color, t * t * ghostAlpha);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
        px = x;
        py = y;
      }
    }

    const cx = this.size / 2;
    const cy = this.size / 2;
    const x1 = last[0];
    const y1 = last[1];
    const x2 = last[2];
    const y2 = last[3];

    if (!isMain && total > 1) {
      // Ghost: minimal rods only (index.html:658–665)
      ctx.strokeStyle = this.rgba(color, ghostAlpha * 0.3);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      return;
    }

    // Rods (index.html:667–676)
    const rodColor = ROD[this.options.theme];
    ctx.strokeStyle = rodColor;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Pivot (index.html:678–680)
    ctx.fillStyle = rodColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    // Mass 1 (index.html:682–689) — radius parity: 4 + √m·0.8
    const r1 = 4 + Math.sqrt(this.options.m1) * 0.8;
    ctx.beginPath();
    ctx.arc(x1, y1, r1, 0, Math.PI * 2);
    ctx.fillStyle = this.rgba(color, 0.85);
    ctx.fill();
    ctx.strokeStyle = this.rgba(color, 0.4);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Mass 2 (index.html:691–698)
    const r2 = 4 + Math.sqrt(this.options.m2) * 0.8;
    ctx.beginPath();
    ctx.arc(x2, y2, r2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}
