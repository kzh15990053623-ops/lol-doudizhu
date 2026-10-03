export type HeroId =
  | "garen"
  | "darius"
  | "ashe"
  | "jinx"
  | "caitlyn"
  | "yasuo"
  | "thresh"
  | "azir"
  | "pantheon"
  | "missfortune"
  | "teemo"
  | "kaisa";

export interface HeroDefinition {
  id: HeroId;
  name: string;
  city: string;
  mark: string;
  color: string;
  skillName: string;
  skillSummary: string;
  skillDescription: string;
  fieldName: string;
  fieldSummary: string;
  fieldDescription: string;
}

export interface Card {
  id: number;
  rank: string;
  value: number;
  suit: string;
  red: boolean;
  joker?: true;
}

export type ComboType =
  | "single"
  | "pair"
  | "triple"
  | "tripleSolo"
  | "triplePair"
  | "straight"
  | "pairSeq"
  | "tripleSeq"
  | "planeSolo"
  | "planePair"
  | "fourSolo"
  | "fourPair"
  | "bomb"
  | "rocket"
  | "azirMarch";

export interface Combo {
  type: ComboType;
  value: number;
  length: number;
  label: string;
}

export interface CandidatePlay {
  cards: Card[];
  combo: Combo;
  reason?: string;
}

export interface PlayerBuffs {
  garen?: boolean;
  dariusExecute?: boolean;
  frozen?: boolean;
  jinxBomb?: boolean;
  caitlynFieldPeek?: boolean;
  yasuo?: boolean;
  azir?: boolean;
  pantheonPairBeatsSingle?: boolean;
  mushroomed?: boolean;
  skillBlocked?: boolean;
  noBomb?: boolean;
  pantheonShield?: boolean;
}

export interface Player {
  id: number;
  name: string;
  hero: HeroDefinition;
  hand: Card[];
  role: "待定" | "地主" | "农民";
  usedSkill: boolean;
  buffs: PlayerBuffs;
  warnedThree: boolean;
}

export interface CurrentPlay {
  playerId: number;
  cards: Card[];
  combo: Combo;
}

export type HistoryKind = "play" | "beat" | "pass" | "round";

export interface HistoryEntry {
  id: number;
  playerId: number;
  playerName: string;
  heroName: string;
  label: string;
  cards: Card[];
  kind: HistoryKind;
  targetId: number | null;
}

export type GameEventKind = "info" | "warning" | "turn" | "skill" | "passive" | "result";

export interface GameEvent {
  id: number;
  kind: GameEventKind;
  title: string;
  message: string;
  announcement: string;
  playerId?: number;
  actorId?: number;
  targetId?: number;
  operationId?: number;
  viewerId?: number;
}

export interface KnownCard {
  playerId: number;
  viewerId: number | null;
  card: Card;
  source: string;
}

export type GamePhase = "heroSelect" | "bidding" | "playing" | "finished";

export interface FieldFlags {
  garen?: boolean;
  azir?: boolean;
  pantheon?: boolean;
  kaisa?: boolean;
}

export interface GameState {
  phase: GamePhase;
  seed: number;
  rngState: number;
  heroChoices: HeroDefinition[];
  selectedHeroId: HeroId | null;
  players: Player[];
  bottomCards: Card[];
  landlordId: number | null;
  turnPlayerId: number;
  currentPlay: CurrentPlay | null;
  history: HistoryEntry[];
  passCount: number;
  multiplier: number;
  discardPile: Card[];
  firstLeadOfTrick: boolean;
  forcedNoPass: boolean;
  fieldFlags: FieldFlags;
  winnerId: number | null;
  turnRevision: number;
  eventRevision: number;
  events: GameEvent[];
  logs: string[];
  operationRevision: number;
  responseQueue: number[];
  passedPlayerIds: number[];
  interruptedNext: number | null;
  knownCards: KnownCard[];
  training: boolean;
}

interface TurnCommandBase {
  playerId: number;
  expectedTurnRevision: number;
}

export type GameCommand =
  | { type: "chooseHero"; heroId: HeroId }
  | { type: "bid"; call: boolean }
  | ({ type: "play"; cardIds: number[] } & TurnCommandBase)
  | ({ type: "pass" } & TurnCommandBase)
  | ({ type: "useSkill"; targetId?: number; takeCardId?: number; returnCardId?: number } & TurnCommandBase)
  | { type: "startPractice" }
  | { type: "restartMatch"; seed?: number | string }
  | { type: "returnToHeroSelect"; seed?: number | string };

export interface SelectionAnalysis {
  cards: Card[];
  combo: Combo | null;
  legal: boolean;
  reason: string;
}

export interface SkillAvailability {
  available: boolean;
  reason: string;
}

export interface UserSettings {
  muted: boolean;
  volume: number;
  aiSpeed: "normal" | "fast";
  difficulty: "casual" | "standard";
}

export type OverlayName = "guide" | "catalog" | "settings" | "menu" | "result" | "skill" | "history" | "records" | "confirmLeave" | null;

export interface GameUiState {
  selectedCardIds: number[];
  overlay: OverlayName;
  catalogHeroId: HeroId;
  focusedCardId: number | null;
}
