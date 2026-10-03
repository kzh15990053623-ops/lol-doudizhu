import { TARGETED_SKILL_HEROES } from "./heroes";
import type {
  CandidatePlay,
  Card,
  Combo,
  CurrentPlay,
  GameState,
  Player,
  SelectionAnalysis,
  SkillAvailability,
} from "./types";

export const TRIPLE_FAMILY_TYPES = ["triple", "tripleSolo", "triplePair", "azirMarch"] as const;

interface CardGroup {
  value: number;
  cards: Card[];
}

export function compareCardsAsc(a: Card, b: Card): number {
  return a.value - b.value || a.suit.localeCompare(b.suit);
}

export function compareCardsDesc(a: Card, b: Card): number {
  return b.value - a.value || b.suit.localeCompare(a.suit);
}

export function sortHand(hand: readonly Card[]): Card[] {
  return [...hand].sort(compareCardsDesc);
}

export function countGroups(cards: readonly Card[]): CardGroup[] {
  const map = new Map<number, Card[]>();
  for (const card of cards) {
    const group = map.get(card.value) ?? [];
    group.push(card);
    map.set(card.value, group);
  }
  return [...map.entries()].map(([value, groupCards]) => ({ value, cards: groupCards }));
}

export function isConsecutive(values: readonly number[], minimumLength: number, allowGap = false): boolean {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  if (sorted.length < minimumLength || sorted.some((value) => value >= 15)) return false;
  let gaps = 0;
  for (let index = 1; index < sorted.length; index += 1) gaps += sorted[index] - sorted[index - 1] - 1;
  return allowGap ? gaps <= 1 : gaps === 0;
}

function isTripleFamily(combo: Combo): boolean {
  return TRIPLE_FAMILY_TYPES.includes(combo.type as (typeof TRIPLE_FAMILY_TYPES)[number]);
}

export function isAzirFirstLeadAvailable(state: GameState, player?: Player): boolean {
  return Boolean(
    player &&
      state.landlordId !== null &&
      player.id === state.landlordId &&
      player.hero.id === "azir" &&
      state.firstLeadOfTrick &&
      !state.currentPlay &&
      !state.fieldFlags.azir,
  );
}

function azirMarchCombo(groups: readonly CardGroup[], size: number): Combo | null {
  const triple = groups.find((group) => group.cards.length === 3);
  if (!triple) return null;
  const carryCount = size - 3;
  if (carryCount < 0 || carryCount > 2) return null;
  return {
    type: "azirMarch",
    value: triple.value,
    length: size,
    label: carryCount === 0 ? "帝国三张" : carryCount === 1 ? "帝国三带一" : "帝国三带二",
  };
}

