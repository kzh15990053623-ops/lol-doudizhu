import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore, type Dispatch, type PropsWithChildren } from 'react';
import { HEROES, analyzeSelection, canPlayerPass, chooseAiCommand, createInitialGame, gameReducer, getSkillAvailability, getSuggestionKey, loadSettings, saveSettings, strategicSuggestions, loadSession } from '../domain';
import { createProgressStore } from './progressStore';
import type { GameCommand, GameEvent, GameState, GameUiState, HeroId, OverlayName, SelectionAnalysis, SkillAvailability, StorageLike, UserSettings, Profile } from '../domain';
import { playFeedback, setSoundVolume, stopSound, unlockSound } from './sound';

type SkillOptions = { targetId?: number; takeCardId?: number; returnCardId?: number };
interface GameContextValue {
  game: GameState; ui: GameUiState; settings: UserSettings; selection: SelectionAnalysis;
  passAvailability: { allowed: boolean; reason: string }; skillAvailability: SkillAvailability;
  isPortrait: boolean; isPaused: boolean; isAiThinking: boolean; announcement: string;
  visibleEvent: GameEvent | undefined; notice: string; hintText: string; hasResponse: boolean;
  profile: Profile; practiceSelected: boolean; practiceHinted: boolean;
  chooseHero(heroId: HeroId): void; bid(call: boolean): void; toggleCard(cardId: number): void;
  setFocusedCard(cardId: number | null): void; playSelection(): void; pass(): void; hint(): void;
  useSkill(): void; confirmSkill(options: SkillOptions): void; clearSelection(): void;
  openOverlay(name: Exclude<OverlayName, null>): void; closeOverlay(): void;
  setCatalogHero(heroId: HeroId): void; updateSettings(patch: Partial<UserSettings>): void;
  restartMatch(): void; returnToHeroSelect(): void; confirmLeave(): void; startPractice(): void;
  dispatchGame: Dispatch<GameCommand>;
}

type UiAction = { type: 'toggleCard'; cardId: number } | { type: 'selectCards'; cardIds: number[]; focusedCardId: number | null } | { type: 'clearSelection' } | { type: 'setFocus'; cardId: number | null } | { type: 'openOverlay'; name: Exclude<OverlayName, null> } | { type: 'closeOverlay' } | { type: 'setCatalogHero'; heroId: HeroId };
const initialUi: GameUiState = { selectedCardIds: [], overlay: null, catalogHeroId: HEROES[0].id, focusedCardId: null };
function uiReducer(state: GameUiState, action: UiAction): GameUiState {
  switch (action.type) {
    case 'toggleCard': return { ...state, selectedCardIds: state.selectedCardIds.includes(action.cardId) ? state.selectedCardIds.filter(id => id !== action.cardId) : [...state.selectedCardIds, action.cardId], focusedCardId: action.cardId };
    case 'selectCards': return { ...state, selectedCardIds: action.cardIds, focusedCardId: action.focusedCardId };
    case 'clearSelection': return { ...state, selectedCardIds: [] };
    case 'setFocus': return { ...state, focusedCardId: action.cardId };
    case 'openOverlay': return { ...state, overlay: action.name };
    case 'closeOverlay': return { ...state, overlay: null };
    case 'setCatalogHero': return { ...state, catalogHeroId: action.heroId };
  }
}
interface GameProviderProps extends PropsWithChildren { seed?: number | string; aiEnabled?: boolean; storage?: StorageLike | null; initialGame?: GameState }
interface GameLifecycleState { game: GameState; matchRevision: number }
function gameLifecycleReducer(state: GameLifecycleState, command: GameCommand): GameLifecycleState {
  const startsMatch = command.type === 'startPractice' || command.type === 'restartMatch' || command.type === 'returnToHeroSelect';
  return { game: gameReducer(state.game, command), matchRevision: state.matchRevision + Number(startsMatch) };
}
const GameContext = createContext<GameContextValue | null>(null);
function browserStorage(): StorageLike | null { try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; } }
function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && Boolean(window.matchMedia?.(query).matches));
  useEffect(() => { const media = window.matchMedia?.(query); if (!media) return; const update = () => setMatches(media.matches); update(); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, [query]);
  return matches;
}

