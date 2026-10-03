export function normalizeSeed(seed: number | string = Date.now()): number {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    const normalized = Math.trunc(seed) >>> 0;
    return normalized || 0x6d2b79f5;
  }
  let hash = 2166136261;
  for (const character of String(seed)) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) || 0x6d2b79f5;
}

export function nextRandom(rngState: number): { value: number; rngState: number } {
  let next = rngState >>> 0;
  next ^= next << 13;
  next ^= next >>> 17;
  next ^= next << 5;
  const normalized = next >>> 0;
  return { value: normalized / 0x1_0000_0000, rngState: normalized || 0x6d2b79f5 };
}

export function shuffleSeeded<T>(items: readonly T[], rngState: number): { items: T[]; rngState: number } {
  const copy = [...items];
  let nextState = rngState;
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const random = nextRandom(nextState);
    nextState = random.rngState;
    const swapIndex = Math.floor(random.value * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return { items: copy, rngState: nextState };
}

export function deterministicFraction(rngState: number, revision: number, salt = 0): number {
  const mixed = (rngState ^ Math.imul(revision + 1, 0x9e3779b1) ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0;
  return nextRandom(mixed || 0x6d2b79f5).value;
}
