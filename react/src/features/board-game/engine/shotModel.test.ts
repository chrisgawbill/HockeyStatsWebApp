import { describe, expect, it } from 'vitest';
import {
  BASE_SAVE_BY_BAND,
  MAX_SAVE_CHANCE,
  SHOT_COVER_CHANCE,
} from '@/features/board-game/data/balance';
import {
  bandForPosition,
  bandWidthsForAccuracy,
  poiseFactor,
  rollBandFromAccuracy,
  rollCpuShotBand,
  rollShotSave,
  shotAccuracyBonus,
} from '@/features/board-game/engine/shotModel';

describe('shotModel', () => {
  it('accuracy widens only the yellow band; blue stays constant', () => {
    const low = bandWidthsForAccuracy(0);
    const high = bandWidthsForAccuracy(100);
    expect(high.yellowWidth).toBeGreaterThan(low.yellowWidth);
    expect(high.blueWidth).toBe(low.blueWidth);
  });

  it('bandForPosition is concentric: centre is perfect, then good, then weak', () => {
    const widths = { yellowWidth: 0.1, blueWidth: 0.3 };
    expect(bandForPosition(0.5, widths)).toBe('perfect');
    expect(bandForPosition(0.5 + 0.04, widths)).toBe('perfect');
    expect(bandForPosition(0.5 + 0.1, widths)).toBe('good');
    expect(bandForPosition(0.5 - 0.1, widths)).toBe('good');
    expect(bandForPosition(0.9, widths)).toBe('weak');
  });

  it('poiseFactor is 0 at full poise and most negative at 0 poise', () => {
    expect(poiseFactor(20, 20)).toBe(0);
    expect(poiseFactor(0, 20)).toBeLessThan(poiseFactor(10, 20));
    expect(poiseFactor(10, 20)).toBeLessThan(0);
  });

  it('a perfect band concedes a save near BASE_SAVE_BY_BAND.perfect for a fresh goalie, seeded', () => {
    // Seed chosen so the save roll lands under the ~20% perfect-band chance.
    let seed = 3;
    let saved = false;
    for (let i = 0; i < 50 && !saved; i++) {
      const [result, next] = rollShotSave('perfect', 0, 20, 20, seed);
      expect(result.saveChance).toBe(BASE_SAVE_BY_BAND.perfect);
      if (result.saved) saved = true;
      seed = next;
    }
    expect(saved).toBe(true);
  });

  it('power reduces save chance and, on a save, drains poise by power', () => {
    const [withoutPower] = rollShotSave('good', 0, 20, 20, 1);
    const [withPower] = rollShotSave('good', 10, 20, 20, 1);
    expect(withPower.saveChance).toBe(withoutPower.saveChance - 10);
    const [saveResult] = rollShotSave('miss', 6, 20, 20, 1);
    if (saveResult.saved) expect(saveResult.poiseDrain).toBe(6);
  });

  it('a drained goalie saves less than a fresh one, same band/power/seed', () => {
    const [fresh] = rollShotSave('good', 5, 20, 20, 99);
    const [drained] = rollShotSave('good', 5, 2, 20, 99);
    expect(drained.saveChance).toBeLessThan(fresh.saveChance);
  });

  it('weak/miss saves freeze and never cover; good/perfect saves rebound or cover, never freeze', () => {
    const [weakSave] = rollShotSave('weak', 0, 20, 20, 2);
    const [missSave] = rollShotSave('miss', 0, 20, 20, 2);
    const [goodSave] = rollShotSave('good', 0, 20, 20, 2);
    const [perfectSave] = rollShotSave('perfect', 0, 20, 20, 2);
    if (weakSave.saved) {
      expect(weakSave.freeze).toBe(true);
      expect(weakSave.rebound).toBe(false);
      expect(weakSave.covered).toBe(false);
    }
    if (missSave.saved) {
      expect(missSave.freeze).toBe(true);
      expect(missSave.covered).toBe(false);
    }
    if (goodSave.saved) {
      expect(goodSave.freeze).toBe(false);
      expect(goodSave.rebound).toBe(!goodSave.covered);
    }
    if (perfectSave.saved) {
      expect(perfectSave.freeze).toBe(false);
      expect(perfectSave.rebound).toBe(!perfectSave.covered);
    }
  });

  describe('covered saves (BG-A16)', () => {
    it('never rolls covered on a weak/miss save, saved or not', () => {
      for (let seed = 0; seed < 200; seed++) {
        const [weakSave] = rollShotSave('weak', 0, 20, 20, seed);
        const [missSave] = rollShotSave('miss', 0, 20, 20, seed);
        expect(weakSave.covered).toBe(false);
        expect(missSave.covered).toBe(false);
      }
    });

    it('covered and rebound are never both true on a good/perfect save', () => {
      for (let seed = 0; seed < 200; seed++) {
        const [goodSave] = rollShotSave('good', 0, 20, 20, seed);
        const [perfectSave] = rollShotSave('perfect', 0, 20, 20, seed);
        expect(goodSave.covered && goodSave.rebound).toBe(false);
        expect(perfectSave.covered && perfectSave.rebound).toBe(false);
      }
    });

    it('finds both a covered and a rebounding outcome across seeds, against SHOT_COVER_CHANCE', () => {
      let sawCovered = false;
      let sawRebound = false;
      for (let seed = 0; seed < 200 && !(sawCovered && sawRebound); seed++) {
        const [result] = rollShotSave('perfect', 0, 20, 20, seed);
        if (!result.saved) continue;
        if (result.covered) sawCovered = true;
        if (result.rebound) sawRebound = true;
      }
      expect(sawCovered).toBe(true);
      expect(sawRebound).toBe(true);
      expect(SHOT_COVER_CHANCE).toBeGreaterThan(0);
      expect(SHOT_COVER_CHANCE).toBeLessThan(100);
    });

    it('is seeded and deterministic for a fixed seed', () => {
      const a = rollShotSave('perfect', 0, 20, 20, 42);
      const b = rollShotSave('perfect', 0, 20, 20, 42);
      expect(a).toEqual(b);
    });
  });

  it('save chance is clamped and never exceeds MAX_SAVE_CHANCE', () => {
    const [result] = rollShotSave('miss', -50, 0, 20, 5);
    expect(result.saveChance).toBeLessThanOrEqual(MAX_SAVE_CHANCE);
  });

  it('rollCpuShotBand resolves through the same rollShotSave as a human band', () => {
    let seed = 11;
    const [cpuBand, seedAfterAim] = rollCpuShotBand(seed);
    const [cpuResult] = rollShotSave(cpuBand, 6, 20, 20, seedAfterAim);
    expect(['perfect', 'good', 'weak']).toContain(cpuBand);
    expect(cpuResult.saveChance).toBeGreaterThanOrEqual(0);
  });

  it('rollBandFromAccuracy and rollShotSave are deterministic for a fixed seed', () => {
    const a = rollBandFromAccuracy(50, 123);
    const b = rollBandFromAccuracy(50, 123);
    expect(a).toEqual(b);
    const sa = rollShotSave('good', 5, 15, 20, 123);
    const sb = rollShotSave('good', 5, 15, 20, 123);
    expect(sa).toEqual(sb);
  });

  it('shotAccuracyBonus applies only to LW/RW', () => {
    expect(shotAccuracyBonus('LW')).toBeGreaterThan(0);
    expect(shotAccuracyBonus('RW')).toBeGreaterThan(0);
    expect(shotAccuracyBonus('C')).toBe(0);
    expect(shotAccuracyBonus('LD')).toBe(0);
    expect(shotAccuracyBonus('RD')).toBe(0);
    expect(shotAccuracyBonus('G')).toBe(0);
  });

  it('the wing perk produces a measurably wider yellow band than no perk', () => {
    const baseAccuracy = 50;
    const withoutPerk = bandWidthsForAccuracy(baseAccuracy);
    const withPerk = bandWidthsForAccuracy(
      baseAccuracy + shotAccuracyBonus('LW'),
    );
    expect(withPerk.yellowWidth).toBeGreaterThan(
      withoutPerk.yellowWidth + 0.01,
    );
  });
});
