import { useGame } from "../app/GameProvider";
import { ActionBar } from "./ActionBar";
import { CenterPile } from "./CenterPile";
import { PlayerHand } from "./PlayerHand";
import { PlayerSeat } from "./PlayerSeat";
import { PracticeProgress } from "./PracticeProgress";
import { useCompactLayout } from "../app/useCompactLayout";
import styles from "./Board.module.css";

export function GameBoard() {
  const { game } = useGame();
  const compact = useCompactLayout();
  if (game.players.length < 3) return null;
  return (
    <section className={`${styles.board} ${game.training ? styles.practiceBoard : ""}`} aria-label="三人牌桌">
      <div className={styles.emberField} aria-hidden="true"><i /><i /><i /><i /><i /></div>
      {game.training && !compact ? <PracticeProgress /> : null}
      <div className={styles.arena}>
        <PlayerSeat player={game.players[1]} position="left" />
        <CenterPile />
        <PlayerSeat player={game.players[2]} position="right" />
      </div>
      <div className={styles.playerZone}>
        <PlayerSeat player={game.players[0]} position="self" />
        <PlayerHand />
        <ActionBar />
      </div>
    </section>
  );
}
