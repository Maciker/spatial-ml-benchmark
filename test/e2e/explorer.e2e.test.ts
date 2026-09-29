import { expect, test } from "@playwright/test";

test.describe("The benchmark explorer", () => {
  test("loads the map and manifest-driven controls", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Spatial ML Benchmark" })).toBeVisible();
    await expect(page.getByLabel("Prediction error map")).toBeVisible();
    await expect(page.getByText(/Showing \d+ evaluation points/)).toBeVisible();
  });

  test("surfaces spatial-group leakage when random split is selected", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Split scheme").selectOption("random");
    await expect(
      page.getByText("Random fold shares spatial groups between train and test partitions"),
    ).toHaveCount(2);

    await page.getByLabel("Split scheme").selectOption("spatial");
    await expect(
      page.getByText("Random fold shares spatial groups between train and test partitions"),
    ).toHaveCount(0);
  });

  test("allows keyboard focus on split and model selectors", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Split scheme").focus();
    await expect(page.getByLabel("Split scheme")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Model")).toBeFocused();
  });

  test("lists metrics for every fold of the selected scheme and model", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Split scheme").selectOption("spatial");
    await page.getByLabel("Model").selectOption("majority");

    await expect(page.getByText("fold 0 preview")).toHaveCount(0);
    await expect(page.getByRole("row", { name: /Fold 0/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /Fold 1/ })).toBeVisible();

    await page.getByLabel("Split scheme").selectOption("random");
    await expect(page.getByRole("row", { name: /Fold 0/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /Fold 1/ })).toBeVisible();
    await expect(
      page.getByText("Random fold shares spatial groups between train and test partitions"),
    ).toHaveCount(2);
  });

  test("uses the fold selector only to change map predictions", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Split scheme").selectOption("spatial");
    await page.getByLabel("Model").selectOption("majority");
    await page.getByLabel("Map fold").selectOption("0");

    const fold0Text = page.getByText(/Showing \d+ evaluation points for fold 0/);
    await expect(fold0Text).toBeVisible();
    const fold0Count = Number((await fold0Text.textContent())?.match(/Showing (\d+)/)?.[1]);

    await page.getByLabel("Map fold").selectOption("1");
    const fold1Text = page.getByText(/Showing \d+ evaluation points for fold 1/);
    await expect(fold1Text).toBeVisible();
    const fold1Count = Number((await fold1Text.textContent())?.match(/Showing (\d+)/)?.[1]);

    expect(fold0Count).toBeGreaterThan(0);
    expect(fold1Count).toBeGreaterThan(0);
    await expect(page.getByRole("row", { name: /Fold 0/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /Fold 1/ })).toBeVisible();
  });

  test("shows hit and miss point details from the manifest", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Split scheme").selectOption("spatial");
    await page.getByLabel("Model").selectOption("majority");
    await page.getByLabel("Map fold").selectOption("0");

    await page.getByRole("button", { name: "Sample 27722418" }).click();
    const detail = page.getByRole("region", { name: "Selected point detail" });
    await expect(detail).toContainText("Sample ID: 27722418");
    await expect(detail).toContainText("Spatial group: es11-galicia");
    await expect(detail).toContainText("True label: 0");
    await expect(detail).toContainText("Predicted label: 0");
    await expect(detail).toContainText("Model: majority");
    await expect(detail).toContainText("Scheme: spatial");
    await expect(detail).toContainText("Fold: 0");

    await page.getByRole("button", { name: "Sample 27682414" }).click();
    await expect(detail).toContainText("Sample ID: 27682414");
    await expect(detail).toContainText("True label: 1");
    await expect(detail).toContainText("Predicted label: 0");
  });

  test("selects a point detail via keyboard", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Split scheme").selectOption("spatial");
    await page.getByLabel("Model").selectOption("majority");
    await page.getByLabel("Map fold").selectOption("0");

    await page.getByRole("button", { name: "Sample 27722418" }).focus();
    await expect(page.getByRole("button", { name: "Sample 27722418" })).toBeFocused();
    await page.keyboard.press("Enter");

    const detail = page.getByRole("region", { name: "Selected point detail" });
    await expect(detail).toContainText("Sample ID: 27722418");
    await expect(detail).toContainText("Predicted label: 0");
  });

  test("keeps Galicia and Andalusia points visible with external network blocked", async ({
    page,
  }) => {
    const blockedHosts: string[] = [];
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      const isLocal =
        url.hostname === "127.0.0.1" ||
        url.hostname === "localhost" ||
        url.hostname === "[::1]";
      if (!isLocal) {
        blockedHosts.push(url.host);
        await route.abort();
        return;
      }
      await route.continue();
    });

    await page.goto("/");

    await page.getByLabel("Split scheme").selectOption("spatial");
    await page.getByLabel("Model").selectOption("majority");

    await expect(page.getByLabel("Prediction error map")).toBeVisible();
    await expect(page.getByText(/coordinate\/group map \(no basemap\)/i)).toBeVisible();

    await page.getByLabel("Map fold").selectOption("0");
    await expect(page.getByText(/Showing \d+ evaluation points for fold 0/)).toBeVisible();
    await page.getByRole("button", { name: "Sample 27722418" }).click();
    const detail = page.getByRole("region", { name: "Selected point detail" });
    await expect(detail).toContainText("Spatial group: es11-galicia");

    await page.getByLabel("Map fold").selectOption("1");
    await expect(page.getByText(/Showing \d+ evaluation points for fold 1/)).toBeVisible();
    await page.getByRole("button", { name: "Sample 28221754" }).click();
    await expect(detail).toContainText("Spatial group: es61-andalusia");

    expect(blockedHosts.some((host) => host.includes("demotiles.maplibre.org"))).toBe(false);
  });
});
