import { useGame } from "../app/GameProvider";
import { buffDescriptions } from "../domain";
import styles from "./Board.module.css";

export function ActionBar() {
  const {
    game,
    ui,
    selection,
    passAvailability,
    skillAvailability,
    playSelection,
    pass,
    hint,
    useSkill,
    clearSelection,
    bid,
    hintText,
    hasResponse,
  } = useGame();
  const isTurn = game.phase === "playing" && game.turnPlayerId === 0;
  const player = game.players[0];
  const activeBuffs = player ? buffDescriptions(player).join("；") : "";
  const reason = !isTurn
    ? "等待对手 · 可以预选手牌"
    : ui.selectedCardIds.length
      ? selection.legal
        ? `${selection.combo?.label} · 可出牌`
        : selection.reason
      : game.currentPlay && !hasResponse
        ? "无牌可压，可以选择不要"
      : game.currentPlay
        ? `目标：${game.currentPlay.combo.label}，请选择能压过的牌`
        : "请选择要出的牌";

  if (game.phase === "bidding") {
    return (
      <section className={styles.actionBar} aria-label="抢地主操作">
        <div className={styles.actionStatus}>
          <span>你的决定</span>
          <strong className={styles.chip}>抢地主并获得三张底牌？</strong>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryAction} onClick={() => bid(false)}>
            不抢
          </button>
          <BidButton />
        </div>
      </section>
    );
  }

  return (
    <section className={styles.actionBar} aria-label="出牌操作">
      <div className={styles.actionStatus} id="action-status">
        <span title={activeBuffs || undefined}>{hintText || activeBuffs || (selection.legal ? "牌型有效" : isTurn ? "行动提示" : "回合状态")}</span>
        <strong className={`${styles.chip} ${isTurn ? styles.activeChip : ""}`}>{reason}</strong>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={hint} disabled={!isTurn} aria-keyshortcuts="H">
          提示 <kbd>H</kbd>
        </button>
        <button
          type="button"
          onClick={pass}
          disabled={!passAvailability.allowed}
          title={passAvailability.reason || undefined}
          aria-keyshortcuts="X"
        >
          不要 <kbd>X</kbd>
        </button>
        <button
          type="button"
          className={styles.skillAction}
          onClick={useSkill}
          disabled={!skillAvailability.available}
          title={skillAvailability.reason || player?.hero.skillSummary}
          aria-keyshortcuts="S"
        >
          <span className={styles.skillLabel}>{player?.hero.skillName ?? "技能"}</span><span className={styles.mobileSkillLabel}>技能</span> <kbd>S</kbd>
        </button>
        {ui.selectedCardIds.length ? (
          <button type="button" className={styles.clearAction} onClick={clearSelection} aria-label="清空选牌">
            重选
          </button>
        ) : null}
        <button
          type="button"
          className={styles.primaryAction}
          onClick={playSelection}
          disabled={!selection.legal}
          title={selection.reason || undefined}
          aria-describedby="action-status"
          aria-keyshortcuts="P"
        >
          出牌 <kbd>P</kbd>
        </button>
      </div>
    </section>
  );
}

function BidButton() {
  const { bid } = useGame();
  return (
    <button type="button" className={styles.primaryAction} onClick={() => bid(true)}>
      抢地主
    </button>
  );
}
