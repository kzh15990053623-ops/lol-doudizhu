import { describe, expect, it } from 'vitest';
import { HERO_BY_ID, canBeat, chooseAiCommand, classifyCards, createDeck, createInitialGame, gameReducer, generateCandidates, loadProfile, loadSession, matchScore, observeGame, playerWon, recordMatch, recoverableCards, replayGame, saveSession, validSavedGame, SESSION_KEY, DEFAULT_SETTINGS } from '..';
import type { Card, GameCommand, GameState, HeroId } from '..';

let cardId = 10000;
function cards(...values: number[]): Card[] { return values.map(value => ({ ...createDeck().find(card => card.value === value)!, id: cardId++ })); }
function begin(hero: HeroId = 'caitlyn', seed: number | string = 42, landlord = true): GameState {
  let game = createInitialGame(seed); game.heroChoices = [HERO_BY_ID[hero]];
  game = gameReducer(game, { type: 'chooseHero', heroId: hero });
  return gameReducer(game, { type: 'bid', call: landlord });
}
function act(game: GameState, type: 'play' | 'pass' | 'useSkill', options: Partial<Extract<GameCommand, { expectedTurnRevision: number }>> = {}) {
  return gameReducer(game, { type, playerId: game.turnPlayerId, expectedTurnRevision: game.turnRevision, ...options } as GameCommand);
}
function target(game: GameState, playerId: number, value = 5) { game.currentPlay = { playerId, cards: cards(value), combo: { type: 'single', value, length: 1, label: '单牌' } }; game.firstLeadOfTrick = false; }
const storage = () => { const data = new Map<string, string>(); return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } }; };

