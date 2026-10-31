import { StandingsData } from '@/features/standings/hooks/StandingsContext';
import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import { League } from '@/lib/league';

export type Conference = 'Eastern' | 'Western';
export type StandingsView = 'conference' | 'division';

/** One standings table to render: a whole conference, or a single division. */
export interface StandingsSection {
  name: string;
  teams: StandingsTeam[];
  format: 'Conference' | 'Division';
}

/**
 * Picks the standings tables for the active toggles: one combined table for
 * the conference view, or the conference's two division tables.
 */
export function getStandingsSections(
  standings: Pick<
    StandingsData,
    | 'easternStandingsData'
    | 'westernStandingsData'
    | 'metroOrNorthStandings'
    | 'atlanticStandings'
    | 'centralStandings'
    | 'pacificStandings'
  >,
  view: StandingsView,
  conference: Conference,
  league: League = 'nhl',
): StandingsSection[] {
  const sectionsByView: Record<
    StandingsView,
    Record<Conference, StandingsSection[]>
  > = {
    conference: {
      Eastern: [
        {
          name: '',
          teams: standings.easternStandingsData,
          format: 'Conference',
        },
      ],
      Western: [
        {
          name: '',
          teams: standings.westernStandingsData,
          format: 'Conference',
        },
      ],
    },
    division: {
      Eastern: [
        {
          name: league === 'ahl' ? 'North' : 'Metro',
          teams: standings.metroOrNorthStandings,
          format: 'Division',
        },
        {
          name: 'Atlantic',
          teams: standings.atlanticStandings,
          format: 'Division',
        },
      ],
      Western: [
        {
          name: 'Central',
          teams: standings.centralStandings,
          format: 'Division',
        },
        {
          name: 'Pacific',
          teams: standings.pacificStandings,
          format: 'Division',
        },
      ],
    },
  };
  return sectionsByView[view][conference];
}
