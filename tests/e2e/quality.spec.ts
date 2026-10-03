import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createInitialGame } from '../../src/domain';

const heroSeed = (hero: string) => {
  for (let seed = 1; seed < 100; seed++) if (createInitialGame(String(seed)).heroChoices.some(choice => choice.id === hero)) return seed;
  throw new Error('No candidate seed');
};

test('技能确认可取消，状态和侦查记录可读取，新增弹层通过 axe @a11y', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`/?seed=${heroSeed('teemo')}&ai=off`);
  await page.getByRole('button', { name: '选择 提莫', exact: true }).click();
  await page.getByRole('button', { name: '抢地主', exact: true }).click();
  const skill = page.getByRole('button', { name: /^种蘑菇/ });
  await skill.click();
  await expect(page.getByRole('dialog', { name: '种蘑菇', exact: true })).toBeVisible();
  await expect(page.getByLabel('技能目标').locator('option')).toHaveCount(2);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await expect(skill).toBeEnabled();
  await skill.click(); await page.getByRole('button', { name: '确认发动', exact: true }).click();
  await expect(skill).toBeDisabled();
  await page.getByRole('button', { name: '记录', exact: true }).click();
  const history = page.getByRole('dialog', { name: '对局记录与状态', exact: true });
  await expect(history).toContainText('蘑菇：下次普通牌 −1');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '战绩', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '我的战绩' })).toContainText('0/12');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
});

test('刷新恢复牌局与预期行动者，放弃前确认', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/?ai=off');
  await page.getByRole('button', { name: /^选择 / }).first().click();
  await page.getByRole('button', { name: '抢地主', exact: true }).click();
  const hand = page.getByTestId('player-hand');
  await hand.getByRole('button').first().click(); await page.getByRole('button', { name: /^出牌/ }).click();
  const actor = await page.locator('section[aria-label*="当前行动"]').getAttribute('aria-label');
  const labels = await hand.getByRole('button').allTextContents();
  await page.reload();
  await expect(page.getByText('已恢复上次牌局', { exact: true })).toBeVisible();
  expect(await hand.getByRole('button').allTextContents()).toEqual(labels);
  await expect(page.locator('section[aria-label*="当前行动"]')).toHaveAttribute('aria-label', actor!);
  await page.getByRole('button', { name: '设置', exact: true }).click();
  await page.getByRole('button', { name: '返回英雄选择' }).click();
  await expect(page.getByRole('dialog', { name: '放弃当前牌局？' })).toBeVisible();
  await page.getByRole('button', { name: '继续当前牌局' }).click();
  await expect(hand.getByRole('button')).toHaveCount(19);
  await page.getByRole('button', { name: '设置', exact: true }).click(); await page.getByRole('button', { name: '返回英雄选择' }).click(); await page.getByRole('button', { name: '放弃并重新选英雄' }).click();
  await expect(page.getByRole('heading', { name: '选择你的英雄' })).toBeVisible();
  await page.reload(); await expect(page.getByRole('heading', { name: '选择你的英雄' })).toBeVisible();
});

