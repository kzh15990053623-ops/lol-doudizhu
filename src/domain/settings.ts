import type { UserSettings } from "./types";

export const SETTINGS_STORAGE_KEY = "runeterra-ddz-settings-v1";

export const DEFAULT_SETTINGS: Readonly<UserSettings> = {
  muted: false,
  volume: 0.85,
  aiSpeed: "normal",
  difficulty: "standard",
};

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function sanitizeSettings(value: unknown): UserSettings {
  if (!value || typeof value !== "object") return { ...DEFAULT_SETTINGS };
  const candidate = value as Partial<UserSettings>;
  return {
    muted: typeof candidate.muted === "boolean" ? candidate.muted : DEFAULT_SETTINGS.muted,
    volume: Number.isFinite(candidate.volume) ? Math.max(0, Math.min(1, Number(candidate.volume))) : DEFAULT_SETTINGS.volume,
    aiSpeed: candidate.aiSpeed === "fast" || candidate.aiSpeed === "normal" ? candidate.aiSpeed : DEFAULT_SETTINGS.aiSpeed,
    difficulty: candidate.difficulty === "casual" ? "casual" : "standard",
  };
}

export function loadSettings(storage?: StorageLike | null): UserSettings {
  if (!storage) return { ...DEFAULT_SETTINGS };
  try {
    const raw = storage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? sanitizeSettings(JSON.parse(raw)) : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: UserSettings, storage?: StorageLike | null): void {
  if (!storage) return;
  try {
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitizeSettings(settings)));
  } catch {
    // localStorage can be unavailable in private or embedded contexts.
  }
}
