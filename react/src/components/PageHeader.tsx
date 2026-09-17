import {
  KeyboardEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isCompletedGameState } from '@/lib/gameStatus';
import { useListOfGames } from '@/features/schedule/hooks/ScheduleContext';
import { localTeamList } from '@/lib/teamListData';
import { useTheme } from '@/lib/ThemeContext';
import SeasonSelector from '@/components/SeasonSelector';
import styles from '@/components/PageHeader.module.css';

/**
 * One entry in the global search index: either a team (routes to
 * `/team/:triCode`) or a completed game (routes to `/game/:gameId`). Upcoming/
 * live games are left out of the index entirely since only completed games have
 * a detail page worth searching for (ticket 2.5 scope).
 */
type SearchResult =
  | { type: 'team'; id: string; label: string; triCode: string }
  | { type: 'game'; id: string; label: string; gameId: number };

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

function HomeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function StickPuckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 3 L14 17" />
      <path d="M14 17 L20 19" />
      <circle cx="20" cy="20.5" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ThemeToggle() {
  const { theme, setPreference } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className={styles['theme-toggle']}
      onClick={() => setPreference(nextTheme)}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    >
      {nextTheme === 'dark' ? 'Dark' : 'Light'}
    </button>
  );
}

function normalizeNavPath(path: string): string {
  return path.split('?')[0];
}

export interface PageHeaderProps {
  /**
   * Optional content rendered in a small fixed-size slot after the nav
   * items (e.g. the board game's Google sign-in avatar badge). PageHeader
   * itself has no idea what this is — it just reserves the corner.
   */
  corner?: ReactNode;
}

