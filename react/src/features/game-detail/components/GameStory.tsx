import React from 'react';
import {
  GameDetailBoxscore,
  TeamTotalsViewModel,
} from '@/features/game-detail/types/gameDetail';
import {
  GameStoryFacts,
  GameStoryScoringEvent,
  GameStoryTurningPoint,
} from '@/features/game-detail/utils/gameStoryHelper';
import { getTeamPrimaryColor } from '@/lib/teamColor';
import shared from '@/styles/shared.module.css';
import styles from '@/features/game-detail/components/GameDetailPage.module.css';

type GameStoryProps = {
  facts: GameStoryFacts;
  boxscore: GameDetailBoxscore;
  homeTotals: TeamTotalsViewModel | null;
  awayTotals: TeamTotalsViewModel | null;
};

/** Short period label: P1, P2, P3, OT, or SO. */
function periodLabel(periodNumber: number, periodType: string): string {
  if (periodType === 'OT') return 'OT';
  if (periodType === 'SO') return 'SO';
  return `P${periodNumber}`;
}

const TURNING_POINT_LABELS: Record<GameStoryTurningPoint['kind'], string> = {
  'first-lead': 'First goal',
  'largest-lead': 'Largest lead',
  'lead-change': 'Lead change',
  'tied-game': 'Tied up',
};

/** The score after a goal with the leader first: "PHI up 5–1", "Tied 1–1". */
function scoreAfterGoal(
  event: GameStoryScoringEvent,
  awayAbbrev: string,
  homeAbbrev: string,
): string {
  const { awayScore, homeScore } = event;
  if (awayScore === null || homeScore === null) return 'Score unavailable';
  if (awayScore === homeScore) return `Tied ${awayScore}–${homeScore}`;
  return awayScore > homeScore
    ? `${awayAbbrev} up ${awayScore}–${homeScore}`
    : `${homeAbbrev} up ${homeScore}–${awayScore}`;
}

/** Who scored and when: "M. Michkov · P1 12:49 · PP". */
function goalMoment(event: GameStoryScoringEvent): string {
  const badge =
    event.goalModifier === 'empty-net'
      ? 'EN'
      : event.strength === 'pp' || event.strength === 'sh'
        ? event.strength.toUpperCase()
        : null;
  return [
    event.scorer,
    `${periodLabel(event.periodNumber, event.periodType)} ${event.timeInPeriod}`.trim(),
    badge,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Plain-language recap of the game built from the scoring facts. */
function GameStory({
  facts,
  boxscore,
  homeTotals,
  awayTotals,
}: GameStoryProps) {
  const { awayTeam, homeTeam } = boxscore;
  const hasSupportingStats = homeTotals !== null && awayTotals !== null;

  return (
    <section className={`${styles['game-detail-section']} ds-section`}>
      <div className={styles['game-story-heading']}>
        <div>
          <p className="ds-overline-primary">The quick read</p>
          <h2 className="ds-section-title">Game Story</h2>
        </div>
        <p className={styles['game-story-description']}>
          Verified from the scoring feed and box score.
        </p>
      </div>

      {facts.turningPoints.length > 0 ? (
        <ul className={styles['game-story-turning-points']}>
          {facts.turningPoints.map((point) => {
            const event = facts.scoringEvents[point.eventIndex];
            if (!event) return null;
            return (
              <li
                className={`${styles['game-story-point']} ${shared.surfaceElevated}`}
                key={`${point.kind}-${point.eventIndex}`}
                style={
                  point.kind === 'tied-game'
                    ? undefined
                    : ({
                        '--story-team-color': getTeamPrimaryColor(
                          event.teamAbbrev,
                        ),
                      } as React.CSSProperties)
                }
              >
                <span className={styles['game-story-point__label']}>
                  {TURNING_POINT_LABELS[point.kind]}
                </span>
                <span className={styles['game-story-point__score']}>
                  {scoreAfterGoal(event, awayTeam.abbrev, homeTeam.abbrev)}
                </span>
                <span className={styles['game-story-point__detail']}>
                  {goalMoment(event)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        facts.scoringEvents.length === 0 && (
          <p className={`${styles['game-story-empty']} ${shared.surface}`}>
            Scoring details are not available for this game.
          </p>
        )
      )}

      {hasSupportingStats && (
        <div className={`${styles['game-story-stats']} ${shared.surface}`}>
          <span className={styles['game-story-stats__label']}>
            Helpful context
          </span>
          <span>
            Shots: {awayTeam.abbrev} {awayTotals!.sog}, {homeTeam.abbrev}{' '}
            {homeTotals!.sog}
          </span>
          {awayTotals!.powerPlayGoals != null &&
            homeTotals!.powerPlayGoals != null && (
              <span>
                Power-play goals: {awayTeam.abbrev} {awayTotals!.powerPlayGoals}
                , {homeTeam.abbrev} {homeTotals!.powerPlayGoals}
              </span>
            )}
        </div>
      )}
    </section>
  );
}

export default GameStory;
