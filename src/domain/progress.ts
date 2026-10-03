import { createDeck } from "./engine";
import { HERO_BY_ID, isHeroId } from "./heroes";
import type { GameState, HeroId, UserSettings } from "./types";
import type { StorageLike } from "./settings";

export const SESSION_KEY = "runeterra-ddz-match-v2";
export const PROFILE_KEY = "runeterra-ddz-profile-v2";
export const RULES_VERSION = 2;
export interface MatchRecord {
  id: string; heroId: HeroId; won: boolean; role: string; score: number; multiplier: number;
  seed: number; finishedAt: number; difficulty: UserSettings["difficulty"];
}
export interface Profile { records: MatchRecord[]; heroWins: Partial<Record<HeroId, number>>; recordedIds: string[] }
export const emptyProfile = (): Profile => ({ records: [], heroWins: {}, recordedIds: [] });
const object = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));
const integer = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;
const seat = (value: unknown): value is number => integer(value) && value < 3;
const cards = createDeck();
const validCard = (value: unknown) => object(value) && integer(value.id) && cards.some((card) => card.id === value.id && card.value === value.value && card.rank === value.rank && card.suit === value.suit && card.red === value.red);
const cardArray = (value: unknown): boolean => Array.isArray(value) && value.length <= 54 && value.every(validCard);
const comboTypes = new Set(["single", "pair", "triple", "tripleSolo", "triplePair", "straight", "pairSeq", "bomb", "rocket", "azirMarch", "tripleSeq", "planeSolo", "planePair", "fourSolo", "fourPair"]);

export function validSavedGame(value: unknown): value is GameState {
  if (!object(value) || !["bidding", "playing", "finished"].includes(String(value.phase))) return false;
  if (!["seed", "rngState", "turnRevision", "eventRevision", "operationRevision", "multiplier", "passCount"].every((key) => integer(value[key]))) return false;
  if (!seat(value.turnPlayerId) || (value.landlordId !== null && !seat(value.landlordId)) || (value.winnerId !== null && !seat(value.winnerId))) return false;
  if (typeof value.selectedHeroId !== "string" || !isHeroId(value.selectedHeroId) || !Array.isArray(value.heroChoices) || !value.heroChoices.every((hero) => object(hero) && typeof hero.id === "string" && isHeroId(hero.id))) return false;
  if (!Array.isArray(value.players) || value.players.length !== 3 || !value.players.every((player, index) => object(player) && player.id === index && typeof player.name === "string" && object(player.hero) && typeof player.hero.id === "string" && isHeroId(player.hero.id) && cardArray(player.hand) && object(player.buffs) && Object.values(player.buffs).every((buff) => typeof buff === "boolean") && typeof player.usedSkill === "boolean" && typeof player.warnedThree === "boolean" && ["地主", "农民", "待定"].includes(String(player.role)))) return false;
  if (!cardArray(value.bottomCards) || (value.bottomCards as unknown[]).length !== 3 || !cardArray(value.discardPile)) return false;
  if (!object(value.fieldFlags) || !Object.values(value.fieldFlags).every((flag) => typeof flag === "boolean") || !["training", "firstLeadOfTrick", "forcedNoPass"].every((key) => typeof value[key] === "boolean")) return false;
  if (!["responseQueue", "passedPlayerIds"].every((key) => Array.isArray(value[key]) && (value[key] as unknown[]).every(seat) && new Set(value[key] as unknown[]).size === (value[key] as unknown[]).length)) return false;
  if (value.interruptedNext !== null && !seat(value.interruptedNext)) return false;
  if (!Array.isArray(value.logs) || !value.logs.every((log) => typeof log === "string")) return false;
  if (!Array.isArray(value.events) || !value.events.every((event) => object(event) && integer(event.id) && ["info", "warning", "turn", "skill", "passive", "result"].includes(String(event.kind)) && ["title", "message", "announcement"].every((key) => typeof event[key] === "string") && ["playerId", "actorId", "targetId", "viewerId"].every((key) => event[key] === undefined || seat(event[key])))) return false;
  if (!Array.isArray(value.history) || !value.history.every((entry) => object(entry) && integer(entry.id) && seat(entry.playerId) && cardArray(entry.cards) && ["play", "beat", "pass", "round"].includes(String(entry.kind)) && ["playerName", "heroName", "label"].every((key) => typeof entry[key] === "string"))) return false;
  if (!Array.isArray(value.knownCards) || !value.knownCards.every((entry) => object(entry) && seat(entry.playerId) && (entry.viewerId === null || seat(entry.viewerId)) && validCard(entry.card) && typeof entry.source === "string")) return false;
  if (value.currentPlay !== null && (!object(value.currentPlay) || !seat(value.currentPlay.playerId) || !cardArray(value.currentPlay.cards) || !object(value.currentPlay.combo) || !comboTypes.has(String(value.currentPlay.combo.type)) || typeof value.currentPlay.combo.label !== "string" || !integer(value.currentPlay.combo.value) || !integer(value.currentPlay.combo.length))) return false;
  const game = value as unknown as GameState;
  const physical = [...game.players.flatMap((player) => player.hand), ...game.discardPile, ...(game.phase === "bidding" ? game.bottomCards : [])];
  if (physical.length !== 54 || new Set(physical.map((card) => card.id)).size !== 54) return false;
  if (game.phase !== "bidding" && game.landlordId === null) return false;
  if (game.phase === "finished" && (game.winnerId === null || game.players[game.winnerId].hand.length !== 0)) return false;
  if (game.phase === "playing" && (game.winnerId !== null || game.players.some((player) => !player.hand.length) || game.currentPlay?.playerId === game.turnPlayerId)) return false;
  if (game.currentPlay && !game.currentPlay.cards.every((card) => game.discardPile.some((discard) => discard.id === card.id))) return false;
  if (game.phase === "bidding" && (game.currentPlay !== null || game.passCount !== 0 || game.responseQueue.length > 0 || game.passedPlayerIds.length > 0 || game.interruptedNext !== null)) return false;
  if (game.phase === "playing") {
    const queue = game.responseQueue;
    const passed = game.passedPlayerIds;
    const leadId = game.currentPlay?.playerId ?? null;
    const consistent =
      game.passCount === passed.length &&
      !passed.includes(game.turnPlayerId) &&
      !queue.some((id) => passed.includes(id)) &&
      (leadId === null || (!queue.includes(leadId) && !passed.includes(leadId))) &&
      (queue.length === 0 || game.turnPlayerId === queue[0]) &&
      (leadId === null) === (queue.length === 0);
    if (!consistent) return false;
    if (leadId === null) {
      if (passed.length > 0 || game.interruptedNext !== null) return false;
    } else {
      const pending = game.players.filter((player) => player.id !== leadId && !passed.includes(player.id));
      if (queue.length !== pending.length || pending.some((player) => !queue.includes(player.id))) return false;
    }
    if (game.interruptedNext !== null) {
      // Only Garen's extra action may interrupt a trick; its continuation is the other responder.
      const landlord = game.players[game.landlordId ?? -1];
      if (landlord?.hero.id !== "garen" || game.turnPlayerId !== game.landlordId || game.fieldFlags.garen !== true || game.passCount !== 0 || game.interruptedNext !== queue[1]) return false;
    }
  }
  return true;
}

