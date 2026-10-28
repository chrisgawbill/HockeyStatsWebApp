import { describe, expect, it } from 'vitest';
import {
  buildReportTeamForm,
  formatGameDay,
  formatOpponent,
  formatTeamScore,
  formatWeekRecord,
  listReportTeams,
} from '@/features/favorite-players/utils/weeklyReportTeams';
import {
  makeWeeklyReport,
  makeWeeklyReportFormGame as formGame,
  makeWeeklyReportTeam as team,
  makeWeeklyReportTeamGame as weekGame,
} from '@/test/fixtures/reports';
import type { WeeklyReportTeam } from '@/features/favorite-players/types/favoritePlayers';

describe('listReportTeams', () => {
  it('returns no teams for a report made before teams were added', () => {
    expect(listReportTeams(makeWeeklyReport())).toEqual([]);
  });

  it('orders teams Diehard, Fan, Curious and keeps order within a tier', () => {
    const teams = [
      team({ triCode: 'DAL', tier: 'curious' }),
      team({ triCode: 'TOR', tier: 'fan' }),
      team({ triCode: 'COL', tier: 'diehard' }),
      team({ triCode: 'MTL', tier: 'fan' }),
    ];
    expect(
      listReportTeams(makeWeeklyReport(teams)).map((t) => t.triCode),
    ).toEqual(['COL', 'TOR', 'MTL', 'DAL']);
  });

  it('treats an unknown tier as the default Fan tier', () => {
    const teams = [
      team({ triCode: 'DAL', tier: 'curious' }),
      team({ triCode: 'TOR', tier: 'superfan' as WeeklyReportTeam['tier'] }),
    ];
    const listed = listReportTeams(makeWeeklyReport(teams));
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
