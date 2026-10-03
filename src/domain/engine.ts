import { HEROES, HERO_BY_ID, TARGETED_SKILL_HEROES } from "./heroes";
import { nextRandom, normalizeSeed, shuffleSeeded } from "./random";
import { decideAiCommand, observeGame } from "./ai";
import {
  analyzeSelection,
  canPlayerPass,
  countGroups,
  formatCards,
  getSkillAvailability,
  isAzirFirstLeadAvailable,
  sortHand,
  enemyPlayers,
  recoverableCards,
} from "./rules";
import type {
  Card,
  Combo,
  GameCommand,
  GameEventKind,
  GameState,
  HeroId,
  HistoryKind,
  Player,
  UserSettings,
} from "./types";

const RANKS = [
  { rank: "3", value: 3 },
  { rank: "4", value: 4 },
  { rank: "5", value: 5 },
  { rank: "6", value: 6 },
  { rank: "7", value: 7 },
  { rank: "8", value: 8 },
  { rank: "9", value: 9 },
  { rank: "10", value: 10 },
  { rank: "J", value: 11 },
  { rank: "Q", value: 12 },
  { rank: "K", value: 13 },
  { rank: "A", value: 14 },
  { rank: "2", value: 15 },
] as const;

const SUITS = [
  { suit: "♠", red: false },
  { suit: "♥", red: true },
  { suit: "♣", red: false },
  { suit: "♦", red: true },
] as const;

export function createDeck(): Card[] {
  let id = 0;
  const deck: Card[] = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push({ id: id++, rank: rank.rank, value: rank.value, suit: suit.suit, red: suit.red });
    }
  }
  deck.push({ id: id++, rank: "小王", value: 16, suit: "", red: false, joker: true });
  deck.push({ id: id++, rank: "大王", value: 17, suit: "", red: true, joker: true });
  return deck;
}

export function createInitialGame(seed: number | string = Date.now()): GameState {
  const normalizedSeed = normalizeSeed(seed);
  const shuffledHeroes = shuffleSeeded(HEROES, normalizedSeed);
  return {
    phase: "heroSelect",
    seed: normalizedSeed,
    rngState: shuffledHeroes.rngState,
    heroChoices: shuffledHeroes.items.slice(0, 3),
    selectedHeroId: null,
    players: [],
    bottomCards: [],
    landlordId: null,
    turnPlayerId: 0,
    currentPlay: null,
    history: [],
    passCount: 0,
    multiplier: 1,
    discardPile: [],
    firstLeadOfTrick: true,
    forcedNoPass: false,
    fieldFlags: {},
    winnerId: null,
    turnRevision: 0,
    eventRevision: 0,
    events: [],
    logs: [],
    operationRevision: 0,
    responseQueue: [],
    passedPlayerIds: [],
    interruptedNext: null,
    knownCards: [],
    training: false,
  };
}

function cloneGameState(state: GameState): GameState {
  return {
    ...state,
    heroChoices: [...state.heroChoices],
    players: state.players.map((player) => ({
      ...player,
      hand: [...player.hand],
      buffs: { ...player.buffs },
    })),
    bottomCards: [...state.bottomCards],
    currentPlay: state.currentPlay
      ? { ...state.currentPlay, cards: [...state.currentPlay.cards], combo: { ...state.currentPlay.combo } }
      : null,
    history: state.history.map((entry) => ({ ...entry, cards: [...entry.cards] })),
    discardPile: [...state.discardPile],
    fieldFlags: { ...state.fieldFlags },
    events: [...state.events],
    logs: [...state.logs],
    responseQueue: [...state.responseQueue],
    passedPlayerIds: [...state.passedPlayerIds],
    knownCards: [...state.knownCards],
  };
}

function appendLog(state: GameState, message: string): void {
  state.logs = [message, ...state.logs].slice(0, 80);
}

