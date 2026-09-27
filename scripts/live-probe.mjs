// Verifies the LIVE GitHub Pages deployment: physics worker runs, frame
// counter advances, canvas mounted. Run: node scripts/live-probe.mjs [url]
import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "https://ht1204.github.io/chaos-pendulum/";
const browser = await chromium.launch();
const page = await browser.newPage();

const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("requestfailed", (r) =>
  errors.push(`REQ FAIL: ${r.url()} ${r.failure()?.errorText}`)
);

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

const readFrame = () =>
  page
    .getByText("frame")
    .locator("b")
    .innerText()
    .then((t) => Number(t))
    .catch(() => -1);

const f1 = await readFrame();
await page.waitForTimeout(1500);
const f2 = await readFrame();
const canvas = await page.locator("canvas").count();

console.log("url:", BASE);
console.log("frame counter:", f1, "->", f2);
console.log("canvas elements:", canvas);
console.log("page/request errors:", errors.length ? errors : "none");

const ok = f2 > f1 && f1 >= 0 && canvas === 1 && errors.length === 0;
console.log(ok ? "LIVE PROBE: PASS" : "LIVE PROBE: FAIL");
process.exit(ok ? 0 : 1);
