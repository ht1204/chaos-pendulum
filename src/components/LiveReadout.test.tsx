import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LiveReadout } from "./LiveReadout";

describe("LiveReadout", () => {
  it("shows placeholders before data arrives", () => {
    render(<LiveReadout readout={null} />);
    const values = screen.getAllByText("—");
    expect(values).toHaveLength(4);
  });

  it("formats values like the original (index.html:720–728)", () => {
    render(
      <LiveReadout
        readout={{ a1: Math.PI, a2: Math.PI / 8, a1v: -0.000381, a2v: -0.002842 }}
      />
    );
    expect(screen.getByText("180.0")).toBeInTheDocument(); // θ₁
    expect(screen.getByText("22.5")).toBeInTheDocument(); // θ₂
    expect(screen.getByText("-0.000")).toBeInTheDocument(); // ω₁ (3 decimals)
    expect(screen.getByText("-0.003")).toBeInTheDocument(); // ω₂
  });

  it("wraps degrees into (-360, 360]", () => {
    render(
      <LiveReadout readout={{ a1: Math.PI * 3, a2: 0, a1v: 0, a2v: 0 }} />
    );
    expect(screen.getByText("180.0")).toBeInTheDocument();
  });
});