function emitEvent(
  state: GameState,
  kind: GameEventKind,
  title: string,
  message: string,
  options: { playerId?: number; actorId?: number; targetId?: number; viewerId?: number; announcement?: string; log?: boolean } = {},
): void {
  state.eventRevision += 1;
  state.events = [
    ...state.events,
    {
      id: state.eventRevision,
      kind,
      title,
      message,
      announcement: options.announcement ?? message,
      ...(options.playerId === undefined ? {} : { playerId: options.playerId }),
      actorId: options.actorId ?? options.playerId,
      targetId: options.targetId,
      viewerId: options.viewerId,
      operationId: state.operationRevision,
    },
  ].slice(-500);
  if (options.log !== false) appendLog(state, message);
}

function rejectCommand(state: GameState, reason: string): GameState {
  const next = cloneGameState(state);
  emitEvent(next, "warning", "操作未执行", reason, { playerId: state.turnPlayerId });
  return next;
}

function randomValue(state: GameState): number {
  const random = nextRandom(state.rngState);
  state.rngState = random.rngState;
  return random.value;
}

function shuffleFromState<T>(state: GameState, items: readonly T[]): T[] {
  const result = shuffleSeeded(items, state.rngState);
  state.rngState = result.rngState;
  return result.items;
}

function addHistory(
  state: GameState,
  playerId: number,
  label: string,
  cards: readonly Card[],
  kind: HistoryKind,
  targetId: number | null = null,
): void {
  const player = state.players[playerId];
  const nextId = (state.history[0]?.id ?? 0) + 1;
  state.history = [
    {
      id: nextId,
      playerId,
      playerName: player.name,
      heroName: player.hero.name,
      label,
      cards: [...cards],
      kind,
      targetId,
    },
    ...state.history,
  ].slice(0, 500);
}

function nextPlayer(playerId: number): number {
  return (playerId + 1) % 3;
}

function chooseHero(state: GameState, heroId: HeroId): GameState {
  if (state.phase !== "heroSelect") return rejectCommand(state, "当前不能重新选择英雄");
  if (!state.heroChoices.some((hero) => hero.id === heroId)) return rejectCommand(state, "该英雄不在本轮候选中");

  const next = cloneGameState(state);
  const shuffledDeck = shuffleFromState(next, createDeck());
  const opponents = shuffleFromState(
    next,
    HEROES.filter((hero) => hero.id !== heroId),
  ).slice(0, 2);
  const selectedHeroes = [HERO_BY_ID[heroId], ...opponents];
  next.players = [0, 1, 2].map((id) => ({
    id,
    name: id === 0 ? "你" : `AI ${id}`,
    hero: selectedHeroes[id],
    hand: sortHand(shuffledDeck.slice(id * 17, id * 17 + 17)),
    role: "待定",
    usedSkill: false,
    buffs: {},
    warnedThree: false,
  }));
  next.selectedHeroId = heroId;
  next.bottomCards = shuffledDeck.slice(51);
  next.phase = "bidding";
  next.turnPlayerId = 0;
  next.landlordId = null;
  next.currentPlay = null;
  next.history = [];
  next.passCount = 0;
  next.discardPile = [];
  next.winnerId = null;
  next.fieldFlags = {};
  next.multiplier = 1;
  next.firstLeadOfTrick = true;
  next.forcedNoPass = false;
  next.turnRevision += 1;
  emitEvent(
    next,
    "info",
    "英雄就位",
    `你选择了 ${selectedHeroes[0].name}，对手选择了 ${selectedHeroes[1].name}和${selectedHeroes[2].name}。开始抢地主。`,
    { playerId: 0 },
  );
  return next;
}

function evaluateBid(state: GameState, player: Player): boolean {
  const highCards = player.hand.filter((card) => card.value >= 14).length;
  const bombs = countGroups(player.hand).filter((group) => group.cards.length === 4).length;
  return highCards + bombs * 2 >= 5 || randomValue(state) > 0.62;
}

function assignLandlord(state: GameState, landlordId: number): void {
  state.landlordId = landlordId;
  state.players.forEach((player) => {
    player.role = player.id === landlordId ? "地主" : "农民";
  });
  const landlord = state.players[landlordId];
  landlord.hand = sortHand([...landlord.hand, ...state.bottomCards]);
  state.phase = "playing";
  state.turnPlayerId = landlordId;
  state.currentPlay = null;
  state.history = [];
  state.passCount = 0;
  state.firstLeadOfTrick = true;
  state.turnRevision += 1;
  emitEvent(
    state,
    "passive",
    "地主确认",
    `${landlord.name}成为地主，${landlord.hero.city}城邦「${landlord.hero.fieldName}」已激活。`,
    { playerId: landlordId },
  );
}