describe('完整牌规与技能边界', () => {
  it.each([
    [[3,3,3,4,4,4], 'tripleSeq'], [[3,3,3,4,4,4,7,7], 'planeSolo'], [[3,3,3,4,4,4,7,7,8,8], 'planePair'],
    [[6,6,6,6,8,8], 'fourSolo'], [[6,6,6,6,8,8,9,9], 'fourPair'],
  ] as const)('识别并生成 %s', (values, kind) => {
    const game = begin(); game.players[0].hand = cards(...values);
    expect(classifyCards(game, game.players[0].hand, game.players[0])?.type).toBe(kind);
    expect(generateCandidates(game, game.players[0]).some(candidate => candidate.combo.type === kind && candidate.cards.length === values.length)).toBe(true);
  });
  it('拒绝双王翅膀、主体复用、含 2 的连续三张和重复对子翅膀', () => {
    const game = begin();
    for (const values of [[3,3,3,4,4,4,16,17], [3,3,3,3,4,4,4,8], [14,14,14,15,15,15], [6,6,6,6,8,8,8,8]]) expect(classifyCards(game, cards(...values), game.players[0])).toBeNull();
  });
  it('飞机比较主体点数、类型和长度，普通炸弹仍可压制', () => {
    const game = begin(); const combo = { type: 'planeSolo' as const, value: 5, length: 8, label: '飞机带单' };
    const current = { playerId: 1, cards: [], combo: { ...combo, value: 4 } };
    expect(canBeat(game, combo, current, game.players[0])).toBe(true);
    expect(canBeat(game, { ...combo, length: 12 }, current, game.players[0])).toBe(false);
    expect(canBeat(game, { type: 'bomb', value: 3, length: 4, label: '炸弹' }, current, game.players[0])).toBe(true);
  });
  it('护盾只保护地主领出，禁炸在首出和响应时都生效', () => {
    const game = begin('pantheon'); game.players[0].buffs.pantheonShield = true;
    const bomb = { type: 'bomb' as const, value: 7, length: 4, label: '炸弹' };
    target(game, 1);
    expect(canBeat(game, bomb, game.currentPlay, game.players[2])).toBe(true);
    target(game, 0); expect(canBeat(game, bomb, game.currentPlay, game.players[2])).toBe(false);
    expect(canBeat(game, { type: 'rocket', value: 99, length: 2, label: '火箭' }, game.currentPlay, game.players[2])).toBe(true);
    game.players[2].buffs.noBomb = true;
    expect(canBeat(game, bomb, null, game.players[2])).toBe(false);
  });
  it('农民只能指定敌方，非法技能不会消耗或触发城邦', () => {
    const game = begin('ashe'); game.landlordId = 1; game.players[0].role = '农民'; game.players[1].role = '地主';
    const rejected = act(game, 'useSkill', { targetId: 2 });
    expect(rejected.players[0].usedSkill).toBe(false);
    const used = act(game, 'useSkill'); expect(used.players[1].buffs.frozen).toBe(true); expect(used.players[2].buffs.frozen).toBeUndefined();
  });
  it('蘑菇只降低比较点数，过牌与炸弹不消耗，也不帮助对手弃牌', () => {
    let game = begin('teemo'); game.players[1].hand = cards(9, 3); game.players[2].hand = cards(6);
    game = act(game, 'useSkill', { targetId: 1 });
    game.players[0].hand = cards(4, 5); game = act(game, 'play', { cardIds: [game.players[0].hand[0].id] });
    game = act(game, 'play', { cardIds: [game.players[1].hand[0].id] });
    expect(game.players[1].hand).toHaveLength(1); expect(game.phase).toBe('playing'); expect(game.currentPlay?.combo.value).toBe(8);
    expect(game.players[1].buffs.mushroomed).toBeUndefined();
    game.players[2].buffs.mushroomed = true; game = act(game, 'pass'); expect(game.players[2].buffs.mushroomed).toBe(true);
  });
  it('亚索强化保留到顺子，而盖伦在下一次出牌消耗', () => {
    let game = begin('yasuo'); game.players[0].hand = cards(3,4,6,7,8,9);
    game = act(game, 'useSkill'); game = act(game, 'play', { cardIds: [game.players[0].hand.at(-1)!.id] });
    expect(game.players[0].buffs.yasuo).toBe(true);
    game.turnPlayerId = 0; game.currentPlay = null;
    game = act(game, 'play', { cardIds: game.players[0].hand.map(card => card.id) });
    expect(game.players[0].buffs.yasuo).toBeUndefined(); expect(game.phase).toBe('finished');
  });
  it.each(['pass', 'play'] as const)('盖伦额外 %s 后恢复原响应顺序', type => {
    let game = begin('garen'); game.players[0].hand = cards(8, 9); game.players[1].hand = cards(6, 7); target(game, 0); game.turnPlayerId = 1;
    game = act(game, 'play', { cardIds: [game.players[1].hand[0].id] }); expect(game.turnPlayerId).toBe(0);
    game = act(game, type, type === 'play' ? { cardIds: [game.players[0].hand[0].id] } : {});
    expect(game.turnPlayerId).toBe(2); expect(game.turnPlayerId).not.toBe(game.currentPlay?.playerId);
    game = act(game, 'pass');
    expect(game.turnPlayerId).toBe(1);
    if (type === 'pass') expect(game.currentPlay).toBeNull();
    else { game = act(game, 'pass'); expect(game.turnPlayerId).toBe(0); expect(game.currentPlay).toBeNull(); }
  });
  it('锤石换牌不改变数量，不可拿走当前领出牌', () => {
    let game = begin('thresh'); const discard = cards(3, 4); game.discardPile = discard; game.players[0].hand = cards(5, 6, 7);
    game.currentPlay = { playerId: 1, cards: [discard[1]], combo: { type: 'single', value: 4, length: 1, label: '单牌' } };
    expect(recoverableCards(game).map(card => card.id)).toEqual([discard[0].id]);
    const originalCount = game.players[0].hand.length; const give = game.players[0].hand[0].id;
    game = act(game, 'useSkill', { takeCardId: discard[0].id, returnCardId: give });
    expect(game.players[0].hand).toHaveLength(originalCount); expect(game.players[0].hand.some(card => card.id === discard[0].id)).toBe(true); expect(game.discardPile.some(card => card.id === give)).toBe(true);
  });
  it('侦查区分施法者与目标，并在牌离开手牌时移除已知信息', () => {
    let game = begin('caitlyn'); game = act(game, 'useSkill', { targetId: 1 });
    const result = game.events.at(-1)!; expect(result.actorId).toBe(0); expect(result.targetId).toBe(1); expect(result.viewerId).toBe(0);
    expect(game.knownCards).toHaveLength(3); const exposed = game.knownCards[0].card;
    game.turnPlayerId = 1; game.currentPlay = null; game = act(game, 'play', { cardIds: [exposed.id] });
    expect(game.knownCards.some(known => known.card.id === exposed.id)).toBe(false);
  });
  it('卡莎主动跨过阈值触发城邦，操作产生的事件保持同一编号', () => {
    let game = begin('kaisa'); game.players[0].hand = cards(3,4,5,6,7); game = act(game, 'useSkill');
    expect(game.fieldFlags.kaisa).toBe(true); expect(game.players.some(player => player.buffs.noBomb)).toBe(true);
    expect(new Set(game.events.slice(-2).map(event => event.operationId)).size).toBe(1);
    expect(game.events.filter(event => event.title === '虚空干扰')).toHaveLength(1);
  });
});

