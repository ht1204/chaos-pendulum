"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useTheme } from "@/lib/ThemeProvider";
import { usePhysics } from "@/hooks/usePhysics";
import { CanvasStage, type RendererMode } from "./CanvasStage";
import { Sidebar } from "./Sidebar";
import { MoonIcon, SunIcon } from "./icons";
import { DEFAULT_PHYSICS_PARAMS } from "@/physics/types";

const AppShell = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  grid-template-rows: 48px 1fr;
  height: 100%;

  /* Responsive: stack on narrow screens (index.html:327–339) */
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    grid-template-rows: 48px 1fr auto;
  }
`;

const Header = styled.header`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  z-index: 10;
`;

const HeaderTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-dim);

  span {
    color: var(--accent);
  }
`;

const HeaderSep = styled.div`
  flex: 1;
`;

const HeaderStat = styled.div`
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 11px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;

  b {
    color: var(--text-dim);
    font-weight: 500;
  }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--good);
  animation: ${pulse} 2s ease-in-out infinite;
`;

const ThemeButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface2);
  color: var(--text-dim);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--border);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  & svg {
    width: 14px;
    height: 14px;
  }
`;

interface UiState {
  g: number;
  m1: number;
  m2: number;
  l1frac: number;
  l2frac: number;
  a1InitDeg: number;
  a2InitDeg: number;
  trailLength: number;
  speed: number;
  color: string;
  multi: boolean;
  mode: RendererMode;
}

/** Slider defaults mirror index.html:511–521. */
const INITIAL_UI: UiState = {
  g: 0.1,
  m1: 50,
  m2: 20,
  l1frac: 0.66,
  l2frac: 0.33,
  a1InitDeg: 180,
  a2InitDeg: 22,
  trailLength: 200,
  speed: 1,
  color: "#5b8dee",
  multi: false,
  mode: "2d",
};

export function Dashboard() {
  // `api` is identity-stable; `stats` changes drive re-renders only.
  const { api: physics, stats } = usePhysics();
  const { mode: themeMode, toggle } = useTheme();
  const [ui, setUi] = useState<UiState>(INITIAL_UI);
  const [running, setRunning] = useState(true);

  // Boot the worker once (defaults; real size arrives from the ResizeObserver).
  useEffect(() => {
    physics.init(DEFAULT_PHYSICS_PARAMS, 800);
  }, [physics]);

  const setUiField = useCallback(<K extends keyof UiState>(key: K, value: UiState[K]) => {
    setUi((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onPhysicsParam = useCallback(
    (key: "g" | "m1" | "m2") => (value: number) => {
      setUiField(key, value);
      physics.setParams({ [key]: value });
    },
    [physics, setUiField]
  );

  const onGeometryParam = useCallback(
    (key: "l1frac" | "l2frac") => (value: number) => {
      setUiField(key, value);
      physics.setParams({ [key]: value });
    },
    [physics, setUiField]
  );

  // Initial angles are stored by the worker and applied on the next reset
  // (original parity: the sliders do nothing until Reset is clicked).
  const onAngleParam = useCallback(
    (key: "a1InitDeg" | "a2InitDeg") => (value: number) => {
      setUiField(key, value);
      physics.setParams(
        key === "a1InitDeg"
          ? { a1Init: (value * Math.PI) / 180 }
          : { a2Init: (value * Math.PI) / 180 }
      );
    },
    [physics, setUiField]
  );

  const onSpeedChange = useCallback(
    (value: number) => {
      setUiField("speed", value);
      physics.setParams({ speed: value });
    },
    [physics, setUiField]
  );

  const onMultiChange = useCallback(
    (multi: boolean) => {
      setUiField("multi", multi);
      physics.setParams({ multi });
    },
    [physics, setUiField]
  );

  const onModeChange = useCallback(
    (mode: RendererMode) => setUiField("mode", mode),
    [setUiField]
  );

  const onToggleRun = useCallback(() => {
    setRunning((prev) => {
      physics.setRunning(!prev);
      return !prev;
    });
  }, [physics]);

  const onReset = useCallback(() => {
    physics.reset();
  }, [physics]);

  const rendererOptions = useMemo(
    () => ({
      trailLength: ui.trailLength,
      color: ui.color,
      theme: themeMode,
      m1: ui.m1,
      m2: ui.m2,
    }),
    [ui.trailLength, ui.color, themeMode, ui.m1, ui.m2]
  );

  return (
    <AppShell>
      <Header>
        <HeaderTitle>
          <span>Chaos</span> Pendulum
        </HeaderTitle>
        <HeaderSep />
        <HeaderStat>
          <Dot role="presentation" />
          <b>{stats.fps}</b> fps
        </HeaderStat>
        <HeaderStat>
          frame <b>{stats.totalSteps}</b>
        </HeaderStat>
        <ThemeButton
          type="button"
          onClick={toggle}
          aria-label={`Switch to ${themeMode === "dark" ? "light" : "dark"} theme`}
        >
          {themeMode === "dark" ? <SunIcon /> : <MoonIcon />}
        </ThemeButton>
      </Header>

      <CanvasStage
        physics={physics}
        mode={ui.mode}
        options={rendererOptions}
      />

      <Sidebar
        running={running}
        onToggleRun={onToggleRun}
        onReset={onReset}
        g={ui.g}
        m1={ui.m1}
        m2={ui.m2}
        onPhysicsParam={onPhysicsParam}
        l1frac={ui.l1frac}
        l2frac={ui.l2frac}
        onGeometryParam={onGeometryParam}
        a1InitDeg={ui.a1InitDeg}
        a2InitDeg={ui.a2InitDeg}
        onAngleParam={onAngleParam}
        mode={ui.mode}
        onModeChange={onModeChange}
        trailLength={ui.trailLength}
        onTrailLengthChange={(v) => setUiField("trailLength", v)}
        speed={ui.speed}
        onSpeedChange={onSpeedChange}
        color={ui.color}
        onColorChange={(color) => setUiField("color", color)}
        multi={ui.multi}
        onMultiChange={onMultiChange}
        readout={stats.readout}
      />
    </AppShell>
  );
}
