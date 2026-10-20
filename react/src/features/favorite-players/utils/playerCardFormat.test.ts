import { describe, expect, it } from 'vitest';
import {
  formatTeamAndPosition,
  getInitials,
} from '@/features/favorite-players/utils/playerCardFormat';

describe('formatTeamAndPosition', () => {
  it('joins team and position', () => {
    expect(formatTeamAndPosition({ teamTriCode: 'EDM', position: 'C' })).toBe(
      'EDM · C',
    );
  });
  it('omits missing parts', () => {
    expect(formatTeamAndPosition({ teamTriCode: 'EDM', position: null })).toBe(
      'EDM',
    );
    expect(formatTeamAndPosition({ teamTriCode: null, position: 'G' })).toBe(
      'G',
    );
    expect(formatTeamAndPosition({ teamTriCode: null, position: null })).toBe(
      '',
    );
  });
});

describe('getInitials', () => {
  it('uses the first letters of the first two names', () => {
    expect(getInitials('Connor McDavid')).toBe('CM');
    expect(getInitials('Pierre-Luc Dubois  Jr')).toBe('PD');
  });
  it('ignores extra spaces', () => {
    expect(getInitials('  Sidney ')).toBe('S');
  });
});