describe('AI 观察与配合决策', () => {
  it('暗牌排列与点数改变不影响同一公开局面的决策', () => {
    const game = begin(); game.turnPlayerId = 1; game.players[1].usedSkill = true;
    const before = chooseAiCommand(game);
    const altered = structuredClone(game); altered.players[0].hand = altered.players[0].hand.map(card => ({ ...card, value: 3 })); altered.players[2].hand.reverse();
    expect(chooseAiCommand(altered)).toEqual(before);
    const observation = observeGame(game, 1); expect(observation.state.players[0].hand.every(card => card.value === 0)).toBe(true);
    const revealed = game.players[0].hand[0];
    game.knownCards = [{ playerId: 0, viewerId: null, card: revealed, source: '公开' }, { playerId: 0, viewerId: 1, card: revealed, source: '侦查' }];
    const knownHand = observeGame(game, 1).state.players[0].hand;
    expect(knownHand).toHaveLength(game.players[0].hand.length);
    expect(knownHand.filter(card => card.id === revealed.id)).toHaveLength(1);
  });
  it('农民让队友领出，但有机会直接获胜时出牌', () => {
    const game = begin(); game.turnPlayerId = 1; game.players[1].usedSkill = true; game.players[1].hand = cards(6,8); target(game, 2);
    expect(chooseAiCommand(game)?.type).toBe('pass');
    game.players[1].hand = cards(6); expect(chooseAiCommand(game)?.type).toBe('play');
  });
});

