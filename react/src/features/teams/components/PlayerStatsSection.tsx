import { useState } from 'react';
import {
  STAT_CATEGORIES,
  StatCategory,
  StatCategoryKey,
  PlayerStatLine,
  GoalieStatLine,
} from '@/features/teams/types/teamPageTypes';
import PlayerHeadshot from '@/features/favorite-players/components/PlayerHeadshot';
import shared from '@/styles/shared.module.css';
import styles from '@/features/teams/components/TeamPage.module.css';
import { joinClassNames } from '@/lib/joinClassNames';
import { DEFAULT_HEADSHOT_URL } from '@/lib/playerHeadshot';

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

/** A skater's value for the chosen leaderboard category. */
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

/** A goalie's value for the chosen leaderboard category. */
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

/** A leader's stat per game played, to two decimals ('—' with no games). */
function formatPerGame(row: LeaderRow): string {
  if (row.value === null || row.gamesPlayed === 0) return '—';
  return (row.value / row.gamesPlayed).toFixed(2);
}

/** Orders rows best-first (nulls last) and keeps the top few. */
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
      (goalie) => getGoalieValue(goalie, category.key) !== null,
    );

    if (category.requiresMinGames) {
      const maxGP = Math.max(...goalies.map((goalie) => goalie.gamesPlayed), 0);
      const minGP = Math.min(20, Math.round(maxGP * 0.25));
      eligible = eligible.filter((goalie) => goalie.gamesPlayed >= minGP);
    }

    const rows: LeaderRow[] = eligible.map((goalie) => ({
      id: goalie.goalieId,
      name: goalie.name,
      positionLabel: 'G',
      gamesPlayed: goalie.gamesPlayed,
      value: getGoalieValue(goalie, category.key),
    }));
    return sortAndSlice(rows, category.higherIsBetter);
  }

  let eligible =
    category.key === 'faceoffWinPct'
      ? players.filter(
          (player) =>
            player.faceoffWinPct !== null &&
            (player.position === 'C' ||
              player.position === 'LW' ||
              player.position === 'RW'),
        )
      : category.key === 'corsiPct'
        ? players.filter((player) => player.corsiPct !== null)
        : players;

  if (category.requiresMinGames) {
    const maxGP = Math.max(...players.map((player) => player.gamesPlayed), 0);
    const minGP = Math.min(20, Math.round(maxGP * 0.25));
    eligible = eligible.filter((player) => player.gamesPlayed >= minGP);
  }

  const rows: LeaderRow[] = eligible.map((player) => ({
    id: player.playerId,
    name: player.name,
    positionLabel: player.position,
    gamesPlayed: player.gamesPlayed,
    value: getSkaterValue(player, category.key),
  }));
  return sortAndSlice(rows, category.higherIsBetter);
}

interface Props {
  players: PlayerStatLine[];
  goalies: GoalieStatLine[];
  headshotMap: Map<number, string>;
}

/** Team leaders: pick a stat category and see the top players with headshots. */
export default function PlayerStatsSection({
  players,
  goalies,
  headshotMap,
}: Props) {
  const [selectedKey, setSelectedKey] = useState<StatCategoryKey>('goals');

  const selectedCategory = STAT_CATEGORIES.find(
    (statCategory) => statCategory.key === selectedKey,
  )!;
  const topTen = getTopTen(players, goalies, selectedCategory);

  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>Player Stats</h2>

      <div className={styles['player-stat-categories']}>
        {STAT_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={joinClassNames(
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
        {selectedCategory.showsPerGame && (
          <div className={styles['player-stat-header']} aria-hidden="true">
            <span className={styles['player-stat-header__value']}>
              {selectedCategory.shortLabel}
            </span>
            <span className={styles['player-stat-header__per-game']}>/GP</span>
          </div>
        )}
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
                <PlayerHeadshot
                  playerId={row.id}
                  playerName={row.name}
                  src={headshotMap.get(row.id) || DEFAULT_HEADSHOT_URL}
                  alt={row.name}
                  imgClassName={styles['player-stat-row__headshot']}
                  starSize="sm"
                  fallback={
                    <img
                      className={styles['player-stat-row__headshot']}
                      src={DEFAULT_HEADSHOT_URL}
                      alt={row.name}
                    />
                  }
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
              {selectedCategory.showsPerGame && (
                <span className={styles['player-stat-row__per-game']}>
                  {formatPerGame(row)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
