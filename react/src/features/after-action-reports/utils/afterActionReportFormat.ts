import type { AfterActionReport } from '@/features/after-action-reports/types/afterActionReport';

export type ReportOutcome = 'W' | 'L' | 'OTL';

/** "Final", "Final/OT", or "Final/SO" from the game's last period type. */
export function finalLabel(periodType: string | null): string {
  if (periodType === 'OT') return 'Final/OT';
  if (periodType === 'SO') return 'Final/SO';
  return 'Final';
}

/**
 * The report is written from the first favorite team's point of view.
 * Overtime and shootout losses read as OTL, matching standings.
 */
export function reportOutcome(report: AfterActionReport): ReportOutcome | null {
  const team = report.favoriteTeams[0];
  const { homeScore, awayScore } = report;
  if (!team || homeScore == null || awayScore == null) return null;
  const isHome = team === report.homeTeam;
  const forGoals = isHome ? homeScore : awayScore;
  const againstGoals = isHome ? awayScore : homeScore;
  if (forGoals > againstGoals) return 'W';
  return report.periodType === 'OT' || report.periodType === 'SO' ? 'OTL' : 'L';
}

/** "TOR 4, MTL 2": favorite team first, then the opponent. */
export function reportScoreLine(report: AfterActionReport): string {
  const team = report.favoriteTeams[0] ?? report.homeTeam;
  const isHome = team === report.homeTeam;
  const us = isHome
    ? `${report.homeTeam} ${report.homeScore ?? '-'}`
    : `${report.awayTeam} ${report.awayScore ?? '-'}`;
  const them = isHome
    ? `${report.awayTeam} ${report.awayScore ?? '-'}`
    : `${report.homeTeam} ${report.homeScore ?? '-'}`;
  return `${us}, ${them}`;
}

const OUTCOME_WORD: Record<ReportOutcome, string> = {
  W: 'Win',
  L: 'Loss',
  OTL: 'OT loss',
};

/** Title and body for an inbox row or a browser alert. */
export function describeReport(report: AfterActionReport): {
  title: string;
  body: string;
} {
  const outcome = reportOutcome(report);
  const team = report.favoriteTeams[0] ?? report.homeTeam;
  return {
    title: `After Action Report: ${team}${outcome ? ` ${OUTCOME_WORD[outcome]}` : ''}`,
    body: `${reportScoreLine(report)} · ${finalLabel(report.periodType)}`,
  };
}

/** "Sat, Oct 18" from a YYYY-MM-DD date, read at local noon to dodge TZ drift. */
export function formatReportDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