export function loadSession(storage?: StorageLike | null): { game: GameState | null; message: string } {
  try {
    const raw = storage?.getItem(SESSION_KEY);
    if (!raw) return { game: null, message: "" };
    const saved: unknown = JSON.parse(raw);
    if (!object(saved) || saved.schemaVersion !== 2 || saved.rulesVersion !== RULES_VERSION) return { game: null, message: "旧牌局与当前规则不兼容，请开始新牌局；设置与战绩已保留。" };
    if (!validSavedGame(saved.game)) return { game: null, message: "上次牌局数据不完整，已安全返回英雄选择。" };
    const game = saved.game;
    game.players.forEach((player) => { player.hero = HERO_BY_ID[player.hero.id]; });
    game.heroChoices = game.heroChoices.map((hero) => HERO_BY_ID[hero.id]);
    return { game, message: "已恢复上次牌局" };
  } catch { return { game: null, message: "无法读取上次牌局，仍可开始新游戏。" }; }
}

export function saveSession(game: GameState, storage?: StorageLike | null): boolean {
  if (!storage) return true;
  try {
    storage.setItem(SESSION_KEY, game.phase === "heroSelect" || game.training ? "" : JSON.stringify({ schemaVersion: 2, rulesVersion: RULES_VERSION, game }));
    return true;
  } catch { return false; }
}

export function loadProfile(storage?: StorageLike | null): Profile {
  try {
    const raw = storage?.getItem(PROFILE_KEY);
    if (!raw) return emptyProfile();
    const parsed: unknown = JSON.parse(raw);
    if (!object(parsed) || parsed.schemaVersion !== 2 || !object(parsed.profile)) return emptyProfile();
    const profile = parsed.profile;
    if (!Array.isArray(profile.records) || !Array.isArray(profile.recordedIds) || !profile.recordedIds.every((id) => typeof id === "string") || !object(profile.heroWins)) return emptyProfile();
    if (!Object.entries(profile.heroWins).every(([heroId, wins]) => isHeroId(heroId) && integer(wins))) return emptyProfile();
    if (!profile.records.every((record) => object(record) && typeof record.id === "string" && typeof record.heroId === "string" && isHeroId(record.heroId) && typeof record.won === "boolean" && Number.isFinite(record.score) && integer(record.multiplier) && integer(record.seed) && integer(record.finishedAt) && typeof record.role === "string" && ["casual", "standard"].includes(String(record.difficulty)))) return emptyProfile();
    return profile as unknown as Profile;
  } catch { return emptyProfile(); }
}

export function playerWon(game: GameState, playerId = 0): boolean {
  return game.winnerId !== null && (game.winnerId === game.landlordId) === (playerId === game.landlordId);
}
export function matchScore(game: GameState, playerId = 0): number {
  return (playerId === game.landlordId ? 20 : 10) * game.multiplier * (playerWon(game, playerId) ? 1 : -1);
}
export function recordMatch(game: GameState, settings: UserSettings, storage?: StorageLike | null): Profile {
  const profile = loadProfile(storage);
  if (game.phase !== "finished" || game.training || !game.selectedHeroId) return profile;
  const id = `${game.seed}:${game.selectedHeroId}`;
  if (profile.recordedIds.includes(id)) return profile;
  const won = playerWon(game);
  profile.records = [{ id, heroId: game.selectedHeroId, won, role: game.players[0].role, score: matchScore(game), multiplier: game.multiplier, seed: game.seed, finishedAt: Date.now(), difficulty: settings.difficulty }, ...profile.records].slice(0, 20);
  profile.recordedIds = [id, ...profile.recordedIds].slice(0, 1000);
  if (won) profile.heroWins[game.selectedHeroId] = (profile.heroWins[game.selectedHeroId] ?? 0) + 1;
  try { storage?.setItem(PROFILE_KEY, JSON.stringify({ schemaVersion: 2, profile })); } catch { /* Playing remains possible when storage is full. */ }
  return profile;
}
