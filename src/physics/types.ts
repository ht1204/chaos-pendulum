/**
 * Physics types and worker protocol.
 * Fixed timestep dt = 0.15 is INTENTIONAL behavior parity with the original
 */

export interface PhysicsParams {
  /** Gravity strength (original slider 0.01–0.5, default 0.1). */
  g: number;
  m1: number;
  m2: number;
  /** Arm lengths as a fraction of the (square) canvas size. */
  l1frac: number;
  l2frac: number;
  /** Initial angles in radians (applied on reset only — original parity). */
  a1Init: number;
  a2Init: number;
  /** Simulation steps per frame (1–10). */
  speed: number;
  /** Ghost pendulum mode (6 near-identical pendulums). */
  multi: boolean;
}

export const DEFAULT_PHYSICS_PARAMS: PhysicsParams = {
  g: 0.1,
  m1: 50,
  m2: 20,
  l1frac: 0.66,
  l2frac: 0.33,
  a1Init: Math.PI,
  a2Init: Math.PI / 8,
  speed: 1,
  multi: false,
};

/** Fixed integration timestep — parity with index.html:574. */
export const DT = 0.15;

/** Ghost configuration — parity with index.html:610–617. */
export const GHOST_COUNT = 6;
export const GHOST_OFFSET = 0.002;

/**
 * Per-pendulum, per-step float layout streamed to the renderers:
 * [a1, a2, a1v, a2v, x1, y1, x2, y2]
 */
export const STRIDE = 8;

export interface FramesMessage {
  type: "frames";
  /**
   * Transferable batch: steps × pendulums × STRIDE floats.
   * EVERY step is included so trails never miss points.
   */
  buffer: Float32Array;
  pendulums: number;
  steps: number;
  /** Total integration steps since last reset (drives the frame counter). */
  totalSteps: number;
}

export type WorkerCommand =
  | { type: "init"; params: PhysicsParams; size: number }
  | { type: "setParams"; patch: Partial<PhysicsParams> }
  | { type: "reset" }
  | { type: "setRunning"; running: boolean }
  | { type: "setSize"; size: number }
  | { type: "tick" };

export type WorkerMessage = FramesMessage | { type: "ready" };
