import { getTeamList } from '@/lib/teamListData';

/** The leagues the site can show. NHL is the default everywhere. */
export type League = 'nhl' | 'ahl';

const REMEMBERED_LEAGUE_KEY = 'hockeystats:league';

/** Returns the league a `?league=` value names, or null for anything else. */
export function parseLeague(value: string | null): League | null {
  return value === 'nhl' || value === 'ahl' ? value : null;
}

/** The league this device last chose; NHL when none was saved or storage fails. */
export function readRememberedLeague(): League {
  try {
    return (
      parseLeague(globalThis.localStorage?.getItem(REMEMBERED_LEAGUE_KEY)) ??
      'nhl'
    );
  } catch {
    return 'nhl';
  }
}

/** Saves the chosen league for the next visit, ignoring storage failures. */
export function rememberLeague(league: League): void {
  try {
    globalThis.localStorage?.setItem(REMEMBERED_LEAGUE_KEY, league);
  } catch {
    // The choice still holds for this visit.
  }
}

/**
 * The `league` query value an API call sends: none for the NHL, so NHL
 * requests stay exactly as they were before the AHL existed.
 */
export function getLeagueQueryValue(league: League): 'ahl' | undefined {
  return league === 'ahl' ? 'ahl' : undefined;
}

/** Pages with no AHL version: the matchup page, comparison, favorites and Rink Quest. */
const NHL_ONLY_PATHS = [
  '/matchup',
  '/compare',
  '/my-hockey',
  '/weekly-report',
  '/board-game',
];

/**
 * Where switching to `nextLeague` sends a visitor whose page has no twin in
 * that league, or null to stay on the page. Game ids never match across
 * leagues; a team page stays only when the other league has that tri-code.
 */
export function getLeagueSwitchPath(
  pathname: string,
  nextLeague: League,
): string | null {
  if (pathname.startsWith('/game/')) return '/schedule';
  if (pathname.startsWith('/team/')) {
    const triCode = pathname.slice('/team/'.length).toUpperCase();
    const hasTeam = getTeamList(nextLeague).some(
      (team) => team.triCode === triCode,
    );
    return hasTeam ? null : '/teamList';
  }
  if (
    nextLeague === 'ahl' &&
    NHL_ONLY_PATHS.some((path) => pathname.startsWith(path))
  ) {
    return '/';
  }
  return null;
}
