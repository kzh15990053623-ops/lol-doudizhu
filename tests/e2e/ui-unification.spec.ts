import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { createDeck, createInitialGame, gameReducer, HERO_BY_ID, saveSession, sortHand, validSavedGame, type GameState } from '../../src/domain';

const viewports = [
  { name: 'desktop', width: 1600, height: 900, compact: false },
  { name: 'desktop-1440', width: 1440, height: 900, compact: false },
  { name: 'desktop-1280', width: 1280, height: 720, compact: false },
  { name: 'tablet', width: 1024, height: 600, compact: true },
  { name: 'landscape', width: 844, height: 390, compact: true },
  { name: 'short-landscape', width: 812, height: 375, compact: true },
  { name: 'wide-phone', width: 932, height: 430, compact: true },
  { name: 'wide-short-phone', width: 915, height: 412, compact: true },
] as const;

async function waitForArt(page: Page) {
  await expect.poll(() => page.locator('img:visible').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete))).toBe(true);
}

async function expectInside(element: Locator, container?: Locator) {
  const rect = await element.boundingBox();
  expect(rect, 'element must have a rendered box').not.toBeNull();
  const bounds = container ? await container.boundingBox() : { x: 0, y: 0, ...element.page().viewportSize()! };
  expect(bounds, 'container must have a rendered box').not.toBeNull();
  expect(rect!.x).toBeGreaterThanOrEqual(bounds!.x - 1);
  expect(rect!.y).toBeGreaterThanOrEqual(bounds!.y - 1);
  expect(rect!.x + rect!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width + 1);
  expect(rect!.y + rect!.height).toBeLessThanOrEqual(bounds!.y + bounds!.height + 1);
}

async function expectHandCornerVisible(card: Locator, hand: Locator, selected: boolean) {
  // The shared card face always begins with the unified rank/suit corner block.
  await expectInside(card.locator(':scope > span').first(), hand);
  if (!selected) return;
  await expect(card).toHaveAttribute('aria-pressed', 'true');
  const mark = card.getByText('✓', { exact: true });
  await expectInside(mark, hand);
  const uncovered = await mark.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return hit?.closest('button') === element.closest('button');
  });
  expect(uncovered, 'a selected check mark must remain readable above adjacent cards').toBe(true);
}

async function expectTableCardVisible(card: Locator, play: Locator) {
  await expectInside(card, play);
  const corner = card.locator(':scope > span').first();
  await expectInside(corner, play);
  const layout = await card.evaluate(element => ({
    cardHeight: element.getBoundingClientRect().height,
    pileHeight: element.parentElement!.clientHeight,
  }));
  expect(layout.pileHeight, 'the played-card viewport must fit a complete card face').toBeGreaterThanOrEqual(layout.cardHeight - 1);
  const readable = await corner.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return hit?.closest('[role="img"]') === element.closest('[role="img"]');
  });
  expect(readable, 'the rank/suit corner must not be covered by the action bar or another layer').toBe(true);
}

function longPairSequence(): GameState {
  let game = createInitialGame('ui-long-pair-sequence');
  game.heroChoices = [HERO_BY_ID.caitlyn];
  game = gameReducer(game, { type: 'chooseHero', heroId: 'caitlyn' });
  game = gameReducer(game, { type: 'bid', call: true });

  // A fixed, physically valid deal: nine consecutive pairs plus two jokers.
  // Only the deal is arranged; the actual play, response queue, history, and
  // discard pile are produced by the same reducer used by the live game.
  const deck = createDeck();
  const sequence = Array.from({ length: 9 }, (_, index) => deck.filter(card => card.value === index + 3).slice(0, 2)).flat();
  const landlordHand = [...sequence, ...deck.filter(card => card.joker)];
  const assigned = new Set(landlordHand.map(card => card.id));
  const rest = deck.filter(card => !assigned.has(card.id));
  game.players[0].hand = sortHand(landlordHand);
  game.players[1].hand = sortHand(rest.slice(0, 17));
  game.players[2].hand = sortHand(rest.slice(17));
  game.bottomCards = landlordHand.slice(-3);
  game.knownCards = [];
  expect(validSavedGame(game), 'the arranged deal must pass the production save validator').toBe(true);
  game = gameReducer(game, { type: 'play', playerId: 0, expectedTurnRevision: game.turnRevision, cardIds: sequence.map(card => card.id) });
  expect(game.currentPlay?.combo.type).toBe('pairSeq');
  expect(game.currentPlay?.cards).toHaveLength(18);
  expect(game.phase).toBe('playing');
  expect(validSavedGame(game), 'the played fixture must preserve all 54 cards and a consistent response queue').toBe(true);
  return game;
}

