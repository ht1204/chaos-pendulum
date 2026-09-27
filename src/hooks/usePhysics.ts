"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  STRIDE,
  type FramesMessage,
  type PhysicsParams,
  type WorkerCommand,
  type WorkerMessage,
} from "@/physics/types";

export interface PhysicsStats {
  fps: number;
  totalSteps: number;
  readout: { a1: number; a2: number; a1v: number; a2v: number } | null;
}

/**
 * Stable command surface — the object identity NEVER changes, so effects
 * keyed on it (worker boot, rAF loop, subscriptions) run exactly once.
 */
export interface PhysicsApi {
  init: (params: PhysicsParams, size: number) => void;
  setParams: (patch: Partial<PhysicsParams>) => void;
  reset: () => void;
  setRunning: (running: boolean) => void;
  setSize: (size: number) => void;
  /** Called once per animation frame by CanvasStage — drives the worker. */
  tick: () => void;
  subscribe: (listener: (msg: FramesMessage) => void) => () => void;
}

export interface UsePhysicsResult {
  api: PhysicsApi;
  stats: PhysicsStats;
}

/**
 * Worker orchestration hook.
 * The rAF loop lives in CanvasStage (display cadence, pauses when the tab
 * is hidden — parity with the original's requestAnimationFrame loop).
 * FPS counts received frame batches; readout throttling mirrors
 * index.html:758 (`frameCount % 3 === 0`).
 */
export function usePhysics(): UsePhysicsResult {
  const workerRef = useRef<Worker | null>(null);
  const subscribersRef = useRef(new Set<(msg: FramesMessage) => void>());
  const batchCountRef = useRef(0);

  const [stats, setStats] = useState<PhysicsStats>({
    fps: 0,
    totalSteps: 0,
    readout: null,
  });

  useEffect(() => {
    const worker = new Worker(
      new URL("../physics/worker.ts", import.meta.url)
    );
    const subscribers = subscribersRef.current;

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const msg = event.data;
      if (msg.type !== "frames") return;

      batchCountRef.current++;
      for (const listener of subscribers) listener(msg);

      if (msg.totalSteps % 3 === 0) {
        // Pendulum 0 of the LAST step in the batch.
        const base = (msg.steps - 1) * msg.pendulums * STRIDE;
        const nextReadout =
          msg.steps > 0
            ? {
                a1: msg.buffer[base],
                a2: msg.buffer[base + 1],
                a1v: msg.buffer[base + 2],
                a2v: msg.buffer[base + 3],
              }
            : null;
        setStats((prev) => ({
          ...prev,
          totalSteps: msg.totalSteps,
          readout: nextReadout ?? prev.readout,
        }));
      }
    };

    workerRef.current = worker;

    const fpsTimer = window.setInterval(() => {
      setStats((prev) => ({ ...prev, fps: batchCountRef.current }));
      batchCountRef.current = 0;
    }, 1000);

    return () => {
      window.clearInterval(fpsTimer);
      worker.terminate();
      workerRef.current = null;
      subscribers.clear();
    };
  }, []);

  const send = useCallback((command: WorkerCommand) => {
    workerRef.current?.postMessage(command);
  }, []);

  const init = useCallback(
    (params: PhysicsParams, size: number) => {
      send({ type: "init", params, size });
    },
    [send]
  );

  const setParams = useCallback(
    (patch: Partial<PhysicsParams>) => {
      send({ type: "setParams", patch });
    },
    [send]
  );

  const reset = useCallback(() => {
    send({ type: "reset" });
  }, [send]);

  const setRunning = useCallback(
    (running: boolean) => {
      send({ type: "setRunning", running });
    },
    [send]
  );

  const setSize = useCallback(
    (size: number) => {
      send({ type: "setSize", size });
    },
    [send]
  );

  const tick = useCallback(() => {
    send({ type: "tick" });
  }, [send]);

  const subscribe = useCallback((listener: (msg: FramesMessage) => void) => {
    subscribersRef.current.add(listener);
    return () => {
      subscribersRef.current.delete(listener);
    };
  }, []);

  // All members are useCallback-stable (refs only) → this object is stable
  // for the lifetime of the component.
  const api = useMemo<PhysicsApi>(
    () => ({
      init,
      setParams,
      reset,
      setRunning,
      setSize,
      tick,
      subscribe,
    }),
    [init, setParams, reset, setRunning, setSize, tick, subscribe]
  );

  return { api, stats };
}
