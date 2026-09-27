import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColorSwatchGroup } from "./ColorSwatchGroup";
import { TRAIL_COLORS } from "@/lib/theme";

describe("ColorSwatchGroup", () => {
  it("renders a radiogroup with one radio per preset color", () => {
    render(<ColorSwatchGroup value="#5b8dee" onChange={() => {}} />);
    const group = screen.getByRole("radiogroup", { name: "Trail color" });
    expect(group).toBeInTheDocument();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(TRAIL_COLORS.length);
  });

  it("marks the selected color as checked", () => {
    render(<ColorSwatchGroup value="#34d399" onChange={() => {}} />);
    const selected = screen.getByRole("radio", { checked: true });
    expect(selected).toHaveAttribute("value", "#34d399");
  });

  it("selects via click on the swatch label", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorSwatchGroup value="#5b8dee" onChange={onChange} />);
    const label = screen.getAllByRole("radio")[2].closest("label");
    expect(label).not.toBeNull();
    await user.click(label!);
    expect(onChange).toHaveBeenCalledWith("#34d399");
  });

  it("is keyboard-focusable (the original <div> swatches were not)", () => {
    render(<ColorSwatchGroup value="#5b8dee" onChange={() => {}} />);
    const radios = screen.getAllByRole("radio");
    radios[0].focus();
    expect(document.activeElement).toBe(radios[0]);
    // Radio semantics: arrow-key group navigation is native browser behavior
    // (verified in E2E); jsdom does not simulate it.
    expect(radios[0]).toHaveProperty("type", "radio");
  });
});
