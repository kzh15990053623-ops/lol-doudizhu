import { describe, expect, it } from 'vitest';
import { HEROES, HERO_BY_ID, chooseAiCommand, createInitialGame, gameReducer, validSavedGame } from '..';
import type { GameState, HeroId } from '..';

function begin(hero: HeroId, seed: number | string, landlord: boolean): GameState {
  let game = createInitialGame(seed); game.heroChoices = [HERO_BY_ID[hero]];
  game = gameReducer(game, { type: 'chooseHero', heroId: hero });
  return gameReducer(game, { type: 'bid', call: landlord });
}

// npm test 保留完整模拟；npm run test:fast 会跳过本文件。
describe('千局完整对战模拟', () => {
  it('1000 局覆盖十二英雄、双方阵营、两档 AI，合法行动且 54 张牌始终唯一归属', () => {
    const heroCounts = new Set<string>(); const landlordIds = new Set<number>();
    for (let seed = 1; seed <= 1000; seed++) {
      let game = begin(HEROES[seed % HEROES.length].id, seed, seed % 3 === 0); heroCounts.add(game.players[0].hero.id); landlordIds.add(game.landlordId!);
      expect(validSavedGame(game), `initial saved seed ${seed}`).toBe(true);
      let actions = 0;
      while (game.phase === 'playing' && actions++ < 300) {
        const command = chooseAiCommand(game, seed % 2 ? 'standard' : 'casual'); expect(command, `seed ${seed}`).not.toBeNull();
        const next = gameReducer(game, command!); expect(next.events.at(-1)?.kind, `seed ${seed}, ${JSON.stringify(command)}`).not.toBe('warning');
        const all = [...next.players.flatMap(player => player.hand), ...next.discardPile];
        expect(all.length, `seed ${seed}`).toBe(54); expect(new Set(all.map(card => card.id)).size, `seed ${seed}`).toBe(54);
        expect(next.turnPlayerId === next.currentPlay?.playerId && next.phase === 'playing', `seed ${seed}`).toBe(false);
        expect(validSavedGame(next), `saved seed ${seed}, action ${actions}, ${JSON.stringify(command)}`).toBe(true);
        game = next;
      }
      expect(game.phase, `seed ${seed}, actions ${actions}`).toBe('finished');
      expect(validSavedGame(game), `saved seed ${seed}`).toBe(true);
    }
    expect(heroCounts.size).toBe(12); expect(landlordIds.size).toBe(3);
  }, 120000);
});
