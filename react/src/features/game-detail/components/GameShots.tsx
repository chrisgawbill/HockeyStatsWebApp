import { CSSProperties, useMemo } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { isCompletedGameState } from '@/lib/gameStatus';
import ErrorState from '@/components/ErrorState';
import shared from '@/styles/shared.module.css';
import styles from '@/features/game-detail/components/GameShots.module.css';
import GameFlowChart from '@/features/game-detail/components/GameFlowChart';
import ShotMap from '@/features/game-detail/components/ShotMap';
import { usePlayByPlay } from '@/features/game-detail/hooks/usePlayByPlay';
import { GameDetailStatus } from '@/features/game-detail/types/gameDetail';
import {
  buildFlowTimeline,
  getFlowEndSeconds,
  isPlayoffGame,
} from '@/features/game-detail/utils/gameFlowHelper';
import { pickMatchupChartColors } from '@/features/game-detail/utils/matchupChartColors';
import { listGamePeriods } from '@/features/game-detail/utils/shotMapHelper';

interface GameShotsProps {
  gameId: string;
  status: GameDetailStatus;
  homeTriCode: string;
  awayTriCode: string;
}

/**
 * Game flow and shot map for a started game, side by side on wide screens.
 * Shows nothing while loading or when the play-by-play route answers 404
 * (not deployed yet, or an unknown game); any other failure shows an inline
 * error with Try again. Team colors come from `pickMatchupChartColors`.
 */
function GameShots({
  gameId,
  status,
  homeTriCode,
  awayTriCode,
}: GameShotsProps) {
  const { theme } = useTheme();
  const { playByPlay, state, retry } = usePlayByPlay(gameId, status);

  const colorStyle = useMemo(() => {
    const colors = pickMatchupChartColors(homeTriCode, awayTriCode);
    return {
      '--shot-home': colors.home[theme],
      '--shot-away': colors.away[theme],
    } as CSSProperties;
  }, [homeTriCode, awayTriCode, theme]);

  const chartData = useMemo(() => {
    if (!playByPlay) return null;
    const events = playByPlay.events ?? [];
    const periods = listGamePeriods(events);
    const timeline = buildFlowTimeline(periods, isPlayoffGame(Number(gameId)));
    const isFinal =
      playByPlay.gameState != null &&
      isCompletedGameState(playByPlay.gameState);
    return {
      events,
      periods,
      timeline,
      endSeconds: getFlowEndSeconds(events, timeline, isFinal),
    };
  }, [playByPlay, gameId]);

  if (state === 'error') {
    return (
      <section className={shared.section} aria-labelledby="shots-error-heading">
        <h2 id="shots-error-heading" className={shared.sectionTitle}>
          Game flow and shot map
        </h2>
        <ErrorState message="Couldn't load the shot data." onRetry={retry} />
      </section>
    );
  }
  if (state !== 'ready' || !chartData) return null;

  return (
    <div className={styles['game-shots']} style={colorStyle}>
      <GameFlowChart
        events={chartData.events}
        timeline={chartData.timeline}
        endSeconds={chartData.endSeconds}
        homeTriCode={homeTriCode}
        awayTriCode={awayTriCode}
      />
      <ShotMap
        events={chartData.events}
        periods={chartData.periods}
        homeTriCode={homeTriCode}
        awayTriCode={awayTriCode}
      />
    </div>
  );
}

export default GameShots;
