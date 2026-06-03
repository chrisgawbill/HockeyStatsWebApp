import React, { useState } from 'react';
import {
  STAT_CATEGORIES,
  StatCategory,
  StatCategoryKey,
  PlayerStatLine,
} from '../../Data/LocalData/teamPageMockData';
import shared from '../../style/shared.module.css';
import styles from '../../style/TeamPage/TeamPage.module.css';

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const FALLBACK_HEADSHOT = 'https://assets.nhle.com/mugs/nhl/skater/default.png';

function getTopTen(
  players: PlayerStatLine[],
  category: StatCategory,
): PlayerStatLine[] {
  let eligible =
    category.key === 'faceoffWinPct'
      ? players.filter(
          (p) =>
            p.faceoffWinPct !== null &&
            (p.position === 'C' || p.position === 'LW' || p.position === 'RW'),
        )
      : category.key === 'corsiPct'
        ? players.filter((p) => p.corsiPct !== null)
        : players;

  if (category.requiresMinGames) {
    const maxGP = Math.max(...players.map((p) => p.gamesPlayed), 0);
    const minGP = Math.min(20, Math.round(maxGP * 0.25));
    eligible = eligible.filter((p) => p.gamesPlayed >= minGP);
  }

  return [...eligible]
    .sort((a, b) => {
      const aVal = a[category.key] ?? -Infinity;
      const bVal = b[category.key] ?? -Infinity;
      return category.higherIsBetter
        ? (bVal as number) - (aVal as number)
        : (aVal as number) - (bVal as number);
    })
    .slice(0, 10);
}

interface Props {
  players: PlayerStatLine[];
  headshotMap: Map<number, string>;
}

export default function PlayerStatsSection({ players, headshotMap }: Props) {
  const [selectedKey, setSelectedKey] = useState<StatCategoryKey>('goals');

  const selectedCategory = STAT_CATEGORIES.find((c) => c.key === selectedKey)!;
  const topTen = getTopTen(players, selectedCategory);

  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>Player Stats</h2>

      <div className={styles['player-stat-categories']}>
        {STAT_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={cx(
              styles['player-stat-tab'],
              selectedKey === cat.key && styles.active,
            )}
            onClick={() => setSelectedKey(cat.key)}
          >
            {cat.shortLabel}
          </button>
        ))}
      </div>

      <div
        className={`${styles['player-stat-leaderboard']} ${shared.surface} ${shared.surfaceClip}`}
      >
        <p className={styles['player-stat-leaderboard__title']}>
          {selectedCategory.label} Leaders
        </p>
        {topTen.map((player, index) => {
          const val = player[selectedKey];
          const formatted =
            val !== null ? selectedCategory.format(val as number) : '—';
          return (
            <div
              key={`${player.playerId}-${index}`}
              className={styles['player-stat-row']}
            >
              <div className={styles['player-stat-row__leading']}>
                <span className={styles['player-stat-row__rank']}>
                  #{index + 1}
                </span>
                <img
                  className={styles['player-stat-row__headshot']}
                  src={headshotMap.get(player.playerId) || FALLBACK_HEADSHOT}
                  alt={player.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_HEADSHOT;
                  }}
                />
              </div>
              <div className={styles['player-stat-row__info']}>
                <span className={styles['player-stat-row__name']}>
                  {player.name}
                </span>
                <span className={styles['player-stat-row__pos']}>
                  {player.position} · {player.gamesPlayed} GP
                </span>
              </div>
              <span className={styles['player-stat-row__value']}>
                {formatted}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
