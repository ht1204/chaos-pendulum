"use client";

import React from "react";
import styled from "styled-components";
import { Button } from "./Button";
import { Slider } from "./Slider";
import { Toggle } from "./Toggle";
import { ColorSwatchGroup } from "./ColorSwatchGroup";
import { ModeSwitch } from "./ModeSwitch";
import { LiveReadout, type ReadoutState } from "./LiveReadout";
import { PauseIcon, PlayIcon, ResetIcon } from "./icons";
import type { RendererMode } from "./CanvasStage";

/** Sidebar chrome — port of .sidebar/.section/.section-label (index.html:123–146). */
const Aside = styled.aside`
  background: var(--surface);
  border-left: 1px solid var(--border);
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 2px;
  }

  @media (max-width: 640px) {
    border-left: none;
    border-top: 1px solid var(--border);
    max-height: 40vh;
  }
`;

const Section = styled.section`
  padding: 16px;
  border-bottom: 1px solid var(--border);
`;

const SectionLabel = styled.h2`
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 14px;
`;

const ControlsRow = styled.div`
  display: flex;
  gap: 8px;
`;

export interface SidebarProps {
  running: boolean;
  onToggleRun: () => void;
  onReset: () => void;

  g: number;
  m1: number;
  m2: number;
  onPhysicsParam: (key: "g" | "m1" | "m2") => (value: number) => void;

  l1frac: number;
  l2frac: number;
  onGeometryParam: (key: "l1frac" | "l2frac") => (value: number) => void;

  a1InitDeg: number;
  a2InitDeg: number;
  onAngleParam: (key: "a1InitDeg" | "a2InitDeg") => (value: number) => void;

  mode: RendererMode;
  onModeChange: (mode: RendererMode) => void;

  trailLength: number;
  onTrailLengthChange: (value: number) => void;

  speed: number;
  onSpeedChange: (value: number) => void;

  color: string;
  onColorChange: (color: string) => void;

  multi: boolean;
  onMultiChange: (multi: boolean) => void;

  readout: ReadoutState | null;
}

export function Sidebar(props: SidebarProps) {
  return (
    <Aside>
      <Section aria-label="Playback">
        <SectionLabel>Playback</SectionLabel>
        <ControlsRow>
          <Button primary onClick={props.onToggleRun}>
            {props.running ? <PauseIcon /> : <PlayIcon />}
            {props.running ? "Pause" : "Play"}
          </Button>
          <Button onClick={props.onReset}>
            <ResetIcon />
            Reset
          </Button>
        </ControlsRow>
      </Section>

      <Section aria-label="Physics">
        <SectionLabel>Physics</SectionLabel>
        <Slider
          label="Gravity"
          symbol="g"
          value={props.g}
          min={0.01}
          max={0.5}
          step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={props.onPhysicsParam("g")}
        />
        <Slider
          label="Mass 1"
          symbol="m₁"
          value={props.m1}
          min={5}
          max={150}
          step={1}
          format={(v) => String(v)}
          onChange={props.onPhysicsParam("m1")}
        />
        <Slider
          label="Mass 2"
          symbol="m₂"
          value={props.m2}
          min={5}
          max={150}
          step={1}
          format={(v) => String(v)}
          onChange={props.onPhysicsParam("m2")}
        />
      </Section>

      <Section aria-label="Geometry">
        <SectionLabel>Geometry</SectionLabel>
        <Slider
          label="Arm 1 length"
          symbol="l₁"
          value={props.l1frac}
          min={0.2}
          max={0.9}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={props.onGeometryParam("l1frac")}
        />
        <Slider
          label="Arm 2 length"
          symbol="l₂"
          value={props.l2frac}
          min={0.1}
          max={0.8}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={props.onGeometryParam("l2frac")}
        />
      </Section>

      <Section aria-label="Initial angles">
        <SectionLabel>Initial Angles</SectionLabel>
        <Slider
          label="Angle 1"
          symbol="θ₁"
          value={props.a1InitDeg}
          min={-180}
          max={180}
          step={1}
          format={(v) => `${v}°`}
          hint="Applied after Reset"
          onChange={props.onAngleParam("a1InitDeg")}
        />
        <Slider
          label="Angle 2"
          symbol="θ₂"
          value={props.a2InitDeg}
          min={-180}
          max={180}
          step={1}
          format={(v) => `${v}°`}
          hint="Applied after Reset"
          onChange={props.onAngleParam("a2InitDeg")}
        />
      </Section>

      <Section aria-label="Rendering">
        <SectionLabel>Rendering</SectionLabel>
        <ModeSwitch mode={props.mode} onChange={props.onModeChange} />
        <Slider
          label="Trail length"
          value={props.trailLength}
          min={20}
          max={800}
          step={10}
          format={(v) => String(v)}
          onChange={props.onTrailLengthChange}
        />
        <Slider
          label="Speed"
          value={props.speed}
          min={1}
          max={10}
          step={1}
          format={(v) => `${v}×`}
          onChange={props.onSpeedChange}
        />
        <div style={{ margin: "14px 0" }}>
          <ColorSwatchGroup value={props.color} onChange={props.onColorChange} />
        </div>
        <Toggle
          label="Ghost pendulums"
          checked={props.multi}
          onChange={props.onMultiChange}
        />
      </Section>

      <Section aria-label="Live state">
        <SectionLabel>Live State</SectionLabel>
        <LiveReadout readout={props.readout} />
      </Section>
    </Aside>
  );
}