function bid(state: GameState, call: boolean): GameState {
  if (state.phase !== "bidding") return rejectCommand(state, "当前不在抢地主阶段");
  const next = cloneGameState(state);
  let landlordId = 0;
  if (!call) {
    appendLog(next, "你选择不抢地主。");
    landlordId = [1, 2].find((id) => evaluateBid(next, next.players[id])) ?? (randomValue(next) < 0.5 ? 1 : 2);
  }
  assignLandlord(next, landlordId);
  return next;
}

function validateTurnCommand(
  state: GameState,
  command: Extract<GameCommand, { expectedTurnRevision: number }>,
): string | null {
  if (state.phase !== "playing") return "当前不在出牌阶段";
  if (command.expectedTurnRevision !== state.turnRevision) return "已忽略过期的回合操作";
  if (command.playerId !== state.turnPlayerId) return "当前不是该玩家的回合";
  return null;
}

function clearSingleUseBuffs(player: Player, combo: Combo): void {
  delete player.buffs.garen;
  if (combo.type === "straight") delete player.buffs.yasuo;
  if (combo.label.includes("金克丝")) delete player.buffs.jinxBomb;
  if (combo.label.includes("星陨")) delete player.buffs.pantheonPairBeatsSingle;
  delete player.buffs.skillBlocked;
  if (combo.label.includes("沙兵")) delete player.buffs.azir;
  if (combo.type !== "bomb" && combo.type !== "rocket") delete player.buffs.mushroomed;
  delete player.buffs.noBomb;
  delete player.buffs.frozen;
}

function takeLowestCard(player: Player): Card | null {
  const lowest = [...player.hand].sort((a, b) => a.value - b.value || a.suit.localeCompare(b.suit))[0];
  if (!lowest) return null;
  player.hand = player.hand.filter((card) => card.id !== lowest.id);
  return lowest;
}

function discardLowest(state: GameState, player: Player, reason: string): Card | null {
  const card = takeLowestCard(player);
  if (!card) return null;
  state.discardPile.push(card);
  player.hand = sortHand(player.hand);
  appendLog(state, `${reason}：${player.name}弃掉 ${formatCards([card])}。`);
  return card;
}

function endGame(state: GameState, winnerId: number): void {
  state.phase = "finished";
  state.winnerId = winnerId;
  state.turnRevision += 1;
  const winner = state.players[winnerId];
  const winnerSide = winnerId === state.landlordId ? "地主" : "农民";
  emitEvent(state, "result", `${winnerSide}胜利`, `${winner.name}出完手牌，${winnerSide}获胜！最终倍率 ×${state.multiplier}。`, {
    playerId: winnerId,
  });
}

function checkEndAfterHandMutation(state: GameState, playerId: number): boolean {
  const player = state.players[playerId];
  if (!player || player.hand.length > 0 || state.phase !== "playing") return false;
  endGame(state, playerId);
  return true;
}

function checkFieldWarnings(state: GameState, player: Player): void {
  const landlord = state.landlordId === null ? undefined : state.players[state.landlordId];
  if (landlord?.hero.id !== "thresh" || player.warnedThree || player.hand.length > 3 || !player.hand.length) return;
  player.warnedThree = true;
  revealCards(state, player, [player.hand[Math.floor(randomValue(state) * player.hand.length)]], null, "魂锁典狱", landlord.id);
}

function revealCards(state: GameState, target: Player, cards: Card[], viewerId: number | null, source: string, actorId: number): void {
  for (const card of cards) {
    if (!state.knownCards.some((known) => known.card.id === card.id && known.playerId === target.id && known.viewerId === viewerId)) {
      state.knownCards.push({ playerId: target.id, viewerId, card, source });
    }
  }
  emitEvent(state, "passive", source, `${target.name}公开信息：${formatCards(cards)}`, { playerId: actorId, actorId, targetId: target.id, ...(viewerId === null ? {} : { viewerId }) });
}

