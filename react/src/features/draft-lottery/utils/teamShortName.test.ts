import { describe, expect, it } from 'vitest';
import { getTeamShortName } from '@/features/draft-lottery/utils/teamShortName';

describe('getTeamShortName', () => {
  it.each([
    ['Los Angeles Kings', 'Kings'],
    ['Columbus Blue Jackets', 'Blue Jackets'],
    ['Vegas Golden Knights', 'Golden Knights'],
    ['Toronto Maple Leafs', 'Maple Leafs'],
    ['Detroit Red Wings', 'Red Wings'],
    ['Montréal Canadiens', 'Canadiens'],
    ['Tampa Bay Lightning', 'Lightning'],
    ['Kings', 'Kings'],
  ])('%s -> %s', (full, short) => {
    expect(getTeamShortName(full)).toBe(short);
  });
});
