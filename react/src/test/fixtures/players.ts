import {
  ComparePlayer,
  GoalieSeason,
  SeasonPlayerPool,
  SkaterSeason,
  CompareSlot,
} from '@/features/player-compare/types/playerCompare';

/** A skater season with zeroed stats, overridden by `fields`. */
export function makeSkater(fields: Partial<SkaterSeason>): SkaterSeason {
  return {
    group: 'skater',
    playerId: 1,
    name: 'Test Skater',
    position: 'C',
    teamTriCode: 'EDM',
    gamesPlayed: 0,
    goals: 0,
    assists: 0,
    points: 0,
    plusMinus: 0,
    shots: 0,
    shootingPct: null,
    toiPerGame: null,
    ...fields,
  };
}

/** A goalie season with zeroed stats, overridden by `fields`. */
export function makeGoalie(fields: Partial<GoalieSeason>): GoalieSeason {
  return {
    group: 'goalie',
    playerId: 100,
    name: 'Test Goalie',
    teamTriCode: 'NYR',
    gamesPlayed: 0,
    wins: 0,
    goalsAgainstAverage: null,
    savePct: null,
    shutouts: 0,
    ...fields,
  };
}

/** A season pool holding the given players. */
export function makePool(players: ComparePlayer[]): SeasonPlayerPool {
  return {
    skaters: players.filter(
      (player): player is SkaterSeason => player.group === 'skater',
    ),
    goalies: players.filter(
      (player): player is GoalieSeason => player.group === 'goalie',
    ),
    byId: new Map(players.map((player) => [player.playerId, player])),
  };
}

export const skater = makeSkater({ playerId: 1 });
export const otherSkater = makeSkater({ playerId: 2 });
export const goalie = makeGoalie({ playerId: 100 });
export const pool = makePool([skater, otherSkater, goalie]);

export const mcdavid = makeSkater({
  playerId: 1,
  gamesPlayed: 30,
  goals: 17,
  assists: 34,
  points: 51,
  plusMinus: 6,
  shots: 98,
  shootingPct: 0.17347,
  toiPerGame: 1324,
});
export const mackinnon = makeSkater({
  playerId: 2,
  gamesPlayed: 30,
  goals: 19,
  assists: 29,
  points: 48,
  plusMinus: 11,
  shots: 121,
  shootingPct: 0.157,
  toiPerGame: 1351,
});
export const matthews = makeSkater({
  playerId: 3,
  gamesPlayed: 28,
  goals: 19,
  assists: 15,
  points: 34,
  plusMinus: -2,
  shots: 110,
  shootingPct: 0.17272,
  toiPerGame: 1247,
});
export const skaterSlots: CompareSlot[] = [mcdavid, mackinnon, matthews].map(
  (player) => ({ kind: 'player', player }),
);

export const makar = makeSkater({
  playerId: 1,
  name: 'Cale Makar',
  gamesPlayed: 30,
});
export const stutzle = makeSkater({
  playerId: 2,
  name: 'Tim Stützle',
  gamesPlayed: 29,
});
export const searchMcdavid = makeSkater({
  playerId: 3,
  name: 'Connor McDavid',
  gamesPlayed: 30,
});
export const mcavoy = makeSkater({
  playerId: 4,
  name: 'Charlie McAvoy',
  gamesPlayed: 12,
});
export const callahan = makeSkater({
  playerId: 5,
  name: 'Mac Callahan',
  gamesPlayed: 40,
});
export const oreilly = makeSkater({
  playerId: 6,
  name: "Ryan O'Reilly",
  gamesPlayed: 30,
});
export const searchSkaters = [
  makar,
  stutzle,
  searchMcdavid,
  mcavoy,
  callahan,
  oreilly,
];