function maybeTriggerKaisaField(state: GameState, landlord: Player): void {
  if (landlord.hero.id !== "kaisa" || state.fieldFlags.kaisa || landlord.hand.length >= 5) return;
  state.fieldFlags.kaisa = true;
  const farmers = enemyPlayers(state, landlord.id);
  const target = farmers[Math.floor(randomValue(state) * farmers.length)];
  if (!target) return;
  target.buffs.noBomb = true;
  emitEvent(state, "passive", "虚空干扰", `虚空干扰触发，${target.name}下次出牌不能使用炸弹或火箭。`, {
    playerId: landlord.id,
    actorId: landlord.id,
    targetId: target.id,
  });
}

function handleAfterPlay(
  state: GameState,
  playerId: number,
  combo: Combo,
  beatPrevious: boolean,
): boolean {
  const player = state.players[playerId];
  const landlord = state.landlordId === null ? undefined : state.players[state.landlordId];
  if (combo.type === "bomb" || combo.type === "rocket") {
    state.multiplier += combo.type === "rocket" ? 2 : 1;
    if (landlord?.hero.id === "darius") {
      state.multiplier += 1;
      emitEvent(state, "passive", "铁血竞技", "铁血竞技触发，炸弹让倍率额外 +1。", { playerId: landlord.id });
    }
    if (landlord?.hero.id === "jinx") {
      state.forcedNoPass = true;
      emitEvent(state, "passive", "失控爆燃", "失控爆燃触发，下一家有牌可出时不能过牌。", { playerId: landlord.id });
    }
  } else {
    state.forcedNoPass = false;
  }

  if (player.buffs.dariusExecute && beatPrevious) {
    const discarded = discardLowest(state, player, "诺克萨斯断头台");
    delete player.buffs.dariusExecute;
    if (discarded) emitEvent(state, "skill", "诺克萨斯断头台", `${player.name}弃掉了最小手牌。`, { playerId });
    if (checkEndAfterHandMutation(state, playerId)) return true;
  }
  if (player.id === state.landlordId) maybeTriggerKaisaField(state, player);
  if (player.id === state.landlordId && player.hero.id === "pantheon" && !state.fieldFlags.pantheon && player.hand.length < 5) {
    state.fieldFlags.pantheon = true;
    player.buffs.pantheonShield = true;
    emitEvent(state, "passive", "不屈天穹", "不屈天穹触发，地主获得防炸弹护盾。", { playerId });
  }
  return false;
}

function nextTurnAfterPlay(state: GameState, playerId: number, previousPlayerId: number | null): number {
  if (state.interruptedNext !== null) {
    const resume = state.interruptedNext;
    state.interruptedNext = null;
    return resume;
  }
  const landlord = state.landlordId === null ? undefined : state.players[state.landlordId];
  if (
    landlord?.hero.id === "garen" &&
    previousPlayerId === state.landlordId &&
    playerId !== state.landlordId &&
    !state.fieldFlags.garen
  ) {
    state.fieldFlags.garen = true;
    state.interruptedNext = nextPlayer(playerId) === landlord.id ? nextPlayer(landlord.id) : nextPlayer(playerId);
    emitEvent(state, "passive", "坚毅阵线", "地主额外行动一次，然后恢复原来的响应顺序。", { playerId: landlord.id });
    return landlord.id;
  }
  return nextPlayer(playerId);
}

