import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage();

const errors = [];
const consoleErrors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("requestfailed", (r) =>
  consoleErrors.push(`REQ FAIL: ${r.url()} ${r.failure()?.errorText}`)
);
page.on("response", (r) => {
  if (r.status() >= 400) consoleErrors.push(`HTTP ${r.status()} ${r.url()}`);
});

await page.goto("http://localhost:3000/");
await page.waitForTimeout(2500);

const frame1 = await page
  .getByText("frame")
  .locator("b")
  .innerText()
  .catch(() => "N/A");
await page.waitForTimeout(1500);
const frame2 = await page
  .getByText("frame")
  .locator("b")
  .innerText()
  .catch(() => "N/A");
const canvasCount = await page.locator("canvas").count();
const canvasBox = await page
  .locator("canvas")
  .first()
  .boundingBox()
  .catch(() => null);

console.log("frame1:", frame1, "frame2:", frame2);
console.log("canvas count:", canvasCount, "box:", JSON.stringify(canvasBox));
console.log("pageerrors:", errors);
console.log("console/request errors:", consoleErrors.slice(0, 10));

await browser.close();
