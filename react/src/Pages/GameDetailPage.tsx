import React, { useEffect, useMemo, useState } from 'react';
import { GetGameDetails, GetGameLanding } from '../Services/apiHandler';
import {
  BoxscoreTeamStats,
  GameDetailBoxscore,
  GameLanding,
  LandingScoringPeriod,
} from '../Data/Models/gameDetail';
import { useTheme } from '@table-library/react-table-library/theme';
import { useParams } from 'react-router-dom';
import PageHeader from '../Components/PageHeader';
import HeroScoreboard from '../Components/GameDetail/HeroScoreboard';
import PeriodScoresTable from '../Components/GameDetail/PeriodScoresTable';
import ScoringSummary from '../Components/GameDetail/ScoringSummary';
import TeamComparison from '../Components/GameDetail/TeamComparison';
import ThreeStars from '../Components/GameDetail/ThreeStars';
import PlayerStatsSelection from '../Components/GameDetail/PlayerStatsSelection';
import { getTheme } from '../Services/themeHandler';
import shared from '../style/shared.module.css';
import styles from '../style/GameDetailPage.module.css';
import LoadingState from '../Components/LoadingState';

function getPeriodScores(
  scoring: LandingScoringPeriod[],
  homeAbbrev: string,
  awayAbbrev: string,
) {
  return scoring.map((period) => ({
    periodNum: period.periodDescriptor.number,
    periodType: period.periodDescriptor.periodType,
    homeGoals: period.goals.filter((g) => g.teamAbbrev.default === homeAbbrev)
      .length,
    awayGoals: period.goals.filter((g) => g.teamAbbrev.default === awayAbbrev)
      .length,
  }));
}

function computeTeamTotals(teamStats: BoxscoreTeamStats, teamSog: number) {
  const skaters = [...teamStats.forwards, ...teamStats.defense];
  return {
    sog: teamSog,
    hits: skaters.reduce((sum, p) => sum + p.hits, 0),
    blockedShots: skaters.reduce((sum, p) => sum + p.blockedShots, 0),
    pim: skaters.reduce((sum, p) => sum + p.pim, 0),
    powerPlayGoals: skaters.reduce((sum, p) => sum + p.powerPlayGoals, 0),
    giveaways: skaters.reduce((sum, p) => sum + p.giveaways, 0),
    takeaways: skaters.reduce((sum, p) => sum + p.takeaways, 0),
  };
}

const GameDetailPage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const theme = useTheme(getTheme());
  const [boxscore, setBoxscore] = useState<GameDetailBoxscore | null>(null);
  const [landing, setLanding] = useState<GameLanding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!gameId) return;
    Promise.all([
      GetGameDetails(Number(gameId)),
      GetGameLanding(Number(gameId)),
    ])
      .then(([boxData, landData]) => {
        setBoxscore(boxData);
        setLanding(landData);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [gameId]);

  const periodScores = useMemo(() => {
    if (!landing?.summary?.scoring || !boxscore) return [];
    return getPeriodScores(
      landing.summary.scoring,
      boxscore.homeTeam.abbrev,
      boxscore.awayTeam.abbrev,
    );
  }, [landing, boxscore]);

  const homeTotals = useMemo(() => {
    if (!boxscore?.playerByGameStats) return null;
    return computeTeamTotals(
      boxscore.playerByGameStats.homeTeam,
      boxscore.homeTeam.sog,
    );
  }, [boxscore]);

  const awayTotals = useMemo(() => {
    if (!boxscore?.playerByGameStats) return null;
    return computeTeamTotals(
      boxscore.playerByGameStats.awayTeam,
      boxscore.awayTeam.sog,
    );
  }, [boxscore]);

  if (loading)
    return (
      <div className={styles['game-detail-page']}>
        <PageHeader />
        <LoadingState label="Loading game" />
      </div>
    );
  if (error || !boxscore)
    return (
      <div className={styles['game-detail-page']}>
        <PageHeader />
        <div className={shared.errorState}>Game data unavailable.</div>
      </div>
    );

  const isFuture = boxscore.gameState === 'FUT' || boxscore.gameState === 'PRE';

  return (
    <div className={styles['game-detail-page']}>
      <PageHeader />
      <HeroScoreboard boxscore={boxscore} theme={theme} />
      {!isFuture && (
        <div className={styles['game-detail-page__content']}>
          {periodScores.length > 0 && (
            <PeriodScoresTable
              periodScores={periodScores}
              homeAbbrev={boxscore.homeTeam.abbrev}
              awayAbbrev={boxscore.awayTeam.abbrev}
            />
          )}
          {landing?.summary?.scoring && (
            <ScoringSummary scoring={landing.summary.scoring} />
          )}
          {(landing?.summary?.threeStars?.length ?? 0) > 0 && (
            <ThreeStars stars={landing!.summary.threeStars} />
          )}
          {homeTotals && awayTotals && (
            <TeamComparison
              homeTotals={homeTotals}
              awayTotals={awayTotals}
              homeAbbrev={boxscore.homeTeam.abbrev}
              awayAbbrev={boxscore.awayTeam.abbrev}
            />
          )}
          {boxscore.playerByGameStats && (
            <PlayerStatsSelection
              homeTeam={boxscore.playerByGameStats.homeTeam}
              awayTeam={boxscore.playerByGameStats.awayTeam}
              homeAbbrev={boxscore.homeTeam.abbrev}
              awayAbbrev={boxscore.awayTeam.abbrev}
            />
          )}
        </div>
      )}
    </div>
  );
};
export default GameDetailPage;
