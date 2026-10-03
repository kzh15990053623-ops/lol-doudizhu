import { describe, expect, it } from "vitest";
import {
  HERO_BY_ID,
  analyzeSelection,
  applyComparisonBuff,
  canBeat,
  classifyCards,
  createDeck,
  createInitialGame,
  generateCandidates,
  getSkillAvailability,
  gameReducer,
  loadSettings,
  saveSettings,
  sortHand,
  suggestPlays,
  validSavedGame,
} from "..";
import type { Card, GameState, Player, PlayerBuffs } from "..";

let nextCardId = 1000;

function card(rank: string, value: number, suit = "♠"): Card {
  return { id: nextCardId++, rank, value, suit, red: suit === "♥" || suit === "♦", ...(value >= 16 ? { joker: true as const } : {}) };
}

function player(heroId = "garen", buffs: PlayerBuffs = {}, hand: Card[] = [], id = 0): Player {
  return {
    id,
    name: id === 0 ? "测试玩家" : `测试对手 ${id}`,
    hero: HERO_BY_ID[heroId as keyof typeof HERO_BY_ID],
    hand,
    role: id === 0 ? "地主" : "农民",
    usedSkill: false,
    buffs,
    warnedThree: false,
  };
}

function table(landlordHeroId = "garen"): GameState {
  const state = createInitialGame(42);
  state.phase = "playing";
  state.players = [player(landlordHeroId, {}, [], 0), player("ashe", {}, [], 1), player("jinx", {}, [], 2)];
  state.landlordId = 0;
  state.turnPlayerId = 0;
  state.firstLeadOfTrick = true;
  state.turnRevision = 1;
  return state;
}

function frozenPantheonTable(): { frozen: GameState; unfrozen: GameState; pairIds: number[] } {
  let state = createInitialGame("frozen-pantheon-regression");
  state.heroChoices = [HERO_BY_ID.pantheon];
  state = gameReducer(state, { type: "chooseHero", heroId: "pantheon" });
  state = gameReducer(state, { type: "bid", call: true });
  state.players[1].hero = HERO_BY_ID.ashe;
  state.players[2].hero = HERO_BY_ID.teemo;

  const deck = createDeck();
  const pair = deck.filter((item) => item.value === 9).slice(0, 2);
  const opening = deck.find((item) => item.value === 3)!;
  const response = deck.find((item) => item.value === 8)!;
  const assignedIds = new Set([opening.id, response.id, ...pair.map((item) => item.id)]);
  const remaining = deck.filter((item) => !assignedIds.has(item.id));
  state.players[0].hand = sortHand([opening, ...pair, ...remaining.slice(0, 17)]);
  state.players[1].hand = sortHand([response, ...remaining.slice(17, 33)]);
  state.players[2].hand = sortHand(remaining.slice(33));
  state.bottomCards = state.players[0].hand.slice(0, 3);
  expect(validSavedGame(state)).toBe(true);

  const act = (type: "play" | "pass" | "useSkill", extra: { cardIds?: number[]; targetId?: number } = {}) => {
    state = gameReducer(state, { type, playerId: state.turnPlayerId, expectedTurnRevision: state.turnRevision, ...extra } as Parameters<typeof gameReducer>[1]);
    expect(validSavedGame(state)).toBe(true);
  };
  act("useSkill");
  const unfrozen = state;
  act("play", { cardIds: [opening.id] });
  act("useSkill", { targetId: 0 });
  act("play", { cardIds: [response.id] });
  act("pass");
  expect(state.turnPlayerId).toBe(0);
  expect(state.players[0].buffs).toMatchObject({ pantheonPairBeatsSingle: true, frozen: true });
  return { frozen: state, unfrozen, pairIds: pair.map((item) => item.id) };
}

