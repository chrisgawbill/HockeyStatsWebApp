import { AfterActionReport } from '@/features/after-action-reports/types/afterActionReport';
import type {
  WeeklyPlayerReport,
  WeeklyReportFormGame,
  WeeklyReportPlayer,
  WeeklyReportTeam,
  WeeklyReportTeamGame,
} from '@/features/favorite-players/types/favoritePlayers';

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

export function makeWeeklyReportTeamGame(
  overrides: Partial<WeeklyReportTeamGame> = {},
): WeeklyReportTeamGame {
  return {
    gameId: 2026020110,
    date: '2026-10-21',
    opponent: 'MTL',
    isHome: true,
    teamScore: 4,
    opponentScore: 2,
    outcome: 'W',
    ...overrides,
  };
}

export function makeWeeklyReportFormGame(
  overrides: Partial<WeeklyReportFormGame> = {},
): WeeklyReportFormGame {
  return {
    date: '2026-10-10',
    gameState: 'OFF',
    homeTeam: 'COL',
    awayTeam: 'DAL',
    homeScore: 3,
    awayScore: 1,
    periodType: 'REG',
    ...overrides,
  };
}

export function makeWeeklyReportTeam(
  overrides: Partial<WeeklyReportTeam> = {},
): WeeklyReportTeam {
  return {
    triCode: 'COL',
    name: 'Colorado Avalanche',
    logo: null,
    tier: 'fan',
    label: null,
    weekGames: [],
    formGames: [],
    ...overrides,
  };
}

export function makeWeeklyReport(
  teams?: WeeklyReportTeam[],
): WeeklyPlayerReport {
  return {
    weekStart: '2026-10-19',
    weekEnd: '2026-10-25',
    label: 'Oct 19–25',
    headline: '',
    players: [],
    ...(teams ? { teams } : {}),
    createdAt: '2026-10-26T13:00:00Z',
    read: false,
  };
}
