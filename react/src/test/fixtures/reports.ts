import { AfterActionReport } from '@/features/after-action-reports/types/afterActionReport';
import { WeeklyReportPlayer } from '@/features/favorite-players/types/favoritePlayers';

export function makeReport(
  overrides: Partial<AfterActionReport> = {},
): AfterActionReport {
  return {
    gameId: 1,
    date: '2026-10-18',
    gameTime: '2026-10-18T23:00:00Z',
    homeTeam: 'TOR',
    homeLogo: '',
    homeScore: 4,
    awayTeam: 'MTL',
    awayLogo: '',
    awayScore: 2,
    periodType: 'REG',
    isPlayoff: false,
    favoriteTeams: ['TOR'],
    read: false,
    ...overrides,
  };
}

export function makeWeeklyPlayer(
  overrides: Partial<WeeklyReportPlayer>,
): WeeklyReportPlayer {
  return {
    playerId: 1,
    name: 'Connor McDavid',
    position: 'C',
    headshot: null,
    team: 'EDM',
    teams: ['EDM'],
    played: false,
    teamGames: 3,
    type: 'skater',
    stats: null,
    ...overrides,
  } as WeeklyReportPlayer;
}
