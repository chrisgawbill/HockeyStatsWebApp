import { describe, expect, it } from 'vitest';
import type { AfterActionReport } from '@/features/after-action-reports/types/afterActionReport';
import {
  describeReport,
  finalLabel,
  reportOutcome,
  reportScoreLine,
} from '@/features/after-action-reports/utils/afterActionReportFormat';

function report(overrides: Partial<AfterActionReport> = {}): AfterActionReport {
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

describe('afterActionReportFormat', () => {
  it('labels finals by last period', () => {
    expect(finalLabel('REG')).toBe('Final');
    expect(finalLabel(null)).toBe('Final');
    expect(finalLabel('OT')).toBe('Final/OT');
    expect(finalLabel('SO')).toBe('Final/SO');
  });

  it('scores the outcome from the favorite team side, home or away', () => {
    expect(reportOutcome(report())).toBe('W');
    expect(reportOutcome(report({ favoriteTeams: ['MTL'] }))).toBe('L');
    expect(
      reportOutcome(report({ favoriteTeams: ['MTL'], periodType: 'SO' })),
    ).toBe('OTL');
    expect(reportOutcome(report({ homeScore: null }))).toBeNull();
  });

  it('puts the favorite team first in the score line', () => {
    expect(reportScoreLine(report())).toBe('TOR 4, MTL 2');
    expect(reportScoreLine(report({ favoriteTeams: ['MTL'] }))).toBe(
      'MTL 2, TOR 4',
    );
  });

  it('describes a report for the inbox and alerts', () => {
    expect(describeReport(report({ periodType: 'OT' }))).toEqual({
      title: 'After Action Report: TOR Win',
      body: 'TOR 4, MTL 2 · Final/OT',
    });
  });
});
