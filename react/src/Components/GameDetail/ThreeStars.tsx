import React from 'react';
import { LandingThreeStar } from '../../Data/Models/gameDetail';
import { getTeamPrimaryColor } from '../../Data/Helpers/teamColor';
import shared from '../../Style/shared.module.css';
import styles from '../../Style/GameDetailPage.module.css';

type ThreeStarsProps = {
  stars: LandingThreeStar[];
};

const STAR_LABELS = ['1st Star', '2nd Star', '3rd Star'];

function formatStatLine(star: LandingThreeStar): string {
  if (star.position === 'G') {
    const gaa = star.goalsAgainstAverage?.toFixed(2) ?? '—';
    const svPct =
      star.savePctg != null ? (star.savePctg * 100).toFixed(1) + '%' : '—';
    return `${svPct} SV%  ·  ${gaa} GAA`;
  }
  const g = star.goals ?? 0;
  const a = star.assists ?? 0;
  const p = star.points ?? 0;
  return `${g}G  ${a}A  ${p}P`;
}

function ThreeStars({ stars }: ThreeStarsProps) {
  return (
    <section className={`${styles['game-detail-section']} ${shared.section}`}>
      <h2 className={shared.sectionTitle}>Three Stars</h2>
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
            <img
              className={styles['three-star-card__headshot']}
              src={star.headshot}
              alt={star.name.default}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className={styles['three-star-card__info']}>
              <span className={styles['three-star-card__name']}>
                {star.name.default}
              </span>
              <span className={styles['three-star-card__meta']}>
                {star.teamAbbrev} · {star.position}
              </span>
              <span className={styles['three-star-card__stats']}>
                {formatStatLine(star)}
              </span>
              <span className={styles['three-star-card__label']}>
                {STAR_LABELS[star.star - 1]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ThreeStars;
