import { describe, expect, it } from 'vitest';
import { searchPlayers } from '@/features/player-compare/utils/playerSearch';
import { makeSkater } from '@/features/player-compare/utils/testPlayers';

const makar = makeSkater({ playerId: 1, name: 'Cale Makar', gamesPlayed: 30 });
const stutzle = makeSkater({
  playerId: 2,
  name: 'Tim Stützle',
  gamesPlayed: 29,
});
const mcdavid = makeSkater({
  playerId: 3,
  name: 'Connor McDavid',
  gamesPlayed: 30,
});
const mcavoy = makeSkater({
  playerId: 4,
  name: 'Charlie McAvoy',
  gamesPlayed: 12,
});
const callahan = makeSkater({
  playerId: 5,
  name: 'Mac Callahan',
  gamesPlayed: 40,
});
const oreilly = makeSkater({
  playerId: 6,
  name: "Ryan O'Reilly",
  gamesPlayed: 30,
});
const skaters = [makar, stutzle, mcdavid, mcavoy, callahan, oreilly];

/** Ids of the players a query finds, in result order. */
const findIds = (query: string, excludedIds: number[] = []) =>
  searchPlayers(skaters, query, excludedIds).map((player) => player.playerId);

describe('searchPlayers', () => {
  it('needs two letters', () => {
    expect(findIds('m')).toEqual([]);
    expect(findIds('  ')).toEqual([]);
  });

  it('ignores case and accents', () => {
    expect(findIds('STUTZ')).toEqual([2]);
    expect(findIds('stütz')).toEqual([2]);
  });

  it('puts last-name matches first, then more games played', () => {
    // "mac" starts only Mac Callahan's first name ("Makar" is "mak").
    expect(findIds('mac')).toEqual([5]);
    expect(findIds('mc')).toEqual([3, 4]);
    expect(findIds('ma')).toEqual([1, 5]);
  });

  it('matches first and last name together', () => {
    expect(findIds('connor mc')).toEqual([3]);
    expect(findIds('mcdavid connor')).toEqual([3]);
  });

  it('matches parts of apostrophe names', () => {
    expect(findIds('reilly')).toEqual([6]);
    expect(findIds("o'rei")).toEqual([6]);
  });

  it('leaves out players already compared', () => {
    expect(findIds('mc', [3])).toEqual([4]);
  });

  it('returns at most eight players', () => {
    const many = Array.from({ length: 12 }, (_, index) =>
      makeSkater({ playerId: 100 + index, name: `Player Smith${index}` }),
    );
    expect(searchPlayers(many, 'smith', [])).toHaveLength(8);
  });
});
