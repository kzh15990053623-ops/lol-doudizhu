import { useGame } from "../app/GameProvider";
import styles from "./TopHud.module.css";
import { useCompactLayout } from "../app/useCompactLayout";
import { PracticeProgress } from "./PracticeProgress";

const PHASE_LABELS = {
  heroSelect: "英雄集结",
  bidding: "抢地主",
  playing: "对局进行中",
  finished: "牌局结算",
} as const;

export function TopHud() {
  const { game, openOverlay, notice } = useGame();
  const compact = useCompactLayout();
  const currentPlayer = game.players[game.turnPlayerId];
  return (
    <header className={styles.topbar}>
      <a className={styles.brand} href="#main-content" aria-label="符文之地斗地主，跳到主要内容">
        <span className={styles.sigil} aria-hidden="true">
          R
        </span>
        <span>
          <b>符文之地</b>
          <small>斗地主</small>
        </span>
      </a>

      {game.training && compact ? <PracticeProgress compact /> : <div className={styles.round} aria-label="牌局状态">
        <span className={notice ? styles.noticeLabel : undefined} title={notice ? `${PHASE_LABELS[game.phase]} · ${notice}` : undefined} role={notice ? "status" : undefined}>{notice || PHASE_LABELS[game.phase]}</span>
        <strong>{currentPlayer ? `${currentPlayer.name} · ${currentPlayer.hero.name}` : "三选一 · 决定你的战术"}</strong>
      </div>}

      <nav className={styles.tools} aria-label="牌桌工具">
        <button type="button" className={styles.toolButton} onClick={() => openOverlay("guide")}>
          <span aria-hidden="true">?</span>
          <b>玩法</b>
        </button>
        <button type="button" className={styles.toolButton} onClick={() => openOverlay("catalog")}>
          <span aria-hidden="true">◇</span>
          <b>图鉴</b>
        </button>
        <button type="button" className={styles.toolButton} onClick={() => openOverlay("settings")}>
          <span aria-hidden="true">⚙</span>
          <b>设置</b>
        </button>
        <button type="button" className={styles.toolButton} onClick={() => openOverlay("records")}><span aria-hidden="true">♜</span><b>战绩</b></button>
        <button type="button" className={`${styles.toolButton} ${styles.menuButton}`} onClick={() => openOverlay("menu")}>
          <span aria-hidden="true">☰</span>
          <b>菜单</b>
        </button>
      </nav>
    </header>
  );
}