function playCards(
  state: GameState,
  command: Extract<GameCommand, { type: "play" }>,
): GameState {
  const turnError = validateTurnCommand(state, command);
  if (turnError) return rejectCommand(state, turnError);
  const analysis = analyzeSelection(state, command.cardIds, command.playerId);
  if (!analysis.legal || !analysis.combo) return rejectCommand(state, analysis.reason);

  const next = cloneGameState(state);
  const player = next.players[command.playerId];
  const cardIds = new Set(command.cardIds);
  const cards = player.hand.filter((card) => cardIds.has(card.id));
  const previous = next.currentPlay;
  const previousPlayerId = previous?.playerId ?? null;
  const beatPrevious = Boolean(previous && previous.playerId !== command.playerId);
  const azirFirstLead = isAzirFirstLeadAvailable(next, player);

  player.hand = player.hand.filter((card) => !cardIds.has(card.id));
  next.discardPile.push(...cards);
  next.currentPlay = { playerId: command.playerId, cards, combo: { ...analysis.combo } };
  addHistory(next, command.playerId, analysis.combo.label, cards, beatPrevious ? "beat" : "play", previousPlayerId);
  next.passCount = 0;
  next.passedPlayerIds = [];
  next.firstLeadOfTrick = false;
  if (azirFirstLead) {
    next.fieldFlags.azir = true;
    if (analysis.combo.type === "azirMarch") {
      emitEvent(next, "passive", "帝国军阵", "帝国军阵触发，地主首出使用了变体三带。", { playerId: player.id });
    }
  }
  clearSingleUseBuffs(player, analysis.combo);
  if (handleAfterPlay(next, command.playerId, analysis.combo, beatPrevious)) return next;

  appendLog(next, `${player.name}打出 ${analysis.combo.label}：${formatCards(cards)}。`);
  if (player.hand.length === 0) {
    endGame(next, command.playerId);
    return next;
  }
  checkFieldWarnings(next, player);
  next.turnPlayerId = nextTurnAfterPlay(next, command.playerId, previousPlayerId);
  next.responseQueue = [next.turnPlayerId, ...next.players.map((candidate) => candidate.id).filter((id) => id !== command.playerId && id !== next.turnPlayerId)];
  next.turnRevision += 1;
  const action = previous ? (beatPrevious ? "压制成功" : "出牌") : "首出";
  emitEvent(next, "turn", action, `${player.name}${action === "压制成功" ? "压过目标" : "打出"}${analysis.combo.label}：${formatCards(cards)}`, {
    playerId: command.playerId,
  });
  return next;
}

function passTurn(state: GameState, command: Extract<GameCommand, { type: "pass" }>): GameState {
  const turnError = validateTurnCommand(state, command);
  if (turnError) return rejectCommand(state, turnError);
  const permission = canPlayerPass(state, command.playerId);
  if (!permission.allowed) return rejectCommand(state, permission.reason);

  const next = cloneGameState(state);
  const player = next.players[command.playerId];
  const landlord = next.landlordId === null ? undefined : next.players[next.landlordId];
  if (player.id === next.landlordId && player.hero.id === "caitlyn" && !player.buffs.caitlynFieldPeek && next.currentPlay) {
    player.buffs.caitlynFieldPeek = true;
    for (const enemy of enemyPlayers(next, player.id)) revealCards(next, enemy, [sortHand(enemy.hand)[0]], null, "执法视野", player.id);
  }
  addHistory(next, command.playerId, "过牌", [], "pass");
  appendLog(next, `${player.name}过牌。`);
  if (player.buffs.skillBlocked) delete player.buffs.skillBlocked;
  next.passedPlayerIds = [...new Set([...next.passedPlayerIds, command.playerId])];
  next.passCount = next.passedPlayerIds.length;
  next.responseQueue = next.responseQueue.filter((id) => id !== command.playerId);
  next.forcedNoPass = false;

  if (next.passCount >= 2 && next.currentPlay) {
    if (landlord?.hero.id === "teemo") {
      player.buffs.skillBlocked = true;
      emitEvent(next, "passive", "约德尔恶作剧", `${player.name}下次行动不能使用技能。`, { playerId: player.id });
    }
    if (landlord?.hero.id === "missfortune" && next.currentPlay.playerId === next.landlordId) {
      const discarded = discardLowest(next, landlord, "海盗分赃");
      if (discarded) emitEvent(next, "passive", "海盗分赃", "海盗分赃触发，地主弃掉一张最小手牌。", { playerId: landlord.id });
      if (checkEndAfterHandMutation(next, landlord.id)) return next;
    }
    next.turnPlayerId = next.currentPlay.playerId;
    const leadPlayer = next.players[next.turnPlayerId];
    next.currentPlay = null;
    next.passCount = 0;
    next.passedPlayerIds = [];
    next.responseQueue = [];
    next.interruptedNext = null;
    next.firstLeadOfTrick = true;
    addHistory(next, leadPlayer.id, "重新首出", [], "round");
    next.turnRevision += 1;
    emitEvent(next, "turn", "新一轮", `${leadPlayer.name}重新获得首出权。`, { playerId: leadPlayer.id });
    return next;
  }

  const followup = next.interruptedNext ?? next.responseQueue[0] ?? next.players.find((candidate) => candidate.id !== next.currentPlay?.playerId && !next.passedPlayerIds.includes(candidate.id))?.id;
  if (followup === undefined) return rejectCommand(state, "回合状态异常，请重新开始牌局");
  next.turnPlayerId = followup;
  next.interruptedNext = null;
  next.turnRevision += 1;
  emitEvent(next, "turn", "过牌", `${player.name}过牌。`, { playerId: player.id, log: false });
  return next;
}

