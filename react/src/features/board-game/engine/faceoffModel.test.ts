import { describe, expect, it } from 'vitest';
import { BASE_WIN_BY_BAND } from '@/features/board-game/data/balance';
import {
  bandForReaction,
  narrowedWindowsAfterJump,
  rollBandFromAnticipation,
  rollCpuFaceoffBand,
  rollDropDelayMs,
  rollFaceoffContest,
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

  it('grip shifts the contest roll and higher grip beats lower, same band/opponent/seed', () => {
    const [lowGrip] = rollFaceoffContest('scrum', 0, 5, false, 7);
    const [highGrip] = rollFaceoffContest('scrum', 10, 5, false, 7);
    expect(highGrip.winChance).toBeGreaterThan(lowGrip.winChance);
    expect(highGrip.winChance - lowGrip.winChance).toBe(10);
  });

  it('the contest roll is seeded and deterministic for a fixed seed', () => {
    const a = rollFaceoffContest('clean', 3, 1, false, 123);
    const b = rollFaceoffContest('clean', 3, 1, false, 123);
    expect(a).toEqual(b);
  });

  it('a clean band concedes a win near BASE_WIN_BY_BAND.clean with matched grip, seeded', () => {
    let seed = 5;
    let won = false;
    for (let i = 0; i < 50 && !won; i++) {
      const [result, next] = rollFaceoffContest('clean', 0, 0, false, seed);
      expect(result.winChance).toBe(BASE_WIN_BY_BAND.clean);
      if (result.won) won = true;
      seed = next;
    }
    expect(won).toBe(true);
  });

  it('the contest win chance is clamped to [0, 100]', () => {
    const [tooHigh] = rollFaceoffContest('clean', 1000, 0, false, 1);
    const [tooLow] = rollFaceoffContest('late', 0, 1000, false, 1);
    expect(tooHigh.winChance).toBe(100);
    expect(tooLow.winChance).toBe(0);
  });

  it('a jump costs a re-drop and never rolls a contest', () => {
    const [firstJump, nextSeed] = rollFaceoffContest('jump', 20, 20, false, 9);
    expect(firstJump.won).toBe(false);
    expect(firstJump.reDrop).toBe(true);
    expect(firstJump.winChance).toBe(0);
    // No RNG was consumed on a jump - the seed passes through unchanged.
    expect(nextSeed).toBe(9);
  });

  it('a second jump loses outright, no re-drop', () => {
    const [secondJump] = rollFaceoffContest('jump', 20, 20, true, 9);
    expect(secondJump.won).toBe(false);
    expect(secondJump.reDrop).toBe(false);
  });

  it('the CPU path resolves through the same rollFaceoffContest as a human band', () => {
    let seed = 11;
    const [cpuBand, seedAfterRead] = rollCpuFaceoffBand(50, seed);
    const [cpuResult] = rollFaceoffContest(cpuBand, 4, 3, false, seedAfterRead);
    expect(['clean', 'scrum', 'late']).toContain(cpuBand);
    expect(cpuResult.winChance).toBeGreaterThanOrEqual(0);
    expect(cpuResult.winChance).toBeLessThanOrEqual(100);
  });

  it('rollCpuFaceoffBand never resolves to jump, across many seeds and anticipations', () => {
    for (let seed = 0; seed < 200; seed++) {
      const [band] = rollCpuFaceoffBand(seed % 100, seed);
      expect(band).not.toBe('jump');
    }
  });

  it('rollBandFromAnticipation and rollCpuFaceoffBand are deterministic for a fixed seed', () => {
    const a = rollBandFromAnticipation(50, 321);
    const b = rollBandFromAnticipation(50, 321);
    expect(a).toEqual(b);
    const ca = rollCpuFaceoffBand(50, 321);
    const cb = rollCpuFaceoffBand(50, 321);
    expect(ca).toEqual(cb);
  });

  it("rollCpuFaceoffBand's late share is no longer pinned at exactly 50% (BG-A15b fix): it reflects CPU_FACEOFF_REACTION_CEILING_MS vs. the (anticipation-independent) scrum window, not half of a self-referential domain", () => {
    // scrumWindowMs is constant regardless of anticipation (Chris's ruling,
    // unchanged here), so late's share doesn't move with anticipation either
    // - but unlike the old bug, it's no longer forced to land on exactly
    // half of the sampling domain by construction: (500 - 420) / 500 = 16%.
    const trials = 4000;
    let late = 0;
    for (let seed = 0; seed < trials; seed++) {
      const [band] = rollCpuFaceoffBand(50, seed);
      if (band === 'late') late++;
    }
    const lateShare = late / trials;
    expect(lateShare).not.toBeCloseTo(0.5, 1);
    expect(lateShare).toBeCloseTo(0.16, 1);
  });

  it('higher anticipation makes a clean CPU roll more likely too', () => {
    const trials = 300;
    const countClean = (anticipation: number) => {
      let count = 0;
      for (let seed = 0; seed < trials; seed++) {
        const [band] = rollCpuFaceoffBand(anticipation, seed);
        if (band === 'clean') count++;
      }
      return count;
    };
    expect(countClean(90)).toBeGreaterThan(countClean(10));
  });

  it('higher anticipation makes a clean roll more likely for the CPU-style random read', () => {
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
