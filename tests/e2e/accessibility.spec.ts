import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const previewPath = "/";

async function expectNoAaViolations(page: Page, state: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(results.violations, `${state}: ${results.violations.map((violation) => `${violation.id}(${violation.nodes.length})`).join(", ")}`).toEqual([]);
}

test("@a11y 英雄选择、牌局、设置与图鉴通过 axe A/AA", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${previewPath}?seed=axe-main&ai=off`);
  await expectNoAaViolations(page, "英雄选择");

  await page.getByRole("button", { name: /^选择 / }).first().click();
  await page.getByRole("button", { name: "抢地主" }).click();
  await expectNoAaViolations(page, "牌局");

  await page.getByRole("button", { name: "设置" }).click();
  await expect(page.getByRole("dialog", { name: "牌桌设置" })).toBeVisible();
  await expectNoAaViolations(page, "设置");
  await page.getByRole("button", { name: "关闭" }).click();

  await page.getByRole("button", { name: "图鉴" }).click();
  await expect(page.getByRole("dialog", { name: "符文图鉴" })).toBeVisible();
  await expectNoAaViolations(page, "图鉴");
});

test("@a11y 结果弹窗通过 axe A/AA", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${previewPath}?seed=axe-result&scenario=result&ai=off`);
  await expect(page.getByRole("dialog", { name: /胜利/ })).toBeVisible();
  await expectNoAaViolations(page, "结果");
});
