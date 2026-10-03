import { describe, expect, it } from "vitest";
import {
  HERO_BY_ID,
  chooseAiCommand,
  createInitialGame,
  gameReducer,
  replayGame,
  suggestPlays,
  uniqueCardIds,
} from "..";
import type { GameCommand, GameState, HeroId } from "..";

let scenarioCardId = 20_000;

function scenarioCard(value: number, suit = "♠") {
  const rank = value === 16 ? "小王" : value === 17 ? "大王" : value === 11 ? "J" : value === 12 ? "Q" : value === 13 ? "K" : value === 14 ? "A" : String(value);
  return { id: scenarioCardId++, rank, value, suit, red: suit === "♥" || suit === "♦", ...(value >= 16 ? { joker: true as const } : {}) };
}

function begin(seed: number | string, heroId?: HeroId): GameState {
  let state = createInitialGame(seed);
  const selected = heroId ?? state.heroChoices[0].id;
  if (!state.heroChoices.some((hero) => hero.id === selected)) {
    state.heroChoices = [HERO_BY_ID[selected], state.heroChoices[0], state.heroChoices[1]];
  }
  state = gameReducer(state, { type: "chooseHero", heroId: selected });
  return gameReducer(state, { type: "bid", call: true });
}

describe("确定性牌局引擎", () => {
  it("发牌、出牌和弃牌始终守恒为 54 个唯一 card id", () => {
    let state = createInitialGame("conservation");
    state = gameReducer(state, { type: "chooseHero", heroId: state.heroChoices[0].id });
    expect(uniqueCardIds(state).size).toBe(54);
    state = gameReducer(state, { type: "bid", call: true });
    expect(uniqueCardIds(state).size).toBe(54);
    const suggestion = suggestPlays(state, 0)[0];
    state = gameReducer(state, {
      type: "play",
      playerId: 0,
      cardIds: suggestion.cards.map((card) => card.id),
      expectedTurnRevision: state.turnRevision,
    });
    expect(uniqueCardIds(state).size).toBe(54);
  });

  it("拒绝过期 AI 回合命令且不改变手牌或行动者", () => {
    const state = begin("stale-command");
    const handIds = state.players[0].hand.map((card) => card.id);
    const stale = gameReducer(state, {
      type: "play",
      playerId: 0,
      cardIds: [handIds[0]],
      expectedTurnRevision: state.turnRevision - 1,
    });
    expect(stale.players[0].hand.map((card) => card.id)).toEqual(handIds);
    expect(stale.turnPlayerId).toBe(0);
    expect(stale.events.at(-1)?.message).toMatch(/过期/);
  });

  it("相同 seed 与命令序列可得到逐字段一致的状态", () => {
    const initial = createInitialGame("replay-seed");
    const heroId = initial.heroChoices[0].id;
    let prepared = gameReducer(initial, { type: "chooseHero", heroId });
    prepared = gameReducer(prepared, { type: "bid", call: true });
    const suggestion = suggestPlays(prepared, 0)[0];
    const commands: GameCommand[] = [
      { type: "chooseHero", heroId },
      { type: "bid", call: true },
      {
        type: "play",
        playerId: 0,
        cardIds: suggestion.cards.map((card) => card.id),
        expectedTurnRevision: prepared.turnRevision,
      },
    ];
    expect(replayGame("replay-seed", commands)).toEqual(replayGame("replay-seed", commands));
    expect(replayGame("another-seed", commands)).not.toEqual(replayGame("replay-seed", commands));
  });

  it("AI 决策只返回带当前回合版本的领域命令", () => {
    let state = createInitialGame("ai-command");
    state = gameReducer(state, { type: "chooseHero", heroId: state.heroChoices[0].id });
    state = gameReducer(state, { type: "bid", call: false });
    if (state.turnPlayerId === 0) throw new Error("不抢地主后行动者应为 AI");
    const command = chooseAiCommand(state);
    expect(command).not.toBeNull();
    expect(command).toMatchObject({ playerId: state.turnPlayerId, expectedTurnRevision: state.turnRevision });
  });

  it("城邦事件使用统一机制名称", () => {
    const state = begin("field-copy", "darius");
    state.players[0].hand = [
      { id: 90, rank: "6", value: 6, suit: "♠", red: false },
      { id: 91, rank: "6", value: 6, suit: "♥", red: true },
      { id: 92, rank: "6", value: 6, suit: "♣", red: false },
      { id: 93, rank: "6", value: 6, suit: "♦", red: true },
      { id: 94, rank: "9", value: 9, suit: "♠", red: false },
    ];
    const next = gameReducer(state, {
      type: "play",
      playerId: 0,
      cardIds: [90, 91, 92, 93],
      expectedTurnRevision: state.turnRevision,
    });
    expect(next.events.some((event) => event.title === "铁血竞技")).toBe(true);
    expect(next.multiplier).toBe(3);
  });
});

