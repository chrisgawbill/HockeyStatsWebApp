import {
  ReactNode,
  useCallback,
  useContext,
  createContext,
  useState,
  useEffect,
} from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import {
  getCurrentSeasonId,
  isValidSeasonId,
} from '@/features/season/utils/seasonHelper';

const SeasonContext = createContext<{
  season: string;
  setSeason: (seasonId: string) => void;
} | null>(null);

/**
 * Deep links, back/forward, and manual URL edits update the season the app
 * remembers.
 */
function useSyncRememberedSeasonWithUrl(
  validParam: string | null,
  rememberedSeason: string,
  setRememberedSeason: (seasonId: string) => void,
) {
  useEffect(() => {
    if (validParam && validParam !== rememberedSeason) {
      setRememberedSeason(validParam);
    }
  }, [validParam, rememberedSeason, setRememberedSeason]);
}

/**
 * Bare navigations drop the `?season=` param; rewrites the URL to carry the
 * remembered season without adding a history entry or dropping router state.
 */
function useCarrySeasonInUrl(
  validParam: string | null,
  rememberedSeason: string,
) {
  const [, setSearchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    if (!validParam) {
      setSearchParams(
        (currentParams) => {
          const nextParams = new URLSearchParams(currentParams);
          nextParams.set('season', rememberedSeason);
          return nextParams;
        },
        { replace: true, state: location.state },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validParam, rememberedSeason, location.key]);
}

/**
 * Holds the app-wide selected season. The `?season=` URL param wins when present
 * and valid (so a season is deep-linkable and survives a refresh); otherwise the
 * last selected season is remembered in memory and written back to the URL, so
 * navigating via bare links (which drop query params) keeps the same season.
 * An absent or malformed param with no prior selection falls back to the current
 * season. Must live inside HashRouter (it reads the URL); season-dependent data
 * providers nest inside it so they re-fetch on change.
 */
function SeasonProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get('season');
  const validParam = param && isValidSeasonId(param) ? param : null;

  const [rememberedSeason, setRememberedSeason] = useState<string>(
    () => validParam ?? getCurrentSeasonId(),
  );

  const season = validParam ?? rememberedSeason;

  useSyncRememberedSeasonWithUrl(
    validParam,
    rememberedSeason,
    setRememberedSeason,
  );
  useCarrySeasonInUrl(validParam, rememberedSeason);

  /**
   * Writes the selected season back to the URL while preserving unrelated query
   * params such as schedule `date` and `view`.
   */
  const setSeason = useCallback(
    (nextSeason: string) => {
      setRememberedSeason(nextSeason);
      setSearchParams((currentParams) => {
        const nextParams = new URLSearchParams(currentParams);
        nextParams.set('season', nextSeason);
        return nextParams;
      });
    },
    [setSearchParams],
  );

  return (
    <SeasonContext.Provider value={{ season, setSeason }}>
      {children}
    </SeasonContext.Provider>
  );
}
/**
 * Returns the selected season plus a setter from SeasonContext. Throws when used
 * outside SeasonProvider so provider-order mistakes fail during development.
 */
function useSeason() {
  const context = useContext(SeasonContext);
  if (!context) throw new Error('useSeason must be used within SeasonProvider');
  return context;
}

export { SeasonProvider, useSeason };
