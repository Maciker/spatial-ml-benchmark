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
    await expect(page.getByText("Random fold shares spatial groups between train and test partitions")).toBeVisible();

    await page.getByLabel("Split scheme").selectOption("spatial");
    await expect(page.getByText("Random fold shares spatial groups between train and test partitions")).toHaveCount(0);
  });

  test("allows keyboard focus on split and model selectors", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Split scheme").focus();
    await expect(page.getByLabel("Split scheme")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Model")).toBeFocused();
  });
});
