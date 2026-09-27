"use client";

import React, { useId } from "react";
import styled, { css } from "styled-components";
import { TRAIL_COLORS } from "@/lib/theme";

/**
 * Phase 3 — ColorSwatchGroup.
 * The original swatches (index.html:457–465) are non-focusable <div>s —
 * a keyboard-accessibility bug. This is a native radio group instead:
 * visually-hidden radios + styled labels, so Tab / arrow keys / space work
 * and checked/focus states are pure CSS (index.html:242–260 port).
 */
const Field = styled.fieldset`
  border: none;
  margin: 4px 0 0;
  padding: 0;
  min-width: 0;
`;

const Legend = styled.legend`
  font-size: 12px;
  color: var(--text-dim);
  font-weight: 400;
  padding: 0;
  margin-bottom: 10px;
`;

const Swatches = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const SwatchLabel = styled.label`
  cursor: pointer;
  line-height: 0;
`;

const Input = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  clip-path: inset(50%);
  overflow: hidden;
  white-space: nowrap;
`;

const Swatch = styled.span<{ $isWhite: boolean }>`
  display: block;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: all 0.15s;
  position: relative;

  ${(props) =>
    props.$isWhite &&
    css`
      border: 1px solid #555;
    `}

  ${Input}:checked + & {
    border-color: var(--text);
    transform: scale(1.15);
  }

  ${Input}:hover + & {
    transform: scale(1.1);
  }

  ${Input}:focus-visible + & {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;

export interface ColorSwatchGroupProps {
  value: string;
  onChange: (color: string) => void;
  /** Accessible name for the radio group. */
  label?: string;
  colors?: readonly string[];
}

export function ColorSwatchGroup({
  value,
  onChange,
  label = "Trail color",
  colors = TRAIL_COLORS,
}: ColorSwatchGroupProps) {
  const name = useId();

  return (
    <Field>
      <Legend>{label}</Legend>
      <Swatches role="radiogroup" aria-label={label}>
        {colors.map((color) => (
          <SwatchLabel key={color} title={color}>
            <Input
              type="radio"
              name={name}
              value={color}
              checked={value === color}
              onChange={() => onChange(color)}
            />
            <Swatch
              $isWhite={color.toLowerCase() === "#ffffff"}
              style={{ background: color }}
            />
          </SwatchLabel>
        ))}
      </Swatches>
    </Field>
  );
}
