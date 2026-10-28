import { describe, expect, it } from 'vitest';
import {
  buildReportTeamForm,
  formatGameDay,
  formatOpponent,
  formatTeamScore,
  formatWeekRecord,
  listReportTeams,
} from '@/features/favorite-players/utils/weeklyReportTeams';
import type {
  WeeklyPlayerReport,
  WeeklyReportFormGame,
  WeeklyReportTeam,
  WeeklyReportTeamGame,
} from '@/features/favorite-players/types/favoritePlayers';

function weekGame(
  overrides: Partial<WeeklyReportTeamGame>,
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

function formGame(
  overrides: Partial<WeeklyReportFormGame>,
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

function team(overrides: Partial<WeeklyReportTeam>): WeeklyReportTeam {
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

function report(teams?: WeeklyReportTeam[]): WeeklyPlayerReport {
  return {
    weekStart: '2026-10-19',
    weekEnd: '2026-10-25',
    label: 'Oct 19–25',
    headline: '',
    players: [],
    createdAt: '2026-10-26T13:00:00Z',
    read: false,
    ...(teams ? { teams } : {}),
  };
}

describe('listReportTeams', () => {
  it('returns no teams for a report made before teams were added', () => {
    expect(listReportTeams(report())).toEqual([]);
  });

  it('orders teams Diehard, Fan, Curious and keeps order within a tier', () => {
    const teams = [
      team({ triCode: 'DAL', tier: 'curious' }),
      team({ triCode: 'TOR', tier: 'fan' }),
      team({ triCode: 'COL', tier: 'diehard' }),
      team({ triCode: 'MTL', tier: 'fan' }),
    ];
    expect(listReportTeams(report(teams)).map((t) => t.triCode)).toEqual([
      'COL',
      'TOR',
      'MTL',
      'DAL',
    ]);
  });

  it('treats an unknown tier as the default Fan tier', () => {
    const teams = [
      team({ triCode: 'DAL', tier: 'curious' }),
      team({ triCode: 'TOR', tier: 'superfan' as WeeklyReportTeam['tier'] }),
    ];
    const listed = listReportTeams(report(teams));
    expect(listed.map((t) => [t.triCode, t.tier])).toEqual([
      ['TOR', 'fan'],
      ['DAL', 'curious'],
    ]);
  });
});

describe('buildReportTeamForm', () => {
  it('builds Team Form from the frozen date-string games', () => {
    const form = buildReportTeamForm(
      team({
        formGames: [
          formGame({
            date: '2026-10-12',
            homeScore: 2,
            awayScore: 3,
            periodType: 'OT',
          }),
          formGame({ date: '2026-10-10' }),
          formGame({
            date: '2026-10-14',
            homeTeam: 'VGK',
            awayTeam: 'COL',
            homeScore: 4,
            awayScore: 1,
          }),
        ],
      }),
    );
    expect(form.results.map((result) => result.outcome)).toEqual([
      'W',
      'OTL',
      'L',
    ]);
    expect(form.goalDiff).toBe(-2);
    expect(form.splits.home).toMatchObject({ wins: 1, otl: 1, losses: 0 });
    expect(form.splits.road).toMatchObject({ wins: 0, losses: 1 });
  });

  it('gives an empty form when the team has no completed games', () => {
    const form = buildReportTeamForm(team({}));
    expect(form.results).toEqual([]);
    expect(form.recent).toEqual([]);
  });
});

describe('week game formatting', () => {
  it('counts the week record as W-L-OTL', () => {
    expect(
      formatWeekRecord([
        weekGame({ outcome: 'W' }),
        weekGame({ outcome: 'OTL' }),
        weekGame({ outcome: 'W' }),
      ]),
    ).toBe('2-0-1');
    expect(formatWeekRecord([])).toBe('0-0-0');
  });

  it('names the opponent as home or road', () => {
    expect(formatOpponent(weekGame({ isHome: true }))).toBe('vs MTL');
    expect(formatOpponent(weekGame({ isHome: false, opponent: 'BOS' }))).toBe(
      '@ BOS',
    );
  });

  it("puts the team's score first", () => {
    expect(formatTeamScore(weekGame({ teamScore: 1, opponentScore: 3 }))).toBe(
      '1–3',
    );
  });

  it('formats the game day without shifting the date', () => {
    expect(formatGameDay('2026-10-20')).toBe('Tue, Oct 20');
  });
});
