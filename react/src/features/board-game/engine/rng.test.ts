import { describe, expect, it } from 'vitest';
import { nextFloat, rollDie, shuffle } from '@/features/board-game/engine/rng';

describe('rng', () => {
  it('nextFloat is deterministic for a given seed', () => {
    expect(nextFloat(42)).toEqual(nextFloat(42));
  });

  it('rollDie is deterministic and stays in 1..6', () => {
    let seed = 1;
    for (let i = 0; i < 200; i++) {
      const [a, nextA] = rollDie(seed);
      const [b, nextB] = rollDie(seed);
      expect(a).toBe(b);
      expect(nextA).toBe(nextB);
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(6);
      seed = nextA;
    }
  });

  it('shuffle is deterministic and keeps every element', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const [shuffledA] = shuffle(arr, 7);
    const [shuffledB] = shuffle(arr, 7);
    expect(shuffledA).toEqual(shuffledB);
    expect([...shuffledA].sort()).toEqual([...arr].sort());
    expect(arr).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
