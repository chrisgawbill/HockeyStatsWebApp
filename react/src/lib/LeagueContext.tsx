import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  League,
  parseLeague,
  readRememberedLeague,
  rememberLeague,
} from '@/lib/league';

const LeagueContext = createContext<{
  league: League;
  setLeague: (league: League, pathname?: string) => void;
} | null>(null);

/**
 * Bare navigations drop `?league=ahl`; puts it back without adding a history
 * entry so an AHL visitor stays in the AHL. NHL URLs carry no league.
 */
function useCarryAhlInUrl(urlLeague: League | null, rememberedLeague: League) {
  const [, setSearchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    if (!urlLeague && rememberedLeague === 'ahl') {
      setSearchParams(
        (currentParams) => {
          const nextParams = new URLSearchParams(currentParams);
          nextParams.set('league', 'ahl');
          return nextParams;
        },
        { replace: true, state: location.state },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlLeague, rememberedLeague, location.key]);
}

/**
 * Holds the league the site shows (NHL by default). A valid `?league=` wins,
 * so shared AHL links open in the AHL; otherwise the league this device last
 * chose is used. Must live inside HashRouter; league-dependent data providers
 * nest inside it so they re-fetch on change.
 */
function LeagueProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const urlLeague = parseLeague(searchParams.get('league'));
  const [rememberedLeague, setRememberedLeague] = useState<League>(
    () => urlLeague ?? readRememberedLeague(),
  );
  const league = urlLeague ?? rememberedLeague;

  // Deep links, back/forward and URL edits change the remembered league too.
  // Runs on URL changes only: a toggle updates the remembered league a render
  // before its URL, and must not be undone by the URL it is replacing.
  useEffect(() => {
    if (urlLeague) {
      setRememberedLeague(urlLeague);
      rememberLeague(urlLeague);
    }
  }, [urlLeague]);
  useCarryAhlInUrl(urlLeague, rememberedLeague);

  /**
   * Switches league, keeping the other query params. The visitor stays on the
   * page unless `pathname` names another one (a page with no twin in the
   * other league).
   */
  const setLeague = useCallback(
    (nextLeague: League, pathname = location.pathname) => {
      // The URL's league wins, so an AHL switch is remembered once its URL
      // lands; the NHL one, whose URL carries no league, is remembered here.
      if (nextLeague === 'nhl') {
        setRememberedLeague('nhl');
        rememberLeague('nhl');
      }
      const nextParams = new URLSearchParams(location.search);
      if (nextLeague === 'ahl') nextParams.set('league', 'ahl');
      else nextParams.delete('league');
      navigate({ pathname, search: nextParams.toString() });
    },
    [location.pathname, location.search, navigate],
  );

  return (
    <LeagueContext.Provider value={{ league, setLeague }}>
      {children}
    </LeagueContext.Provider>
  );
}

/** Returns the shown league and its setter; throws outside LeagueProvider. */
function useLeague() {
  const context = useContext(LeagueContext);
  if (!context) throw new Error('useLeague must be used within LeagueProvider');
  return context;
}

export { LeagueProvider, useLeague };