function mostCardsOpponent(state: GameState, playerId: number): Player | undefined {
  return enemyPlayers(state, playerId)
    .sort((a, b) => b.hand.length - a.hand.length || a.id - b.id)[0];
}

function pirateSwap(state: GameState, player: Player): void {
  for (const target of enemyPlayers(state, player.id)) {
    if (!target.hand.length || !player.hand.length) continue;
    const stolenIndex = Math.floor(randomValue(state) * target.hand.length);
    const [stolen] = target.hand.splice(stolenIndex, 1);
    const returned = takeLowestCard(player);
    if (!returned) {
      target.hand.push(stolen);
      continue;
    }
    player.hand.push(stolen);
    target.hand.push(returned);
    player.hand = sortHand(player.hand);
    target.hand = sortHand(target.hand);
  }
}

function activateSkill(state: GameState, command: Extract<GameCommand, { type: "useSkill" }>): GameState {
  const turnError = validateTurnCommand(state, command);
  if (turnError) return rejectCommand(state, turnError);
  const availability = getSkillAvailability(state, command.playerId);
  if (!availability.available) return rejectCommand(state, availability.reason);

  const original = state.players[command.playerId];
  if (command.targetId !== undefined && !enemyPlayers(state, command.playerId).some((player) => player.id === command.targetId)) return rejectCommand(state, "技能只能指定敌方");
  if (original.hero.id === "thresh" && (!recoverableCards(state).some((card) => card.id === command.takeCardId) || !original.hand.some((card) => card.id === command.returnCardId))) return rejectCommand(state, "请选择一张已结算的弃牌和一张要换出的手牌");

  const next = cloneGameState(state);
  const player = next.players[command.playerId];
  const target = command.targetId === undefined ? mostCardsOpponent(next, command.playerId) : next.players[command.targetId];
  player.usedSkill = true;
  emitEvent(next, "skill", player.hero.skillName, `${player.name}发动「${player.hero.skillName}」${target && TARGETED_SKILL_HEROES.includes(player.hero.id) ? `，目标：${target.name}` : ""}。`, { playerId: player.id, actorId: player.id, targetId: target?.id });

  switch (player.hero.id) {
    case "garen":
      player.buffs.garen = true;
      appendLog(next, `${player.name}的下一次单牌或对子比较点数 +1。`);
      break;
    case "darius":
      player.buffs.dariusExecute = true;
      appendLog(next, `${player.name}的下一次成功压制会弃掉最小手牌。`);
      break;
    case "ashe":
      if (target) {
        target.buffs.frozen = true;
        appendLog(next, `${target.name}被冻结，实际出牌只能选择单牌。`);
      }
      break;
    case "jinx":
      player.buffs.jinxBomb = true;
      appendLog(next, `${player.name}的下一组三张 3–10 可视为炸弹。`);
      break;
    case "caitlyn":
      if (target) {
        const cards = shuffleFromState(next, target.hand).slice(0, 3);
        revealCards(next, target, cards, player.id, "侦查结果", player.id);
      }
      break;
    case "yasuo":
      player.buffs.yasuo = true;
      appendLog(next, `${player.name}的下一次顺子允许一个点数缺口。`);
      break;
    case "thresh": {
      const card = recoverableCards(next).find((candidate) => candidate.id === command.takeCardId)!;
      const returned = player.hand.find((candidate) => candidate.id === command.returnCardId)!;
      next.discardPile = [...next.discardPile.filter((candidate) => candidate.id !== card.id), returned];
      player.hand = sortHand([...player.hand.filter((candidate) => candidate.id !== returned.id), card]);
      emitEvent(next, "info", "魂引交换", `${player.name}取回 ${formatCards([card])}，换出 ${formatCards([returned])}。`, { playerId: player.id });
      break;
    }
    case "azir":
      player.buffs.azir = true;
      appendLog(next, `${player.name}的下一次对子可视为三张。`);
      break;
    case "pantheon":
      player.buffs.pantheonPairBeatsSingle = true;
      appendLog(next, `${player.name}的下一次对子可按单牌压制。`);
      break;
    case "missfortune":
      pirateSwap(next, player);
      appendLog(next, `${player.name}与两名对手各交换了一张手牌。`);
      break;
    case "teemo":
      if (target) {
        target.buffs.mushroomed = true;
        appendLog(next, `${target.name}下一次普通出牌比较点数 −1。`);
      }
      break;
    case "kaisa": {
      const card = discardLowest(next, player, "虚空索敌");
      if (card) {
        next.multiplier = Math.max(1, next.multiplier - 1);
        appendLog(next, `当前倍率降至 ×${next.multiplier}。`);
      }
      break;
    }
  }

  if (checkEndAfterHandMutation(next, player.id)) return next;
  return next;
}

