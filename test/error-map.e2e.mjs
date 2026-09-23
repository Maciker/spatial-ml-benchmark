import { spawn } from "node:child_process";
import { chromium } from "playwright";

const preview = spawn("pnpm", ["--filter", "@gis/spatial-ml-benchmark-web", "preview"], {
  stdio: ["ignore", "pipe", "pipe"],
});

function waitFor(text, stream) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Preview did not start")), 20_000);
    stream.on("data", (chunk) => {
      const message = String(chunk);
      if (message.includes(text) || message.includes("4173")) {
        clearTimeout(timer);
        resolve(undefined);
      }
    });
  });
}

try {
  await waitFor("4173", preview.stdout);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  const first = page.locator("tbody tr").first();
  await first.click();
  const sample = (await first.locator("td").first().textContent())?.trim();
  const selected = await page.locator("tbody tr[data-selected='true'] td").first().textContent();
  if (!sample || selected?.trim() !== sample) {
    throw new Error("Map report and table did not select the same sample");
  }
  await browser.close();
  console.log(`e2e selected ${sample}`);
} finally {
  preview.kill("SIGKILL");
}
process.exit(0);
