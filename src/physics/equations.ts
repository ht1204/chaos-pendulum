/**
 * Lagrangian double-pendulum equations + RK4 integrator.
 * Verbatim, op-for-op port of index.html:549–603 so trajectories are
 * float-identical to the original (verified by differential tests).
 */
import { DT, type PhysicsParams } from "./types";

export interface PendulumState {
  a1: number;
  a2: number;
  a1v: number;
  a2v: number;
}

export type MassParams = Pick<PhysicsParams, "g" | "m1" | "m2">;

/**
 * Angular acceleration of arm 1 — port of calcA1v (index.html:549–558).
 * Multiplication/addition order preserved bit-for-bit.
 */
export function alpha1(
  s: PendulumState,
  l1: number,
  l2: number,
  p: MassParams
): number {
  const { g, m1, m2 } = p;
  const d = s.a1 - s.a2;
  const num =
    -g * (2 * m1 + m2) * Math.sin(s.a1) -
    m2 * g * Math.sin(s.a1 - 2 * s.a2) -
    2 * Math.sin(d) * m2 * (s.a2v * s.a2v * l2 + s.a1v * s.a1v * l1 * Math.cos(d));
  const den = l1 * (2 * m1 + m2 - m2 * Math.cos(2 * d));
  return num / den;
}

/** Angular acceleration of arm 2 — port of calcA2v (index.html:560–570). */
export function alpha2(
  s: PendulumState,
  l1: number,
  l2: number,
  p: MassParams
): number {
  const { g, m1, m2 } = p;
  const d = s.a1 - s.a2;
  const num =
    2 *
    Math.sin(d) *
    (s.a1v * s.a1v * l1 * (m1 + m2) +
      g * (m1 + m2) * Math.cos(s.a1) +
      s.a2v * s.a2v * l2 * m2 * Math.cos(d));
  const den = l2 * (2 * m1 + m2 - m2 * Math.cos(2 * d));
  return num / den;
}

/**
 * One RK4 integration step, mutating the state — port of stepPendulum
 * (index.html:572–593) including its k-stage expressions and update order.
 */
export function rk4Step(
  s: PendulumState,
  l1: number,
  l2: number,
  p: MassParams
): void {
  const dt = DT;

  function deriv(a1: number, a2: number, a1v: number, a2v: number) {
    const st: PendulumState = { a1, a2, a1v, a2v };
    return {
      da1: a1v,
      da2: a2v,
      da1v: alpha1(st, l1, l2, p),
      da2v: alpha2(st, l1, l2, p),
    };
  }

  const k1 = deriv(s.a1, s.a2, s.a1v, s.a2v);
  const k2 = deriv(
    s.a1 + (dt / 2) * k1.da1,
    s.a2 + (dt / 2) * k1.da2,
    s.a1v + (dt / 2) * k1.da1v,
    s.a2v + (dt / 2) * k1.da2v
  );
  const k3 = deriv(
    s.a1 + (dt / 2) * k2.da1,
    s.a2 + (dt / 2) * k2.da2,
    s.a1v + (dt / 2) * k2.da1v,
    s.a2v + (dt / 2) * k2.da2v
  );
  const k4 = deriv(
    s.a1 + dt * k3.da1,
    s.a2 + dt * k3.da2,
    s.a1v + dt * k3.da1v,
    s.a2v + dt * k3.da2v
  );

  s.a1 += (dt / 6) * (k1.da1 + 2 * k2.da1 + 2 * k3.da1 + k4.da1);
  s.a2 += (dt / 6) * (k1.da2 + 2 * k2.da2 + 2 * k3.da2 + k4.da2);
  s.a1v += (dt / 6) * (k1.da1v + 2 * k2.da1v + 2 * k3.da1v + k4.da1v);
  s.a2v += (dt / 6) * (k1.da2v + 2 * k2.da2v + 2 * k3.da2v + k4.da2v);
}
