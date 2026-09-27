/**
 * Differential-testing oracle: verbatim TypeScript copy of the ORIGINAL
 * index.html physics (index.html:505–603). Kept independent of src/physics
 * on purpose — production code must reproduce this bit-for-bit.
 */

export interface OracleState {
  a1: number;
  a2: number;
  a1v: number;
  a2v: number;
  l1: number;
  l2: number;
}

export interface OracleMasses {
  g: number;
  m1: number;
  m2: number;
}

export function makeOraclePendulum(
  a1: number,
  a2: number,
  l1: number,
  l2: number
): OracleState {
  return { a1, a2, a1v: 0, a2v: 0, l1, l2 };
}

function calcA1v(p: OracleState, m: OracleMasses): number {
  const { a1, a2, a1v, a2v, l1, l2 } = p;
  const { g, m1, m2 } = m;
  const d = a1 - a2;
  const num =
    -g * (2 * m1 + m2) * Math.sin(a1) -
    m2 * g * Math.sin(a1 - 2 * a2) -
    2 * Math.sin(d) * m2 * (a2v * a2v * l2 + a1v * a1v * l1 * Math.cos(d));
  const den = l1 * (2 * m1 + m2 - m2 * Math.cos(2 * d));
  return num / den;
}

function calcA2v(p: OracleState, m: OracleMasses): number {
  const { a1, a2, a1v, a2v, l1, l2 } = p;
  const { g, m1, m2 } = m;
  const d = a1 - a2;
  const num =
    2 *
    Math.sin(d) *
    (a1v * a1v * l1 * (m1 + m2) +
      g * (m1 + m2) * Math.cos(a1) +
      a2v * a2v * l2 * m2 * Math.cos(d));
  const den = l2 * (2 * m1 + m2 - m2 * Math.cos(2 * d));
  return num / den;
}

export function oracleStepPendulum(p: OracleState, m: OracleMasses): void {
  const dt = 0.15;

  function deriv(a1: number, a2: number, a1v: number, a2v: number) {
    const pp: OracleState = { ...p, a1, a2, a1v, a2v };
    return {
      da1: a1v,
      da2: a2v,
      da1v: calcA1v(pp, m),
      da2v: calcA2v(pp, m),
    };
  }

  const k1 = deriv(p.a1, p.a2, p.a1v, p.a2v);
  const k2 = deriv(
    p.a1 + (dt / 2) * k1.da1,
    p.a2 + (dt / 2) * k1.da2,
    p.a1v + (dt / 2) * k1.da1v,
    p.a2v + (dt / 2) * k1.da2v
  );
  const k3 = deriv(
    p.a1 + (dt / 2) * k2.da1,
    p.a2 + (dt / 2) * k2.da2,
    p.a1v + (dt / 2) * k2.da1v,
    p.a2v + (dt / 2) * k2.da2v
  );
  const k4 = deriv(
    p.a1 + dt * k3.da1,
    p.a2 + dt * k3.da2,
    p.a1v + dt * k3.da1v,
    p.a2v + dt * k3.da2v
  );

  p.a1 += (dt / 6) * (k1.da1 + 2 * k2.da1 + 2 * k3.da1 + k4.da1);
  p.a2 += (dt / 6) * (k1.da2 + 2 * k2.da2 + 2 * k3.da2 + k4.da2);
  p.a1v += (dt / 6) * (k1.da1v + 2 * k2.da1v + 2 * k3.da1v + k4.da1v);
  p.a2v += (dt / 6) * (k1.da2v + 2 * k2.da2v + 2 * k3.da2v + k4.da2v);
}

export function oracleSnapshot(
  p: OracleState,
  size: number
): { a1: number; a2: number; a1v: number; a2v: number; x1: number; y1: number; x2: number; y2: number } {
  const cx = size / 2;
  const cy = size / 2;
  const x1 = cx + p.l1 * Math.sin(p.a1);
  const y1 = cy + p.l1 * Math.cos(p.a1);
  const x2 = x1 + p.l2 * Math.sin(p.a2);
  const y2 = y1 + p.l2 * Math.cos(p.a2);
  return { a1: p.a1, a2: p.a2, a1v: p.a1v, a2v: p.a2v, x1, y1, x2, y2 };
}