export function GameProvider({ children, seed, aiEnabled = true, storage, initialGame }: GameProviderProps) {
  const resolvedStorage = useMemo(() => storage === undefined ? browserStorage() : storage, [storage]);
  const [boot] = useState(() => seed === undefined && initialGame === undefined ? loadSession(resolvedStorage) : { game: null, message: '' });
  const [{ game, matchRevision }, dispatchGame] = useReducer(gameLifecycleReducer, undefined, () => ({
    game: initialGame ?? boot.game ?? createInitialGame(seed ?? new URLSearchParams(window.location.search).get('seed') ?? Date.now()),
    matchRevision: 0,
  }));
  const [ui, dispatchUi] = useReducer(uiReducer, initialUi);
  const [settings, setSettings] = useState(() => loadSettings(resolvedStorage));
  const progressStore = useMemo(() => createProgressStore(resolvedStorage), [resolvedStorage]);
  const persistence = useSyncExternalStore(progressStore.subscribe, progressStore.getSnapshot);
  const [notice, setNotice] = useState(boot.message);
  const [hintText, setHintText] = useState('');
  const [practiceSelected, setPracticeSelected] = useState(false);
  const [practiceHinted, setPracticeHinted] = useState(false);
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden');
  const isPortrait = useMedia('(orientation: portrait) and (max-width: 820px)');
  const reducedMotion = useMedia('(prefers-reduced-motion: reduce)');
  const [presented, setPresented] = useState({ matchRevision, id: boot.game?.eventRevision ?? 0 });
  const consumedAudio = useRef('');
  // A seed identifies the deal; each new match still needs its own feedback cursor.
  const cursor = presented.matchRevision === matchRevision ? presented.id : 0;
  const publicEvents = useMemo(() => game.events.filter(event => event.viewerId === undefined || event.viewerId === 0), [game.events]);
  const pendingEvent = publicEvents.find(event => event.id > cursor);
  const visibleEvent = pendingEvent ?? publicEvents.at(-1);
  const isPaused = !visible || isPortrait || (ui.overlay !== null && ui.overlay !== 'result');
  const announcement = visibleEvent?.announcement ?? '';
  const hintCycle = useRef({ key: '', index: -1 });
  const previousHand = useRef<number[]>([]);
  const selection = useMemo(() => analyzeSelection(game, ui.selectedCardIds, 0), [game, ui.selectedCardIds]);
  const passAvailability = useMemo(() => canPlayerPass(game, 0), [game]);
  const skillAvailability = useMemo(() => getSkillAvailability(game, 0), [game]);
  const suggestions = useMemo(() => strategicSuggestions(game, 0), [game]);

  const clearSelection = useCallback(() => { hintCycle.current = { key: '', index: -1 }; setHintText(''); dispatchUi({ type: 'clearSelection' }); }, []);
  const openOverlay = useCallback((name: Exclude<OverlayName, null>) => { unlockSound(); dispatchUi({ type: 'openOverlay', name }); }, []);
  const closeOverlay = useCallback(() => dispatchUi({ type: 'closeOverlay' }), []);
  const playSelection = useCallback(() => {
    if (game.phase !== 'playing' || game.turnPlayerId !== 0) return;
    unlockSound(); dispatchGame({ type: 'play', playerId: 0, cardIds: ui.selectedCardIds, expectedTurnRevision: game.turnRevision });
    if (selection.legal) clearSelection();
  }, [game.phase, game.turnPlayerId, game.turnRevision, ui.selectedCardIds, selection.legal, clearSelection]);
  const pass = useCallback(() => { if (!passAvailability.allowed) return; unlockSound(); dispatchGame({ type: 'pass', playerId: 0, expectedTurnRevision: game.turnRevision }); clearSelection(); }, [passAvailability.allowed, game.turnRevision, clearSelection]);
  const useSkill = useCallback(() => { if (skillAvailability.available) openOverlay('skill'); }, [skillAvailability.available, openOverlay]);
  const confirmSkill = useCallback((options: SkillOptions) => { unlockSound(); dispatchGame({ type: 'useSkill', playerId: 0, expectedTurnRevision: game.turnRevision, ...options }); closeOverlay(); }, [game.turnRevision, closeOverlay]);
  const hint = useCallback(() => {
    if (game.phase !== 'playing' || game.turnPlayerId !== 0) return;
    unlockSound();
    if (!suggestions.length) { dispatchUi({ type: 'clearSelection' }); setHintText('无牌可压，可以选择不要'); return; }
    const key = getSuggestionKey(game, 0); const index = hintCycle.current.key === key ? (hintCycle.current.index + 1) % suggestions.length : 0;
    hintCycle.current = { key, index };
    const practiceCards = game.training && !game.players[0].usedSkill ? game.players[0].hand.filter(card => card.value === 3).slice(0, 3) : null;
    const chosen = practiceCards?.length === 3 ? practiceCards : suggestions[index].cards;
    const ids = new Set(chosen.map(card => card.id)); const cardIds = game.players[0].hand.filter(card => ids.has(card.id)).map(card => card.id);
    dispatchUi({ type: 'selectCards', cardIds, focusedCardId: cardIds[0] ?? null });
    setHintText(game.training ? '练习：选中三张 3，发动飞弹后再出牌' : `${index + 1}/${suggestions.length} · ${suggestions[index].reason}`);
    setPracticeHinted(true);
  }, [game, suggestions]);

  useEffect(() => { const onVisibility = () => setVisible(document.visibilityState !== 'hidden'); document.addEventListener('visibilitychange', onVisibility); return () => document.removeEventListener('visibilitychange', onVisibility); }, []);
  useEffect(() => { saveSettings(settings, resolvedStorage); }, [settings, resolvedStorage]);
  useEffect(() => { progressStore.sync(game, settings); }, [game, settings, progressStore]);
  useEffect(() => {
    const ids = game.players[0]?.hand.map(card => card.id) ?? [];
    const selected = ui.selectedCardIds.filter(id => ids.includes(id));
    if (selected.length !== ui.selectedCardIds.length) dispatchUi({ type: 'selectCards', cardIds: selected, focusedCardId: ui.focusedCardId });
    if (ui.focusedCardId !== null && !ids.includes(ui.focusedCardId) && previousHand.current.includes(ui.focusedCardId)) {
      const index = previousHand.current.indexOf(ui.focusedCardId); dispatchUi({ type: 'setFocus', cardId: ids[Math.min(index, ids.length - 1)] ?? null });
    }
    previousHand.current = ids;
  }, [game.players, ui.selectedCardIds, ui.focusedCardId]);
  useEffect(() => {
    if (!pendingEvent || isPaused) return;
    const duration = reducedMotion ? 1 : settings.aiSpeed === 'fast' ? 140 : ['skill', 'passive', 'result'].includes(pendingEvent.kind) ? 550 : 180;
    const timer = window.setTimeout(() => setPresented({ matchRevision, id: pendingEvent.id }), duration);
    return () => window.clearTimeout(timer);
  }, [pendingEvent, isPaused, matchRevision, reducedMotion, settings.aiSpeed]);
  useEffect(() => {
    if (isPaused || settings.muted || settings.volume <= 0) { stopSound(); return; }
    setSoundVolume(settings.volume);
    if (!pendingEvent) return;
    const key = `${matchRevision}:${pendingEvent.id}`;
    if (consumedAudio.current === key) return;
    consumedAudio.current = key; playFeedback(pendingEvent, game, settings);
  }, [isPaused, pendingEvent, game, settings, matchRevision]);
  useEffect(() => () => stopSound(), []);
  useEffect(() => {
    if (!aiEnabled || isPaused || ui.overlay !== null || pendingEvent || game.phase !== 'playing' || game.turnPlayerId === 0) return;
    const timer = window.setTimeout(() => { const command = chooseAiCommand(game, settings.difficulty); if (command) dispatchGame(command); }, settings.aiSpeed === 'fast' ? 260 : 700);
    return () => window.clearTimeout(timer);
  }, [aiEnabled, isPaused, ui.overlay, pendingEvent, game, settings.aiSpeed, settings.difficulty]);
  useEffect(() => { if (game.phase === 'finished' && ui.overlay === null && !pendingEvent) openOverlay('result'); }, [game.phase, ui.overlay, pendingEvent, openOverlay]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey || isPaused || ui.overlay !== null) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable)) return;
      if (event.key === 'Escape' && ui.selectedCardIds.length) { event.preventDefault(); clearSelection(); return; }
      if (game.phase !== 'playing' || game.turnPlayerId !== 0) return;
      const actions: Record<string, () => void> = { p: playSelection, h: hint, x: pass, s: useSkill };
      const action = actions[event.key.toLowerCase()]; if (action) { event.preventDefault(); action(); }
    };
    document.addEventListener('keydown', onKeyDown); return () => document.removeEventListener('keydown', onKeyDown);
  }, [isPaused, ui.overlay, ui.selectedCardIds.length, game.phase, game.turnPlayerId, clearSelection, playSelection, hint, pass, useSkill]);

  const confirmLeave = useCallback(() => { clearSelection(); closeOverlay(); stopSound(); setNotice(''); dispatchGame({ type: 'returnToHeroSelect', seed: Date.now() }); }, [clearSelection, closeOverlay]);
  const returnToHeroSelect = useCallback(() => { if (['bidding', 'playing'].includes(game.phase) && !game.training) openOverlay('confirmLeave'); else confirmLeave(); }, [game.phase, game.training, openOverlay, confirmLeave]);
  const value: GameContextValue = {
    game, ui, settings, selection, passAvailability, skillAvailability, isPortrait, isPaused,
    isAiThinking: aiEnabled && !isPaused && ui.overlay === null && game.phase === 'playing' && game.turnPlayerId !== 0,
    visibleEvent, announcement, notice: persistence.notice || notice, hintText, hasResponse: suggestions.length > 0, profile: persistence.profile, practiceSelected, practiceHinted,
    chooseHero: heroId => { unlockSound(); setNotice(''); dispatchGame({ type: 'chooseHero', heroId }); },
    bid: call => { unlockSound(); dispatchGame({ type: 'bid', call }); },
    toggleCard: cardId => { unlockSound(); playFeedback({ id: 0, kind: 'info', title: '选牌', message: '选牌', announcement: '' }, game, settings); setPracticeSelected(true); setHintText(''); dispatchUi({ type: 'toggleCard', cardId }); },
    setFocusedCard: cardId => dispatchUi({ type: 'setFocus', cardId }),
    playSelection, pass, hint, useSkill, confirmSkill, clearSelection, openOverlay, closeOverlay,
    setCatalogHero: heroId => dispatchUi({ type: 'setCatalogHero', heroId }),
    updateSettings: patch => setSettings(current => ({ ...current, ...patch })),
    restartMatch: () => { clearSelection(); closeOverlay(); stopSound(); setNotice(''); dispatchGame({ type: 'restartMatch', seed: game.rngState }); },
    returnToHeroSelect, confirmLeave,
    startPractice: () => { clearSelection(); closeOverlay(); setPracticeSelected(false); setPracticeHinted(false); dispatchGame({ type: 'startPractice' }); },
    dispatchGame,
  };
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
export function useGame(): GameContextValue { const value = useContext(GameContext); if (!value) throw new Error('useGame must be used inside GameProvider'); return value; }
