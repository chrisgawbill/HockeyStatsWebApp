import React from 'react';
import {
  GameDetailBoxscore,
  TeamTotalsViewModel,
} from '@/features/game-detail/types/gameDetail';
import {
  GameStoryFacts,
  GameStoryTurningPoint,
} from '@/features/game-detail/utils/gameStoryHelper';
import { getTeamPrimaryColor } from '@/features/teams/utils/teamColor';
import shared from '@/styles/shared.module.css';
import styles from '@/features/game-detail/components/GameDetailPage.module.css';

type GameStoryProps = {
  facts: GameStoryFacts;
  boxscore: GameDetailBoxscore;
  homeTotals: TeamTotalsViewModel | null;
  awayTotals: TeamTotalsViewModel | null;
};

function periodLabel(periodNumber: number, periodType: string): string {
  if (periodType === 'OT') return 'OT';
  if (periodType === 'SO') return 'SO';
  return `P${periodNumber}`;
}

function scoreLabel(
  awayScore: number | null,
  homeScore: number | null,
): string {
  if (awayScore === null || homeScore === null) return 'Score unavailable';
  return `${awayScore}–${homeScore}`;
}

function turningPointText(
  point: GameStoryTurningPoint,
  facts: GameStoryFacts,
  awayAbbrev: string,
  homeAbbrev: string,
): string {
  const event = facts.scoringEvents[point.eventIndex];
  if (!event) return '';

  const score = scoreLabel(event.awayScore, event.homeScore);
  if (point.kind === 'first-lead') {
    return `${event.teamAbbrev} took the first lead, ${score}.`;
  }
  if (point.kind === 'largest-lead') {
    return `${event.teamAbbrev} built the largest lead: ${event.scoreDifference} goals, ${score}.`;
  }
  if (point.kind === 'lead-change') {
    return `The lead changed to ${event.teamAbbrev}, ${score}.`;
  }
  if (event.gameState === 'tied') {
    return `The game was tied at ${score}.`;
  }
  return `${awayAbbrev} and ${homeAbbrev} were level at ${score}.`;
}

function GameStory({
  facts,
  boxscore,
  homeTotals,
  awayTotals,
}: GameStoryProps) {
  const { awayTeam, homeTeam } = boxscore;
  const hasSupportingStats = homeTotals !== null && awayTotals !== null;

  return (
    <section className={`${styles['game-detail-section']} ${shared.section}`}>
      <div className={styles['game-story-heading']}>
        <div>
          <p className={styles['game-story-eyebrow']}>The quick read</p>
          <h2 className={shared.sectionTitle}>Game Story</h2>
        </div>
        <p className={styles['game-story-description']}>
          Verified from the scoring feed and box score.
        </p>
      </div>

      {facts.turningPoints.length > 0 && (
        <div className={styles['game-story-turning-points']}>
          {facts.turningPoints.map((point) => (
            <p
              className={`${styles['game-story-point']} ${shared.surfaceElevated}`}
              key={`${point.kind}-${point.eventIndex}`}
            >
              {turningPointText(point, facts, awayTeam.abbrev, homeTeam.abbrev)}
            </p>
          ))}
        </div>
      )}

      {facts.scoringEvents.length > 0 ? (
        <div
          className={`${styles['game-story-timeline']} ${shared.surface} ${shared.surfaceClip}`}
          role="region"
          aria-label="Scoring timeline"
        >
          <div
            className={styles['game-story-timeline__line']}
            aria-hidden="true"
          />
          {facts.scoringEvents.map((event) => (
            <div
              className={styles['game-story-event']}
              key={event.eventIndex}
              style={
                {
                  '--story-team-color': getTeamPrimaryColor(event.teamAbbrev),
                } as React.CSSProperties
              }
            >
              <div
                className={styles['game-story-event__marker']}
                aria-hidden="true"
              />
              <div className={styles['game-story-event__content']}>
                <div className={styles['game-story-event__meta']}>
                  <span>
                    {periodLabel(event.periodNumber, event.periodType)}
                  </span>
                  <span>{event.timeInPeriod}</span>
                  {event.strength !== 'ev' && (
                    <span
                      className={`${shared.chip} ${styles['game-story-event__badge']}`}
                    >
                      {event.goalModifier === 'empty-net'
                        ? 'EN'
                        : event.strength.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className={styles['game-story-event__title']}>
                  <strong>{event.teamAbbrev}</strong> — {event.scorer}
                </p>
                <p className={styles['game-story-event__detail']}>
                  {event.gameState === 'tied'
                    ? 'Game tied'
                    : event.gameState === 'away-lead'
                      ? `${awayTeam.abbrev} led`
                      : event.gameState === 'home-lead'
                        ? `${homeTeam.abbrev} led`
                        : 'Score after goal'}{' '}
                  <span
                    aria-label={`Score ${scoreLabel(event.awayScore, event.homeScore)}`}
                  >
                    {scoreLabel(event.awayScore, event.homeScore)}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={`${styles['game-story-empty']} ${shared.surface}`}>
          Scoring details are not available for this game.
        </p>
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
          <span>
            Power-play goals: {awayTeam.abbrev} {awayTotals!.powerPlayGoals},{' '}
            {homeTeam.abbrev} {homeTotals!.powerPlayGoals}
          </span>
        </div>
      )}
    </section>
  );
}

export default GameStory;
