import { KeyboardEvent, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useListOfGames } from '@/features/schedule/hooks/ScheduleContext';
import { isCompletedGameState } from '@/lib/gameStatus';
import { getTeamList } from '@/lib/teamListData';
import { useLeague } from '@/lib/LeagueContext';

/**
 * One entry in the global search index: either a team (routes to
 * `/team/:triCode`) or a completed game (routes to `/game/:gameId`). Upcoming/
 * live games are left out of the index entirely since only completed games have
 * a detail page worth searching for.
 */
export type SearchResult =
  | { type: 'team'; id: string; label: string; triCode: string }
  | { type: 'game'; id: string; label: string; gameId: number };

const MAX_SEARCH_RESULTS = 8;

/** Strips the query string from a route so it can be compared to a nav path. */
export function normalizeNavPath(path: string): string {
  return path.split('?')[0];
}

/**
 * Global header search over the shown league's teams and the loaded season's
 * completed games.
 * The index is rebuilt only when the game list changes; searching itself is a
 * cheap `includes()` filter over it, so no debouncing is needed.
 *
 * Returns the query/dropdown state shared by the desktop dropdown and the
 * mobile overlay, the matching `results`, `goToResult` to navigate to one, and
 * `handleKeyDown` for the desktop input's arrow/Enter/Escape handling.
 */
export function useHeaderSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const { listOfGamesData } = useListOfGames();
  const { league } = useLeague();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const searchIndex = useMemo<SearchResult[]>(() => {
    const teamResults: SearchResult[] = getTeamList(league).map((team) => ({
      type: 'team',
      id: `team-${team.triCode}`,
      label: `${team.fullName} (${team.triCode})`,
      triCode: team.triCode,
    }));

    const gameResults: SearchResult[] = (listOfGamesData ?? [])
      .filter((game) => isCompletedGameState(game.gameState))
      .map((game) => ({
        type: 'game',
        id: `game-${game.gameId}`,
        label: `${game.awayTeam} @ ${game.homeTeam} - ${game.dayOfWeek}`,
        gameId: game.gameId,
      }));

    return [...teamResults, ...gameResults];
  }, [listOfGamesData, league]);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];
    return searchIndex
      .filter((item) => item.label.toLowerCase().includes(normalizedQuery))
      .slice(0, MAX_SEARCH_RESULTS);
  }, [query, searchIndex]);

  /**
   * Routes to a search result's detail page, carrying the same
   * sourcePath/fallbackPath navigation state the schedule and team-list pages
   * already use so the back button returns to wherever the search happened.
   */
  const goToResult = (result: SearchResult) => {
    const backPath = `${location.pathname}${location.search}`;
    const state = {
      sourcePath: backPath,
      fallbackPath: backPath,
      activeNavPath: normalizeNavPath(backPath),
    };
    if (result.type === 'team') {
      navigate(`/team/${result.triCode}`, { state });
    } else {
      navigate(`/game/${result.gameId}`, { state });
    }
    setQuery('');
    setActiveIndex(-1);
    setIsOpen(false);
    searchBoxRef.current?.querySelector('input')?.blur();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const chosen = results[activeIndex] ?? results[0];
      if (chosen) goToResult(chosen);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return {
    query,
    setQuery,
    activeIndex,
    setActiveIndex,
    isOpen,
    setIsOpen,
    searchBoxRef,
    results,
    goToResult,
    handleKeyDown,
  };
}
