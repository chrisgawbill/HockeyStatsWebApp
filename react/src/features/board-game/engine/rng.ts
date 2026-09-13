/** Pure mulberry32 PRNG. All engine/ai/data randomness must flow through here, never Math.random. */

/** Advances the seed and returns a float in [0, 1). */
export function nextFloat(seed: number): [number, number] {
  let t = (seed + 0x6d2b79f5) | 0;
  const nextSeed = t;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, nextSeed];
}

/** Rolls a single six-sided die, returning a value in 1..6. */
export function rollDie(seed: number): [number, number] {
  const [value, nextSeed] = nextFloat(seed);
  return [Math.floor(value * 6) + 1, nextSeed];
}

/** Fisher-Yates shuffle. Returns a new array; never mutates the input. */
export function shuffle<T>(arr: T[], seed: number): [T[], number] {
  const result = [...arr];
  let currentSeed = seed;
  for (let i = result.length - 1; i > 0; i--) {
    const [value, nextSeed] = nextFloat(currentSeed);
    currentSeed = nextSeed;
    const j = Math.floor(value * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return [result, currentSeed];
}
