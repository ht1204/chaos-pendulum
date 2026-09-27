"use client";

import React, { useId } from "react";
import styled from "styled-components";

/**
 * Slider — style port of .param / .param-header / input[type=range]
 * (index.html:181–240). Native <input type="range"> with a visible <label>;
 * the thumb carries a persistent ring that doubles as the focus indicator.
 */
const Param = styled.div`
  margin-bottom: 14px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ParamHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
`;

const ParamName = styled.span`
  font-size: 12px;
  color: var(--text-dim);
  font-weight: 400;

  em {
    font-style: normal;
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 11px;
    color: var(--text-muted);
    margin-left: 4px;
  }
`;

const ParamVal = styled.output`
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 12px;
  color: var(--accent);
  font-weight: 500;
  min-width: 48px;
  text-align: right;
  font-variant-numeric: tabular-nums;
`;

const RangeInput = styled.input`
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 3px;
  border-radius: 2px;
  background: var(--border);
  outline: none;
  cursor: pointer;
  accent-color: var(--accent);
  display: block;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--slider-thumb);
    border: 2px solid var(--surface);
    box-shadow: 0 0 0 1px var(--accent);
    cursor: pointer;
    transition: transform 0.1s;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }

  &::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--slider-thumb);
    border: 2px solid var(--surface);
    box-shadow: 0 0 0 1px var(--accent);
    cursor: pointer;
  }

  &:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px var(--accent-glow), 0 0 0 1px var(--accent);
  }

  &:focus-visible::-moz-range-thumb {
    box-shadow: 0 0 0 3px var(--accent-glow), 0 0 0 1px var(--accent);
  }
`;

export interface SliderProps {
  /** Human-readable name, e.g. "Gravity". */
  label: string;
  /** Optional math symbol rendered next to the name, e.g. "g". */
  symbol?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Formats the value shown on the right (defaults to raw number). */
  format?: (value: number) => string;
  onChange: (value: number) => void;
  id?: string;
  /** Extra hint announced via aria-describedby. */
  hint?: string;
}

export function Slider({
  label,
  symbol,
  value,
  min,
  max,
  step,
  format,
  onChange,
  id,
  hint,
}: SliderProps) {
  const autoId = useId();
  const inputId = id ?? `slider-${autoId}`;
  const hintId = `${inputId}-hint`;

  return (
    <Param>
      <ParamHeader>
        <ParamName>
          <label htmlFor={inputId}>
            {label}
            {symbol ? (
              <>
                {" "}
                <em>{symbol}</em>
              </>
            ) : null}
          </label>
        </ParamName>
        <ParamVal htmlFor={inputId}>{format ? format(value) : String(value)}</ParamVal>
      </ParamHeader>
      <RangeInput
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-describedby={hint ? hintId : undefined}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint ? (
        <span
          id={hintId}
          style={{
            display: "block",
            fontSize: 10,
            color: "var(--text-muted)",
            marginTop: 4,
          }}
        >
          {hint}
        </span>
      ) : null}
    </Param>
  );
}
