import { ReactNode, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SeasonSelector from '@/components/SeasonSelector';
import ShareButton from '@/components/ShareButton';
import AccountCorner from '@/components/AccountCorner';
import HeaderSearchBox from '@/components/HeaderSearchBox';
import MobileSearchOverlay from '@/components/MobileSearchOverlay';
import ThemeToggle from '@/components/ThemeToggle';
import {
  BackIcon,
  BarChartIcon,
  CalendarIcon,
  HomeIcon,
  SearchIcon,
  StickPuckIcon,
  UsersIcon,
} from '@/components/PageHeaderIcons';
import {
  normalizeNavPath,
  useHeaderSearch,
} from '@/components/useHeaderSearch';
import { useMobileChromeHeights } from '@/components/useMobileChromeHeights';
import { useMobileSearchOverlay } from '@/components/useMobileSearchOverlay';
import { useNavSystemBarColor } from '@/components/useNavSystemBarColor';
import styles from '@/components/PageHeader.module.css';
import { joinClassNames } from '@/lib/joinClassNames';

const NAV_ITEMS = [
  { label: 'Home', path: '/', icon: <HomeIcon /> },
  { label: 'Schedule', path: '/schedule', icon: <CalendarIcon /> },
  { label: 'Standings', path: '/standings', icon: <BarChartIcon /> },
  { label: 'Team List', path: '/teamList', icon: <UsersIcon /> },
  { label: 'Rink Quest', path: '/board-game', icon: <StickPuckIcon /> },
];

/** Back arrow shown on team and game pages; the header renders two layouts of it. */
function HeaderBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className={styles['nav-back-btn']}
      onClick={onClick}
      aria-label="Go back"
    >
      <BackIcon />
    </button>
  );
}

export interface PageHeaderProps {
  /**
   * Content for the small slot after the nav items. Defaults to the
   * site-wide account controls (Google sign-in, After Action Report bell,
   * avatar menu); pass `null` to leave the corner empty.
   */
  corner?: ReactNode;
}

/**
 * Global header rendered at the top of every page: brand, back button on team
 * and game pages, desktop search, season selector, the phone-only share
 * button, primary navigation (a
 * glass top bar on desktop, a bottom bar on phones), the account corner, and
 * the phone search overlay.
 */
export default function PageHeader({
  corner = <AccountCorner />,
}: PageHeaderProps = {}) {
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);

  useNavSystemBarColor(navRef);
  const search = useHeaderSearch();
  const mobileSearch = useMobileSearchOverlay();
  useMobileChromeHeights(navRef, mobileNavRef);

  const isTeamSubPage = pathname.startsWith('/team/');
  const isGameSubPage = pathname.startsWith('/game/');
  const isSubPage = isTeamSubPage || isGameSubPage;
  const isShareablePage = pathname !== '/diagnostics';
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

  return (
    <>
      <nav
        aria-label="Primary"
        className={styles['nav-bar']}
        ref={navRef}
        style={isSubPage ? { marginBottom: 0 } : undefined}
      >
        <div className={styles['nav-inner']}>
          <div className={styles['nav-left']}>
            <span className={styles['nav-brand']}>HockeyStats</span>
            <div className={styles['nav-back-col']}>
              {isSubPage && <HeaderBackButton onClick={handleBack} />}
            </div>
            <HeaderSearchBox search={search} />
          </div>
          <div className={styles['nav-secondary-row']}>
            <div className={styles['nav-mobile-back']}>
              {isSubPage && <HeaderBackButton onClick={handleBack} />}
            </div>
            <div className={styles['nav-season-selector']}>
              <SeasonSelector className="page-header-season-selector" />
            </div>
            <div className={styles['nav-secondary-utility']}>
              {isShareablePage && <ShareButton />}
              {corner && <div className={styles['nav-corner']}>{corner}</div>}
            </div>
          </div>
          <div className={styles['nav-right']}>
            {NAV_ITEMS.map(({ label, path, icon }) => (
              <div key={path} className={styles['nav-bar-item']}>
                <Link
                  to={path}
                  className={joinClassNames(
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
      {/* Phone-only MD3 navigation bar. It is a separate element because the
          header's glass backdrop-filter would anchor a fixed child to the
          header instead of the viewport; below the breakpoint the header's
          own destination links are hidden, so only one set is exposed. */}
      <nav
        aria-label="Primary"
        className={styles['mobile-nav-bar']}
        ref={mobileNavRef}
      >
        {NAV_ITEMS.map(({ label, path, icon }) => (
          <Link
            key={path}
            to={path}
            className={joinClassNames(
              styles['mobile-nav-item'],
              activePath === path && styles['mobile-nav-item--active'],
            )}
            aria-current={activePath === path ? 'page' : undefined}
          >
            <span className={styles['mobile-nav-item__indicator']}>{icon}</span>
            <span className={styles['mobile-nav-item__label']}>{label}</span>
          </Link>
        ))}
      </nav>
      <button
        ref={mobileSearch.fabRef}
        type="button"
        className={styles['mobile-search-fab']}
        onClick={mobileSearch.open}
        aria-label="Search teams or games"
      >
        <SearchIcon />
      </button>
      {mobileSearch.isOpen && (
        <MobileSearchOverlay
          query={search.query}
          onQueryChange={search.setQuery}
          results={search.results}
          onSelectResult={search.goToResult}
          onClose={mobileSearch.close}
          onKeyDown={mobileSearch.handleKeyDown}
          inputRef={mobileSearch.inputRef}
        />
      )}
    </>
  );
}