describe("牌型规则", () => {
  it("识别核心斗地主牌型", () => {
    const state = table();
    const actor = state.players[0];
    expect(classifyCards(state, [card("7", 7)], actor)?.type).toBe("single");
    expect(classifyCards(state, [card("9", 9), card("9", 9, "♥")], actor)?.type).toBe("pair");
    expect(classifyCards(state, [card("小王", 16, ""), card("大王", 17, "")], actor)?.type).toBe("rocket");
    expect(classifyCards(state, [card("3", 3), card("4", 4), card("5", 5), card("6", 6), card("7", 7)], actor)?.type).toBe("straight");
    expect(classifyCards(state, [card("J", 11), card("Q", 12), card("K", 13), card("A", 14), card("2", 15)], actor)).toBeNull();
  });

  it("应用英雄主动与艾欧尼亚场地修正", () => {
    const state = table("yasuo");
    const ashe = player("ashe");
    expect(classifyCards(state, [card("3", 3), card("4", 4), card("5", 5), card("6", 6)], ashe)?.type).toBe("straight");

    state.landlordId = null;
    const yasuo = player("yasuo", { yasuo: true });
    expect(classifyCards(state, [card("3", 3), card("4", 4), card("6", 6), card("7", 7), card("8", 8)], yasuo)?.label).toBe("踏前顺子");
    expect(classifyCards(state, [card("9", 9), card("9", 9, "♥")], player("pantheon", { pantheonPairBeatsSingle: true }))?.type).toBe("single");
  });

  it("比较炸弹、火箭、护盾与临时加成", () => {
    const state = table("pantheon");
    const garen = player("garen", { garen: true });
    const boosted = applyComparisonBuff(classifyCards(state, [card("8", 8)], garen)!, garen);
    expect(boosted.value).toBe(9);
    expect(canBeat(state, boosted, { playerId: 1, cards: [], combo: { type: "single", value: 8, length: 1, label: "单牌" } }, garen)).toBe(true);
    expect(canBeat(state, { type: "rocket", value: 99, length: 2, label: "火箭" }, { playerId: 1, cards: [], combo: { type: "bomb", value: 14, length: 4, label: "炸弹" } }, garen)).toBe(true);
    expect(canBeat(state, { type: "bomb", value: 6, length: 4, label: "炸弹" }, { playerId: 1, cards: [], combo: { type: "pair", value: 14, length: 2, label: "对子" } }, player("kaisa", { noBomb: true }))).toBe(false);
    state.players[0].buffs.pantheonShield = true;
    expect(canBeat(state, { type: "bomb", value: 6, length: 4, label: "炸弹" }, { playerId: 0, cards: [], combo: { type: "pair", value: 14, length: 2, label: "对子" } }, garen)).toBe(false);
  });

  it("为火箭、连对与长顺生成可执行提示", () => {
    const state = table();
    const hand = [
      card("小王", 16, ""),
      card("大王", 17, ""),
      card("3", 3),
      card("3", 3, "♥"),
      card("4", 4),
      card("4", 4, "♥"),
      card("5", 5),
      card("5", 5, "♥"),
    ];
    state.players[0].hand = hand;
    const candidates = generateCandidates(state, state.players[0]);
    expect(candidates.some((candidate) => candidate.combo.type === "rocket")).toBe(true);
    expect(candidates.some((candidate) => candidate.combo.type === "pairSeq" && candidate.cards.length === 6)).toBe(true);

    state.players[0].hand = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((value) => card(String(value), value));
    expect(generateCandidates(state, state.players[0]).some((candidate) => candidate.combo.type === "straight" && candidate.cards.length === 10)).toBe(true);
    expect(suggestPlays(state, 0)[0].cards).toHaveLength(10);
  });

  it("普通牌可响应时优先保留炸弹", () => {
    const state = table();
    state.players[0].hand = [card("6", 6), card("3", 3), card("3", 3, "♥"), card("3", 3, "♣"), card("3", 3, "♦")];
    state.currentPlay = { playerId: 1, cards: [card("5", 5)], combo: { type: "single", value: 5, length: 1, label: "单牌" } };
    expect(suggestPlays(state, 0)[0].combo.type).toBe("single");
  });

  it("支持阿兹尔地主首轮三张变体且只触发一次", () => {
    const state = table("azir");
    const azir = state.players[0];
    const three = classifyCards(state, [card("6", 6), card("6", 6, "♥"), card("6", 6, "♦")], azir)!;
    const five = classifyCards(state, [card("7", 7), card("7", 7, "♥"), card("7", 7, "♦"), card("3", 3), card("4", 4)], azir)!;
    expect(three.type).toBe("azirMarch");
    expect(five.label).toBe("帝国三带二");
    expect(canBeat(state, five, { playerId: 1, cards: [], combo: three }, player("garen"))).toBe(true);
    state.fieldFlags.azir = true;
    expect(classifyCards(state, [card("9", 9), card("9", 9, "♥"), card("9", 9, "♦"), card("3", 3), card("4", 4)], azir)).toBeNull();
  });
});

