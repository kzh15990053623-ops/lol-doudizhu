import { useGame } from "../app/GameProvider";
import { buffDescriptions, sameSide, type Player } from "../domain";
import { HeroPortrait } from "./HeroPortrait";
import styles from "./Board.module.css";

interface PlayerSeatProps {
  player: Player;
  position: "left" | "right" | "self";
}

export function PlayerSeat({ player, position }: PlayerSeatProps) {
  const { game, isAiThinking, setCatalogHero, openOverlay } = useGame();
  const active = game.phase === "playing" && game.turnPlayerId === player.id;
  const isLandlord = player.id === game.landlordId;
  const skillText = player.usedSkill ? "技能已用" : player.buffs.skillBlocked ? "技能封锁" : "技能待命";
  const buffs = buffDescriptions(player);
  return (
    <section
      className={`${styles.seat} ${styles[position]} ${active ? styles.activeSeat : ""}`}
      aria-label={`${player.name}，${player.hero.name}，${player.role}，剩余 ${player.hand.length} 张牌${active ? "，当前行动" : ""}`}
    >
      <HeroPortrait hero={player.hero} size="small" />
      <div className={styles.seatIdentity}>
        <span>
          {player.name} · {player.hero.city}
        </span>
        <h2>{player.hero.name}</h2>
        <div className={styles.seatMeta}>
          <b className={isLandlord ? styles.landlord : ""}>{player.role}{game.landlordId !== null && position !== "self" ? ` · ${sameSide(game, 0, player.id) ? "队友" : "敌方"}` : ""}</b>
          <b className={player.hand.length <= 2 ? styles.dangerCount : ""}>{player.hand.length} 张{player.hand.length <= 2 ? "！" : ""}</b>
          <button
            type="button"
            onClick={() => {
              setCatalogHero(player.hero.id);
              openOverlay("catalog");
            }}
            aria-label={`查看${player.hero.name}技能详情，${skillText}`}
          >
            {skillText}
          </button>
        </div>
        {isLandlord ? <p className={styles.fieldTag}>城邦 · {player.hero.fieldName}</p> : null}
        {buffs.length ? <div className={styles.buffList} aria-label={`${player.name}当前状态`}>{buffs.map(buff => <span key={buff} title={buff}>{buff.split("：")[0]}</span>)}</div> : null}
      </div>
      {position !== "self" ? (
        <div className={styles.cardBacks} aria-hidden="true">
          <i />
          <i />
          <i />
          <span>{player.hand.length}</span>
        </div>
      ) : null}
      {active ? (
        <span className={styles.turnFlag}>{isAiThinking && player.id !== 0 ? "思考中" : "行动中"}</span>
      ) : null}
    </section>
  );
}
