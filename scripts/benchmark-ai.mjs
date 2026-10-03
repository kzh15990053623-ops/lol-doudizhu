import { createServer } from 'vite';
import { performance } from 'node:perf_hooks';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const d = await server.ssrLoadModule('/src/domain/index.ts');
  function reference(game) {
    const p = game.players[game.turnPlayerId]; const base = { playerId: p.id, expectedTurnRevision: game.turnRevision };
    if (d.getSkillAvailability(game, p.id).available && d.deterministicFraction(game.rngState, game.turnRevision, p.id) < 0.36) {
      if (p.hero.id !== 'thresh') return { type: 'useSkill', ...base };
      const take = d.recoverableCards(game).at(-1);
      if (take) return { type: 'useSkill', ...base, takeCardId: take.id, returnCardId: p.hand.at(-1).id };
    }
    const move = d.suggestPlays(game, p.id)[0];
    return move ? { type: 'play', ...base, cardIds: move.cards.map(card => card.id) } : { type: 'pass', ...base };
  }
  const count = Number(process.argv[2] ?? 600);
  const outcome = { seeds: count, standardWins: 0, referenceWins: 0, improved: 0, regressed: 0, landlord: { games: 0, standardWins: 0, referenceWins: 0 }, farmer: { games: 0, standardWins: 0, referenceWins: 0 } };
  const timings = [];
  for (let seed = 1; seed <= count; seed++) {
    let initial = d.createInitialGame(seed);
    const hero = d.HEROES[seed % 12]; initial.heroChoices = [hero];
    initial = d.gameReducer(initial, { type: 'chooseHero', heroId: hero.id });
    initial = d.gameReducer(initial, { type: 'bid', call: seed % 3 === 0 });
    const wins = [];
    for (const standard of [false, true]) {
      let game = initial;
      for (let turn = 0; game.phase === 'playing' && turn < 300; turn++) {
        const start = performance.now();
        const move = standard && game.turnPlayerId === 0 ? d.chooseAiCommand(game, 'standard') : reference(game);
        if (standard && game.turnPlayerId === 0) timings.push(performance.now() - start);
        game = d.gameReducer(game, move);
        if (game.events.at(-1)?.kind === 'warning') throw new Error(`Illegal move, seed ${seed}`);
      }
      if (game.phase !== 'finished') throw new Error(`Unfinished, seed ${seed}`);
      wins.push(d.playerWon(game));
    }
    const role = initial.landlordId === 0 ? outcome.landlord : outcome.farmer;
    role.games++; role.referenceWins += Number(wins[0]); role.standardWins += Number(wins[1]);
    outcome.referenceWins += Number(wins[0]); outcome.standardWins += Number(wins[1]);
    outcome.improved += Number(!wins[0] && wins[1]); outcome.regressed += Number(wins[0] && !wins[1]);
  }
  timings.sort((a,b) => a-b);
  console.log(JSON.stringify({ ...outcome, decisionMs: { p50: timings[Math.floor(timings.length * .5)], p95: timings[Math.floor(timings.length * .95)], max: timings.at(-1) }, methodology: '相同新规则和 seed，仅玩家 0 从旧的随机技能与首条提示策略换为标准 AI；两名对手保持参考策略。按地主/农民分别报告。' }, null, 2));
} finally { await server.close(); }