export function classifyCards(
  state: GameState,
  cards: readonly Card[],
  player?: Player,
  options: { allowGap?: boolean } = {},
): Combo | null {
  const sorted = [...cards].sort(compareCardsAsc);
  const values = sorted.map((card) => card.value);
  const groups = countGroups(sorted).sort((a, b) => a.cards.length - b.cards.length || a.value - b.value);
  const size = sorted.length;
  const fieldHeroId = state.landlordId === null ? null : state.players[state.landlordId]?.hero.id;
  const shortRuns = fieldHeroId === "yasuo";
  const allowGap = Boolean(player?.buffs.yasuo || options.allowGap);

  if (size === 1) return { type: "single", value: values[0], length: 1, label: "单牌" };
  if (size === 2 && values.includes(16) && values.includes(17)) return { type: "rocket", value: 99, length: 2, label: "火箭" };
  if (size === 2 && groups.length === 1 && player?.buffs.azir) return { type: "triple", value: values[0], length: 3, label: "沙兵三张" };
  if (size === 2 && groups.length === 1 && player?.buffs.pantheonPairBeatsSingle) {
    return { type: "single", value: values[0], length: 1, label: "星陨对子" };
  }
  if (size === 2 && groups.length === 1) return { type: "pair", value: values[0], length: 2, label: "对子" };
  if (isAzirFirstLeadAvailable(state, player) && size >= 3 && size <= 5) {
    const combo = azirMarchCombo(groups, size);
    if (combo) return combo;
  }
  if (size === 3 && groups.length === 1) {
    if (player?.buffs.jinxBomb && values[0] <= 10) return { type: "bomb", value: values[0], length: 4, label: "金克丝炸弹" };
    return { type: "triple", value: values[0], length: 3, label: "三张" };
  }
  if (size === 4 && groups.length === 1) return { type: "bomb", value: values[0], length: 4, label: "炸弹" };
  if (size === 4 && groups.some((group) => group.cards.length === 3)) {
    return { type: "tripleSolo", value: groups.find((group) => group.cards.length === 3)!.value, length: 4, label: "三带一" };
  }
  if (size === 5 && groups.length === 2 && groups.some((group) => group.cards.length === 3) && groups.some((group) => group.cards.length === 2)) {
    return { type: "triplePair", value: groups.find((group) => group.cards.length === 3)!.value, length: 5, label: "三带二" };
  }
  const four = groups.find((group) => group.cards.length === 4);
  if (four && size === 6 && !(values.includes(16) && values.includes(17))) {
    return { type: "fourSolo", value: four.value, length: size, label: "四带两单" };
  }
  if (four && size === 8 && groups.length === 3 && groups.filter((group) => group !== four).every((group) => group.cards.length === 2)) {
    return { type: "fourPair", value: four.value, length: size, label: "四带两对" };
  }
  // A wing never shares a rank with the consecutive triple body.
  const triples = groups.filter((group) => group.cards.length === 3 && group.value < 15).sort((a, b) => a.value - b.value);
  for (let start = 0; start < triples.length; start += 1) {
    for (let count = 2; count <= triples.length - start; count += 1) {
      const body = triples.slice(start, start + count);
      if (!isConsecutive(body.map((group) => group.value), count)) continue;
      const wings = groups.filter((group) => !body.includes(group));
      const bodyValue = body.at(-1)!.value;
      if (size === count * 3 && wings.length === 0) return { type: "tripleSeq", value: bodyValue, length: size, label: "连续三张" };
      if (size === count * 4 && wings.reduce((n, group) => n + group.cards.length, 0) === count && !(values.includes(16) && values.includes(17))) {
        return { type: "planeSolo", value: bodyValue, length: size, label: "飞机带单牌" };
      }
      if (size === count * 5 && wings.length === count && wings.every((group) => group.cards.length === 2)) {
        return { type: "planePair", value: bodyValue, length: size, label: "飞机带对子" };
      }
    }
  }
  if (
    size >= (shortRuns ? 4 : 5) &&
    groups.every((group) => group.cards.length === 1) &&
    isConsecutive(values, shortRuns ? 4 : 5, allowGap)
  ) {
    return { type: "straight", value: Math.max(...values), length: size, label: allowGap ? "踏前顺子" : "顺子" };
  }
  if (
    size >= (shortRuns ? 4 : 6) &&
    size % 2 === 0 &&
    groups.every((group) => group.cards.length === 2) &&
    isConsecutive(
      groups.map((group) => group.value),
      shortRuns ? 2 : 3,
    )
  ) {
    return { type: "pairSeq", value: Math.max(...groups.map((group) => group.value)), length: size, label: "连对" };
  }
  return null;
}

export function applyComparisonBuff(combo: Combo, player: Player): Combo {
  const weakened = player.buffs.mushroomed && combo.type !== "bomb" && combo.type !== "rocket";
  const adjusted = weakened ? { ...combo, value: combo.value - 1, label: `${combo.label} −1` } : { ...combo };
  if (player.buffs.garen && (combo.type === "single" || combo.type === "pair")) {
    return { ...adjusted, value: adjusted.value + 1, label: `${adjusted.label} +1` };
  }
  return adjusted;
}

export function canBeat(state: GameState, combo: Combo | null, current: CurrentPlay | null, player: Player): boolean {
  if (!combo) return false;
  if (player.buffs.noBomb && (combo.type === "bomb" || combo.type === "rocket")) return false;
  if (!current) return true;
  if (current.playerId === player.id) return false;
  if (combo.type === "rocket") return current.combo.type !== "rocket";
  if (current.combo.type === "rocket") return false;
  const landlord = state.landlordId === null ? undefined : state.players[state.landlordId];
  if (combo.type === "bomb" && current.playerId === state.landlordId && landlord?.buffs.pantheonShield && player.id !== state.landlordId) return false;
  if (combo.type === "bomb" && current.combo.type !== "bomb") {
    return true;
  }
  if (current.combo.type === "bomb" && combo.type !== "bomb") return false;
  if ((combo.type === "azirMarch" || current.combo.type === "azirMarch") && isTripleFamily(combo) && isTripleFamily(current.combo)) {
    return combo.value > current.combo.value;
  }
  return combo.type === current.combo.type && combo.length === current.combo.length && combo.value > current.combo.value;
}