describe("十二城邦被动", () => {
  it("德玛西亚让首次被压制的地主立即行动", () => {
    const state = begin("garen-field", "garen");
    state.players[1].hand = [scenarioCard(6), scenarioCard(3)];
    state.currentPlay = { playerId: 0, cards: [scenarioCard(5)], combo: { type: "single", value: 5, length: 1, label: "单牌" } };
    state.firstLeadOfTrick = false;
    state.turnPlayerId = 1;
    state.turnRevision += 1;
    const next = gameReducer(state, {
      type: "play",
      playerId: 1,
      cardIds: [state.players[1].hand[0].id],
      expectedTurnRevision: state.turnRevision,
    });
    expect(next.turnPlayerId).toBe(0);
    expect(next.fieldFlags.garen).toBe(true);
    expect(next.events.some((event) => event.title === "坚毅阵线")).toBe(true);
  });

  it("弗雷尔卓德限制首炸，祖安在炸弹后设置强制出牌", () => {
    for (const heroId of ["ashe", "jinx"] as const) {
      const state = begin(`${heroId}-field`, heroId);
      state.players[0].hand = [scenarioCard(6, "♠"), scenarioCard(6, "♥"), scenarioCard(6, "♣"), scenarioCard(6, "♦"), scenarioCard(9)];
      const cardIds = state.players[0].hand.slice(0, 4).map((card) => card.id);
      const next = gameReducer(state, { type: "play", playerId: 0, cardIds, expectedTurnRevision: state.turnRevision });
      if (heroId === "ashe") {
        expect(next.players[0].hand).toHaveLength(5);
        expect(next.events.at(-1)?.message).toMatch(/极寒律令/);
      } else {
        expect(next.forcedNoPass).toBe(true);
        expect(next.events.some((event) => event.title === "失控爆燃")).toBe(true);
      }
    }
  });

  it("皮尔特沃夫首过公开目标，暗影岛在三张时警告", () => {
    const caitlyn = begin("caitlyn-field", "caitlyn");
    caitlyn.currentPlay = { playerId: 1, cards: [scenarioCard(10)], combo: { type: "single", value: 10, length: 1, label: "单牌" } };
    caitlyn.firstLeadOfTrick = false;
    const afterPass = gameReducer(caitlyn, { type: "pass", playerId: 0, expectedTurnRevision: caitlyn.turnRevision });
    expect(afterPass.players[0].buffs.caitlynFieldPeek).toBe(true);
    expect(afterPass.events.some((event) => event.title === "执法视野")).toBe(true);

    const thresh = begin("thresh-field", "thresh");
    thresh.players[0].hand = [scenarioCard(9), scenarioCard(8), scenarioCard(7), scenarioCard(6)];
    const afterPlay = gameReducer(thresh, {
      type: "play",
      playerId: 0,
      cardIds: [thresh.players[0].hand[0].id],
      expectedTurnRevision: thresh.turnRevision,
    });
    expect(afterPlay.players[0].warnedThree).toBe(true);
    expect(afterPlay.events.some((event) => event.title === "魂锁典狱")).toBe(true);
  });

  it("巨神峰和虚空在地主降至四张时分别施加护盾与禁炸", () => {
    for (const heroId of ["pantheon", "kaisa"] as const) {
      const state = begin(`${heroId}-threshold`, heroId);
      state.players[0].hand = [scenarioCard(10), scenarioCard(9), scenarioCard(8), scenarioCard(7), scenarioCard(6)];
      const next = gameReducer(state, {
        type: "play",
        playerId: 0,
        cardIds: [state.players[0].hand[0].id],
        expectedTurnRevision: state.turnRevision,
      });
      if (heroId === "pantheon") {
        expect(next.players[0].buffs.pantheonShield).toBe(true);
        expect(next.events.some((event) => event.title === "不屈天穹")).toBe(true);
      } else {
        expect(next.players.filter((player) => player.id !== 0 && player.buffs.noBomb)).toHaveLength(1);
        expect(next.events.some((event) => event.title === "虚空干扰")).toBe(true);
      }
    }
  });

  it("虚空干扰的发动者是地主、目标是农民，且只触发一次", () => {
    const state = begin("kaisa-attribution", "kaisa");
    state.players[0].hand = [scenarioCard(10), scenarioCard(9), scenarioCard(8), scenarioCard(7), scenarioCard(6)];
    const next = gameReducer(state, {
      type: "play",
      playerId: 0,
      cardIds: [state.players[0].hand[0].id],
      expectedTurnRevision: state.turnRevision,
    });
    const events = next.events.filter((entry) => entry.title === "虚空干扰");
    expect(events).toHaveLength(1);
    const target = next.players.find((player) => player.buffs.noBomb);
    expect(target).toBeDefined();
    expect(events[0].playerId).toBe(0);
    expect(events[0].actorId).toBe(0);
    expect(events[0].targetId).toBe(target?.id);
  });

  it("比尔吉沃特分赃和班德尔恶作剧在两次过牌后结算", () => {
    for (const heroId of ["missfortune", "teemo"] as const) {
      let state = begin(`${heroId}-passes`, heroId);
      state.players[0].hand = [scenarioCard(12), scenarioCard(4)];
      state.players[1].hand = [scenarioCard(9)];
      state.players[2].hand = [scenarioCard(8)];
      state.currentPlay = { playerId: 0, cards: [scenarioCard(10)], combo: { type: "single", value: 10, length: 1, label: "单牌" } };
      state.firstLeadOfTrick = false;
      state.turnPlayerId = 1;
      state.turnRevision += 1;
      state = gameReducer(state, { type: "pass", playerId: 1, expectedTurnRevision: state.turnRevision });
      state = gameReducer(state, { type: "pass", playerId: 2, expectedTurnRevision: state.turnRevision });
      if (heroId === "missfortune") {
        expect(state.players[0].hand).toHaveLength(1);
        expect(state.events.some((event) => event.title === "海盗分赃")).toBe(true);
      } else {
        expect(state.players[2].buffs.skillBlocked).toBe(true);
        expect(state.events.some((event) => event.title === "约德尔恶作剧")).toBe(true);
      }
    }
  });
});
