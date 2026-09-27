/**
 * Phase 4 — worker-side simulation world.
 * Pure, DOM-free module so the stepping logic is unit-testable without a
 * real Worker. worker.ts is a thin message-dispatch shell around this.
 */
import { rk4Step, type PendulumState } from "./equations";
import {
  DEFAULT_PHYSICS_PARAMS,
  GHOST_COUNT,
  GHOST_OFFSET,
  STRIDE,
  type PhysicsParams,
} from "./types";

interface Pendulum extends PendulumState {
  l1: number;
  l2: number;
}

export interface World {
  params: PhysicsParams;
  /** Square simulation area in CSS pixels (drives arm lengths — parity with getL1/getL2). */
  size: number;
  pendulums: Pendulum[];
  running: boolean;
  totalSteps: number;
}

export interface SimulateResult {
  buffer: Float32Array;
  pendulums: number;
  steps: number;
}

export function armLengths(world: World): [number, number] {
  return [world.size * world.params.l1frac, world.size * world.params.l2frac];
}

function spawnPendulums(world: World): Pendulum[] {
  const [l1, l2] = armLengths(world);
  const { a1Init, a2Init, multi } = world.params;
  if (multi) {
    const pendulums: Pendulum[] = [];
    for (let i = 0; i < GHOST_COUNT; i++) {
      const offset = i * GHOST_OFFSET;
      pendulums.push({
        a1: a1Init + offset,
        a2: a2Init,
        a1v: 0,
        a2v: 0,
        l1,
        l2,
      });
    }
    return pendulums;
  }
  return [{ a1: a1Init, a2: a2Init, a1v: 0, a2v: 0, l1, l2 }];
}

export function createWorld(
  params: PhysicsParams = DEFAULT_PHYSICS_PARAMS,
  size = 800,
  running = true
): World {
  const world: World = { params: { ...params }, size, pendulums: [], running, totalSteps: 0 };
  world.pendulums = spawnPendulums(world);
  return world;
}

/** Re-initialize pendulums from the stored initial angles. Resets the step counter (initPendulums parity). */
export function resetWorld(world: World): void {
  world.pendulums = spawnPendulums(world);
  world.totalSteps = 0;
}

/**
 * Latest-wins param application. Live-affecting params (g, m1, m2, l1frac,
 * l2frac, speed) take effect on the next step; initial angles are stored and
 * only applied on the next reset (original parity). Toggling ghost mode
 * re-initializes immediately, matching index.html:826–829.
 */
export function applyParams(world: World, patch: Partial<PhysicsParams>): void {
  const multiChanged =
    patch.multi !== undefined && patch.multi !== world.params.multi;
  Object.assign(world.params, patch);
  if (multiChanged) resetWorld(world);
}

/**
 * Advance the world `steps` integration steps and stream a batched,
 * transfer-ready snapshot: every step of every pendulum is recorded
 * (STRIDE floats each) so renderers never drop trail points.
 */
export function simulate(world: World, steps: number): SimulateResult {
  const n = world.pendulums.length;
  if (steps <= 0 || n === 0) {
    return { buffer: new Float32Array(0), pendulums: n, steps: 0 };
  }

  const buffer = new Float32Array(steps * n * STRIDE);
  const { g, m1, m2 } = world.params;
  const [l1, l2] = armLengths(world);
  const cx = world.size / 2;
  const cy = world.size / 2;

  let offset = 0;
  for (let s = 0; s < steps; s++) {
    // Parity: the original refreshes arm lengths before every step
    // (index.html:752) so live geometry slider changes apply instantly.
    for (const p of world.pendulums) {
      p.l1 = l1;
      p.l2 = l2;
    }
    for (const p of world.pendulums) {
      rk4Step(p, p.l1, p.l2, { g, m1, m2 });
    }
    world.totalSteps++;

    for (let i = 0; i < n; i++) {
      const p = world.pendulums[i];
      // Parity: the original records the tip AFTER integrating, in canvas
      // coordinates (index.html:596–601).
      const x1 = cx + p.l1 * Math.sin(p.a1);
      const y1 = cy + p.l1 * Math.cos(p.a1);
      const x2 = x1 + p.l2 * Math.sin(p.a2);
      const y2 = y1 + p.l2 * Math.cos(p.a2);
      buffer[offset++] = p.a1;
      buffer[offset++] = p.a2;
      buffer[offset++] = p.a1v;
      buffer[offset++] = p.a2v;
      buffer[offset++] = x1;
      buffer[offset++] = y1;
      buffer[offset++] = x2;
      buffer[offset++] = y2;
    }
  }

  return { buffer, pendulums: n, steps };
}
