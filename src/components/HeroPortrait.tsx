import type { HeroDefinition } from "../domain";
import { HERO_PORTRAITS } from "../app/heroMedia";
import styles from "./Portrait.module.css";

interface HeroPortraitProps {
  hero: HeroDefinition;
  size?: "small" | "medium" | "large";
  eager?: boolean;
  decorative?: boolean;
}

export function HeroPortrait({ hero, size = "medium", eager = false, decorative = false }: HeroPortraitProps) {
  return (
    <span className={`${styles.portrait} ${styles[size]}`} style={{ "--hero-color": hero.color } as React.CSSProperties}>
      <img
        src={HERO_PORTRAITS[hero.id]}
        alt={decorative ? "" : `${hero.name}头像`}
        width="313"
        height="418"
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
      <span className={styles.mark} aria-hidden="true">
        {hero.mark}
      </span>
    </span>
  );
}
