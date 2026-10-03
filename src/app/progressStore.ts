import { loadProfile, recordMatch, saveSession, type GameState, type StorageLike, type UserSettings } from "../domain";

/** External persistence has its own subscription, so rendering never writes localStorage. */
export function createProgressStore(storage: StorageLike | null) {
  let snapshot = { profile: loadProfile(storage), notice: "" };
  const listeners = new Set<() => void>();
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => snapshot,
    sync(game: GameState, settings: UserSettings) {
      const saved = saveSession(game, storage);
      const next = {
        profile: game.phase === "finished" ? recordMatch(game, settings, storage) : snapshot.profile,
        notice: saved ? "" : "浏览器存储不可用，本局暂时无法自动保存",
      };
      if (JSON.stringify(next) !== JSON.stringify(snapshot)) { snapshot = next; listeners.forEach(listener => listener()); }
    },
  };
}
