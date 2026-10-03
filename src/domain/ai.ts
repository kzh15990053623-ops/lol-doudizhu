import { EMPOWER_BUFF_BY_HERO } from "./heroes";
import { deterministicFraction } from "./random";
import { countGroups, enemyPlayers, getSkillAvailability, recoverableCards, sameSide, suggestPlays } from "./rules";
import type { CandidatePlay, Card, GameCommand, GameState, UserSettings } from "./types";

/** A deliberately redacted state: no opponent's unrevealed card enters the decision boundary. */
export interface AiObservation { state: GameState; playerId: number }

export function observeGame(state: GameState, playerId: number): AiObservation {
  const knownCards = state.knownCards.filter((known) => known.viewerId === null || known.viewerId === playerId);
  return { playerId, state: {
    ...state,
    players: state.players.map((player) => {
      const known = [...new Map(knownCards.filter((card) => card.playerId === player.id).map((entry) => [entry.card.id, entry.card])).values()];
      return { ...player, buffs: { ...player.buffs }, hand: player.id === playerId ? [...player.hand] : [
        ...known,
        ...Array.from({ length: Math.max(0, player.hand.length - known.length) }, (_, index) => ({ id: -100 - player.id * 30 - index, value: 0, rank: "?", suit: "", red: false })),
      ] };
    }),
    knownCards,
    events: [], logs: [],
  } };
}

/** Fast hand partition estimate, shared by hints and AI. Counts runs before loose groups. */
export function estimateTurns(hand: readonly Card[], shortRuns = false): number {
  const counts = Array<number>(18).fill(0);
  hand.forEach((card) => { counts[card.value] += 1; });
  let turns = 0;
  if (counts[16] && counts[17]) { counts[16]--; counts[17]--; turns++; }
  for (const [copies, minimum] of [[3, 2], [1, shortRuns ? 4 : 5], [2, shortRuns ? 2 : 3]]) {
    for (let start = 3; start <= 14; start++) {
      let end = start;
      while (end <= 14 && counts[end] >= copies) end++;
      if (end - start < minimum) continue;
      for (let value = start; value < end; value++) counts[value] -= copies;
      turns++;
      start = 2;
    }
  }
  const triples = counts.filter((n) => n === 3).length;
  let attachments = triples;
  for (let rank = 3; rank <= 17 && attachments; rank++) {
    if (counts[rank] === 1 || counts[rank] === 2) { counts[rank] = 0; attachments--; }
  }
  return turns + counts.filter((n) => n > 0).length;
}

export function strategicSuggestions(state: GameState, playerId = state.turnPlayerId): CandidatePlay[] {
  const player = state.players[playerId];
  if (!player) return [];
  const enemies = enemyPlayers(state, playerId);
  const danger = enemies.some((enemy) => enemy.hand.length <= 2);
  const shortRuns = state.players[state.landlordId ?? -1]?.hero.id === "yasuo";
  const groups = countGroups(player.hand);
  const currentAlly = state.currentPlay && sameSide(state, playerId, state.currentPlay.playerId);
  return suggestPlays(state, playerId).map((candidate) => {
    const ids = new Set(candidate.cards.map((card) => card.id));
    const remaining = player.hand.filter((card) => !ids.has(card.id));
    const bomb = candidate.combo.type === "bomb" || candidate.combo.type === "rocket";
    const brokenBomb = groups.some((group) => group.cards.length === 4 && group.cards.some((card) => ids.has(card.id)) && group.cards.some((card) => !ids.has(card.id)));
    const enemyFinishRisk = enemies.some((enemy) => enemy.hand.length === candidate.cards.length);
    const score = remaining.length === 0 ? -10000 : estimateTurns(remaining, shortRuns) * 100 + remaining.length * 2
      + (brokenBomb ? 55 : 0) + (bomb ? (danger ? 4 : 70) : 0)
      + (danger && enemyFinishRisk ? 35 : 0) + (danger && state.currentPlay ? -candidate.combo.value * 3 : candidate.combo.value * 0.7);
    const reason = !remaining.length ? "这一手可以直接出完" : currentAlly ? "队友领出，通常可以让牌" : danger ? "敌方即将收尾，优先争夺出牌权" : bomb ? "使用炸弹争夺出牌权" : `保留组合，预计还需约 ${estimateTurns(remaining, shortRuns)} 手`;
    return { ...candidate, reason, score };
  }).sort((a, b) => a.score - b.score || a.combo.value - b.combo.value).map(({ cards, combo, reason }) => ({ cards, combo, reason }));
}

