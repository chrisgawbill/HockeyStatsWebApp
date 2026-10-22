import type {
  ComparePlayer,
  GoalieSeason,
  SeasonPlayerPool,
  SkaterSeason,
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
