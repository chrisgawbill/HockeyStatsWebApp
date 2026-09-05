import { RosterPlayer } from '@/features/teams/types/teamPageTypes';
import shared from '@/styles/shared.module.css';
import styles from '@/features/teams/components/TeamPage.module.css';

interface PlayerCardProps {
  player: RosterPlayer;
}

const FALLBACK_HEADSHOT = 'https://assets.nhle.com/mugs/nhl/skater/default.png';

export default function PlayerCard({ player }: PlayerCardProps) {
  const headshotUrl = player.headshot || FALLBACK_HEADSHOT;

  return (
    <div
      className={`${styles['player-card']} ${shared.surface} ${shared.surfaceInteractive}`}
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
