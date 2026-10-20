import { Link } from 'react-router-dom';

import {
  TeamCardData,
  TeamFilter,
  formatNumber,
  getStatusLabel,
  getWinPct,
} from '@/features/teams/utils/teamListHelper';
import styles from '@/features/teams/components/TeamList.module.css';

/** One team's card on the team list: logo, record, points, win %, and goals per game. */
export default function TeamListCard({
  card,
  filter,
}: {
  card: TeamCardData;
  filter: TeamFilter;
}) {
  const { team, stats, standings, triCode } = card;
  const logoUrl = `https://assets.nhle.com/logos/nhl/svg/${triCode}_light.svg`;
  const winPct = getWinPct(stats);
  const statusLabel = getStatusLabel(card, filter);

  return (
    <Link
      to={`/team/${triCode}`}
      state={{ sourcePath: '/teamList', fallbackPath: '/teamList' }}
      className={styles['team-card']}
    >
      <div className={styles['team-card__top']}>
        <img
          className={styles['team-card__logo']}
          src={logoUrl}
          alt={team.teamName}
        />
        {statusLabel && (
          <span className={styles['team-card__status']}>{statusLabel}</span>
        )}
      </div>
      <p className={styles['team-card__name']}>{team.teamName}</p>
      <p className={styles['team-card__meta']}>
        {standings?.divisionName ?? 'NHL'} · {triCode}
      </p>
      {stats ? (
        <>
          <p className={styles['team-card__record']}>
            {stats.wins}-{stats.losses}-{stats.otLosses}
          </p>
          <div className={styles['team-card__metrics']}>
            <span>
              <strong className={styles['team-card__metrics-value']}>
                {stats.points}
              </strong>
              <span className={styles['team-card__metrics-label']}>PTS</span>
            </span>
            <span>
              <strong className={styles['team-card__metrics-value']}>
                {(winPct * 100).toFixed(1)}
              </strong>
              <span className={styles['team-card__metrics-label']}>WIN%</span>
            </span>
            <span>
              <strong className={styles['team-card__metrics-value']}>
                {formatNumber(stats.goalsPerGame, 2)}
              </strong>
              <span className={styles['team-card__metrics-label']}>GF/GP</span>
            </span>
          </div>
        </>
      ) : (
        <p className={styles['team-card__record']}>—</p>
      )}
    </Link>
  );
}
