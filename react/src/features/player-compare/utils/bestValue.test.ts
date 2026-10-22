import { describe, expect, it } from 'vitest';
import { findBestColumns } from '@/features/player-compare/utils/bestValue';

describe('findBestColumns', () => {
  it('marks the highest value when higher is better', () => {
    expect(findBestColumns([17, 19, 12], 'higher')).toEqual([
      false,
      true,
      false,
    ]);
  });

  it('marks the lowest value when lower is better (GAA)', () => {
    expect(findBestColumns([2.74, 2.31, 3.05], 'lower')).toEqual([
      false,
      true,
      false,
    ]);
  });

  it('marks every tied leader', () => {
    expect(findBestColumns([19, 17, 19], 'higher')).toEqual([
      true,
      false,
      true,
    ]);
    expect(findBestColumns([2.31, 2.31, 2.5], 'lower')).toEqual([
      true,
      true,
      false,
    ]);
  });

  it('marks nothing when every value ties', () => {
    expect(findBestColumns([5, 5, 5], 'higher')).toEqual([false, false, false]);
  });

  it('skips missing values and needs two to compare', () => {
    expect(findBestColumns([null, 0.921, 0.908], 'higher')).toEqual([
      false,
      true,
      false,
    ]);
    expect(findBestColumns([null, 0.921, null], 'higher')).toEqual([
      false,
      false,
      false,
    ]);
    expect(findBestColumns([12], 'higher')).toEqual([false]);
  });

  it('treats negative values normally (plus/minus)', () => {
    expect(findBestColumns([-2, -5, -1], 'higher')).toEqual([
      false,
      false,
      true,
    ]);
  });

  it('never marks a stat that has no better direction (games played)', () => {
    expect(findBestColumns([30, 82, 12], 'none')).toEqual([
      false,
      false,
      false,
    ]);
  });
});
