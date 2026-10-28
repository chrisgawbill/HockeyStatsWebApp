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
  it('sorts tiers stably without mutating the input', () => {
    const favorites = [
      { id: 'a', tier: 'curious' },
      { id: 'b', tier: 'fan' },
      { id: 'c', tier: 'diehard' },
      { id: 'd', tier: 'fan' },
      { id: 'e', tier: 'diehard' },
    ] as const;
    const original = structuredClone(favorites);
    expect(sortByFanTier(favorites).map(({ id }) => id)).toEqual([
      'c',
      'e',
      'b',
      'd',
      'a',
    ]);
    expect(favorites).toEqual(original);
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
  it('enforces the trimmed 24-grapheme boundary for text and emoji', () => {
    for (const character of ['a', '❤️']) {
      expect(isCategoryLabelTooLong(character.repeat(24))).toBe(false);
      expect(isCategoryLabelTooLong(character.repeat(25))).toBe(true);
      expect(isCategoryLabelTooLong(`  ${character.repeat(24)}  `)).toBe(false);
    }
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
