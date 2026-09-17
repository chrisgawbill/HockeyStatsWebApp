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
  setSeason: (s: string) => void;
} | null>(null);

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
  const location = useLocation();
  const param = searchParams.get('season');
  const validParam = param && isValidSeasonId(param) ? param : null;

  const [rememberedSeason, setRememberedSeason] = useState<string>(
    () => validParam ?? getCurrentSeasonId(),
  );

  const season = validParam ?? rememberedSeason;

  // Deep links / back-forward / manual URL edits update what we remember.
  useEffect(() => {
    if (validParam && validParam !== rememberedSeason) {
      setRememberedSeason(validParam);
    }
  }, [validParam, rememberedSeason]);

  // Bare navigations drop the param; rewrite the URL to carry the remembered
  // season without adding a history entry or dropping router state.
  useEffect(() => {
    if (!validParam) {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set('season', rememberedSeason);
          return p;
        },
        { replace: true, state: location.state },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validParam, rememberedSeason, location.key]);

  /**
   * Writes the selected season back to the URL while preserving unrelated query
   * params such as schedule `date` and `view`.
   */
  const setSeason = useCallback(
    (next: string) => {
      setRememberedSeason(next);
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.set('season', next);
        return p;
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
  const ctx = useContext(SeasonContext);
  if (!ctx) throw new Error('useSeason must be used within SeasonProvider');
  return ctx;
}

export { SeasonProvider, useSeason };
