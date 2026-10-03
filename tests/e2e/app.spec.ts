import { expect, test } from "@playwright/test";
import sharp from "sharp";

const previewPath = "/";

async function waitForVisuals(page: import("@playwright/test").Page) {
  await page.waitForLoadState("networkidle");
  await page.locator("img").first().waitFor({ state: "visible" });
  await expect
    .poll(() => page.locator("img:visible").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete)))
    .toBe(true);
}

test("完整键盘主流程：选英雄、抢地主、选牌、弹层、提示与出牌", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${previewPath}?seed=e2e-flow&ai=off`);
  await page.getByRole("button", { name: /^选择 / }).first().click();
  await page.getByRole("button", { name: "抢地主" }).click();

  const hand = page.getByRole("group", { name: /你的手牌/ });
  const cards = hand.getByRole("button");
  const initialCount = await cards.count();
  const firstCard = cards.first();
  await firstCard.focus();
  await firstCard.press("Space");
  await expect(firstCard).toHaveAttribute("aria-pressed", "true");
  await expect(firstCard).toBeFocused();

  const settingsTrigger = page.getByRole("button", { name: "设置" });
  await settingsTrigger.focus();
  await settingsTrigger.press("Enter");
  await expect(page.getByRole("dialog", { name: "牌桌设置" })).toBeVisible();
  await expect(page.getByText("等待首出")).toBeVisible();
  await expect(cards).toHaveCount(initialCount);
  await page.getByRole("button", { name: "关闭" }).click();
  await expect(settingsTrigger).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(firstCard).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: /^提示/ }).click();
  const suggested = hand.locator('button[aria-pressed="true"]');
  await expect(suggested.first()).toBeFocused();
  const suggestedCount = await suggested.count();
  expect(suggestedCount).toBeGreaterThan(0);
  await page.keyboard.press("p");
  await expect(cards).toHaveCount(initialCount - suggestedCount);
});

for (const viewport of [
  { name: "desktop-large", width: 1440, height: 900 },
  { name: "desktop-compact", width: 1280, height: 720 },
  { name: "mobile-landscape", width: 812, height: 375 },
] as const) {
  test(`${viewport.name} 无页面溢出且主要操作完整可见`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`${previewPath}?seed=layout-${viewport.name}&scenario=game&ai=off`);
    await waitForVisuals(page);
    const dimensions = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      pageWidth: document.documentElement.scrollWidth,
      pageHeight: document.documentElement.scrollHeight,
    }));
    expect(dimensions.pageWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
    expect(dimensions.pageHeight).toBeLessThanOrEqual(dimensions.viewportHeight);
    const actionBar = await page.getByRole("region", { name: "出牌操作" }).boundingBox();
    expect(actionBar).not.toBeNull();
    expect((actionBar?.y ?? 0) + (actionBar?.height ?? 0)).toBeLessThanOrEqual(viewport.height + 1);

    if (viewport.width === 812) {
      await expect(page.getByRole("button", { name: "菜单" })).toBeVisible();
      await expect(page.getByRole("button", { name: "设置" })).toBeHidden();
      const undersizedButtons = await page.locator("button:visible").evaluateAll((buttons) =>
        buttons
          .map((button) => {
            const rect = button.getBoundingClientRect();
            return { label: button.getAttribute("aria-label") || button.textContent?.trim(), width: rect.width, height: rect.height };
          })
          .filter((button) => button.width < 44 || button.height < 44),
      );
      expect(undersizedButtons).toEqual([]);

      await page.getByRole("button", { name: "菜单" }).click();
      await page.getByRole("button", { name: /牌桌设置/ }).click();
      const returnToDraft = page.getByRole("button", { name: "返回英雄选择" });
      await returnToDraft.scrollIntoViewIfNeeded();
      const returnToDraftBox = await returnToDraft.boundingBox();
      expect(returnToDraftBox).not.toBeNull();
      expect(returnToDraftBox?.y ?? -1).toBeGreaterThanOrEqual(0);
      expect((returnToDraftBox?.y ?? 0) + (returnToDraftBox?.height ?? 0)).toBeLessThanOrEqual(viewport.height + 1);
      await returnToDraft.click({ trial: true });
      await page.getByRole("button", { name: "关闭" }).click();
    }

    await test.info().attach(`${viewport.name}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });
}

test("390×844 竖屏显示完全不透底的旋转门禁并暂停牌桌", async ({ page }) => {
  await page.setViewportSize({ width: 812, height: 375 });
  await page.goto(`${previewPath}?seed=portrait&scenario=game`);
  await page.getByRole("button", { name: "提示" }).click();
  await page.getByRole("button", { name: "出牌" }).click();
  const activeTurn = page.locator('[aria-label*="当前行动"]');
  const pausedTurn = await activeTurn.getAttribute("aria-label");
  expect(pausedTurn).toBeTruthy();

  await page.setViewportSize({ width: 390, height: 844 });
  const gate = page.getByRole("dialog", { name: "请旋转设备" });
  await expect(gate).toBeVisible();
  await expect(page.getByTestId("game-canvas")).toHaveAttribute("aria-hidden", "true");
  await page.waitForTimeout(900);
  expect(await activeTurn.getAttribute("aria-label")).toBe(pausedTurn);
  const gateStyle = await gate.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return { backgroundColor: style.backgroundColor, width: rect.width, height: rect.height };
  });
  expect(gateStyle.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(gateStyle.width).toBe(390);
  expect(gateStyle.height).toBe(844);

  await page.setViewportSize({ width: 812, height: 375 });
  await expect(gate).toBeHidden();
  await expect.poll(() => activeTurn.getAttribute("aria-label")).not.toBe(pausedTurn);
});

test("相同 seed 的英雄选择截图可重复", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${previewPath}?seed=visual-replay&ai=off`);
  await waitForVisuals(page);
  const first = await page.locator("main").screenshot();
  await page.reload();
  await waitForVisuals(page);
  const second = await page.locator("main").screenshot();
  const [firstPixels, secondPixels] = await Promise.all([
    sharp(first).raw().toBuffer({ resolveWithObject: true }),
    sharp(second).raw().toBuffer({ resolveWithObject: true }),
  ]);
  expect(secondPixels.info).toEqual(firstPixels.info);
  let changedPixels = 0;
  for (let offset = 0; offset < firstPixels.data.length; offset += firstPixels.info.channels) {
    let changed = false;
    for (let channel = 0; channel < firstPixels.info.channels; channel += 1) {
      if (Math.abs(firstPixels.data[offset + channel] - secondPixels.data[offset + channel]) > 4) changed = true;
    }
    if (changed) changedPixels += 1;
  }
  const totalPixels = firstPixels.info.width * firstPixels.info.height;
  expect(changedPixels / totalPixels).toBeLessThan(0.001);
});
