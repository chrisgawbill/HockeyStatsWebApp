import { useLocation } from 'react-router-dom';
import SlidingToggle from '@/components/SlidingToggle';
import { useLeague } from '@/features/league/hooks/LeagueContext';
import {
  League,
  getLeagueSwitchPath,
} from '@/features/league/utils/leagueHelper';

/**
 * Header switch between the NHL and AHL views of the site. Keeps the visitor
 * on the same page, or on the nearest list page when it has no twin in the
 * other league.
 */
export default function LeagueToggle() {
  const { league, setLeague } = useLeague();
  const { pathname } = useLocation();

  /** Switches league, moving off a page the other league does not have. */
  function switchLeague(nextLeague: League) {
    setLeague(
      nextLeague,
      getLeagueSwitchPath(pathname, nextLeague) ?? pathname,
    );
  }

  return (
    <SlidingToggle
      label="League"
      options={[
        { label: 'NHL', value: 'nhl' },
        { label: 'AHL', value: 'ahl' },
      ]}
      value={league}
      onChange={switchLeague}
    />
  );
}