function violatesAsheField(state: GameState, combo: Combo): boolean {
  const landlord = state.landlordId === null ? undefined : state.players[state.landlordId];
  return Boolean(
    state.firstLeadOfTrick && landlord?.hero.id === "ashe" && (combo.type === "bomb" || combo.type === "rocket"),
  );
}

export function analyzeSelection(state: GameState, cardIds: readonly number[], playerId = 0): SelectionAnalysis {
  if (state.phase !== "playing" || state.turnPlayerId !== playerId) {
    return { cards: [], combo: null, legal: false, reason: "还没轮到你行动" };
  }
  const player = state.players[playerId];
  if (!player) return { cards: [], combo: null, legal: false, reason: "玩家尚未进入牌局" };
  const idSet = new Set(cardIds);
  const cards = player.hand.filter((card) => idSet.has(card.id));
  if (cards.length !== idSet.size) return { cards, combo: null, legal: false, reason: "选牌已过期，请重新选择" };
  if (!cards.length) return { cards, combo: null, legal: false, reason: "请选择要出的牌" };
  const rawCombo = classifyCards(state, cards, player);
  const combo = rawCombo ? applyComparisonBuff(rawCombo, player) : null;
  if (!combo) return { cards, combo: null, legal: false, reason: "不是合法牌型" };
  if (player.buffs.frozen && cards.length !== 1) {
    return { cards, combo, legal: false, reason: "被冻结：这次只能出单牌或过牌" };
  }
  if (violatesAsheField(state, combo)) {
    return { cards, combo, legal: false, reason: "极寒律令：每轮首出不能打炸弹" };
  }
  if (!canBeat(state, combo, state.currentPlay, player)) {
    return { cards, combo, legal: false, reason: "不能出牌：请选择合法牌型并压过当前牌" };
  }
  return { cards, combo, legal: true, reason: "" };
}

