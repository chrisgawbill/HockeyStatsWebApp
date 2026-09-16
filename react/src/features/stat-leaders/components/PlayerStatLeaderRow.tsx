import styles from '@/styles/LandingPageRow.module.css';
import { TopStatLeader } from '@/features/stat-leaders/types/topStatLeader';
import StatLeaderCard from '@/features/stat-leaders/components/StatLeaderCard';
import EmptyState from '@/components/EmptyState';
import { useSeason } from '@/features/season/hooks/SeasonContext';
import { formatSeasonLabel } from '@/features/season/utils/seasonHelper';

interface PlayerStatLeaderProps {
  title: string;
  topStatLeaders: (TopStatLeader | undefined)[];
}

/**
 * A titled grid of stat-leader cards. Drops categories that haven't loaded
 * (undefined) and falls back to an EmptyState, naming the season, when none of
 * them are available.
 */
export default function PlayerStatLeaderRow({
  title,
  topStatLeaders,
}: PlayerStatLeaderProps) {
  const { season } = useSeason();
  const availableLeaders = topStatLeaders.filter(
    (leader): leader is TopStatLeader => Boolean(leader),
  );

  return (
    <div className={styles['stat-leader-row']}>
      <div className={styles['landing-header']}>
          <h2>{title}</h2>
      </div>
      {availableLeaders.length < 1 ? (
        <EmptyState
          message={`No ${title.toLowerCase()} available for ${formatSeasonLabel(season)}.`}
        />
      ) : (
        <div className={styles['row-scroller-wrapper']}>
          <div className={`${styles['row-scroller']} ds-grid`}>
            {availableLeaders.map((topStatLeader: TopStatLeader) => (
              <div
                className={styles['row-scroller-column']}
                key={topStatLeader.statIndicator}
              >
                <StatLeaderCard topStatLeader={topStatLeader} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
