import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import { GetCurrentStandings } from '@/features/standings/api/standingsApi';
import { CreateLeagueStandingsArray } from '@/features/standings/utils/leagueStandingsHelper';
import { useSeason } from '@/features/season/hooks/SeasonContext';

interface StandingsData {
  easternStandingsData: StandingsTeam[];
  westernStandingsData: StandingsTeam[];
  metropolitanStandings: StandingsTeam[];
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
 * sorted into standings order. Re-fetches whenever the season changes.
 */
function StandingsDataProvider({ children }: { children: ReactNode }) {
  const [easternStandingsData, setEasternStandingsData] = useState<
    StandingsTeam[]
  >([]);
  const [westernStandingsData, setWesternStandingsData] = useState<
    StandingsTeam[]
  >([]);
  const [metropolitanStandings, setMetropolitanStandings] = useState<
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

  /**
   * Fetches one season's standings and splits them into the slices above. On
   * failure it resets every slice (rather than leaving the previous season's
   * standings on screen after a failed season change) and stores a
   * human-readable message for the UI instead of the raw axios error.
   */
  const fetchStandings = useCallback(async (seasonId: string) => {
    setErrorStandingsData(null);
    try {
      const data = await GetCurrentStandings(seasonId);
      const all: StandingsTeam[] = CreateLeagueStandingsArray(data.standings);

      const byConference = (name: string) =>
        all
          .filter((t) => t.conferenceName === name)
          .sort(
            (a, b) => a.conferenceStandingsPlace - b.conferenceStandingsPlace,
          );

      const byDivision = (name: string) =>
        all
          .filter((t) => t.divisionName === name)
          .sort((a, b) => a.divisionStandingsPlace - b.divisionStandingsPlace);

      setEasternStandingsData(byConference('Eastern'));
      setWesternStandingsData(byConference('Western'));
      setMetropolitanStandings(byDivision('Metropolitan'));
      setAtlanticStandings(byDivision('Atlantic'));
      setCentralStandings(byDivision('Central'));
      setPacificStandings(byDivision('Pacific'));
      /**
       * Keeps the lottery list to the 16 non-playoff teams that carry odds,
       * sorted best-odds first for the landing-page display.
       */
      setDraftLotteryOdds(
        all
          .filter((t) => t.draftLotteryOdds > 0)
          .sort((a, b) => b.draftLotteryOdds - a.draftLotteryOdds)
          .slice(0, 16),
      );
    } catch (error) {
      console.error('Error fetching standings: ', error);
      setErrorStandingsData("Couldn't load standings.");
      setEasternStandingsData([]);
      setWesternStandingsData([]);
      setMetropolitanStandings([]);
      setAtlanticStandings([]);
      setCentralStandings([]);
      setPacificStandings([]);
      setDraftLotteryOdds([]);
    } finally {
      setLoadingStandingsData(false);
    }
  }, []);

  /**
   * Re-runs the season fetch for the current `season`. Shared by the mount/
   * season-change effect and the manual "Try again" retry action so there is
   * one fetch code path instead of two copies of the same reset-then-fetch
   * sequence.
   */
  const refetchStandings = useCallback(() => {
    setLoadingStandingsData(true);
    fetchStandings(season);
  }, [season, fetchStandings]);

  useEffect(() => {
    refetchStandings();
  }, [refetchStandings]);

  return (
    <StandingsContext.Provider
      value={{
        easternStandingsData,
        westernStandingsData,
        metropolitanStandings,
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

export function useStandingsContext(): StandingsData {
  const context = useContext(StandingsContext);
  if (!context)
    throw new Error(
      'useStandingsContext must be used within StandingsDataProvider',
    );
  return context;
}

export function useDraftLotteryOddsData() {
  return useStandingsContext().draftLotteryOdds;
}

function useStandingsData(): StandingsData {
  return useStandingsContext();
}
export { StandingsDataProvider, useStandingsData };
