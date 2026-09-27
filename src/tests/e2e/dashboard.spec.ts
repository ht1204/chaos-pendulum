import { expect, test, type Page } from "@playwright/test";

/**
 * E2E — the only layer where Canvas / WebGL / Web Worker run for real.
 * Run: npm run build && npm run test:e2e
 */

async function collectPageErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  return errors;
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("loads the dashboard with canvas and all sidebar sections", async ({
  page,
}) => {
  const errors = await collectPageErrors(page);

  await expect(page.getByText("Chaos Pendulum")).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Pendulum simulation viewport" })
  ).toBeVisible();

  for (const section of [
    "Playback",
    "Physics",
    "Geometry",
    "Initial angles",
    "Rendering",
    "Live state",
  ]) {
    await expect(page.getByRole("region", { name: section })).toBeVisible();
  }

  // FPS counter appears once the rAF loop delivers frames.
  await expect(page.getByText(/fps/)).toBeVisible();
  expect(errors).toEqual([]);
});

test("physics is live: readout and frame counter advance", async ({ page }) => {
  const frame = page.getByText("frame");
  await expect(frame).toBeVisible();

  const readFrame = async () =>
    Number(await page.getByText("frame").locator("b").innerText());

  const initial = await readFrame();
  await page.waitForTimeout(1500);
  const later = await readFrame();
  expect(later).toBeGreaterThan(initial);

  // Live readout replaces the placeholders with numbers.
  await expect(page.getByText("—")).toHaveCount(0);
});

test("play/pause stops and resumes the simulation", async ({ page }) => {
  const readFrame = async () =>
    Number(await page.getByText("frame").locator("b").innerText());

  // Settle past the initial resize re-init (debounced setSize) before pausing.
  await expect.poll(readFrame, { timeout: 10_000 }).toBeGreaterThan(50);

  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();
  const pausedAt = await readFrame();
  await page.waitForTimeout(800);
  expect(await readFrame()).toBe(pausedAt);

  await page.getByRole("button", { name: "Play" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await page.waitForTimeout(800);
  expect(await readFrame()).toBeGreaterThan(pausedAt);
});

test("gravity slider responds to keyboard and affects the simulation", async ({
  page,
}) => {
  const gravity = page.getByRole("slider", { name: "Gravity g" });
  await gravity.focus();
  const before = await gravity.inputValue();
  await gravity.press("ArrowRight");
  const after = await gravity.inputValue();
  expect(Number(after)).toBeGreaterThan(Number(before));
});

test("ghost pendulums toggle is a real switch", async ({ page }) => {
  const ghost = page.getByRole("switch", { name: "Ghost pendulums" });
  await expect(ghost).not.toBeChecked();
  // The input is visually hidden — click its wrapping label (the track).
  await ghost.locator("..").click();
  await expect(ghost).toBeChecked();
});

test("trail color swatches are keyboard-operable radios", async ({ page }) => {
  const group = page.getByRole("radiogroup", { name: "Trail color" });
  await expect(group).toBeVisible();
  const radios = group.getByRole("radio");
  await expect(radios).toHaveCount(7);

  await radios.first().focus();
  await radios.first().press("ArrowRight");
  await expect(radios.nth(1)).toBeChecked();
});

test("theme toggle flips data-theme and persists across reload", async ({
  page,
}) => {
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");

  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  // Toggle back to explicit dark, then to system.
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("2D canvas zooms with the mouse wheel and resets on double-click", async ({
  page,
}) => {
  const errors = await collectPageErrors(page);
  const canvas = page.locator("canvas");

  const zoom = () =>
    canvas.evaluate((el) => Number((el as HTMLCanvasElement).dataset.zoom));

  await expect(canvas).toHaveAttribute("data-zoom", "1.00");

  // Wheel up over the canvas → zoom in around the pivot.
  await canvas.hover();
  await page.mouse.wheel(0, -240);
  await expect.poll(zoom, { timeout: 3000 }).toBeGreaterThan(1);

  // Wheel down → zoom back out.
  await page.mouse.wheel(0, 480);
  await expect.poll(zoom, { timeout: 3000 }).toBeLessThan(1);

  // Double-click resets the view.
  await canvas.dblclick();
  await expect.poll(zoom, { timeout: 3000 }).toBe(1);

  expect(errors).toEqual([]);
});

test("renderer swap 2D↔3D repeatedly stays healthy with a single canvas", async ({
  page,
}) => {
  const errors = await collectPageErrors(page);
  const renderer = page.getByRole("radiogroup", { name: "Renderer" });
  await expect(renderer).toBeVisible();

  for (let i = 0; i < 3; i++) {
    // The radios are visually hidden — click their visible labels.
    await renderer.getByText("3D").click();
    // Chunk load + WebGL init; overlay disappears when the renderer attaches.
    await expect(page.getByText("WebGL unavailable")).toHaveCount(0);
    await expect(page.locator("canvas")).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(1);

    await renderer.getByText("2D").click();
    await expect(page.locator("canvas")).toHaveCount(1);
    await expect(page.locator("canvas")).toBeVisible();
  }

  // The app remains interactive after all swaps (no dead worker/renderer).
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByText(/fps/)).toBeVisible();
  expect(errors).toEqual([]);
});
