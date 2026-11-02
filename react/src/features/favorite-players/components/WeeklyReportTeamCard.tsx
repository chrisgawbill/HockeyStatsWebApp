import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import TeamFormPanel from '@/components/TeamFormPanel';
import TeamLogo from '@/components/TeamLogo';
import { joinClassNames } from '@/lib/joinClassNames';
import { withLeagueQuery, type League } from '@/lib/league';
import { getTeamAccentColor } from '@/lib/teamColor';
import { useTheme } from '@/lib/ThemeContext';
import type {
  WeeklyReportTeam,
  WeeklyReportTeamGame,
} from '@/features/favorite-players/types/favoritePlayers';
import {
  buildReportTeamForm,
  formatGameDay,
  formatOpponent,
  formatTeamScore,
  formatWeekRecord,
} from '@/features/favorite-players/utils/weeklyReportTeams';
import { reportEntryLeague } from '@/features/favorite-players/utils/weeklyReportFormat';
import shared from '@/styles/shared.module.css';
import styles from '@/features/favorite-players/components/WeeklyReportTeamCard.module.css';

/** One of the week's games: day, opponent, score and W/L/OTL, linking to the game. */
function WeekGameRow({
  game,
  league,
}: {
  game: WeeklyReportTeamGame;
  league: League;
}) {
  return (
    <li>
      <Link
        className={styles.weekGame}
        to={withLeagueQuery(`/game/${game.gameId}`, league)}
      >
        <span className={styles.gameDay}>{formatGameDay(game.date)}</span>
        <span className={styles.opponent}>{formatOpponent(game)}</span>
        <span className={styles.score}>{formatTeamScore(game)}</span>
        <span
          className={joinClassNames(
            styles.outcome,
            styles[`outcome--${game.outcome.toLowerCase()}`],
          )}
        >
          {game.outcome}
        </span>
      </Link>
    </li>
  );
}

/**
 * A favorite team in the Weekly Player Report: logo and name, the week's
 * results, and its Team Form as of the week's end, in the team's color.
 */
export default function WeeklyReportTeamCard({
  team,
}: {
  team: WeeklyReportTeam;
}) {
  const { theme } = useTheme();
  const teamForm = useMemo(() => buildReportTeamForm(team), [team]);
  const league = reportEntryLeague(team);
  // An AHL and an NHL team can share a tri-code, so AHL ids name the league.
  const idSuffix = league === 'ahl' ? `ahl-${team.triCode}` : team.triCode;
  const nameId = `weekly-team-${idSuffix}`;
  const hasGames = team.weekGames.length > 0;
  const weekText = hasGames
    ? `${formatWeekRecord(team.weekGames)} this week`
    : 'No games this week';
  const teamColorStyle = {
    '--color-primary': getTeamAccentColor(team.triCode, theme, league),
  } as React.CSSProperties;

  return (
    <li
      className={styles.teamCard}
      style={teamColorStyle}
      aria-labelledby={nameId}
    >
      <div className={joinClassNames(styles.week, shared.surface)}>
        <div className={styles.teamHeader}>
          <TeamLogo
            triCode={team.triCode}
            league={league}
            className={styles.logo}
          />
          <div>
            <h3 id={nameId} className={styles.teamName}>
              {team.name}
            </h3>
            <p className={hasGames ? styles.weekRecord : styles.noGames}>
              {league === 'ahl' ? `AHL · ${weekText}` : weekText}
            </p>
          </div>
        </div>
        {hasGames && (
          <ul
            className={styles.weekGames}
            aria-label={`${team.name} results this week`}
          >
            {team.weekGames.map((game) => (
              <WeekGameRow key={game.gameId} game={game} league={league} />
            ))}
          </ul>
        )}
      </div>
      <TeamFormPanel
        teamForm={teamForm}
        headingId={`team-form-${idSuffix}`}
        headingLevel={4}
        className={styles.form}
      />
    </li>
  );
}
