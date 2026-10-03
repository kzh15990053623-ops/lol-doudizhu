import { forwardRef } from "react";
import type { Card, HeroId } from "../domain";
import { HERO_PORTRAITS } from "../app/heroMedia";
import styles from "./PlayingCard.module.css";

const SUIT_NAMES: Record<string, string> = {
  "♠": "黑桃",
  "♥": "红桃",
  "♣": "梅花",
  "♦": "方块",
};

/** 符文花色中文名（游戏道具化） */
const SUIT_TITLES: Record<string, string> = {
  "♠": "利刃",
  "♥": "生命水晶",
  "♣": "三相之叶",
  "♦": "海克斯宝石",
};

export const cardAccessibleName = (card: Card): string => {
  if (card.joker) return card.rank;
  return `${SUIT_NAMES[card.suit] ?? card.suit}${card.rank}`;
};

/* ---------- 符文花色 SVG 图标 ---------- */

function SuitIcon({ suit, className }: { suit: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {suit === "♠" ? (
        <g fill="currentColor">
          <path d="M24 3 L29 25 L24 31 L19 25 Z" />
          <rect x="13" y="31" width="22" height="3.4" rx="1.6" />
          <rect x="21.6" y="34.4" width="4.8" height="8" rx="1.6" />
          <circle cx="24" cy="44.4" r="2.6" />
        </g>
      ) : null}
      {suit === "♥" ? (
        <g>
          <path
            d="M24 41 C11 30 6.5 20 12 13 C16 8.6 22 10 24 15.5 C26 10 32 8.6 36 13 C41.5 20 37 30 24 41 Z"
            fill="currentColor"
          />
          <path
            d="M24 15.5 L24 41 M12.5 13.5 L24 24 M35.5 13.5 L24 24"
            stroke="rgba(10,14,24,.55)"
            strokeWidth="1.6"
            fill="none"
          />
        </g>
      ) : null}
      {suit === "♣" ? (
        <g fill="currentColor">
          <path d="M24 6 C28.5 14 28.5 21 24 25.5 C19.5 21 19.5 14 24 6 Z" />
          <path d="M24 6 C28.5 14 28.5 21 24 25.5 C19.5 21 19.5 14 24 6 Z" transform="rotate(120 24 26)" />
          <path d="M24 6 C28.5 14 28.5 21 24 25.5 C19.5 21 19.5 14 24 6 Z" transform="rotate(240 24 26)" />
          <circle cx="24" cy="26" r="3" />
          <path d="M24 29 L24 42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </g>
      ) : null}
      {suit === "♦" ? (
        <g>
          <path d="M24 5 L37 15.5 V32.5 L24 43 L11 32.5 V15.5 Z" fill="currentColor" />
          <path d="M11 15.5 L24 24 L37 15.5 M24 24 L24 43" stroke="rgba(10,14,24,.5)" strokeWidth="1.8" fill="none" />
        </g>
      ) : null}
    </svg>
  );
}

function RuneRing({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <circle cx="60" cy="60" r="54" stroke="rgba(201,164,92,.45)" strokeWidth="1" fill="none" />
      <circle cx="60" cy="60" r="47" stroke="rgba(201,164,92,.22)" strokeWidth="1" strokeDasharray="2 7" fill="none" />
      <circle cx="60" cy="60" r="38" stroke="rgba(201,164,92,.3)" strokeWidth="1" fill="none" />
      <path
        d="M60 2 L60 10 M60 110 L60 118 M2 60 L10 60 M110 60 L118 60"
        stroke="rgba(240,217,160,.6)"
        strokeWidth="1.4"
      />
    </svg>
  );
}

/* ---------- 英雄绘框映射：花牌与王牌携带英雄立绘 ---------- */

const HERO_CARD_ART: Record<string, { hero: HeroId; title: string }> = {
  A: { hero: "caitlyn", title: "皮城女警" },
  K: { hero: "garen", title: "德玛西亚之力" },
  Q: { hero: "ashe", title: "寒冰射手" },
  J: { hero: "yasuo", title: "疾风剑豪" },
  大王: { hero: "azir", title: "沙漠皇帝" },
  小王: { hero: "thresh", title: "魂锁典狱长" },
};

const heroArtFor = (card: Card) => {
  if (card.joker) return HERO_CARD_ART[card.rank];
  return HERO_CARD_ART[card.rank] ?? null;
};

