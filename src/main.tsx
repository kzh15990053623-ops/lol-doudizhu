import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { GameProvider } from "./app/GameProvider";
import { createInitialGame, gameReducer, type GameState } from "./domain";
import "./styles/global.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root mount point");

const devParameters = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null;
const devSeed = devParameters?.get("seed") ?? undefined;
const devScenario = devParameters?.get("scenario");
let initialGame: GameState | undefined;

if (devScenario === "game" || devScenario === "result") {
  initialGame = createInitialGame(devSeed ?? "dev-scenario");
  initialGame = gameReducer(initialGame, { type: "chooseHero", heroId: initialGame.heroChoices[0].id });
  initialGame = gameReducer(initialGame, { type: "bid", call: true });
  if (devScenario === "result") {
    // 开发预览：直接构造结算态，绕过 reducer，仅供 ?scenario=result 画面检查
    initialGame.phase = "finished";
    initialGame.winnerId = 0;
    initialGame.players[0].hand = [];
  }
}

createRoot(root).render(
  <StrictMode>
    <GameProvider seed={devSeed} initialGame={initialGame} aiEnabled={devParameters?.get("ai") !== "off"}>
      <App />
    </GameProvider>
  </StrictMode>,
);
