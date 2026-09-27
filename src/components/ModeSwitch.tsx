"use client";

import React, { useId } from "react";
import styled from "styled-components";
import type { RendererMode } from "./CanvasStage";

/**
 * Phase 7 — 2D↔3D switcher as a segmented radio group (accessible,
 * keyboard-operable). Swapping calls dispose() on the outgoing renderer
 * via CanvasStage's mode effect.
 */
const Group = styled.div`
  display: flex;
  gap: 4px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 3px;
  margin-bottom: 14px;
`;

const SegmentLabel = styled.label`
  flex: 1;
  cursor: pointer;
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

const Segment = styled.span`
  display: block;
  text-align: center;
  padding: 5px 4px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-dim);
  transition: all 0.15s;

  ${Input}:checked + & {
    background: var(--accent);
    color: #fff;
  }

  ${Input}:focus-visible + & {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
`;

export interface ModeSwitchProps {
  mode: RendererMode;
  onChange: (mode: RendererMode) => void;
}

export function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  const name = useId();
  return (
    <Group role="radiogroup" aria-label="Renderer">
      <SegmentLabel>
        <Input
          type="radio"
          name={name}
          value="2d"
          checked={mode === "2d"}
          onChange={() => onChange("2d")}
        />
        <Segment>2D</Segment>
      </SegmentLabel>
      <SegmentLabel>
        <Input
          type="radio"
          name={name}
          value="3d"
          checked={mode === "3d"}
          onChange={() => onChange("3d")}
        />
        <Segment>3D</Segment>
      </SegmentLabel>
    </Group>
  );
}
