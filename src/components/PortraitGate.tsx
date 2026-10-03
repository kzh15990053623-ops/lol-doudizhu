import { useEffect, useRef } from "react";
import { useGame } from "../app/GameProvider";
import styles from "./PortraitGate.module.css";

export function PortraitGate() {
  const { isPortrait } = useGame();
  const gateRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isPortrait) gateRef.current?.focus({ preventScroll: true });
  }, [isPortrait]);
  if (!isPortrait) return null;
  return (
    <div ref={gateRef} className={styles.gate} role="dialog" aria-modal="true" aria-labelledby="rotate-title" tabIndex={-1}>
      <span className={styles.device} aria-hidden="true">
        <i />
      </span>
      <p>横屏牌局</p>
      <h2 id="rotate-title">请旋转设备</h2>
      <span>牌局与 AI 已暂停，切换为横屏后会从当前回合继续。</span>
    </div>
  );
}
