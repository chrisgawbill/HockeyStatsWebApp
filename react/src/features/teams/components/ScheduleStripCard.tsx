import React from 'react';
import { getTeamList } from '@/lib/teamListData';
import { useLeague } from '@/lib/LeagueContext';
import { ScheduledGame } from '@/features/schedule/types/scheduledGame';
import { hasScore } from '@/features/schedule/utils/gameStatusHelper';
import { isInProgressGameState } from '@/lib/gameStatus';
import shared from '@/styles/shared.module.css';
import styles from '@/features/teams/components/TeamPage.module.css';
import {
  formatGameDate,
  getTeamResultLabel,
} from '@/features/teams/utils/scheduleStripHelper';
import { joinClassNames } from '@/lib/joinClassNames';

interface ScheduleStripCardProps {
  game: ScheduledGame;
  index: number;
  teamAbbrev: string;
  onOpenGame: (game: ScheduledGame) => void;
}

/** One game card: opponent, score or date, home/away badge, and result or live tag. */
export default function ScheduleStripCard({
  game,
  index,
  teamAbbrev,
  onOpenGame,
}: ScheduleStripCardProps) {
  const { league } = useLeague();
  const isHome = game.homeTeam === teamAbbrev;
  const opponentTriCode = isHome ? game.awayTeam : game.homeTeam;
  const opponentLogo = isHome ? game.awayLogo : game.homeLogo;
  const opponent =
    getTeamList(league).find((team) => team.triCode === opponentTriCode)
      ?.fullName ?? opponentTriCode;
  const teamScore = isHome ? game.homeScore : game.awayScore;
  const opponentScore = isHome ? game.awayScore : game.homeScore;
  const resultLabel = getTeamResultLabel(game, teamAbbrev);
  const isLive = isInProgressGameState(game.gameState);

  return (
    <div
      className={joinClassNames(
        styles['schedule-strip__card'],
        shared.surface,
        shared.surfaceInteractive,
        styles['schedule-strip__card--clickable'],
      )}
      onClick={() => onOpenGame(game)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenGame(game);
        }
      }}
      role="button"
      tabIndex={0}
      style={{ '--card-index': index } as React.CSSProperties}
    >
      {game.isPlayoff && (
        <div className={styles['schedule-strip__playoff-badge']}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="16px"
            viewBox="0 -960 960 960"
            width="16px"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M280-120v-80h160v-124q-49-11-87.5-41.5T296-442q-75-9-125.5-65.5T120-640v-40q0-33 23.5-56.5T200-760h80v-80h400v80h80q33 0 56.5 23.5T840-680v40q0 76-50.5 132.5T664-442q-18 46-56.5 76.5T520-324v124h160v80H280Zm0-408v-152h-80v40q0 38 22 68.5t58 43.5Zm285 93q35-35 35-85v-240H360v240q0 50 35 85t85 35q50 0 85-35Zm115-93q36-13 58-43.5t22-68.5v-40h-80v152Zm-200-52Z" />
          </svg>
          <span>
            {game.playoffRound != null ? `R${game.playoffRound}` : 'Playoffs'}
            {game.seriesWins != null
              ? ` · ${game.seriesWins}`
              : game.playoffRound != null
                ? ' · Playoffs'
                : ''}
          </span>
        </div>
      )}
      <img
        className={styles['schedule-strip__logo']}
        src={opponentLogo}
        alt={opponent}
      />
      <p className={styles['schedule-strip__opponent']}>{opponent}</p>
      {hasScore(game) && teamScore != null && opponentScore != null ? (
        <p
          className={joinClassNames(
            styles['schedule-strip__score'],
            resultLabel &&
              (resultLabel.includes('W') ? styles.win : styles.loss),
          )}
        >
          {teamScore} – {opponentScore}
        </p>
      ) : (
        <p className={styles['schedule-strip__date']}>
          {formatGameDate(game.date)}
        </p>
      )}
      <div className={styles['schedule-strip__footer']}>
        <span
          className={joinClassNames(
            styles['schedule-strip__badge'],
            isHome ? styles.home : styles.away,
          )}
        >
          {isHome ? 'Home' : 'Away'}
        </span>
        {resultLabel && (
          <span
            className={joinClassNames(
              styles['schedule-strip__result'],
              resultLabel.includes('W') ? styles.win : styles.loss,
            )}
          >
            {resultLabel}
          </span>
        )}
        {isLive && (
          <span
            className={joinClassNames(
              styles['schedule-strip__result'],
              styles.live,
            )}
          >
            Live
          </span>
        )}
      </div>
    </div>
  );
}
