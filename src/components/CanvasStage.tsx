"use client";

import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import type { PhysicsApi } from "@/hooks/usePhysics";
import type { IRenderer, RendererOptions } from "@/renderers/IRenderer";
import { Canvas2DRenderer } from "@/renderers/Canvas2DRenderer";
import { createThreeRenderer } from "@/renderers/ThreeRenderer";

export type RendererMode = "2d" | "3d";

const Wrap = styled.div`
  position: relative;
  background: var(--bg);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 0;
`;

const StyledCanvas = styled.canvas`
  display: block;
  max-width: 100%;
  max-height: 100%;
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 12px;
  color: var(--text-dim);
  background: color-mix(in srgb, var(--bg) 75%, transparent);
  pointer-events: none;
`;

const CANVAS_HINTS: Record<RendererMode, string> = {
  "2d": "Scroll to zoom · double-click to reset",
  "3d": "Drag to orbit · scroll to zoom",
};

interface CanvasStageProps {
  physics: PhysicsApi;
  mode: RendererMode;
  options: RendererOptions;
}

/**
 * Phase 7 — owns the renderer lifecycle.
 *
 * - One <canvas key={mode}> per renderer mode (a canvas that has hosted a
 *   WebGL context can never return a 2D context, so elements are swapped).
 * - 3D is created through the async factory; a cancelled mount disposes the
 *   half-built renderer immediately.
 * - The rAF loop sends one `tick` per frame; the worker replies with a
 *   batched `frames` message that is forwarded to the active renderer.
 * - Unmount always calls renderer.dispose() — the zero-leak swap guarantee.
 */
export function CanvasStage({ physics, mode, options }: CanvasStageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<IRenderer | null>(null);
  const optionsRef = useRef(options);
  const sizeRef = useRef(0);
  const [overlay, setOverlay] = useState<string | null>(null);

  optionsRef.current = options;

  // Renderer lifecycle — recreated when the mode flips.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;

    const attach = (renderer: IRenderer) => {
      rendererRef.current = renderer;
      renderer.setOptions(optionsRef.current);
      if (sizeRef.current > 0) renderer.resize(sizeRef.current, sizeRef.current);
    };

    if (mode === "2d") {
      setOverlay(null);
      try {
        attach(new Canvas2DRenderer(canvas, optionsRef.current));
      } catch {
        setOverlay("2D context unavailable");
      }
    } else {
      setOverlay("Loading 3D renderer…");
      createThreeRenderer(canvas, optionsRef.current)
        .then((renderer) => {
          if (cancelled) {
            renderer.dispose();
            return;
          }
          setOverlay(null);
          attach(renderer);
        })
        .catch(() => {
          if (!cancelled) setOverlay("WebGL unavailable in this browser");
        });
    }

    return () => {
      cancelled = true;
      rendererRef.current?.dispose();
      rendererRef.current = null;
    };
  }, [mode]);

  // Push option changes into the active renderer.
  useEffect(() => {
    rendererRef.current?.setOptions(options);
  }, [options]);

  // Forward worker batches to the renderer.
  useEffect(() => {
    return physics.subscribe((msg) => {
      rendererRef.current?.render(msg.buffer, msg.pendulums, msg.steps);
    });
  }, [physics]);

  // Drive the worker from requestAnimationFrame (parity with the original loop).
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      physics.tick();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [physics]);

  // Resize: renderer resizes immediately; the worker is debounced because
  // resizing re-initializes the world (original resize() parity).
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let workerTimer: number | undefined;

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      const size = Math.floor(Math.min(rect.width, rect.height, 900));
      if (size <= 0) return;
      sizeRef.current = size;
      rendererRef.current?.resize(size, size);
      window.clearTimeout(workerTimer);
      workerTimer = window.setTimeout(() => physics.setSize(size), 150);
    });

    observer.observe(wrap);
    return () => {
      observer.disconnect();
      window.clearTimeout(workerTimer);
    };
  }, [physics]);

  return (
    <Wrap ref={wrapRef}>
      <StyledCanvas
        key={mode}
        ref={canvasRef}
        role="img"
        aria-label="Pendulum simulation viewport"
        title={CANVAS_HINTS[mode]}
      />
      {overlay ? <Overlay>{overlay}</Overlay> : null}
    </Wrap>
  );
}
