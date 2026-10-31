import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import { GetCurrentStandings } from '@/features/standings/api/standingsApi';
import { CreateLeagueStandingsArray } from '@/features/standings/utils/leagueStandingsHelper';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import { useLeague } from '@/lib/LeagueContext';
import { League } from '@/lib/league';

/** The Eastern division that is not the Atlantic: the NHL's Metropolitan, the AHL's North. */
const METRO_OR_NORTH_DIVISION: Record<League, string> = {
  nhl: 'Metropolitan',
  ahl: 'North',
};

export interface StandingsData {
  easternStandingsData: StandingsTeam[];
  westernStandingsData: StandingsTeam[];
  metroOrNorthStandings: StandingsTeam[];
  atlanticStandings: StandingsTeam[];
  centralStandings: StandingsTeam[];
  pacificStandings: StandingsTeam[];
  draftLotteryOdds: StandingsTeam[];
  loadingStandingsData: boolean;
  errorStandingsData: string | null;
  refetchStandings: () => void;
}

export const StandingsContext = createContext<StandingsData | null>(null);

/**
 * Fetches the selected season's standings and pre-splits them into the slices the
 * UI needs — by conference, by division, and the draft-lottery odds list — each
 * sorted into standings order. Re-fetches whenever the season or league changes.
 */
function StandingsDataProvider({ children }: { children: ReactNode }) {
  const [easternStandingsData, setEasternStandingsData] = useState<
    StandingsTeam[]
  >([]);
  const [westernStandingsData, setWesternStandingsData] = useState<
    StandingsTeam[]
  >([]);
  const [metroOrNorthStandings, setMetroOrNorthStandings] = useState<
    StandingsTeam[]
  >([]);
  const [atlanticStandings, setAtlanticStandings] = useState<StandingsTeam[]>(
    [],
  );
  const [centralStandings, setCentralStandings] = useState<StandingsTeam[]>([]);
  const [pacificStandings, setPacificStandings] = useState<StandingsTeam[]>([]);
  const [draftLotteryOdds, setDraftLotteryOdds] = useState<StandingsTeam[]>([]);
  const [loadingStandingsData, setLoadingStandingsData] = useState(true);
  const [errorStandingsData, setErrorStandingsData] = useState<string | null>(
    null,
  );
  const { season } = useSeason();
  const { league } = useLeague();
  const latestRequest = useRef(0);

  /**
   * Fetches one season's standings and splits them into the slices above. On
   * failure it resets every slice (rather than leaving the previous season's
   * standings on screen after a failed season change) and stores a
   * human-readable message for the UI instead of the raw API error. A response
   * that arrives after a newer fetch started is dropped so it cannot overwrite
   * the newer season's standings.
   */
  const fetchStandings = useCallback(
    async (seasonId: string, league: League) => {
      const requestId = ++latestRequest.current;
      const isStale = () => requestId !== latestRequest.current;
      setErrorStandingsData(null);
      try {
        const standingsResponse = await GetCurrentStandings(seasonId, league);
        if (isStale()) return;
        const allTeams: StandingsTeam[] = CreateLeagueStandingsArray(
          standingsResponse.standings,
        );

        const byConference = (name: string) =>
          allTeams
            .filter((team) => team.conferenceName === name)
            .sort(
              (a, b) => a.conferenceStandingsPlace - b.conferenceStandingsPlace,
            );

        const byDivision = (name: string) =>
          allTeams
            .filter((team) => team.divisionName === name)
            .sort(
              (a, b) => a.divisionStandingsPlace - b.divisionStandingsPlace,
            );

        setEasternStandingsData(byConference('Eastern'));
        setWesternStandingsData(byConference('Western'));
        setMetroOrNorthStandings(byDivision(METRO_OR_NORTH_DIVISION[league]));
        setAtlanticStandings(byDivision('Atlantic'));
        setCentralStandings(byDivision('Central'));
        setPacificStandings(byDivision('Pacific'));
        // The lottery list holds the 16 non-playoff teams that carry odds,
        // ordered worst team first (highest odds; ties broken by league rank).
        setDraftLotteryOdds(
          allTeams
            .filter((team) => team.draftLotteryOdds > 0)
            .sort(
              (a, b) =>
                b.draftLotteryOdds - a.draftLotteryOdds ||
                b.leagueStanding - a.leagueStanding,
            )
            .slice(0, 16),
        );
      } catch (error) {
        if (isStale()) return;
        console.error('Error fetching standings: ', error);
        setErrorStandingsData("Couldn't load standings.");
        setEasternStandingsData([]);
        setWesternStandingsData([]);
        setMetroOrNorthStandings([]);
        setAtlanticStandings([]);
        setCentralStandings([]);
        setPacificStandings([]);
        setDraftLotteryOdds([]);
      } finally {
        if (!isStale()) setLoadingStandingsData(false);
      }
    },
    [],
  );

  /**
   * Re-runs the fetch for the current `season` and `league`. Shared by the mount/
   * season-change effect and the manual "Try again" retry action so there is
   * one fetch code path instead of two copies of the same reset-then-fetch
   * sequence.
   */
  const refetchStandings = useCallback(() => {
    setLoadingStandingsData(true);
    fetchStandings(season, league);
  }, [season, league, fetchStandings]);

  useEffect(() => {
    refetchStandings();
  }, [refetchStandings]);

  return (
    <StandingsContext.Provider
      value={{
        easternStandingsData,
        westernStandingsData,
        metroOrNorthStandings,
        atlanticStandings,
        centralStandings,
        pacificStandings,
        draftLotteryOdds,
        loadingStandingsData,
        errorStandingsData,
        refetchStandings,
      }}
    >
      {children}
    </StandingsContext.Provider>
  );
}

/** Reads the standings slices; throws outside `StandingsDataProvider`. */
export function useStandingsContext(): StandingsData {
  const context = useContext(StandingsContext);
  if (!context)
    throw new Error(
      'useStandingsContext must be used within StandingsDataProvider',
    );
  return context;
}

/** Alias of `useStandingsContext` kept for existing callers. */
function useStandingsData(): StandingsData {
  return useStandingsContext();
}
export { StandingsDataProvider, useStandingsData };
