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
});
