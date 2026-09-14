import { describe, expect, it } from 'vitest';
import { BASE_WIN_BY_BAND } from '@/features/board-game/data/balance';
import {
  bandForReaction,
  narrowedWindowsAfterJump,
  rollBandFromAnticipation,
  rollDropDelayMs,
  rollFaceoffHeadToHead,
  windowsForAnticipation,
} from '@/features/board-game/engine/faceoffModel';

describe('faceoffModel', () => {
  it('anticipation widens only the clean window; scrum stays constant', () => {
    const low = windowsForAnticipation(0);
    const high = windowsForAnticipation(100);
    expect(high.cleanWindowMs).toBeGreaterThan(low.cleanWindowMs);
    expect(high.scrumWindowMs).toBe(low.scrumWindowMs);
  });

  it('bandForReaction is nested: on-time is clean, then scrum, then late; negative is jump', () => {
    const windows = { cleanWindowMs: 100, scrumWindowMs: 250 };
    expect(bandForReaction(0, windows)).toBe('clean');
    expect(bandForReaction(100, windows)).toBe('clean');
    expect(bandForReaction(101, windows)).toBe('scrum');
    expect(bandForReaction(250, windows)).toBe('scrum');
    expect(bandForReaction(251, windows)).toBe('late');
    expect(bandForReaction(-1, windows)).toBe('jump');
    expect(bandForReaction(-500, windows)).toBe('jump');
  });

  it('narrowedWindowsAfterJump shaves the clean window and leaves scrum untouched, floored at 0', () => {
    const base = windowsForAnticipation(50);
    const narrowed = narrowedWindowsAfterJump(50);
    expect(narrowed.cleanWindowMs).toBeLessThan(base.cleanWindowMs);
    expect(narrowed.scrumWindowMs).toBe(base.scrumWindowMs);
    expect(narrowedWindowsAfterJump(0).cleanWindowMs).toBeGreaterThanOrEqual(0);
  });

  it('rollDropDelayMs stays within the configured hold range and is deterministic for a fixed seed', () => {
    for (let seed = 0; seed < 100; seed++) {
      const [delay] = rollDropDelayMs(seed);
      expect(delay).toBeGreaterThanOrEqual(700);
      expect(delay).toBeLessThanOrEqual(1800);
    }
    expect(rollDropDelayMs(42)).toEqual(rollDropDelayMs(42));
  });

  describe('rollBandFromAnticipation (shared by the CPU centre and the reduced-motion/headless fallback - BG-A15b cycle 2, no separate path for either)', () => {
    it('never resolves to jump, across many seeds and anticipations', () => {
      for (let seed = 0; seed < 200; seed++) {
        const [band] = rollBandFromAnticipation(seed % 100, seed);
        expect(band).not.toBe('jump');
      }
    });

    it('is deterministic for a fixed seed', () => {
      const a = rollBandFromAnticipation(50, 321);
      const b = rollBandFromAnticipation(50, 321);
      expect(a).toEqual(b);
    });

    it("late's share is not pinned at exactly 50% (the BG-A15a cycle-1 bug, and the fallback shared the same bug until BG-A15b cycle 2): it reflects FACEOFF_REACTION_SAMPLE_CEILING_MS vs. the (anticipation-independent) scrum window, not half of a self-referential domain", () => {
      // scrumWindowMs is constant regardless of anticipation (Chris's
      // ruling, unchanged here), so late's share doesn't move with
      // anticipation either - but unlike the old bug, it's no longer
      // forced to land on exactly half of the sampling domain by
      // construction: (500 - 420) / 500 = 16%.
      const trials = 4000;
      let late = 0;
      for (let seed = 0; seed < trials; seed++) {
        const [band] = rollBandFromAnticipation(50, seed);
        if (band === 'late') late++;
      }
      const lateShare = late / trials;
      expect(lateShare).not.toBeCloseTo(0.5, 1);
      expect(lateShare).toBeCloseTo(0.16, 1);
    });

    it('higher anticipation makes a clean roll more likely', () => {
      const trials = 300;
      const countClean = (anticipation: number) => {
        let count = 0;
        for (let seed = 0; seed < trials; seed++) {
          const [band] = rollBandFromAnticipation(anticipation, seed);
          if (band === 'clean') count++;
        }
        return count;
      };
      expect(countClean(90)).toBeGreaterThan(countClean(10));
    });
  });

  describe('rollFaceoffHeadToHead (BG-A15b cycle 2: the one symmetric contest, no user/CPU fork)', () => {
    it('a tied non-clean band (both scrum, or both late) -> an automatic scrum, no roll (seed passes through unchanged)', () => {
      const [bothScrum, seedAfterBothScrum] = rollFaceoffHeadToHead(
        'scrum',
        10,
        'scrum',
        0,
        7,
      );
      expect(bothScrum.outcome).toBe('scrum');
      expect(bothScrum.winChance).toBe(0);
      expect(seedAfterBothScrum).toBe(7);

      const [bothLate, seedAfterBothLate] = rollFaceoffHeadToHead(
        'late',
        5,
        'late',
        5,
        7,
      );
      expect(bothLate.outcome).toBe('scrum');
      expect(seedAfterBothLate).toBe(7);
    });

    it('scrum vs. late (differing, neither clean) is NOT a scrum - scrum genuinely outcompetes late via the same band-edge roll', () => {
      // Corrected cycle-2 boundary: the scrum trigger is a TIE among
      // non-clean bands, not merely "neither is clean" - see
      // `rollFaceoffHeadToHead`'s doc comment for why the earlier, broader
      // gate made a winning side's own band provably always `clean`
      // whenever its opponent was pinned to a single non-clean band, which
      // is exactly the flattened, not-really-competing draw Chris's ruling
      // rejected.
      const [result, nextSeed] = rollFaceoffHeadToHead(
        'scrum',
        10,
        'late',
        0,
        7,
      );
      expect(result.outcome).toBe('win');
      expect(result.winChance).toBe(
        50 + (BASE_WIN_BY_BAND.scrum - BASE_WIN_BY_BAND.late) + 10,
      );
      expect(nextSeed).not.toBe(7);
    });

    it('both clean, equal grip -> a fair 50/50 (the band terms cancel exactly)', () => {
      const [result] = rollFaceoffHeadToHead('clean', 4, 'clean', 4, 1);
      expect(result.outcome).toBe('win');
      expect(result.winChance).toBe(50);
    });

    it('both clean -> grip difference alone decides, degree-for-degree', () => {
      const [result] = rollFaceoffHeadToHead('clean', 10, 'clean', 4, 1);
      expect(result.winChance).toBe(50 + (10 - 4));
    });

    it('one side clean, the other not -> the base-band edge (BASE_WIN_BY_BAND difference) plus grip favours the clean side', () => {
      const [cleanVsLate] = rollFaceoffHeadToHead('clean', 0, 'late', 0, 1);
      expect(cleanVsLate.winChance).toBe(
        50 + (BASE_WIN_BY_BAND.clean - BASE_WIN_BY_BAND.late),
      );
      const [cleanVsScrum] = rollFaceoffHeadToHead('clean', 0, 'scrum', 0, 1);
      expect(cleanVsScrum.winChance).toBe(
        50 + (BASE_WIN_BY_BAND.clean - BASE_WIN_BY_BAND.scrum),
      );
      // Beating a late opponent is a bigger edge than beating a scrum one.
      expect(cleanVsLate.winChance).toBeGreaterThan(cleanVsScrum.winChance);
    });

    it('the same edge applies symmetrically from either side', () => {
      const [userClean] = rollFaceoffHeadToHead('clean', 2, 'late', 5, 3);
      const [cpuClean] = rollFaceoffHeadToHead('late', 5, 'clean', 2, 3);
      // userClean.winChance is "user wins" chance when user is clean;
      // cpuClean.winChance is "user wins" chance when the CPU is clean (so
      // it should be the complement, grip terms included).
      expect(userClean.winChance).toBe(100 - cpuClean.winChance);
    });

    it('the win chance is clamped to [0, 100]', () => {
      const [tooHigh] = rollFaceoffHeadToHead('clean', 1000, 'late', 0, 1);
      const [tooLow] = rollFaceoffHeadToHead('late', 0, 'clean', 1000, 1);
      expect(tooHigh.winChance).toBe(100);
      expect(tooLow.winChance).toBe(0);
    });

    it('is seeded and deterministic for a fixed seed', () => {
      const a = rollFaceoffHeadToHead('clean', 3, 'scrum', 1, 123);
      const b = rollFaceoffHeadToHead('clean', 3, 'scrum', 1, 123);
      expect(a).toEqual(b);
    });

    it('a favoured side concedes a win near its computed win chance, seeded', () => {
      let seed = 5;
      let won = false;
      for (let i = 0; i < 50 && !won; i++) {
        const [result, next] = rollFaceoffHeadToHead(
          'clean',
          0,
          'late',
          0,
          seed,
        );
        expect(result.winChance).toBe(
          50 + (BASE_WIN_BY_BAND.clean - BASE_WIN_BY_BAND.late),
        );
        if (result.userWins) won = true;
        seed = next;
      }
      expect(won).toBe(true);
    });
  });
});
