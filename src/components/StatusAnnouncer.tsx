import { useGame } from "../app/GameProvider";

export function StatusAnnouncer() {
  const { announcement } = useGame();
  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {announcement}
    </div>
  );
}
