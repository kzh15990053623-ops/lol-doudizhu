import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useGame } from "../app/GameProvider";
import { useCompactLayout } from "../app/useCompactLayout";
import { PlayingCard, cardAccessibleName } from "./PlayingCard";
import styles from "./Board.module.css";

export function PlayerHand() {
  const { game, ui, toggleCard, setFocusedCard, isPaused } = useGame();
  const hand = game.players[0]?.hand ?? [];
  const refs = useRef(new Map<number, HTMLButtonElement>());
  const scrollerRef = useRef<HTMLDivElement>(null);
  const selectedSet = useMemo(() => new Set(ui.selectedCardIds), [ui.selectedCardIds]);
  const rovingId = ui.focusedCardId !== null && hand.some((card) => card.id === ui.focusedCardId) ? ui.focusedCardId : hand[0]?.id ?? null;

  /* 视口感知：移动端扇形角收紧，保证两端牌角完整可见 */
  const narrow = useCompactLayout();

  /* 边缘渐隐：按滚动位置分别判断左右两端是否还有内容，不削弱首尾牌角 */
  const [fade, setFade] = useState({ left: false, right: false });
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () =>
      setFade({
        left: el.scrollLeft > 4,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      });
    update();
    el.addEventListener("scroll", update, { passive: true });
    // jsdom 等环境无 ResizeObserver，降级为仅滚动/挂载时判断
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, [hand.length, narrow]);

  const focusAt = (index: number) => {
    const target = hand[Math.max(0, Math.min(hand.length - 1, index))];
    if (!target) return;
    setFocusedCard(target.id);
    window.requestAnimationFrame(() => {
      const node = refs.current.get(target.id);
      node?.focus({ preventScroll: true });
      node?.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" });
    });
  };

  useLayoutEffect(() => {
    if (ui.focusedCardId === null || isPaused) return;
    const node = refs.current.get(ui.focusedCardId);
    if (!node) return;
    node.focus({ preventScroll: true });
    node.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" });
  }, [ui.focusedCardId, ui.selectedCardIds, isPaused]);

  // LoR 式扇形展开：以手牌中点为轴心旋转；移动端总角度钳制 ±6°，桌面 ±12°
  const half = (hand.length - 1) / 2;
  const step = hand.length > 1 ? Math.min(narrow ? 0.8 : 1.5, (narrow ? 6 : 12) / Math.max(half, 1)) : 0;

  return (
    <section className={styles.handRegion} aria-labelledby="your-hand-title">
      <header className={styles.handHeader}>
        <div>
          <span>你的手牌</span>
          <h2 id="your-hand-title">{hand.length} 张</h2>
        </div>
        <p>方向键移动 · Enter/Space 选牌</p>
      </header>
      <div className={styles.handScroller} data-testid="player-hand" ref={scrollerRef}>
        <div className={styles.hand} role="group" aria-label={`你的手牌，共 ${hand.length} 张`}>
          {hand.map((card, index) => {
            const selected = selectedSet.has(card.id);
            const fanAngle = (index - half) * step;
            return (
              <PlayingCard
                key={card.id}
                ref={(node) => {
                  if (node) refs.current.set(card.id, node);
                  else refs.current.delete(card.id);
                }}
                card={card}
                selected={selected}
                style={{ "--r": `${fanAngle.toFixed(2)}deg` } as React.CSSProperties}
                tabIndex={card.id === rovingId ? 0 : -1}
                aria-label={`${cardAccessibleName(card)}${selected ? "，已选择" : ""}`}
                onFocus={() => setFocusedCard(card.id)}
                onClick={() => toggleCard(card.id)}
                onKeyDown={(event) => {
                  switch (event.key) {
                    case "ArrowRight":
                    case "ArrowDown":
                      event.preventDefault();
                      focusAt(index + 1);
                      break;
                    case "ArrowLeft":
                    case "ArrowUp":
                      event.preventDefault();
                      focusAt(index - 1);
                      break;
                    case "Home":
                      event.preventDefault();
                      focusAt(0);
                      break;
                    case "End":
                      event.preventDefault();
                      focusAt(hand.length - 1);
                      break;
                    case "Enter":
                    case " ":
                    case "Space":
                      event.preventDefault();
                      break;
                  }
                }}
                onKeyUp={(event) => {
                  if (event.key === "Enter" || event.key === " " || event.key === "Space") {
                    event.preventDefault();
                    toggleCard(card.id);
                  }
                }}
              />
            );
          })}
        </div>
      </div>
      {fade.left ? <span className={styles.handFadeLeft} aria-hidden="true" /> : null}
      {fade.right ? <span className={styles.handFadeRight} aria-hidden="true" /> : null}
    </section>
  );
}
