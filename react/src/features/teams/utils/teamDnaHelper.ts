import { TeamStatsContract } from '@/features/teams/types/teamPageTypes';
import { TeamResult, TeamSplit } from '@/features/teams/utils/teamFormHelper';

export interface TeamDnaMetric {
  key: string;
  label: string;
  value: string;
  normalized: number;
  description: string;
}

export interface TeamDnaInput {
  stats: TeamStatsContract;
  results: TeamResult[];
  recent: TeamResult[];
  splits: { home: TeamSplit; road: TeamSplit };
}

function pointsPercentage(results: TeamResult[]): number | null {
  if (results.length === 0) return null;
  const points = results.reduce(
    (total, result) => total + (result.won ? 2 : result.otl ? 1 : 0),
    0,
  );
  return points / (results.length * 2);
}

function signed(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}`;
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function boundedScale(value: number, min: number, max: number): number {
  return Math.round(
    ((Math.max(min, Math.min(max, value)) - min) / (max - min)) * 100,
  );
}

/**
 * Builds the Team DNA profile from the already-loaded Team page data.
 * Percentages use their natural 0–100 scale; goal differential uses -3 to +3
 * goals/game and scoring environment uses 3 to 9 goals/game. Those bounded
 * ranges make the bars comparable while the displayed value remains raw.
 */
export function buildTeamDna({
  stats,
  results,
  recent,
  splits,
}: TeamDnaInput): TeamDnaMetric[] {
  const metrics: TeamDnaMetric[] = [];
  const seasonPct = pointsPercentage(results);
  const recentPct = pointsPercentage(recent);

  if (seasonPct != null) {
    metrics.push({
      key: 'season-points',
      label: 'Season Performance',
      value: percent(seasonPct),
      normalized: Math.round(seasonPct * 100),
      description: 'Share of available standings points earned this season.',
    });
  }

  if (results.length > 0) {
    const goalDiff = results.reduce(
      (total, result) => total + result.gf - result.ga,
      0,
    );
    const goalDiffPerGame = goalDiff / results.length;
    metrics.push({
      key: 'goal-differential',
      label: 'Goal Margin Per Game',
      value: signed(goalDiffPerGame),
      normalized: boundedScale(goalDiffPerGame, -3, 3),
      description: 'Average scoring margin per completed game.',
    });
  }

  if (stats.goalsForPerGame != null && stats.goalsAgainstPerGame != null) {
    const environment = stats.goalsForPerGame + stats.goalsAgainstPerGame;
    metrics.push({
      key: 'scoring-environment',
      label: 'Game Scoring',
      value: `${environment.toFixed(2)} goals/game`,
      normalized: boundedScale(environment, 3, 9),
      description: 'Average combined goals scored and allowed per game.',
    });
  }

  for (const [key, label, split] of [
    ['home-points', 'Home Performance', splits.home],
    ['road-points', 'Road Performance', splits.road],
  ] as const) {
    const splitPct = pointsPercentage(
      results.filter((result) => result.home === (split === splits.home)),
    );
    if (split.games > 0 && splitPct != null) {
      metrics.push({
        key,
        label,
        value: percent(splitPct),
        normalized: Math.round(splitPct * 100),
        description: `${split.games} games · points percentage in this split.`,
      });
    }
  }

  if (recentPct != null) {
    metrics.push({
      key: 'recent-points',
      label: `Recent Form · Last ${recent.length}`,
      value: percent(recentPct),
      normalized: Math.round(recentPct * 100),
      description: 'Points percentage across the most recent completed games.',
    });
  }

  return metrics;
}
