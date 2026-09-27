import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModeSwitch } from "./ModeSwitch";

describe("ModeSwitch (2D↔3D)", () => {
  it("renders an accessible radiogroup", () => {
    render(<ModeSwitch mode="2d" onChange={() => {}} />);
    const group = screen.getByRole("radiogroup", { name: "Renderer" });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "2D" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "3D" })).not.toBeChecked();
  });

  it("switches modes on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ModeSwitch mode="2d" onChange={onChange} />);
    await user.click(screen.getByRole("radio", { name: "3D" }));
    expect(onChange).toHaveBeenCalledWith("3d");
  });

  it("switches with a click on the 3D label", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ModeSwitch mode="2d" onChange={onChange} />);
    const label = screen.getByRole("radio", { name: "3D" }).closest("label");
    await user.click(label!);
    expect(onChange).toHaveBeenCalledWith("3d");
  });

  it("is keyboard-focusable", () => {
    render(<ModeSwitch mode="2d" onChange={() => {}} />);
    const twoD = screen.getByRole("radio", { name: "2D" });
    twoD.focus();
    expect(document.activeElement).toBe(twoD);
  });
});