describe("技能与设置", () => {
  it("冻结限制实际出牌张数：潘森强化对子被拒绝，过牌保留冻结，单牌消耗冻结", () => {
    const { frozen, unfrozen, pairIds } = frozenPantheonTable();
    expect(analyzeSelection(unfrozen, pairIds, 0)).toMatchObject({ legal: true, combo: { type: "single" } });
    expect(analyzeSelection(frozen, pairIds, 0)).toMatchObject({ legal: false, reason: "被冻结：这次只能出单牌或过牌" });

    const base = { playerId: 0, expectedTurnRevision: frozen.turnRevision };
    const rejected = gameReducer(frozen, { type: "play", ...base, cardIds: pairIds });
    expect(rejected.players[0].hand).toEqual(frozen.players[0].hand);
    expect(rejected.players[0].buffs.frozen).toBe(true);
    expect(rejected.currentPlay).toEqual(frozen.currentPlay);
    expect(rejected.events.at(-1)?.kind).toBe("warning");
    expect(validSavedGame(rejected)).toBe(true);

    const passed = gameReducer(frozen, { type: "pass", ...base });
    expect(passed.players[0].buffs.frozen).toBe(true);
    expect(validSavedGame(passed)).toBe(true);

    const single = gameReducer(frozen, { type: "play", ...base, cardIds: [pairIds[0]] });
    expect(single.players[0].hand).toHaveLength(frozen.players[0].hand.length - 1);
    expect(single.currentPlay?.cards).toHaveLength(1);
    expect(single.players[0].buffs.frozen).toBeUndefined();
    expect(single.players[0].buffs.pantheonPairBeatsSingle).toBe(true);
    expect(validSavedGame(single)).toBe(true);
  });

  it("冻结时提示只提供实际单牌，不提供潘森强化对子；未冻结时保留对子建议", () => {
    const { frozen, unfrozen, pairIds } = frozenPantheonTable();
    const suggestions = suggestPlays(frozen, 0);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every((candidate) => candidate.cards.length === 1)).toBe(true);
    expect(suggestions.every((candidate) => analyzeSelection(frozen, candidate.cards.map((item) => item.id), 0).legal)).toBe(true);
    expect(suggestPlays(unfrozen, 0).some((candidate) => candidate.cards.length === 2 && candidate.cards.every((item) => pairIds.includes(item.id)))).toBe(true);
  });

  it("全部十二名英雄的主动技能都能通过 reducer 结算", () => {
    for (const heroId of Object.keys(HERO_BY_ID)) {
      const state = table(heroId);
      state.players[0].hero = HERO_BY_ID[heroId as keyof typeof HERO_BY_ID];
      state.players[0].hand = [card("9", 9), card("8", 8), card("7", 7), card("6", 6), card("5", 5)];
      state.players[1].hand = [card("A", 14), card("K", 13), card("Q", 12), card("4", 4)];
      state.players[2].hand = [card("J", 11), card("10", 10), card("3", 3), card("3", 3, "♥")];
      state.discardPile = [card("4", 4), card("5", 5)];
      state.multiplier = 2;
      const next = gameReducer(state, { type: "useSkill", playerId: 0, expectedTurnRevision: state.turnRevision, ...(heroId === "thresh" ? { takeCardId: state.discardPile[0].id, returnCardId: state.players[0].hand[0].id } : {}) });
      expect(next.players[0].usedSkill, `${heroId} skill`).toBe(true);
      expect(next.events.some((event) => event.kind === "skill")).toBe(true);
    }
  });

  it("不可用技能给出原因且不会被消耗", () => {
    const state = table("thresh");
    state.players[0].hand = [card("9", 9)];
    expect(getSkillAvailability(state, 0)).toMatchObject({ available: false });
    const next = gameReducer(state, { type: "useSkill", playerId: 0, expectedTurnRevision: state.turnRevision });
    expect(next.players[0].usedSkill).toBe(false);
    expect(next.events.at(-1)?.message).toMatch(/弃牌区/);
  });

  it("选牌分析再次校验手牌身份和合法性", () => {
    const state = table();
    state.players[0].hand = [card("8", 8), card("8", 8, "♥")];
    expect(analyzeSelection(state, state.players[0].hand.map((item) => item.id))).toMatchObject({ legal: true, combo: { type: "pair" } });
    expect(analyzeSelection(state, [999999])).toMatchObject({ legal: false, reason: "选牌已过期，请重新选择" });
  });

  it("设置持久化兼容旧键并能从异常数据恢复", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    saveSettings({ muted: true, volume: 2, aiSpeed: "fast", difficulty: "standard" }, storage);
    expect(loadSettings(storage)).toEqual({ muted: true, volume: 1, aiSpeed: "fast", difficulty: "standard" });
    values.set("runeterra-ddz-settings-v1", "{broken");
    expect(loadSettings(storage)).toEqual({ muted: false, volume: 0.85, aiSpeed: "normal", difficulty: "standard" });
    const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(() => saveSettings({ muted: false, volume: 0.5, aiSpeed: "normal", difficulty: "standard" }, blocked)).not.toThrow();
    expect(loadSettings(blocked)).toEqual({ muted: false, volume: 0.85, aiSpeed: "normal", difficulty: "standard" });
  });
});