export function chooseAiCommand(state: GameState, difficulty: UserSettings["difficulty"] = "standard"): GameCommand | null {
  return decideAiCommand(observeGame(state, state.turnPlayerId), difficulty);
}

function reduceCommand(state: GameState, command: GameCommand): GameState {
  switch (command.type) {
    case "chooseHero":
      return chooseHero(state, command.heroId);
    case "bid":
      return bid(state, command.call);
    case "play":
      return playCards(state, command);
    case "pass":
      return passTurn(state, command);
    case "useSkill":
      return activateSkill(state, command);
    case "restartMatch":
      { const fresh = createInitialGame(command.seed ?? state.rngState);
        if (!state.selectedHeroId) return fresh;
        fresh.heroChoices = [HERO_BY_ID[state.selectedHeroId]];
        return chooseHero(fresh, state.selectedHeroId); }
    case "startPractice":
      { const fresh = createInitialGame("practice-v2"); fresh.heroChoices = [HERO_BY_ID.jinx];
        const chosen = chooseHero(fresh, "jinx");
        const deck = createDeck();
        const practiceCards = deck.filter((card) => card.value === 3).slice(0, 3);
        const rest = deck.filter((card) => !practiceCards.some((chosenCard) => chosenCard.id === card.id));
        chosen.players[0].hand = sortHand([...practiceCards, ...rest.slice(0, 14)]);
        chosen.players[1].hand = sortHand(rest.slice(14, 31)); chosen.players[2].hand = sortHand(rest.slice(31, 48));
        chosen.bottomCards = rest.slice(48); assignLandlord(chosen, 0); chosen.training = true; return chosen; }
    case "returnToHeroSelect":
      return createInitialGame(command.seed ?? state.seed);
  }
}

export function gameReducer(state: GameState, command: GameCommand): GameState {
  const next = reduceCommand({ ...state, operationRevision: state.operationRevision + 1 }, command);
  // Hand mutation can also come from skills and city effects, not just playing.
  next.knownCards = next.knownCards.filter((known) => next.players[known.playerId]?.hand.some((card) => card.id === known.card.id));
  if (next.phase === "playing") {
    for (const player of next.players) {
      if (player.hand.length !== state.players[player.id]?.hand.length) checkFieldWarnings(next, player);
    }
    const landlord = next.landlordId === null ? undefined : next.players[next.landlordId];
    if (landlord && landlord.hand.length !== state.players[landlord.id]?.hand.length) {
      maybeTriggerKaisaField(next, landlord);
    }
  }
  return next;
}

export function replayGame(seed: number | string, commands: readonly GameCommand[]): GameState {
  return commands.reduce(gameReducer, createInitialGame(seed));
}

export function uniqueCardIds(state: GameState): Set<number> {
  return new Set([
    ...state.players.flatMap((player) => player.hand.map((card) => card.id)),
    ...state.bottomCards.map((card) => card.id),
    ...state.discardPile.map((card) => card.id),
  ]);
}
