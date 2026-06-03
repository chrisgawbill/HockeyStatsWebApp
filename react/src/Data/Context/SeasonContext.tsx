import { ReactNode, useCallback, useContext, createContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCurrentSeasonId, isValidSeasonId } from '../Helpers/seasonHelper';

const SeasonContext = createContext<{
	season: string;
	setSeason: (s: string) => void;
} | null>(null);

/**
 * Holds the app-wide selected season, backed by the `?season=` URL param so a
 * season is deep-linkable and survives a refresh. An absent or malformed param
 * falls back to the current season. Must live inside HashRouter (it reads the
 * URL); season-dependent data providers nest inside it so they re-fetch on change.
 */
function SeasonProvider({ children }: { children: ReactNode }) {
	const [searchParams, setSearchParams] = useSearchParams();
	const param = searchParams.get('season');
	const season = param && isValidSeasonId(param) ? param : getCurrentSeasonId();

	/**
	 * Writes the selected season back to the URL while preserving unrelated query
	 * params such as schedule `date` and `view`.
	 */
	const setSeason = useCallback(
		(next: string) => {
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
const useSeason = () => {
	const ctx = useContext(SeasonContext);
	if (!ctx) throw new Error('useSeason must be used within SeasonProvider');
	return ctx;
};

export { SeasonProvider, useSeason };