for (const width of [667, 812]) {
  test(`${width} 横屏实际手牌点击宽度达到 44px，滑动浏览不出牌`, async ({ page }) => {
    await page.setViewportSize({ width, height: 375 });
    await page.goto('/?seed=draft-final&ai=off');
    const draftCards = page.locator('article').filter({ has: page.getByRole('button', { name: /^选择 / }) });
    const blockedCards = await draftCards.evaluateAll(cards => cards.filter(card => {
      const details = card.querySelector('button')!.getBoundingClientRect();
      const choose = card.querySelectorAll('button')[1].getBoundingClientRect();
      const descriptions = [...card.querySelectorAll('p')].map(element => element.getBoundingClientRect());
      return descriptions.some(rect => rect.bottom > details.top) || choose.bottom > innerHeight;
    }).length);
    expect(blockedCards).toBe(0);
    await page.goto('/?seed=touch-audit&scenario=game&ai=off');
    const result = await page.getByTestId('player-hand').evaluate(element => {
      const buttons = [...element.querySelectorAll('button')]; const rects = buttons.map(button => button.getBoundingClientRect());
      return { exposed: rects.slice(0,-1).map((rect,index) => rects[index+1].x - rect.x), scrollable: element.scrollWidth > element.clientWidth };
    });
    expect(result.exposed.every(width => width >= 44)).toBe(true); expect(result.scrollable).toBe(true);
    await page.getByTestId('player-hand').evaluate(element => { element.scrollLeft = element.scrollWidth; });
    await expect(page.getByTestId('player-hand').getByRole('button').last()).toBeInViewport();
    await expect(page.getByTestId('player-hand').getByRole('button')).toHaveCount(20);
    const play = page.getByRole('button', { name: '出牌', exact: true });
    expect(await play.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
    await expect(play).toBeInViewport();
  });
}

test('visibilitychange 暂停与恢复 AI，等待期间保留预选', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/?seed=visibility-lifecycle&scenario=game');
  await page.getByRole('button', { name: /^提示/ }).click(); await page.getByRole('button', { name: /^出牌/ }).click();
  const actor = await page.locator('section[aria-label*="当前行动"]').getAttribute('aria-label');
  const chosen = page.getByTestId('player-hand').getByRole('button').first();
  await chosen.click(); const label = (await chosen.getAttribute('aria-label'))!.replace('，已选择','');
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable:true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(1100); await expect(page.locator('section[aria-label*="当前行动"]')).toHaveAttribute('aria-label', actor!);
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable:true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.locator('section[aria-label*="当前行动"]')).not.toHaveAttribute('aria-label', actor!, { timeout: 10000 });
  await expect(page.getByTestId('player-hand').getByRole('button', { name: `${label}，已选择`, exact:true })).toHaveAttribute('aria-pressed','true');
});

test('固定练习通过提示、确认技能、出牌触发城邦，退出不计战绩', async ({ page }) => {
  await page.setViewportSize({ width: 812, height: 375 }); await page.goto('/?ai=off');
  await page.getByRole('button', { name: '两分钟上手练习' }).click();
  await page.getByTestId('player-hand').getByRole('button').first().click();
  await page.getByRole('button', { name: '提示', exact:true }).click();
  await page.getByRole('button', { name: '技能', exact:true }).click();
  await page.getByRole('button', { name: '确认发动', exact:true }).click();
  await page.getByRole('button', { name: '出牌', exact:true }).click();
  await expect(page.getByLabel('操作练习')).toContainText('✓ 完成');
  await page.getByRole('button', { name: '开始正式对局', exact:true }).click();
  await page.getByRole('button', { name: /我的战绩/ }).click();
  await expect(page.getByRole('dialog', { name: '我的战绩' })).toContainText('练习局不计入');
});

test('从发牌到真实结算，再来一局沿用英雄且仅记一次战绩', async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/?seed=complete-game');
  await page.getByRole('button', { name: '设置', exact:true }).click(); await page.getByLabel('快速', {exact:false}).check();
  await page.getByRole('checkbox').uncheck(); await page.getByRole('button', { name: '关闭', exact:true }).click();
  await page.getByRole('button', { name: /^选择 / }).first().click();
  const hero = await page.locator('section[aria-label^="你，"]').getAttribute('aria-label');
  await page.getByRole('button', { name: '抢地主', exact:true }).click();
  for (let step = 0; step < 80; step++) {
    await expect.poll(async () => await page.getByRole('dialog').isVisible() || await page.getByRole('button', { name: /^提示/ }).isEnabled(), {timeout:10000}).toBe(true);
    if (await page.getByRole('dialog').isVisible()) break;
    await page.getByRole('button', { name: /^提示/ }).click();
    if (await page.getByRole('button', { name: /^出牌/ }).isEnabled()) await page.getByRole('button', { name: /^出牌/ }).click();
    else await page.getByRole('button', { name: /^不要/ }).click();
  }
  await expect(page.getByRole('dialog', { name: /胜利/ })).toBeVisible();
  const records = await page.evaluate(() => JSON.parse(localStorage.getItem('runeterra-ddz-profile-v2')!).profile.records);
  expect(records).toHaveLength(1);
  await page.getByRole('button', { name: '再来一局', exact:true }).click();
  await expect(page.getByRole('region', { name: '抢地主操作' })).toBeVisible();
  expect((await page.locator('section[aria-label^="你，"]').getAttribute('aria-label'))!.split('，')[1]).toBe(hero!.split('，')[1]);
});
