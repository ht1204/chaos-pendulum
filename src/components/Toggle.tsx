"use client";

import React from "react";
import styled from "styled-components";

/**
 * Phase 3 — Toggle. Style port of .toggle-row / .toggle (index.html:289–324)
 * using a real checkbox (implicit role: switch semantics via aria).
 * The track receives the focus ring via input:focus-visible + sibling selector.
 */
const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const ToggleLabelText = styled.span`
  font-size: 12px;
  color: var(--text-dim);
`;

const ToggleWrap = styled.label`
  position: relative;
  width: 36px;
  height: 20px;
  flex-shrink: 0;
  display: inline-block;
  cursor: pointer;

  input {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
  }
`;

const Track = styled.span`
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: var(--border);
  transition: background 0.2s;
`;

const Thumb = styled.span`
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--surface);
  transition: left 0.2s;
  pointer-events: none;
`;

const Input = styled.input`
  &:checked + ${Track} {
    background: var(--accent);
  }

  &:checked ~ ${Thumb} {
    left: 19px;
  }

  &:focus-visible + ${Track} {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
}

export function Toggle({ label, checked, onChange, id, disabled }: ToggleProps) {
  return (
    <Row>
      <ToggleLabelText>{label}</ToggleLabelText>
      <ToggleWrap>
        <Input
          id={id}
          type="checkbox"
          role="switch"
          aria-label={label}
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <Track />
        <Thumb />
      </ToggleWrap>
    </Row>
  );
}