export function decideAiCommand(observation: AiObservation, difficulty: UserSettings["difficulty"] = "standard"): GameCommand | null {
  const { state, playerId } = observation;
  if (state.phase !== "playing" || state.turnPlayerId !== playerId) return null;
  const player = state.players[playerId];
  if (!player?.hand.length) return null;
  const base = { playerId, expectedTurnRevision: state.turnRevision };
  const choices = strategicSuggestions(state, playerId);
  if (choices[0]?.cards.length === player.hand.length) return { type: "play", ...base, cardIds: choices[0].cards.map((card) => card.id) };
  const enemies = enemyPlayers(state, playerId).sort((a, b) => a.hand.length - b.hand.length || a.id - b.id);
  const danger = enemies.some((enemy) => enemy.hand.length <= 2);
  const allyLeading = state.currentPlay && sameSide(state, playerId, state.currentPlay.playerId);
  if (allyLeading && !danger && !state.forcedNoPass) return { type: "pass", ...base };

  if (getSkillAvailability(state, playerId).available) {
    const activate = (extra: Partial<Extract<GameCommand, { type: "useSkill" }>> = {}): GameCommand => ({ type: "useSkill", ...base, ...extra });
    const hero = player.hero.id;
    if (hero === "kaisa" && (player.hand.length <= 5 || estimateTurns(player.hand.slice(0, -1)) < estimateTurns(player.hand))) return activate();
    if (hero === "darius" && state.currentPlay && !allyLeading && choices.length) return activate();
    if (hero === "ashe" && enemies[0] && (danger || enemies[0].hand.length <= 8)) return activate({ targetId: enemies[0].id });
    if (hero === "teemo" && enemies[0] && !enemies[0].buffs.mushroomed) return activate({ targetId: enemies[0].id });
    if (hero === "caitlyn" && enemies[0] && enemies[0].hand.length <= 8) return activate({ targetId: enemies[0].id });
    if (hero === "missfortune" && player.hand.some((card) => card.value <= 7) && estimateTurns(player.hand) >= 3) return activate();
    if (hero === "thresh") {
      const before = estimateTurns(player.hand);
      for (const take of recoverableCards(state)) {
        for (const give of player.hand) {
          const after = [...player.hand.filter((card) => card.id !== give.id), take];
          if (estimateTurns(after) < before) return activate({ takeCardId: take.id, returnCardId: give.id });
        }
      }
    }
    const buff = EMPOWER_BUFF_BY_HERO[hero];
    if (buff) {
      const empowered = { ...state, players: state.players.map((candidate) => candidate.id === playerId ? { ...candidate, buffs: { ...candidate.buffs, [buff]: true } } : candidate) };
      const enhanced = strategicSuggestions(empowered, playerId)[0];
      if (enhanced && (!choices.length || enhanced.cards.length === player.hand.length || enhanced.cards.length > choices[0].cards.length || (danger && enhanced.combo.value > choices[0].combo.value))) return activate();
    }
  }
  if (!choices.length) return { type: "pass", ...base };
  const index = difficulty === "casual" && choices.length > 1 && deterministicFraction(state.rngState, state.turnRevision, playerId) < 0.3 ? 1 : 0;
  return { type: "play", ...base, cardIds: choices[index].cards.map((card) => card.id) };
}
