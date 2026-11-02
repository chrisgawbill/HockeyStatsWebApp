import React, { useState } from 'react';
import { LandingThreeStar } from '@/features/game-detail/types/gameDetail';
import { getTeamPrimaryColor } from '@/lib/teamColor';
import PlayerHeadshot from '@/features/favorite-players/components/PlayerHeadshot';
import FavoritePlayerStatsDialog from '@/features/favorite-players/components/FavoritePlayerStatsDialog';
import { useLeague } from '@/lib/LeagueContext';
import shared from '@/styles/shared.module.css';
import styles from '@/features/game-detail/components/GameDetailPage.module.css';

type ThreeStarsProps = {
  stars: LandingThreeStar[];
};

const STAR_LABELS = ['1st Star', '2nd Star', '3rd Star'];

/** One-line stat summary for a star. */
function formatStatLine(star: LandingThreeStar): string {
  if (star.position === 'G') {
    const gaa = star.goalsAgainstAverage?.toFixed(2) ?? '—';
    const svPct =
      star.savePctg != null ? (star.savePctg * 100).toFixed(1) + '%' : '—';
    return `${svPct} SV%  ·  ${gaa} GAA`;
  }
  const goals = star.goals ?? 0;
  const assists = star.assists ?? 0;
  const points = star.points ?? 0;
  return `${goals}G  ${assists}A  ${points}P`;
}

/** The game's three stars with headshots and stat lines; a card opens the star's season stats. */
function ThreeStars({ stars }: ThreeStarsProps) {
  const { league } = useLeague();
  const [selectedStar, setSelectedStar] = useState<LandingThreeStar | null>(
    null,
  );
  return (
    <section className={`${styles['game-detail-section']} ds-section`}>
      <h2 className="ds-section-title">Three Stars</h2>
      <div className={styles['three-stars-row']}>
        {stars.map((star) => (
          <div
            key={star.playerId}
            className={`${styles['three-star-card']} ${shared.surface} ${shared.surfaceInteractive}`}
            style={
              {
                '--star-team-color': getTeamPrimaryColor(star.teamAbbrev),
              } as React.CSSProperties
            }
          >
            <div className={styles['three-star-card__badge']}>{star.star}</div>
            <PlayerHeadshot
              playerId={star.playerId}
              playerName={star.name.default}
              src={star.headshot}
              alt={star.name.default}
              imgClassName={styles['three-star-card__headshot']}
            />
            <div className={styles['three-star-card__info']}>
              <button
                type="button"
                className={`${styles['three-star-card__name']} ${styles['player-stats-button']}`}
                onClick={() => setSelectedStar(star)}
                aria-haspopup="dialog"
              >
                {star.name.default}
              </button>
              <span className={styles['three-star-card__meta']}>
                {star.teamAbbrev} · {star.position}
              </span>
              <span className={styles['three-star-card__stats']}>
                {formatStatLine(star)}
              </span>
              <span className="ds-overline">{STAR_LABELS[star.star - 1]}</span>
            </div>
          </div>
        ))}
      </div>
      {selectedStar && (
        <FavoritePlayerStatsDialog
          player={{
            league,
            playerId: selectedStar.playerId,
            name: selectedStar.name.default,
            teamTriCode: selectedStar.teamAbbrev,
            position: selectedStar.position,
            headshot: selectedStar.headshot,
          }}
          onClose={() => setSelectedStar(null)}
        />
      )}
    </section>
  );
}

export default ThreeStars;