export default function PageHeader({ corner }: PageHeaderProps = {}) {
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const { listOfGamesData } = useListOfGames();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  /**
   * Mobile-only full-screen search overlay, opened from the floating action
   * button below 576px. Kept entirely separate from `isOpen` (the desktop
   * dropdown) so the two surfaces never fight over the same open/close state.
   */
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileSearchFabRef = useRef<HTMLButtonElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  /**
   * Global search index over teams and the loaded season's completed games.
   * Built once per team-list/game-list identity change; searching itself is a
   * cheap `includes()` filter over this, so no debouncing is needed.
   */
  const searchIndex = useMemo<SearchResult[]>(() => {
    const teamResults: SearchResult[] = localTeamList.map((team) => ({
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
  }, [listOfGamesData]);

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    return searchIndex
      .filter((item) => item.label.toLowerCase().includes(trimmed))
      .slice(0, 8);
  }, [query, searchIndex]);

  /**
   * Routes to a search result's detail page, carrying the same
   * sourcePath/fallbackPath navigation state the schedule and team-list pages
   * already use so the back button returns to wherever the search happened.
   */
  const goToResult = (result: SearchResult) => {
    const back = `${location.pathname}${location.search}`;
    const state = {
      sourcePath: back,
      fallbackPath: back,
      activeNavPath: normalizeNavPath(back),
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

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = results[activeIndex] ?? results[0];
      if (chosen) goToResult(chosen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  /**
   * Locks background scroll while the mobile search overlay covers the
   * screen. The previous value is restored in the cleanup - not just when
   * `isMobileSearchOpen` flips back to false - so a route change or other
   * unmount while the overlay is open can never leave scrolling locked.
   */
  useEffect(() => {
    if (!isMobileSearchOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileSearchOpen]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const media = window.matchMedia('(max-width: 576px)');
    const updateChromeHeight = () => {
      document.documentElement.style.setProperty(
        '--mobile-chrome-height',
        media.matches ? `${nav.offsetHeight}px` : '0px',
      );
    };
    const observer = new ResizeObserver(updateChromeHeight);

    observer.observe(nav);
    media.addEventListener('change', updateChromeHeight);
    updateChromeHeight();
    return () => {
      observer.disconnect();
      media.removeEventListener('change', updateChromeHeight);
      document.documentElement.style.removeProperty('--mobile-chrome-height');
    };
  }, []);

  /**
   * Moves focus into the overlay's search input as soon as it opens, and
   * back onto the FAB that triggered it once it closes (cleanup runs on
   * close and on unmount alike), so keyboard/screen-reader users land back
   * where they started instead of at the top of the document.
   */
  useEffect(() => {
    if (!isMobileSearchOpen) return;
    mobileSearchInputRef.current?.focus();
    return () => {
      mobileSearchFabRef.current?.focus();
    };
  }, [isMobileSearchOpen]);

  const closeMobileSearch = () => {
    setIsMobileSearchOpen(false);
  };

  const handleMobileSearchKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMobileSearch();
      return;
    }
    if (e.key === 'Tab') {
      const focusable = Array.from(
        e.currentTarget.querySelectorAll<HTMLElement>(
          'input:not([disabled]), button:not([disabled])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const isTeamSubPage = pathname.startsWith('/team/');
  const isGameSubPage = pathname.startsWith('/game/');
  const isSubPage = isTeamSubPage || isGameSubPage;
  const routeState = location.state as {
    sourcePath?: string;
    fallbackPath?: string;
    activeNavPath?: string;
  } | null;
  const sourcePath =
    routeState?.sourcePath ?? (isGameSubPage ? '/schedule' : '/teamList');
  const activePath = normalizeNavPath(
    isSubPage ? (routeState?.activeNavPath ?? sourcePath) : pathname,
  );

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }

    navigate(routeState?.fallbackPath ?? sourcePath);
  };

  const navItems = [
    { label: 'Home', path: '/', icon: <HomeIcon /> },
    { label: 'Schedule', path: '/schedule', icon: <CalendarIcon /> },
    { label: 'Standings', path: '/standings', icon: <BarChartIcon /> },
    { label: 'Team List', path: '/teamList', icon: <UsersIcon /> },
    { label: 'Rink Quest', path: '/board-game', icon: <StickPuckIcon /> },
  ];

  return (
    <>
      <nav
        aria-label="Primary"
        className={styles['nav-bar']}
        ref={navRef}
        style={isSubPage ? { marginBottom: 0 } : undefined}
      >
        <div className={styles['nav-secondary-row']}>
          <div className={styles['nav-mobile-back']}>
            {isSubPage && (
              <button
                className={styles['nav-back-btn']}
                onClick={handleBack}
                aria-label="Go back"
              >
                <BackIcon />
              </button>
            )}
          </div>
          <div className={styles['nav-season-selector']}>
            <SeasonSelector className="page-header-season-selector" />
          </div>
          <div className={styles['nav-secondary-utility']}>
            {corner && <div className={styles['nav-corner']}>{corner}</div>}
          </div>
        </div>
        <div className={styles['nav-inner']}>
          <div className={styles['nav-left']}>
            <span className={styles['nav-brand']}>HockeyStats</span>
            <div className={styles['nav-back-col']}>
              {isSubPage && (
                <button
                  className={styles['nav-back-btn']}
                  onClick={handleBack}
                  aria-label="Go back"
                >
                  <BackIcon />
                </button>
              )}
            </div>
            <div className={styles['nav-search-col']} ref={searchBoxRef}>
              <input
                type="text"
                className={styles['nav-search-input']}
                placeholder="Search teams or games"
                aria-label="Search teams or games"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(-1);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setIsOpen(false)}
                onKeyDown={handleSearchKeyDown}
              />
              {isOpen && results.length > 0 && (
                <ul className={styles['nav-search-dropdown']} role="listbox">
                  {results.map((result, index) => (
                    <li
                      key={result.id}
                      role="option"
                      aria-selected={index === activeIndex}
                    >
                      <button
                        type="button"
                        className={cx(
                          styles['nav-search-option'],
                          index === activeIndex &&
                            styles['nav-search-option--active'],
                        )}
                        onMouseDown={(e) => {
                          // Prevent the input's onBlur from closing the dropdown before
                          // the click registers.
                          e.preventDefault();
                          goToResult(result);
                        }}
                      >
                        {result.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className={styles['nav-right']}>
            {navItems.map(({ label, path, icon }) => (
              <div key={path} className={styles['nav-bar-item']}>
                <Link
                  to={path}
                  className={cx(
                    styles['nav-btn'],
                    activePath === path && styles['active-page'],
                  )}
                  aria-label={label}
                  aria-current={activePath === path ? 'page' : undefined}
                >
                  <span className={styles['nav-btn__label']}>{label}</span>
                  <span className={styles['nav-btn__icon']}>{icon}</span>
                </Link>
              </div>
            ))}
            {corner && <div className={styles['nav-corner']}>{corner}</div>}
            <div className={styles['nav-theme-toggle']}>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>
      <button
        ref={mobileSearchFabRef}
        type="button"
        className={styles['mobile-search-fab']}
        onClick={() => setIsMobileSearchOpen(true)}
        aria-label="Search teams or games"
      >
        <SearchIcon />
      </button>
      {isMobileSearchOpen && (
        <div
          className={styles['mobile-search-overlay']}
          role="dialog"
          aria-modal="true"
          aria-label="Search teams or games"
          onClick={closeMobileSearch}
          onKeyDown={handleMobileSearchKeyDown}
        >
          <div
            className={styles['mobile-search-panel']}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles['mobile-search-header']}>
              <input
                ref={mobileSearchInputRef}
                type="text"
                className={styles['mobile-search-input']}
                placeholder="Search teams or games"
                aria-label="Search teams or games"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="button"
                className={styles['mobile-search-close-btn']}
                onClick={closeMobileSearch}
                aria-label="Close search"
              >
                &times;
              </button>
            </div>
            <div className={styles['mobile-search-theme']}>
              <ThemeToggle />
            </div>
            <ul className={styles['mobile-search-results']} role="listbox">
              {results.map((result) => (
                <li key={result.id} role="option">
                  <button
                    type="button"
                    className={styles['mobile-search-result']}
                    onClick={() => {
                      goToResult(result);
                      closeMobileSearch();
                    }}
                  >
                    {result.label}
                  </button>
                </li>
              ))}
              {query.trim() !== '' && results.length === 0 && (
                <li className={styles['mobile-search-empty']}>
                  No results found
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
