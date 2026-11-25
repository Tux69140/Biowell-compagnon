import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

const ROOT = process.cwd();
const DEFAULT_APP_URL = pathToFileURL(path.join(ROOT, "dist", "index.html")).href;
const appUrl = process.env.E2E_APP_URL ?? DEFAULT_APP_URL;

const docsFile = (name: string) => path.join(ROOT, "docs", name);

test.describe("analyse Bio-Well", () => {
  test("analyse 3 rapports individuels", async ({ page }) => {
    await page.goto(appUrl);
    await page.setViewportSize({ width: 1440, height: 900 });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      docsFile("2026-05-21 16_44 - Aline (paramètres).csv"),
      docsFile("2026-05-21 16_50 - Aline (paramètres).csv"),
      docsFile("2026-05-21 16_56 - Aline (paramètres).csv"),
    ]);

    await expect(page.getByText("3 fichiers importés")).toBeVisible();

    await page.getByRole("button", { name: "Analyser" }).click();
    await expect(
      page.locator("p.eyebrow").filter({ hasText: "Rapport le plus représentatif" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Exporter les moyennes CSV (simple)" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Exporter CSV détaillé" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Exporter XLS coloré" })).toBeVisible();
  });

  test("analyse un CSV regroupé", async ({ page }) => {
    await page.goto(appUrl);
    await page.setViewportSize({ width: 1440, height: 900 });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([docsFile("Comparer les paramètres 2026-06-17 09_17.csv")]);

    await expect(page.getByText("1 fichier importé")).toBeVisible();
    await page.getByRole("button", { name: "Analyser" }).click();
    await expect(
      page.locator("p.eyebrow").filter({ hasText: "Rapport le plus représentatif" })
    ).toBeVisible();
    await expect(page.locator("small").filter({ hasText: "rapports analysés" })).toBeVisible();
  });
});
