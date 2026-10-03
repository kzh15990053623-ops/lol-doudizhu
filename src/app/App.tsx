import { useGame } from "./GameProvider";
import { GameBoard } from "../components/GameBoard";
import { HeroDraft } from "../components/HeroDraft";
import { Overlays } from "../components/Overlays";
import { PortraitGate } from "../components/PortraitGate";
import { StatusAnnouncer } from "../components/StatusAnnouncer";
import { TopHud } from "../components/TopHud";
import styles from "./App.module.css";

export function App() {
  const { game, isPortrait } = useGame();
  return (
    <div className={styles.appShell} data-game-root>
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <div
        className={styles.gameCanvas}
        data-testid="game-canvas"
        inert={isPortrait ? true : undefined}
        aria-hidden={isPortrait || undefined}
      >
        <TopHud />
        <main id="main-content" className={styles.main} tabIndex={-1}>
          {game.phase === "heroSelect" ? <HeroDraft /> : <GameBoard />}
        </main>
      </div>
      <Overlays />
      <StatusAnnouncer />
      <PortraitGate />
    </div>
  );
}
