import { StandingsTeam } from '@/features/standings/types/standingsTeam';

export type ClinchStatus =
  'presidents' | 'conference' | 'division' | 'playoffs' | 'wildcard';

export const CLINCH_STATUS_META: Record<
  ClinchStatus,
  { badge: string; className: string; label: string }
> = {
  presidents: {
    badge: 'P',
    className: 'standings-status--presidents',
    label: 'Presidents',
  },
  conference: {
    badge: 'C',
    className: 'standings-status--conference',
    label: 'Conference',
  },
  division: {
    badge: 'D',
    className: 'standings-status--division',
    label: 'Division',
  },
  playoffs: {
    badge: 'X',
    className: 'standings-status--playoffs',
    label: 'Playoffs',
  },
  wildcard: {
    badge: 'W',
    className: 'standings-status--wildcard',
    label: 'Wild Card',
  },
};

/**
 * Maps the NHL clinching letter on a standings row (p, z, y, w, x) to a
 * ClinchStatus. An "x" in the top two wild-card spots counts as a wild card.
 * Null when the team has not clinched anything.
 */
export function getClinchStatus(team: StandingsTeam): ClinchStatus | null {
  const indicator = team.clinchingIndicator?.toString().trim().toLowerCase();
  if (indicator === 'p') return 'presidents';
  if (indicator === 'z') return 'conference';
  if (indicator === 'y') return 'division';
  if (
    indicator === 'w' ||
    (indicator === 'x' && team.wildCardRank > 0 && team.wildCardRank <= 2)
  )
    return 'wildcard';
  if (indicator === 'x') return 'playoffs';
  return null;
}
