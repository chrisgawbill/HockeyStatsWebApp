import { describe, expect, it } from 'vitest';
import {
  formatComparePlayerIds,
  getComparePath,
  parseComparePlayerIds,
} from '@/lib/comparePath';

describe('parseComparePlayerIds', () => {
  it('is empty for a missing or blank value', () => {
    expect(parseComparePlayerIds(null)).toEqual([]);
    expect(parseComparePlayerIds('')).toEqual([]);
    expect(parseComparePlayerIds(' , ,')).toEqual([]);
  });

  it('drops tokens that are not positive whole numbers', () => {
    expect(
      parseComparePlayerIds('abc,8478402,-5,0,1.5,12e3,99999999999999999999'),
    ).toEqual([8478402]);
  });

  it('trims spaces around ids', () => {
    expect(parseComparePlayerIds(' 8478402 , 8477492 ')).toEqual([
      8478402, 8477492,
    ]);
  });

  it('preserves order, removes duplicates and keeps at most three players', () => {
    expect(parseComparePlayerIds('1,2,1,3,4,5')).toEqual([1, 2, 3]);
  });
});

describe('getComparePath', () => {
  it('builds the shareable route', () => {
    expect(getComparePath([8478402])).toBe('/compare?players=8478402');
    expect(getComparePath([1, 2, 3])).toBe('/compare?players=1,2,3');
  });

  it('round-trips through the parser', () => {
    const playerIds = [8478402, 8477492, 8479318];
    expect(parseComparePlayerIds(formatComparePlayerIds(playerIds))).toEqual(
      playerIds,
    );
  });
});
