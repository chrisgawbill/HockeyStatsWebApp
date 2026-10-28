import { makeReport as report } from '@/test/fixtures/reports';
import { describe, expect, it } from 'vitest';
import {
  describeReport,
  finalLabel,
  reportOutcome,
  reportScoreLine,
} from '@/features/after-action-reports/utils/afterActionReportFormat';

describe('afterActionReportFormat', () => {
  it('labels finals and scores outcomes from the favorite side', () => {
    expect(finalLabel('REG')).toBe('Final');
    expect(finalLabel(null)).toBe('Final');
    expect(finalLabel('OT')).toBe('Final/OT');
    expect(finalLabel('SO')).toBe('Final/SO');

    // Scores the outcome from the favorite team side, home or away.
    expect(reportOutcome(report())).toBe('W');
    expect(reportOutcome(report({ favoriteTeams: ['MTL'] }))).toBe('L');
    expect(
      reportOutcome(report({ favoriteTeams: ['MTL'], periodType: 'SO' })),
    ).toBe('OTL');
    expect(reportOutcome(report({ homeScore: null }))).toBeNull();
  });

  it('puts the favorite first in score lines and inbox descriptions', () => {
    expect(reportScoreLine(report())).toBe('TOR 4, MTL 2');
    expect(reportScoreLine(report({ favoriteTeams: ['MTL'] }))).toBe(
      'MTL 2, TOR 4',
    );

    // Describes a report for the inbox and alerts.
    expect(describeReport(report({ periodType: 'OT' }))).toEqual({
      title: 'After Action Report: TOR Win',
      body: 'TOR 4, MTL 2 · Final/OT',
    });
  });
});
