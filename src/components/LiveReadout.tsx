"use client";

import React from "react";
import styled from "styled-components";

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const Item = styled.div`
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 10px;
`;

const Label = styled.span`
  display: block;
  font-size: 10px;
  color: var(--text-muted);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  letter-spacing: 0.05em;
  margin-bottom: 3px;
`;

const Value = styled.div`
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 12px;
  color: var(--text);
  font-variant-numeric: tabular-nums;
`;

export interface ReadoutState {
  a1: number;
  a2: number;
  a1v: number;
  a2v: number;
}

export function LiveReadout({ readout }: { readout: ReadoutState | null }) {
  // Formatting parity with index.html:720–728.
  const rows: Array<[string, string]> = readout
    ? [
        ["θ₁ (deg)", ((readout.a1 * 180) / Math.PI % 360).toFixed(1)],
        ["θ₂ (deg)", ((readout.a2 * 180) / Math.PI % 360).toFixed(1)],
        ["ω₁ (rad/s)", readout.a1v.toFixed(3)],
        ["ω₂ (rad/s)", readout.a2v.toFixed(3)],
      ]
    : [
        ["θ₁ (deg)", "—"],
        ["θ₂ (deg)", "—"],
        ["ω₁ (rad/s)", "—"],
        ["ω₂ (rad/s)", "—"],
      ];

  return (
    <Grid>
      {rows.map(([label, value]) => (
        <Item key={label}>
          <Label>{label}</Label>
          <Value>{value}</Value>
        </Item>
      ))}
    </Grid>
  );
}
