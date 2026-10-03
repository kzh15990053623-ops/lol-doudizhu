import { useGame } from "../app/GameProvider";
import { HeroPortrait } from "./HeroPortrait";
import styles from "./HeroDraft.module.css";

export function HeroDraft() {
  const { game, chooseHero, setCatalogHero, openOverlay, startPractice, profile } = useGame();
  return (
    <section className={styles.draft} aria-labelledby="hero-draft-title">
      <header className={styles.intro}>
        <p>随机三选一 · 地主激活城邦</p>
        <h1 id="hero-draft-title">选择你的英雄</h1>
        <span>主动技能每局一次。英雄成为地主时，对应城邦会改变整张牌桌的规则。</span>
        <div className={styles.draftTools}><button type="button" onClick={startPractice}>两分钟上手练习</button><button type="button" onClick={() => openOverlay("records")}>我的战绩 · {Object.keys(profile.heroWins).length}/12 英雄首胜</button></div>
      </header>

      <div className={styles.cards}>
        {game.heroChoices.map((hero, index) => (
          <article
            key={hero.id}
            className={styles.heroCard}
            data-mark={hero.mark}
            style={{ "--hero-color": hero.color, "--draft-order": index } as React.CSSProperties}
          >
            <div className={styles.art}>
              <HeroPortrait hero={hero} size="large" eager />
              <div>
                <span>{hero.city}</span>
                <h2>{hero.name}</h2>
                <small>候选 {index + 1}</small>
              </div>
            </div>

            <div className={styles.mechanics}>
              <section>
                <span>主动技能</span>
                <h3>{hero.skillName}</h3>
                <p>{hero.skillSummary}</p>
              </section>
              <section className={styles.passive}>
                <span>地主城邦</span>
                <h3>{hero.fieldName}</h3>
                <p>{hero.fieldSummary}</p>
              </section>
            </div>

            <button
              type="button"
              className={styles.detailButton}
              onClick={() => {
                setCatalogHero(hero.id);
                openOverlay("catalog");
              }}
            >
              查看完整机制
            </button>
            <button type="button" className={styles.chooseButton} onClick={() => chooseHero(hero.id)}>
              选择 {hero.name}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
