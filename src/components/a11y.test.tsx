import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Slider } from "./Slider";
import { Toggle } from "./Toggle";
import { Button } from "./Button";
import { ColorSwatchGroup } from "./ColorSwatchGroup";
import { ModeSwitch } from "./ModeSwitch";
import { Sidebar } from "./Sidebar";


describe("accessibility (jest-axe)", () => {
  it("Slider has no violations", async () => {
    const { container } = render(
      <Slider label="Gravity" symbol="g" value={0.1} min={0.01} max={0.5} step={0.01} onChange={() => {}} />
    );
    expect((await axe(container)).violations).toEqual([]);
  });

  it("Toggle has no violations", async () => {
    const { container } = render(
      <Toggle label="Ghost pendulums" checked={false} onChange={() => {}} />
    );
    expect((await axe(container)).violations).toEqual([]);
  });

  it("Button has no violations", async () => {
    const { container } = render(<Button onClick={() => {}}>Reset</Button>);
    expect((await axe(container)).violations).toEqual([]);
  });

  it("ColorSwatchGroup has no violations", async () => {
    const { container } = render(
      <ColorSwatchGroup value="#5b8dee" onChange={() => {}} />
    );
    expect((await axe(container)).violations).toEqual([]);
  });

  it("ModeSwitch has no violations", async () => {
    const { container } = render(
      <ModeSwitch mode="2d" onChange={() => {}} />
    );
    expect((await axe(container)).violations).toEqual([]);
  });

  it("the full sidebar has no violations", async () => {
    const noop = vi.fn();
    const passthrough = () => () => noop;
    const { container } = render(
      <Sidebar
        running
        onToggleRun={noop}
        onReset={noop}
        g={0.1}
        m1={50}
        m2={20}
        onPhysicsParam={passthrough}
        l1frac={0.66}
        l2frac={0.33}
        onGeometryParam={passthrough}
        a1InitDeg={180}
        a2InitDeg={22}
        onAngleParam={passthrough}
        mode="2d"
        onModeChange={noop}
        trailLength={200}
        onTrailLengthChange={noop}
        speed={1}
        onSpeedChange={noop}
        color="#5b8dee"
        onColorChange={noop}
        multi={false}
        onMultiChange={noop}
        readout={{ a1: 3.14, a2: 0.39, a1v: 0, a2v: 0 }}
      />
    );
    expect((await axe(container)).violations).toEqual([]);
    // The sidebar sections are all present and labeled.
    for (const label of [
      "Playback",
      "Physics",
      "Geometry",
      "Initial angles",
      "Rendering",
      "Live state",
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });
});
