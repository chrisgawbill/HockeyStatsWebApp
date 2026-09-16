import { StandingsTeam } from '@/features/standings/types/standingsTeam';

export interface PlayoffRaceGame {
  homeTeam: string;
  awayTeam: string;
  isPlayoff: boolean;
  isPreseason: boolean;
  gameState: string;
}

export type PlayoffRaceStatus =
  | 'playoff-position'
  | 'chasing'
  | 'eliminated'
  | 'clinched';

export interface PlayoffRaceTeam {
  team: StandingsTeam;
  remainingGames: number;
  maxPossiblePoints: number;
  cutlinePoints: number | null;
  requiredPoints: number | null;
  requiredPace: number | null;
  magicNumber: number | null;
  tragicNumber: number | null;
  status: PlayoffRaceStatus;
}

export interface PlayoffRaceSummary {
  teams: PlayoffRaceTeam[];
  cutlinePoints: number | null;
  seasonOver: boolean;
}

function isCompleted(gameState: string): boolean {
  return gameState === 'OFF' || gameState === 'FINAL';
}

function isRegularSeasonGame(game: PlayoffRaceGame): boolean {
  return !game.isPlayoff && !game.isPreseason;
}

function remainingGamesForTeam(
  teamId: string,
  games: PlayoffRaceGame[],
): number {
  return games.filter(
    (game) =>
      isRegularSeasonGame(game) &&
      !isCompleted(game.gameState) &&
      (game.homeTeam === teamId || game.awayTeam === teamId),
  ).length;
}

/**
 * Derives a deliberately simplified playoff race from already-loaded data.
 * It uses points as the only ordering rule: NHL tiebreakers, remaining-game
 * interactions, and official clinch rules are intentionally not modeled.
 */
export function derivePlayoffRace(
  standings: StandingsTeam[],
  games: PlayoffRaceGame[],
): PlayoffRaceSummary {
  const ordered = [...standings].sort(
    (a, b) => a.conferenceStandingsPlace - b.conferenceStandingsPlace,
  );
  const cutoffTeam = ordered[7] ?? null;
  const cutlinePoints = cutoffTeam?.points ?? null;
  const outsideTeams = ordered.slice(8);
  const maxChaserPoints = outsideTeams.length
    ? Math.max(
        ...outsideTeams.map(
          (team) =>
            team.points + remainingGamesForTeam(team.id, games) * 2,
        ),
      )
    : null;
  const seasonOver = ordered.every(
    (team) => remainingGamesForTeam(team.id, games) === 0,
  );

  const teams = ordered.map((team, index) => {
    const remainingGames = remainingGamesForTeam(team.id, games);
    const maxPossiblePoints = team.points + remainingGames * 2;
    const inPosition = index < 8;
    const eliminated =
      cutlinePoints !== null && maxPossiblePoints < cutlinePoints;
    const clinched =
      inPosition && maxChaserPoints !== null && team.points > maxChaserPoints;
    const requiredPoints =
      cutlinePoints === null ? null : Math.max(0, cutlinePoints - team.points);

    return {
      team,
      remainingGames,
      maxPossiblePoints,
      cutlinePoints,
      requiredPoints,
      requiredPace:
        requiredPoints === null || remainingGames === 0
          ? null
          : requiredPoints / remainingGames,
      magicNumber:
        inPosition && maxChaserPoints !== null
          ? Math.max(0, maxChaserPoints + 1 - team.points)
          : null,
      tragicNumber:
        !inPosition && cutoffTeam
          ? Math.max(0, maxPossiblePoints - cutoffTeam.points + 1)
          : null,
      status: clinched
        ? 'clinched'
        : eliminated
          ? 'eliminated'
          : inPosition
            ? 'playoff-position'
            : 'chasing',
    } satisfies PlayoffRaceTeam;
  });

  return { teams, cutlinePoints, seasonOver };
}
