import { useState } from 'react';
import {
  STAT_CATEGORIES,
  StatCategory,
  StatCategoryKey,
  PlayerStatLine,
  GoalieStatLine,
} from '@/features/teams/types/teamPageTypes';
import shared from '@/styles/shared.module.css';
import styles from '@/features/teams/components/TeamPage.module.css';

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const FALLBACK_HEADSHOT = 'https://assets.nhle.com/mugs/nhl/skater/default.png';

/**
 * Common leaderboard row shape for skaters and goalies. Goalies have no
 * `position` field, so their rows use a fixed 'G' position label.
 */
interface LeaderRow {
  id: number;
  name: string;
  positionLabel: string;
  gamesPlayed: number;
  value: number | null;
}

function getSkaterValue(
  player: PlayerStatLine,
  key: StatCategoryKey,
): number | null {
  switch (key) {
    case 'goals':
      return player.goals;
    case 'assists':
      return player.assists;
    case 'points':
      return player.points;
    case 'plusMinus':
      return player.plusMinus;
    case 'penaltyMinutes':
      return player.penaltyMinutes;
    case 'faceoffWinPct':
      return player.faceoffWinPct;
    case 'corsiPct':
      return player.corsiPct;
    default:
      return null;
  }
}

function getGoalieValue(
  goalie: GoalieStatLine,
  key: StatCategoryKey,
): number | null {
  switch (key) {
    case 'savePctg':
      return goalie.savePctg;
    case 'goalsAgainstAverage':
      return goalie.goalsAgainstAverage;
    default:
      return null;
  }
}

function sortAndSlice(rows: LeaderRow[], higherIsBetter: boolean): LeaderRow[] {
  return [...rows]
    .sort((a, b) => {
      const aVal = a.value ?? -Infinity;
      const bVal = b.value ?? -Infinity;
      return higherIsBetter ? bVal - aVal : aVal - bVal;
    })
    .slice(0, 10);
}

/**
 * Builds the top-10 leaderboard for the selected category. Skater and goalie
 * categories are backed by separate arrays with different shapes and
 * max-games-played values, which `requiresMinGames` depends on.
 */
function getTopTen(
  players: PlayerStatLine[],
  goalies: GoalieStatLine[],
  category: StatCategory,
): LeaderRow[] {
  if (category.source === 'goalie') {
    let eligible = goalies.filter(
      (g) => getGoalieValue(g, category.key) !== null,
    );

    if (category.requiresMinGames) {
      const maxGP = Math.max(...goalies.map((g) => g.gamesPlayed), 0);
      const minGP = Math.min(20, Math.round(maxGP * 0.25));
      eligible = eligible.filter((g) => g.gamesPlayed >= minGP);
    }

    const rows: LeaderRow[] = eligible.map((g) => ({
      id: g.goalieId,
      name: g.name,
      positionLabel: 'G',
      gamesPlayed: g.gamesPlayed,
      value: getGoalieValue(g, category.key),
    }));
    return sortAndSlice(rows, category.higherIsBetter);
  }

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

  const rows: LeaderRow[] = eligible.map((p) => ({
    id: p.playerId,
    name: p.name,
    positionLabel: p.position,
    gamesPlayed: p.gamesPlayed,
    value: getSkaterValue(p, category.key),
  }));
  return sortAndSlice(rows, category.higherIsBetter);
}

interface Props {
  players: PlayerStatLine[];
  goalies: GoalieStatLine[];
  headshotMap: Map<number, string>;
}

export default function PlayerStatsSection({
  players,
  goalies,
  headshotMap,
}: Props) {
  const [selectedKey, setSelectedKey] = useState<StatCategoryKey>('goals');

  const selectedCategory = STAT_CATEGORIES.find((c) => c.key === selectedKey)!;
  const topTen = getTopTen(players, goalies, selectedCategory);

  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>Player Stats</h2>

      <div className={styles['player-stat-categories']}>
        {STAT_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={cx(
              styles['player-stat-tab'],
              'ds-button',
              selectedKey === cat.key && styles.active,
            )}
            type="button"
            aria-pressed={selectedKey === cat.key}
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
        {topTen.map((row, index) => {
          const formatted =
            row.value !== null ? selectedCategory.format(row.value) : '—';
          return (
            <div
              key={`${row.id}-${index}`}
              className={styles['player-stat-row']}
            >
              <div className={styles['player-stat-row__leading']}>
                <span className={styles['player-stat-row__rank']}>
                  #{index + 1}
                </span>
                <img
                  className={styles['player-stat-row__headshot']}
                  src={headshotMap.get(row.id) || FALLBACK_HEADSHOT}
                  alt={row.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_HEADSHOT;
                  }}
                />
              </div>
              <div className={styles['player-stat-row__info']}>
                <span className={styles['player-stat-row__name']}>
                  {row.name}
                </span>
                <span className={styles['player-stat-row__pos']}>
                  {row.positionLabel} · {row.gamesPlayed} GP
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
