import { RosterPlayer } from '@/features/teams/types/teamPageTypes';
import shared from '@/styles/shared.module.css';
import styles from '@/features/teams/components/TeamPage.module.css';

interface PlayerCardProps {
  player: RosterPlayer;
  /**
   * "card" (default): the standalone elevated card used in flat roster
   * grids. "slot": just the headshot/number/name/stat content with no
   * surface/border/shadow of its own, for when a parent container (e.g.
   * RosterLineRow) already provides the elevated surface — avoids nesting
   * two lifted surfaces inside each other.
   */
  variant?: 'card' | 'slot';
}

const FALLBACK_HEADSHOT = 'https://assets.nhle.com/mugs/nhl/skater/default.png';

export default function PlayerCard({ player, variant = 'card' }: PlayerCardProps) {
  const headshotUrl = player.headshot || FALLBACK_HEADSHOT;

  return (
    <div
      className={
        variant === 'card'
          ? `${styles['player-card']} ${shared.surfaceElevated} ${shared.surfaceInteractive}`
          : `${styles['player-card']} ${styles['player-card--slot']}`
      }
    >
      <div className={styles['player-card__img-wrap']}>
        <img
          className={styles['player-card__headshot']}
          src={headshotUrl}
          alt={player.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_HEADSHOT;
          }}
        />
        <span className={styles['player-card__number']}>#{player.number}</span>
      </div>
      <p className={styles['player-card__name']}>{player.name}</p>
      <p className={styles['player-card__stat']}>{player.stat}</p>
    </div>
  );
}