async function restoreGame(page: Page, game: GameState) {
  const saved = new Map<string, string>();
  expect(saveSession(game, { getItem: key => saved.get(key) ?? null, setItem: (key, value) => { saved.set(key, value); } })).toBe(true);
  await page.addInitScript(entries => {
    for (const [key, value] of entries) localStorage.setItem(key, value);
  }, [...saved]);
  // No seed/scenario parameters: exercise the application's real save restore.
  await page.goto('/?ai=off');
  await expect(page.getByText('已恢复上次牌局', { exact: true })).toBeVisible();
  await expect(page.getByRole('banner').getByText('已恢复上次牌局', { exact: true })).toBeVisible();
  await waitForArt(page);
}

for (const viewport of viewports) {
  test(`${viewport.width}×${viewport.height} 中央牌、双 AI、操作区和选中手牌完整可见`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/?seed=ui-${viewport.name}&scenario=game&ai=off`);
    await waitForArt(page);
    const hand = page.getByTestId('player-hand');
    const cards = hand.getByRole('button');
    await expect(cards).toHaveCount(20);
    const actions = page.getByRole('region', { name: '出牌操作', exact: true });
    await expectInside(actions);
    const actionButtons = actions.getByRole('button');
    for (const button of await actionButtons.all()) {
      await expectInside(button);
      if (viewport.compact) {
        const box = (await button.boundingBox())!;
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
    const opponents = page.locator('section[aria-label*="剩余"]').filter({ hasNot: page.getByRole('heading', { name: '你的手牌' }) });
    const opponentSeats = opponents.filter({ has: page.getByRole('button', { name: /^查看.*技能详情/ }) });
    await expect(opponentSeats).toHaveCount(2);
    for (const seat of await opponentSeats.all()) {
      await expectInside(seat);
      await expectInside(seat.getByRole('button'), seat);
    }

    // Keyboard selection avoids targeting card centers hidden by the fan.
    await cards.first().focus();
    await cards.first().press('Space');
    await expectHandCornerVisible(cards.first(), hand, true);
    await cards.first().press('ArrowRight');
    await cards.nth(1).press('Space');
    await expectHandCornerVisible(cards.first(), hand, true);
    await expectHandCornerVisible(cards.nth(1), hand, true);
    await cards.nth(1).press('End');
    await expect(cards.last()).toBeFocused();
    await cards.last().press('Space');
    await expectHandCornerVisible(cards.last(), hand, true);
    const handLayout = await hand.evaluate(element => ({
      overflowing: element.scrollWidth > element.clientWidth,
      atRight: element.scrollLeft + element.clientWidth >= element.scrollWidth - 4,
      steps: [...element.querySelectorAll('button')].slice(1).map(button => button.offsetLeft - (button.previousElementSibling as HTMLElement).offsetLeft),
    }));
    if (viewport.compact) {
      if (viewport.width <= 900) expect(handLayout.overflowing).toBe(true);
      expect(handLayout.atRight).toBe(true);
      expect(handLayout.steps.every(step => step >= 44)).toBe(true);
    }
    await page.keyboard.press('Escape');
    await cards.first().focus();
    await cards.first().press('Space');
    await page.getByRole('button', { name: /^出牌/ }).click();
    const center = page.getByRole('region', { name: '中央出牌区', exact: true });
    const play = center.getByRole('group', { name: /打出的单牌/ });
    const centralCard = play.getByRole('img');
    await expect(centralCard).toHaveCount(1);
    const width = await centralCard.evaluate(element => parseFloat(getComputedStyle(element).width));
    if (viewport.compact) expect(width).toBeCloseTo(56, 0);
    else expect(width).toBeGreaterThanOrEqual(72);
    await expectTableCardVisible(centralCard, play);
    await expectInside(play);
    await expectInside(actions);
    await expect(actions).toContainText('等待对手');
    await expect(center.getByText(/轮到你 ·|你获得首出权 ·|选择任意合法牌型|正在行动|思考中…/)).toHaveCount(0);
    if (viewport.height < 386) await expect(center.getByLabel('三张底牌', { exact: true })).toBeHidden();
    else await expect(center.getByLabel('三张底牌', { exact: true })).toBeVisible();
    const overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth - innerWidth, height: document.documentElement.scrollHeight - innerHeight }));
    expect(overflow.width).toBeLessThanOrEqual(1);
    expect(overflow.height).toBeLessThanOrEqual(1);
    await test.info().attach(`ui-${viewport.name}.png`, { body: await page.screenshot(), contentType: 'image/png' });
  });

  test(`${viewport.width}×${viewport.height} 合法十八张连对保留每张牌角或可横向浏览`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await restoreGame(page, longPairSequence());
    const play = page.getByRole('group', { name: /打出的连对/ });
    const cards = play.getByRole('img');
    await expect(cards).toHaveCount(18);
    await expectInside(play);
    const layout = await play.evaluate(element => {
      const cards = [...element.querySelectorAll('[role="img"]')] as HTMLElement[];
      return {
        step: cards.slice(1).map((card, index) => card.offsetLeft - cards[index].offsetLeft),
        scrollable: element.scrollWidth > element.clientWidth,
        overflow: getComputedStyle(element).overflowX,
      };
    });
    expect(layout.step.every(step => step >= 24), 'every overlapped card must expose at least a 24px column').toBe(true);
    if (layout.scrollable) expect(['auto', 'scroll']).toContain(layout.overflow);
    await play.evaluate(element => { element.scrollLeft = 0; });
    await expectTableCardVisible(cards.first(), play);
    await play.evaluate(element => { element.scrollLeft = element.scrollWidth; });
    await expectTableCardVisible(cards.last(), play);
    await expectInside(page.getByRole('region', { name: '出牌操作', exact: true }));
    await test.info().attach(`ui-long-combo-${viewport.name}.png`, { body: await page.screenshot(), contentType: 'image/png' });
  });
}

for (const viewport of viewports.filter(viewport => viewport.name.startsWith('wide-'))) {
  test(`${viewport.width}×${viewport.height} 宽屏手机练习保留进度、技能与出牌牌角`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?ai=off');
    await page.getByRole('button', { name: '两分钟上手练习', exact: true }).click();
    const progress = page.getByLabel('操作练习', { exact: true });
    await expectInside(progress);
    await expectInside(progress.getByRole('button'));
    const hand = page.getByTestId('player-hand');
    await hand.getByRole('button').first().click();
    await page.getByRole('button', { name: /^提示/ }).click();
    await expectHandCornerVisible(hand.getByRole('button', { pressed: true }).first(), hand, true);
    await page.getByRole('button', { name: /^(超究极死神飞弹|技能)/ }).click();
    await page.getByRole('button', { name: '确认发动', exact: true }).click();
    await page.getByRole('button', { name: /^出牌/ }).click();
    await expect(progress).toContainText('✓ 完成');
    const play = page.getByRole('group', { name: /打出的/ }).first();
    await expectTableCardVisible(play.getByRole('img').first(), play);
    await expectInside(page.getByRole('region', { name: '出牌操作', exact: true }));
    await test.info().attach(`ui-practice-${viewport.name}.png`, { body: await page.screenshot(), contentType: 'image/png' });
  });
}

test('844×350 过牌动作在折叠播报后仍保留于中央横幅', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 350 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const initial = longPairSequence();
  const passed = gameReducer(initial, { type: 'pass', playerId: initial.turnPlayerId, expectedTurnRevision: initial.turnRevision });
  expect(passed.passCount).toBe(1);
  await restoreGame(page, passed);
  const center = page.getByRole('region', { name: '中央出牌区', exact: true });
  const action = center.getByText(`${initial.players[initial.turnPlayerId].name} 不要`, { exact: true });
  await expect(action).toBeVisible();
  await expectInside(action, center);
  await expect(center.getByText('过牌 1/2', { exact: true })).toBeVisible();
  await expectInside(page.getByRole('region', { name: '出牌操作', exact: true }));
});

test('@a11y 844×390 新横幅与设置弹窗通过 axe A/AA', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await restoreGame(page, longPairSequence());
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: '菜单', exact: true }).click();
  await page.getByRole('button', { name: /牌桌设置/ }).click();
  await expect(page.getByRole('dialog', { name: '牌桌设置', exact: true })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
});