describe('续局、阵营结算与本地成长', () => {
  it('可恢复合法存档，损坏和旧版本存档给出解释', () => {
    const store = storage(); const game = begin(); expect(saveSession(game, store)).toBe(true); expect(loadSession(store).game).toEqual(game);
    const broken = structuredClone(game); broken.players[1].hand[0] = broken.players[0].hand[0]; saveSession(broken, store); expect(loadSession(store).game).toBeNull();
    store.setItem(SESSION_KEY, JSON.stringify({ schemaVersion: 1, rulesVersion: 1, game })); expect(loadSession(store).message).toMatch(/不兼容/);
  });
  it('回合状态不一致的进行中存档被拒绝恢复', () => {
    let game = begin(); game = act(game, 'play', { cardIds: [game.players[0].hand[0].id] });
    const store = storage();
    expect(game.phase).toBe('playing'); expect(game.currentPlay?.playerId).toBe(0); expect(game.responseQueue[0]).toBe(game.turnPlayerId);
    expect(saveSession(game, store)).toBe(true); expect(loadSession(store).game).toEqual(game);
    const corrupt = (mutate: (draft: GameState) => void) => {
      const draft = structuredClone(game); mutate(draft); saveSession(draft, store);
      expect(loadSession(store).game, JSON.stringify({ queue: draft.responseQueue, passed: draft.passedPlayerIds, turn: draft.turnPlayerId, passCount: draft.passCount })).toBeNull();
    };
    corrupt(draft => { draft.responseQueue = [draft.turnPlayerId, 0]; });
    corrupt(draft => { draft.passedPlayerIds = [draft.turnPlayerId]; draft.passCount = 1; });
    corrupt(draft => { draft.passCount = 1; });
    corrupt(draft => { draft.turnPlayerId = 2; });
    corrupt(draft => { draft.responseQueue = []; });
    corrupt(draft => { draft.responseQueue = [draft.turnPlayerId]; });
    corrupt(draft => { draft.interruptedNext = draft.currentPlay!.playerId; });
    corrupt(draft => { draft.interruptedNext = draft.turnPlayerId; });
    corrupt(draft => { draft.interruptedNext = draft.responseQueue[1]; });
  });
  it('抢地主和重新首出的存档不能残留响应状态', () => {
    const playing = begin();
    const initial = createInitialGame('bidding-save');
    const bidding = gameReducer(initial, { type: 'chooseHero', heroId: initial.heroChoices[0].id });
    const store = storage();
    for (const game of [bidding, playing]) {
      expect(validSavedGame(game)).toBe(true);
      for (const mutation of [
        (draft: GameState) => { draft.passedPlayerIds = [1]; draft.passCount = 1; },
        (draft: GameState) => { draft.responseQueue = [draft.turnPlayerId]; },
        (draft: GameState) => { draft.interruptedNext = 1; },
      ]) {
        const invalid = structuredClone(game); mutation(invalid); saveSession(invalid, store);
        expect(loadSession(store).game).toBeNull();
      }
    }
  });
  function garenExtraTurn(responder: number) {
    let game = begin('garen');
    const lead = game.players[0].hand.at(-1)!;
    game = act(game, 'play', { cardIds: [lead.id] });
    if (responder === 2) game = act(game, 'pass');
    const response = [...game.players[responder].hand].sort((a, b) => a.value - b.value).find(card => card.value > lead.value)!;
    game = act(game, 'play', { cardIds: [response.id] });
    expect(game.turnPlayerId).toBe(0);
    expect(game.interruptedNext).toBe(3 - responder);
    return game;
  }
  it('盖伦额外回合的恢复目标必须与队列及城邦状态一致', () => {
    const game = garenExtraTurn(1); const store = storage();
    for (const mutation of [
      (draft: GameState) => { draft.interruptedNext = draft.currentPlay!.playerId; },
      (draft: GameState) => { draft.interruptedNext = draft.turnPlayerId; },
      (draft: GameState) => { draft.fieldFlags.garen = false; },
      (draft: GameState) => { draft.players[0].hero = HERO_BY_ID.caitlyn; },
      (draft: GameState) => { draft.responseQueue = [0]; },
      (draft: GameState) => { draft.passedPlayerIds = [2]; draft.passCount = 1; draft.responseQueue = [0]; },
    ]) {
      const invalid = structuredClone(game); mutation(invalid); saveSession(invalid, store);
      expect(loadSession(store).game).toBeNull();
    }
  });
  it.each([[1, 'pass'], [1, 'play'], [2, 'pass'], [2, 'play']] as const)('盖伦被座位 %s 压制，续局后额外 %s 仍恢复正确顺序', (responder, action) => {
    const store = storage();
    const restore = (game: GameState) => {
      expect(saveSession(game, store)).toBe(true);
      const loaded = loadSession(store).game;
      expect(loaded).toEqual(game);
      return loaded!;
    };
    let game = restore(garenExtraTurn(responder));
    const response = game.players[0].hand.find(card => card.value > game.currentPlay!.combo.value)!;
    game = restore(act(game, action, action === 'play' ? { cardIds: [response.id] } : {}));
    expect(game.turnPlayerId).toBe(3 - responder);
    expect(game.interruptedNext).toBeNull();
    game = restore(act(game, 'pass'));
    expect(game.turnPlayerId).toBe(responder);
    if (action === 'play') {
      game = restore(act(game, 'pass'));
      expect(game.turnPlayerId).toBe(0);
    }
    expect(game.currentPlay).toBeNull();
  });
  it('农民队友获胜计入自己的胜利，积分零和，重复结算只记一次', () => {
    const game = begin(); game.landlordId = 1; game.winnerId = 2; game.phase = 'finished'; game.players[0].role = '农民';
    expect(playerWon(game)).toBe(true); expect(matchScore(game)).toBe(10); expect(game.players.reduce((sum, player) => sum + matchScore(game, player.id), 0)).toBe(0);
    const store = storage(); recordMatch(game, DEFAULT_SETTINGS, store); recordMatch(game, DEFAULT_SETTINGS, store);
    expect(loadProfile(store).records).toHaveLength(1); expect(loadProfile(store).heroWins[game.selectedHeroId!]).toBe(1);
    game.training = true; game.seed++; recordMatch(game, DEFAULT_SETTINGS, store); expect(loadProfile(store).records).toHaveLength(1);
  });
  it('仅保留最近 20 局，累计英雄胜场不丢失；重开沿用英雄', () => {
    const game = begin(); game.winnerId = 0; game.phase = 'finished'; const store = storage();
    for (let seed = 1; seed <= 25; seed++) recordMatch({ ...game, seed }, DEFAULT_SETTINGS, store);
    expect(loadProfile(store).records).toHaveLength(20); expect(loadProfile(store).heroWins.caitlyn).toBe(25);
    const restart = gameReducer(game, { type: 'restartMatch' }); expect(restart.phase).toBe('bidding'); expect(restart.selectedHeroId).toBe(game.selectedHeroId); expect(restart.seed).not.toBe(game.seed);
  });
  it('练习包含可激活城邦的三张 3，且相同指令序列可重放', () => {
    let game = gameReducer(createInitialGame(1), { type: 'startPractice' }); expect(game.training).toBe(true);
    const commands: GameCommand[] = [{ type: 'startPractice' }, { type: 'useSkill', playerId: 0, expectedTurnRevision: game.turnRevision }];
    game = gameReducer(game, commands[1]);
    const play: GameCommand = { type: 'play', playerId: 0, expectedTurnRevision: game.turnRevision, cardIds: game.players[0].hand.filter(card => card.value === 3).slice(0, 3).map(card => card.id) };
    commands.push(play); game = gameReducer(game, play); expect(game.events.some(event => event.title === '失控爆燃')).toBe(true);
    expect(replayGame(1, commands)).toEqual(game);
  });
});