/* ---------- 统一角标：点数 + 传统花色（快速认牌）；王牌竖排「大/小王」 ---------- */

function Corner({ card }: { card: Card }) {
  if (card.joker) {
    const [top, bottom] = Array.from(card.rank); // 大王 → 大 / 王，同列竖排
    return (
      <span className={styles.corner} aria-hidden="true">
        <b>{top}</b>
        <b>{bottom}</b>
      </span>
    );
  }
  return (
    <span className={styles.corner} aria-hidden="true">
      <b>{card.rank}</b>
      <i className={styles.cornerSuit}>{card.suit}</i>
    </span>
  );
}

/* ---------- 牌面内容（按钮态与静态态共用） ---------- */

function CardFace({ card, detail }: { card: Card; detail: "full" | "mini" }) {
  const art = detail === "full" ? heroArtFor(card) : null;
  const suitTitle = SUIT_TITLES[card.suit] ?? "";

  if (art) {
    // 英雄绘框卡：统一角标 + 英雄立绘窗 + 底部英雄名横带（LoR 式排版）
    return (
      <>
        <Corner card={card} />
        <span className={styles.artWindow} aria-hidden="true">
          <img src={HERO_PORTRAITS[art.hero]} alt="" loading="lazy" decoding="async" />
        </span>
        <span className={styles.nameBand} aria-hidden="true">
          {card.joker ? <i className={styles.bandGem} /> : <SuitIcon suit={card.suit} className={styles.bandIcon} />}
          <b>{art.title}</b>
          {card.joker ? <i className={styles.bandGem} /> : null}
        </span>
      </>
    );
  }

  if (card.joker) {
    // 迷你态王牌（历史记录等）：仅角标
    return <Corner card={card} />;
  }

  // 数字卡：角标 + 符文花色
  return (
    <>
      <Corner card={card} />
      <RuneRing className={styles.runes} />
      <SuitIcon suit={card.suit} className={styles.centerIcon} />
      {detail === "full" ? (
        <span className={styles.suitTitle} aria-hidden="true">
          {suitTitle}
        </span>
      ) : null}
    </>
  );
}

/** 鎏金蚀刻层（四角饰 + 顶部光泽） */
function GildLayer() {
  return (
    <>
      <span className={styles.filigree} aria-hidden="true" />
      <span className={styles.sheen} aria-hidden="true" />
    </>
  );
}

interface PlayingCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  card: Card;
  selected?: boolean;
  compact?: boolean;
}

export const PlayingCard = forwardRef<HTMLButtonElement, PlayingCardProps>(function PlayingCard(
  { card, selected = false, compact = false, className = "", ...buttonProps },
  ref,
) {
  const art = heroArtFor(card);
  return (
    <button
      ref={ref}
      type="button"
      className={`${styles.card} ${card.red ? styles.red : ""} ${card.joker ? styles.joker : ""} ${art ? styles.artCard : ""} ${selected ? styles.selected : ""} ${compact ? styles.compact : ""} ${className}`}
      aria-label={buttonProps["aria-label"] ?? cardAccessibleName(card)}
      aria-pressed={buttonProps["aria-pressed"] ?? selected}
      {...buttonProps}
    >
      <CardFace card={card} detail="full" />
      <GildLayer />
      {selected ? (
        <span className={styles.checkMark} aria-hidden="true">
          ✓
        </span>
      ) : null}
    </button>
  );
});

function StaticCard({ card, variant }: { card: Card; variant: "tableCard" | "historyCard" }) {
  const detail = variant === "tableCard" ? "full" : "mini";
  const art = detail === "full" ? heroArtFor(card) : null;
  return (
    <span
      className={`${styles.staticCard} ${styles[variant]} ${card.red ? styles.red : ""} ${card.joker ? styles.joker : ""} ${art ? styles.artCard : ""}`}
      role="img"
      aria-label={cardAccessibleName(card)}
    >
      <CardFace card={card} detail={detail} />
      {detail === "full" ? <GildLayer /> : null}
    </span>
  );
}

export function TableCard({ card }: { card: Card }) {
  return <StaticCard card={card} variant="tableCard" />;
}

export function HistoryCard({ card }: { card: Card }) {
  return <StaticCard card={card} variant="historyCard" />;
}
