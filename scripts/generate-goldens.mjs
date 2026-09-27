#!/usr/bin/env node
/**
 * Generates golden trajectory values by running the ORIGINAL index.html
 * physics, copied verbatim (index.html:505–603). Independent of src/physics
 * so a porting error in either place cannot hide.
 *
 */
const params = {
  g: 0.1,
  m1: 50,
  m2: 20,
  l1frac: 0.66,
  l2frac: 0.33,
  a1_init: Math.PI,
  a2_init: Math.PI / 8,
};

const canvas = { width: 800, height: 800 };

function makePendulum(a1, a2, l1, l2) {
  return { a1, a2, a1v: 0, a2v: 0, l1, l2 };
}

function getL1() { return canvas.width * params.l1frac; }
function getL2() { return canvas.width * params.l2frac; }

function calcA1v(p) {
  const { a1, a2, a1v, a2v, l1, l2 } = p;
  const { g, m1, m2 } = params;
  const d = a1 - a2;
  const num = -g * (2 * m1 + m2) * Math.sin(a1)
             - m2 * g * Math.sin(a1 - 2 * a2)
             - 2 * Math.sin(d) * m2 * (a2v * a2v * l2 + a1v * a1v * l1 * Math.cos(d));
  const den = l1 * (2 * m1 + m2 - m2 * Math.cos(2 * d));
  return num / den;
}

function calcA2v(p) {
  const { a1, a2, a1v, a2v, l1, l2 } = p;
  const { g, m1, m2 } = params;
  const d = a1 - a2;
  const num = 2 * Math.sin(d) * (
                a1v * a1v * l1 * (m1 + m2)
                + g * (m1 + m2) * Math.cos(a1)
                + a2v * a2v * l2 * m2 * Math.cos(d));
  const den = l2 * (2 * m1 + m2 - m2 * Math.cos(2 * d));
  return num / den;
}

function stepPendulum(p) {
  const dt = 0.15;

  function deriv(a1, a2, a1v, a2v) {
    const pp = { ...p, a1, a2, a1v, a2v };
    return {
      da1: a1v, da2: a2v,
      da1v: calcA1v(pp),
      da2v: calcA2v(pp)
    };
  }

  const k1 = deriv(p.a1, p.a2, p.a1v, p.a2v);
  const k2 = deriv(p.a1 + dt/2*k1.da1, p.a2 + dt/2*k1.da2, p.a1v + dt/2*k1.da1v, p.a2v + dt/2*k1.da2v);
  const k3 = deriv(p.a1 + dt/2*k2.da1, p.a2 + dt/2*k2.da2, p.a1v + dt/2*k2.da1v, p.a2v + dt/2*k2.da2v);
  const k4 = deriv(p.a1 + dt*k3.da1, p.a2 + dt*k3.da2, p.a1v + dt*k3.da1v, p.a2v + dt*k3.da2v);

  p.a1 += dt/6 * (k1.da1 + 2*k2.da1 + 2*k3.da1 + k4.da1);
  p.a2 += dt/6 * (k1.da2 + 2*k2.da2 + 2*k3.da2 + k4.da2);
  p.a1v += dt/6 * (k1.da1v + 2*k2.da1v + 2*k3.da1v + k4.da1v);
  p.a2v += dt/6 * (k1.da2v + 2*k2.da2v + 2*k3.da2v + k4.da2v);
}

function snapshot(p) {
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const x1 = cx + p.l1 * Math.sin(p.a1);
  const y1 = cy + p.l1 * Math.cos(p.a1);
  const x2 = x1 + p.l2 * Math.sin(p.a2);
  const y2 = y1 + p.l2 * Math.cos(p.a2);
  return { a1: p.a1, a2: p.a2, a1v: p.a1v, a2v: p.a2v, x1, y1, x2, y2 };
}

function fmt(n) {
  return Number(n.toPrecision(12));
}

// Single pendulum run
const p = makePendulum(params.a1_init, params.a2_init, getL1(), getL2());
for (let s = 0; s < 100; s++) {
  p.l1 = getL1(); p.l2 = getL2();
  stepPendulum(p);
  if (s === 0 || s === 99) {
    const snap = snapshot(p);
    console.log(`step ${s + 1}:`);
    for (const [k, v] of Object.entries(snap)) console.log(`  ${k}: ${fmt(v)},`);
  }
}

// Ghost run: verify initial offsets
console.log("ghost initial a1 values:");
for (let i = 0; i < 6; i++) {
  console.log(`  ghost[${i}].a1: ${fmt(params.a1_init + i * 0.002)},`);
}
