import { describe, expect, it } from 'vitest';
import {
  countGraphemes,
  getCategoryBadgeText,
  isCategoryLabelTooLong,
  readCategoryLabel,
  readFanTier,
  sortByFanTier,
} from '@/lib/favoriteCategory';

describe('sortByFanTier', () => {
  it('orders Diehard, Fan, Curious and keeps API order within a tier', () => {
    const favorites = [
      { id: 'a', tier: 'curious' },
      { id: 'b', tier: 'fan' },
      { id: 'c', tier: 'diehard' },
      { id: 'd', tier: 'fan' },
      { id: 'e', tier: 'diehard' },
    ] as const;
    expect(sortByFanTier(favorites).map(({ id }) => id)).toEqual([
      'c',
      'e',
      'b',
      'd',
      'a',
    ]);
  });

  it('does not change the list it was given', () => {
    const favorites = [{ tier: 'curious' }, { tier: 'diehard' }] as const;
    sortByFanTier(favorites);
    expect(favorites[0].tier).toBe('curious');
  });
});

describe('getCategoryBadgeText', () => {
  it('shows the label when one is set', () => {
    expect(getCategoryBadgeText({ tier: 'fan', label: 'Prospect' })).toBe(
      'Prospect',
    );
  });
  it('shows the tier name when there is no label', () => {
    expect(getCategoryBadgeText({ tier: 'diehard', label: null })).toBe(
      'Diehard',
    );
    expect(getCategoryBadgeText({ tier: 'curious', label: null })).toBe(
      'Curious',
    );
  });
});

describe('label length', () => {
  it('counts an emoji as one character', () => {
    expect(countGraphemes('❤️')).toBe(1);
    expect(countGraphemes('👨‍👩‍👧 ok')).toBe(4);
  });
  it('allows 24 characters and rejects 25', () => {
    expect(isCategoryLabelTooLong('a'.repeat(24))).toBe(false);
    expect(isCategoryLabelTooLong('a'.repeat(25))).toBe(true);
  });
  it('counts 24 emoji as within the limit', () => {
    expect(isCategoryLabelTooLong('❤️'.repeat(24))).toBe(false);
    expect(isCategoryLabelTooLong('❤️'.repeat(25))).toBe(true);
  });
  it('ignores surrounding spaces', () => {
    expect(isCategoryLabelTooLong(`  ${'a'.repeat(24)}  `)).toBe(false);
  });
});

describe('reading API values', () => {
  it('treats a missing or unknown tier as fan', () => {
    expect(readFanTier(undefined)).toBe('fan');
    expect(readFanTier('legend')).toBe('fan');
    expect(readFanTier('curious')).toBe('curious');
  });
  it('treats a missing or blank label as null', () => {
    expect(readCategoryLabel(undefined)).toBeNull();
    expect(readCategoryLabel('   ')).toBeNull();
    expect(readCategoryLabel(' Prospect ')).toBe('Prospect');
  });
});
