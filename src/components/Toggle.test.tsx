import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toggle } from "./Toggle";

describe("Toggle", () => {
  it("exposes role=switch with an accessible name", () => {
    render(
      <Toggle label="Ghost pendulums" checked={false} onChange={() => {}} />
    );
    expect(
      screen.getByRole("switch", { name: "Ghost pendulums" })
    ).toBeInTheDocument();
  });

  it("reflects and toggles checked state on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <Toggle label="Ghost pendulums" checked={false} onChange={onChange} />
    );
    const toggle = screen.getByRole("switch");
    expect(toggle).not.toBeChecked();

    // Click the visible track label (the input itself is visually hidden).
    const wrap = toggle.closest("label");
    expect(wrap).not.toBeNull();
    await user.click(wrap!);
    expect(onChange).toHaveBeenCalledWith(true);

    rerender(
      <Toggle label="Ghost pendulums" checked={true} onChange={onChange} />
    );
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("toggles when activated (click ≙ Space on a switch)", () => {
    const onChange = vi.fn();
    render(<Toggle label="Ghosts" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