function dedupeCandidates(candidates: readonly CandidatePlay[]): CandidatePlay[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const values = candidate.cards
      .map((card) => card.value)
      .sort((a, b) => a - b)
      .join("-");
    const key = `${candidate.combo.type}:${candidate.combo.value}:${candidate.combo.length}:${values}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function addRuns(state: GameState, hand: readonly Card[], candidates: CandidatePlay[], player: Player): void {
  const unique = countGroups(hand)
    .filter((group) => group.value < 15)
    .map((group) => group.cards[0])
    .sort(compareCardsAsc);
  for (let start = 0; start < unique.length; start += 1) {
    for (let length = 4; length <= unique.length - start; length += 1) {
      const cards = unique.slice(start, start + length);
      const combo = classifyCards(state, cards, player);
      if (combo) candidates.push({ cards, combo: applyComparisonBuff(combo, player) });
    }
  }
}

function addPairRuns(state: GameState, groups: readonly CardGroup[], candidates: CandidatePlay[], player: Player): void {
  const pairs = groups.filter((group) => group.value < 15 && group.cards.length >= 2).sort((a, b) => a.value - b.value);
  for (let start = 0; start < pairs.length; start += 1) {
    for (let length = 2; length <= pairs.length - start; length += 1) {
      const sequence = pairs.slice(start, start + length);
      if (!isConsecutive(sequence.map((group) => group.value), length)) continue;
      const cards = sequence.flatMap((group) => group.cards.slice(0, 2));
      const combo = classifyCards(state, cards, player);
      if (combo) candidates.push({ cards, combo: applyComparisonBuff(combo, player) });
    }
  }
}

function chooseWings(groups: readonly CardGroup[], count: number, pairs: boolean): Card[][] {
  const result: Card[][] = [];
  const visit = (index: number, remaining: number, chosen: Card[]) => {
    if (remaining === 0) { result.push(chosen); return; }
    if (index === groups.length) return;
    const group = groups[index];
    const maximum = pairs ? Math.min(1, Math.floor(group.cards.length / 2), remaining) : Math.min(group.cards.length, remaining);
    for (let amount = 0; amount <= maximum; amount += 1) {
      visit(index + 1, remaining - amount, [...chosen, ...group.cards.slice(0, amount * (pairs ? 2 : 1))]);
    }
  };
  visit(0, count, []);
  return result;
}

export function generateCandidates(state: GameState, player: Player): CandidatePlay[] {
  const hand = [...player.hand].sort(compareCardsAsc);
  const groups = countGroups(hand).sort((a, b) => a.value - b.value);
  const candidates: CandidatePlay[] = [];
  const addCandidate = (cards: Card[]) => {
    const combo = classifyCards(state, cards, player);
    if (combo) candidates.push({ cards, combo: applyComparisonBuff(combo, player) });
  };

  hand.forEach((card) => addCandidate([card]));
  for (const group of groups) {
    if (group.cards.length >= 2) addCandidate(group.cards.slice(0, 2));
    if (group.cards.length >= 3) addCandidate(group.cards.slice(0, 3));
    if (group.cards.length === 4) addCandidate(group.cards);
  }
  const smallJoker = hand.find((card) => card.value === 16);
  const bigJoker = hand.find((card) => card.value === 17);
  if (smallJoker && bigJoker) addCandidate([smallJoker, bigJoker]);
  for (const triple of groups.filter((group) => group.cards.length >= 3)) {
    const tripleCards = triple.cards.slice(0, 3);
    hand.filter((card) => card.value !== triple.value).forEach((solo) => addCandidate([...tripleCards, solo]));
    groups
      .filter((group) => group.value !== triple.value && group.cards.length >= 2)
      .forEach((pair) => addCandidate([...tripleCards, ...pair.cards.slice(0, 2)]));
    if (isAzirFirstLeadAvailable(state, player)) {
      const kickers = hand.filter((card) => card.value !== triple.value);
      for (let first = 0; first < kickers.length; first += 1) {
        for (let second = first + 1; second < kickers.length; second += 1) {
          addCandidate([...tripleCards, kickers[first], kickers[second]]);
        }
      }
    }
  }
  addRuns(state, hand, candidates, player);
  addPairRuns(state, groups, candidates, player);
  for (const four of groups.filter((group) => group.cards.length === 4)) {
    const rest = groups.filter((group) => group !== four);
    chooseWings(rest, 2, false).forEach((wing) => addCandidate([...four.cards, ...wing]));
    chooseWings(rest, 2, true).forEach((wing) => addCandidate([...four.cards, ...wing]));
  }
  const triples = groups.filter((group) => group.cards.length >= 3 && group.value < 15);
  for (let start = 0; start < triples.length; start += 1) {
    for (let count = 2; count <= triples.length - start; count += 1) {
      const body = triples.slice(start, start + count);
      if (!isConsecutive(body.map((group) => group.value), count)) continue;
      const bodyCards = body.flatMap((group) => group.cards.slice(0, 3));
      const rest = groups.filter((group) => !body.includes(group));
      addCandidate(bodyCards);
      if (count * 4 <= hand.length) chooseWings(rest, count, false).forEach((wing) => addCandidate([...bodyCards, ...wing]));
      if (count * 5 <= hand.length) chooseWings(rest, count, true).forEach((wing) => addCandidate([...bodyCards, ...wing]));
    }
  }
  return dedupeCandidates(candidates);
}

export function suggestPlays(state: GameState, playerId = state.turnPlayerId): CandidatePlay[] {
  const player = state.players[playerId];
  if (!player || state.phase !== "playing" || state.turnPlayerId !== playerId) return [];
  const legal = generateCandidates(state, player).filter((candidate) => {
    if (player.buffs.frozen && candidate.cards.length !== 1) return false;
    if (violatesAsheField(state, candidate.combo)) return false;
    return canBeat(state, candidate.combo, state.currentPlay, player);
  });
  const responding = Boolean(state.currentPlay);
  return dedupeCandidates(legal).sort((a, b) => {
    const aFinishes = a.cards.length === player.hand.length;
    const bFinishes = b.cards.length === player.hand.length;
    if (aFinishes !== bFinishes) return Number(bFinishes) - Number(aFinishes);
    const aBomb = a.combo.type === "bomb" || a.combo.type === "rocket";
    const bBomb = b.combo.type === "bomb" || b.combo.type === "rocket";
    if (aBomb !== bBomb) return Number(aBomb) - Number(bBomb);
    if (!responding && a.cards.length !== b.cards.length) return b.cards.length - a.cards.length;
    return a.combo.value - b.combo.value || b.cards.length - a.cards.length;
  });
}

export function getSuggestionKey(state: GameState, playerId = state.turnPlayerId): string {
  const player = state.players[playerId];
  if (!player) return "unavailable";
  const current = state.currentPlay
    ? `${state.currentPlay.playerId}:${state.currentPlay.combo.type}:${state.currentPlay.combo.value}:${state.currentPlay.combo.length}:${state.currentPlay.cards.map((card) => card.id).join(",")}`
    : "lead";
  const buffs = Object.entries(player.buffs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");
  return `${state.phase}:${state.turnRevision}:${current}:${state.firstLeadOfTrick}:${player.hand.map((card) => card.id).join(",")}:${buffs}`;
}

export function canPlayerPass(state: GameState, playerId = state.turnPlayerId): { allowed: boolean; reason: string } {
  if (state.phase !== "playing" || state.turnPlayerId !== playerId) return { allowed: false, reason: "还没轮到你行动" };
  if (!state.currentPlay) return { allowed: false, reason: "你是本轮首家，需要出牌" };
  if (state.forcedNoPass && suggestPlays(state, playerId).length > 0) {
    return { allowed: false, reason: "失控爆燃：当前有牌可出，不能过牌" };
  }
  return { allowed: true, reason: "" };
}

export function getSkillAvailability(state: GameState, playerId: number): SkillAvailability {
  const player = state.players[playerId];
  if (!player) return { available: false, reason: "玩家尚未进入牌局" };
  if (state.phase !== "playing") return { available: false, reason: "技能只能在出牌阶段使用" };
  if (state.turnPlayerId !== playerId) return { available: false, reason: "只能在自己的回合使用技能" };
  if (player.usedSkill) return { available: false, reason: "本局技能已经使用" };
  if (player.buffs.skillBlocked) return { available: false, reason: "本回合技能被禁用" };

  const opponents = enemyPlayers(state, playerId);
  if (TARGETED_SKILL_HEROES.includes(player.hero.id) && opponents.length === 0) {
    return { available: false, reason: "当前没有可选的对手" };
  }
  if (player.hero.id === "thresh" && !recoverableCards(state).length) {
    return { available: false, reason: "弃牌区还没有可拿回的 3–10" };
  }
  if (player.hero.id === "missfortune" && (!player.hand.length || !opponents.length)) {
    return { available: false, reason: "需要仍有手牌的敌方才能交换" };
  }
  if (player.hero.id === "kaisa" && !player.hand.length) return { available: false, reason: "当前没有可吞噬的手牌" };
  return { available: true, reason: "" };
}

export function formatCards(cards: readonly Card[]): string {
  return cards.map((card) => `${card.rank}${card.suit}`).join(" ");
}

export function sameSide(state: GameState, first: number, second: number): boolean {
  return (first === state.landlordId) === (second === state.landlordId);
}

export function enemyPlayers(state: GameState, playerId: number): Player[] {
  return state.players.filter((player) => player.hand.length > 0 && !sameSide(state, playerId, player.id));
}

export function recoverableCards(state: GameState): Card[] {
  const active = new Set(state.currentPlay?.cards.map((card) => card.id));
  return state.discardPile.filter((card) => card.value >= 3 && card.value <= 10 && !active.has(card.id));
}

export function comparisonLabel(combo: Combo): string {
  if (combo.type === "rocket") return "双王";
  const rank = ({ 11: "J", 12: "Q", 13: "K", 14: "A", 15: "2", 16: "小王", 17: "大王" } as Record<number, string>)[combo.value] ?? String(combo.value);
  return combo.label.includes("+1") || combo.label.includes("−1") ? `比较强度 ${rank}（技能修正）` : `主牌 ${rank}`;
}

export function buffDescriptions(player: Player): string[] {
  const labels: Partial<Record<keyof Player["buffs"], string>> = {
    garen: "审判：下次出牌单/对 +1", dariusExecute: "断头台：下次压制弃最小牌", frozen: "冻结：下次出牌限单牌",
    jinxBomb: "飞弹：下次三张 3–10 变炸弹", yasuo: "踏前斩：下次顺子可缺一张", azir: "沙兵：下次对子变三张",
    pantheonPairBeatsSingle: "星陨：下次对子变单牌", mushroomed: "蘑菇：下次普通牌 −1", skillBlocked: "本次行动技能封锁",
    noBomb: "下次出牌禁炸弹/火箭", pantheonShield: "本局护盾：地主领出牌防普通炸弹",
  };
  return Object.entries(player.buffs).filter(([key, active]) => active && labels[key as keyof Player["buffs"]]).map(([key]) => labels[key as keyof Player["buffs"]]!);
}
