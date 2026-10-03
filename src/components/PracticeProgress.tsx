import { useGame } from "../app/GameProvider";
import styles from "./Board.module.css";

export function PracticeProgress({ compact = false }: { compact?: boolean }) {
  const { game, practiceSelected, practiceHinted, returnToHeroSelect, notice } = useGame();
  const complete = game.events.some(event => event.title === "失控爆燃");
  const nextStep = complete ? "✓ 完成！" : game.players[0]?.usedSkill ? "4/4 出牌触发城邦" : practiceHinted ? "3/4 发动飞弹" : practiceSelected ? "2/4 点击提示" : "1/4 点击选牌";
  return (
    <aside className={`${styles.practiceBanner} ${compact ? styles.practiceCompact : ""}`} aria-label="操作练习">
      <div>
        <b role={compact && notice ? "status" : undefined}>{compact && notice ? notice : "练习局 · 不计战绩"}</b>
        {compact ? <span>{nextStep}</span> : <span>{practiceSelected ? "✓" : "1"} 点击选牌 → {practiceHinted ? "✓" : "2"} 提示 → {game.players[0]?.usedSkill ? "✓" : "3"} 发动飞弹 → {complete ? "✓ 完成！" : "4 出牌触发城邦"}</span>}
      </div>
      <button type="button" onClick={returnToHeroSelect}>{complete ? "开始正式对局" : "跳过练习"}</button>
    </aside>
  );
}
