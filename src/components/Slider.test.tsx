import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Slider } from "./Slider";

describe("Slider", () => {
  it("associates the visible label with the input", () => {
    render(
      <Slider label="Gravity" symbol="g" value={0.1} min={0.01} max={0.5} step={0.01} onChange={() => {}} />
    );
    const input = screen.getByLabelText("Gravity g", { selector: "input[type=range]" });
    expect(input).toBeInTheDocument();
  });

  it("exposes range attributes", () => {
    render(
      <Slider label="Mass 1" symbol="m₁" value={50} min={5} max={150} step={1} onChange={() => {}} />
    );
    const input = screen.getByLabelText("Mass 1 m₁");
    expect(input).toHaveAttribute("min", "5");
    expect(input).toHaveAttribute("max", "150");
    expect(input).toHaveAttribute("step", "1");
    expect(input).toHaveAttribute("value", "50");
  });

  it("shows the formatted value via <output>", () => {
    render(
      <Slider
        label="Angle 1"
        value={180}
        min={-180}
        max={180}
        step={1}
        format={(v) => `${v}°`}
        onChange={() => {}}
      />
    );
    expect(screen.getByText("180°")).toBeInTheDocument();
  });

  it("fires onChange with a numeric value when the range changes", () => {
    const onChange = vi.fn();
    render(
      <Slider label="Speed" value={5} min={1} max={10} step={1} onChange={onChange} />
    );
    const input = screen.getByLabelText("Speed");
    fireEvent.change(input, { target: { value: "6" } });
    expect(onChange).toHaveBeenCalledWith(6);
    expect(onChange.mock.calls[0][0]).toBeTypeOf("number");
  });

  it("connects hint text via aria-describedby", () => {
    render(
      <Slider
        label="Angle 2"
        value={22}
        min={-180}
        max={180}
        step={1}
        hint="Applied after Reset"
        onChange={() => {}}
      />
    );
    const input = screen.getByLabelText("Angle 2");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent(
      "Applied after Reset"
    );
  });
});
