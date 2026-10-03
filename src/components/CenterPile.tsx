import { useLayoutEffect, useRef } from 'react';
import { useGame } from '../app/GameProvider';
import { comparisonLabel } from '../domain';
import { cardAccessibleName, HistoryCard, TableCard } from './PlayingCard';
import styles from './Board.module.css';

export function CenterPile() {
  const { game, visibleEvent, openOverlay } = useGame();
  const pileRef = useRef<HTMLDivElement>(null);
  const current = game.currentPlay;
  const owner = current ? game.players[current.playerId] : undefined;
  const lastAction = game.history[0];
  const recent = game.history.filter(entry => entry.playerId !== 0 && entry.kind !== 'round').slice(0, 2).reverse();
  const known = game.knownCards.filter(entry => entry.viewerId === null || entry.viewerId === 0);
  const uniqueKnown = known.filter((entry, index) => known.findIndex(other => other.card.id === entry.card.id) === index);
  const playId = current ? game.history.find(entry => entry.kind === 'play' || entry.kind === 'beat')?.id : 'empty';
  const cardCount = current?.cards.length ?? 0;
  // 长牌型按容器实宽调整叠放；至少露出 24px，不足时保留横向滚动。
  useLayoutEffect(() => {
    const pile = pileRef.current;
    if (!pile) return;
    const update = () => {
      const style = getComputedStyle(pile);
      const width = Number.parseFloat(style.getPropertyValue('--table-card-width')) || 84;
      const available = pile.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight);
      const step = cardCount > 1 && available > 0 ? Math.max(24, Math.min(width - 12, (available - width - 4) / (cardCount - 1))) : width - 12;
      pile.style.setProperty('--table-overlap', `${width - step}px`);
    };
    update();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(pile);
    window.addEventListener('resize', update);
    return () => { observer?.disconnect(); window.removeEventListener('resize', update); };
  }, [cardCount, playId]);
  const result = game.phase === 'bidding' ? '抢地主' : game.phase === 'finished' ? '牌局结束' : lastAction?.kind === 'pass' ? `${lastAction.playerName} 不要` : lastAction?.kind === 'beat' ? '已压过' : lastAction?.kind === 'round' ? '重新首出' : current ? '首出' : '等待出牌';
  return <section className={styles.centerPile} aria-label="中央出牌区">
    <div className={styles.trickHeader}>
      <div className={styles.trickIdentity}>
        <span className={styles.playOwner}>{current ? `${owner?.name} · ${owner?.hero.name}` : game.phase === 'bidding' ? '底牌封存' : '等待首出'}</span>
        {current ? <span className={styles.chip}>{current.combo.label}</span> : null}
        <b className={styles.comparison}>{current ? comparisonLabel(current.combo) : `倍率 ×${game.multiplier}`}</b>
      </div>
      <div className={styles.trickState}>
        <span className={`${styles.chip} ${lastAction?.kind === 'beat' ? styles.activeChip : ''}`}>{result}</span>
        {visibleEvent ? <span className={`${styles.chip} ${styles.compactEvent}`} title={visibleEvent.message} aria-hidden="true">{visibleEvent.title}</span> : null}
        <span className={styles.trickProgress}>过牌 {game.passCount}/2</span>
      </div>
    </div>
    {game.landlordId !== null ? <div className={styles.bottomReveal} aria-label="三张底牌"><span>底牌</span>{game.bottomCards.map(card => <span key={card.id} className={card.red ? styles.redRank : ''}>{card.rank}{card.suit}</span>)}<b>×{game.multiplier}</b></div> : null}
    <div key={playId} ref={pileRef} className={styles.playedCards} role="group" aria-label={current ? `${owner?.name}打出的${current.combo.label}` : '当前没有领出牌'}>
      {current ? current.cards.map(card => <TableCard key={card.id} card={card} />) : <span className={styles.emptyRune} aria-hidden="true">{game.phase === 'bidding' ? '▧ ▧ ▧' : '◇'}</span>}
    </div>
    <section className={styles.historyRail} aria-label="对手出牌记录">
      <header className={styles.historyHeader}><span>最近行动</span><button type="button" onClick={() => openOverlay('history')}>记录{uniqueKnown.length ? ` / 已知牌 ${uniqueKnown.length}` : ''}</button></header>
      <div className={styles.historyScroller} role={recent.length ? "list" : undefined}>{recent.length ? recent.map(entry => <article key={entry.id} className={styles.historyItem} role="listitem" aria-label={`${entry.playerName}，${entry.kind === 'pass' ? '不要' : entry.label}，${entry.cards.map(cardAccessibleName).join('、')}`}>
        <b>{entry.playerName}</b><span>{entry.kind === 'pass' ? '不要' : entry.label}</span><div className={styles.historyCards} aria-hidden="true">{entry.cards.map(card => <HistoryCard key={card.id} card={card} />)}</div>
      </article>) : <span className={styles.historyEmpty}>对手行动后保留在这里</span>}</div>
    </section>
    {uniqueKnown.length ? <div className={styles.knownStrip} aria-label="已知手牌">{uniqueKnown.map(entry => <span key={entry.card.id}>{game.players[entry.playerId].name}：{entry.card.rank}{entry.card.suit}</span>)}</div> : null}
    {visibleEvent ? <div key={`${game.seed}:${visibleEvent.id}`} className={`${styles.eventCue} ${styles[visibleEvent.kind] ?? ''}`} aria-hidden="true"><b>{visibleEvent.title}</b><span>{visibleEvent.message}</span></div> : null}
  </section>;
}
