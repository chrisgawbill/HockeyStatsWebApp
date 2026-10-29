import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import PageIntro from '@/components/PageIntro';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import LoadingState from '@/components/LoadingState';
import { ApiError } from '@/lib/apiClient';
import { useAuth } from '@/lib/auth/AuthContext';
import { fetchWeeklyReport } from '@/features/favorite-players/api/favoritePlayersApi';
import { useFavoritePlayers } from '@/features/favorite-players/hooks/FavoritePlayersContext';
import PlayerHeadshot from '@/features/favorite-players/components/PlayerHeadshot';
import WeeklyReportTeamCard from '@/features/favorite-players/components/WeeklyReportTeamCard';
import type {
  WeeklyPlayerReport,
  WeeklyReportPlayer,
} from '@/features/favorite-players/types/favoritePlayers';
import {
  didNotPlayText,
  isWeekStart,
  MAX_FAVORITE_PLAYERS,
  playerStatItems,
  teamsLabel,
} from '@/features/favorite-players/utils/weeklyReportFormat';
import { listReportTeams } from '@/features/favorite-players/utils/weeklyReportTeams';
import { getInitials } from '@/features/favorite-players/utils/playerCardFormat';
import shared from '@/styles/shared.module.css';
import styles from '@/features/favorite-players/components/WeeklyReportPage.module.css';

function PlayerCard({ player }: { player: WeeklyReportPlayer }) {
  const items = playerStatItems(player);
  const bestGame =
    player.type === 'skater' ? (player.stats?.bestGame ?? null) : null;
  return (
    <li className={`${styles.card} ${shared.surface}`}>
      <PlayerHeadshot
        playerId={player.playerId}
        playerName={player.name}
        src={player.headshot}
        className={styles.avatar}
        imgClassName={styles.avatarImg}
        fallback={
          <span className={styles.avatarInitials} aria-hidden="true">
            {getInitials(player.name)}
          </span>
        }
      />
      <div className={styles.cardBody}>
        <h3 className={styles.playerName}>{player.name}</h3>
        <p className={styles.playerMeta}>
          {[teamsLabel(player), player.position].filter(Boolean).join(' · ')}
        </p>
        {player.played && items.length > 0 ? (
          <>
            <ul className={styles.stats} aria-label="Week stats">
              {items.map((item) => (
                <li key={item} className={styles.stat}>
                  {item}
                </li>
              ))}
            </ul>
            {bestGame && (
              <p className={styles.bestGame}>
                Best game:{' '}
                <Link to={`/game/${bestGame.gameId}`}>{bestGame.text}</Link>
              </p>
            )}
          </>
        ) : (
          <p className={styles.didNotPlay}>{didNotPlayText(player)}</p>
        )}
      </div>
    </li>
  );
}

/** The report's favorite teams in fan-tier order; nothing when it has none. */
function ReportTeamsSection({ report }: { report: WeeklyPlayerReport }) {
  const teams = listReportTeams(report);
  if (teams.length === 0) return null;

  return (
    <section className={styles.teamSection} aria-labelledby="report-teams">
      <h2 id="report-teams" className={shared.sectionTitle}>
        Favorite teams
      </h2>
      <ul className={styles.teamCards}>
        {teams.map((team) => (
          <WeeklyReportTeamCard key={team.triCode} team={team} />
        ))}
      </ul>
    </section>
  );
}

function FavoritePlayersList() {
  const { favorites, toggleFavorite } = useFavoritePlayers();
  const [failed, setFailed] = useState<string | null>(null);

  return (
    <section className={shared.section} aria-labelledby="favorite-players">
      <h2 id="favorite-players" className={shared.sectionTitle}>
        Favorite players ({favorites.length}/{MAX_FAVORITE_PLAYERS})
      </h2>
      {favorites.length === 0 ? (
        <p className={styles.note}>
          Tap the ☆ on a player&apos;s headshot (team pages, Three Stars, stat
          leaders) to add them to your Weekly Player Report.
        </p>
      ) : (
        <ul className={`${styles.favorites} ${shared.surface}`}>
          {favorites.map((favorite) => (
            <li
              key={`${favorite.league}-${favorite.playerId}`}
              className={styles.favoriteRow}
            >
              <span className={styles.favoriteName}>{favorite.name}</span>
              <span className={styles.favoriteTeam}>
                {[
                  favorite.league === 'ahl' && 'AHL',
                  favorite.teamTriCode,
                  favorite.position,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
              <button
                type="button"
                className={styles.unstar}
                aria-label={`Unfavorite ${favorite.name}`}
                onClick={() => {
                  setFailed(null);
                  toggleFavorite(
                    favorite.playerId,
                    favorite.league,
                    favorite.name,
                  ).catch(() => setFailed(favorite.name));
                }}
              >
                <span aria-hidden="true">★</span> Unstar
              </button>
            </li>
          ))}
        </ul>
      )}
      {failed && (
        <p className={styles.note} role="alert">
          Couldn&apos;t remove {failed}. Try again.
        </p>
      )}
    </section>
  );
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; report: WeeklyPlayerReport }
  | { status: 'missing' }
  | { status: 'error' };

/**
 * One week's frozen Weekly Player Report (`/weekly-report/:weekStart`), or the
 * newest one (`/weekly-report`). Opening it marks it read. The favorite
 * teams' week follows the players; the user's favorite players, with unstar
 * buttons, sit underneath.
 */
export default function WeeklyReportPage() {
  const { weekStart } = useParams();
  const { token } = useAuth();
  const { available, reports, markReportRead } = useFavoritePlayers();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const target = weekStart ?? reports[0]?.weekStart ?? null;

  useEffect(() => {
    if (!token) return;
    if (!target) {
      setState({ status: 'missing' });
      return;
    }
    if (!isWeekStart(target)) {
      setState({ status: 'missing' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    fetchWeeklyReport(token, target)
      .then((report) => {
        if (cancelled) return;
        setState({ status: 'ready', report });
        if (!report.read) markReportRead(target);
      })
      .catch((error) => {
        if (cancelled) return;
        setState(
          error instanceof ApiError && error.status === 404
            ? { status: 'missing' }
            : { status: 'error' },
        );
      });
    return () => {
      cancelled = true;
    };
  }, [token, target, attempt, markReportRead]);

  const report = state.status === 'ready' ? state.report : null;
  const others = reports.filter((r) => r.weekStart !== report?.weekStart);

  let content;
  if (!token) {
    content = (
      <EmptyState
        title="Weekly Player Report"
        message="Sign in with Google at the top of the page, then star players to get a report on their week every Monday morning."
      />
    );
  } else if (!available) {
    content = (
      <EmptyState
        title="Weekly Player Report"
        message="Weekly Player Reports aren't available yet. Check back soon."
      />
    );
  } else if (state.status === 'loading') {
    content = <LoadingState label="Loading Weekly Player Report" />;
  } else if (state.status === 'error') {
    content = (
      <ErrorState
        title="Couldn't load this report"
        message="The report service may be waking up."
        onRetry={() => setAttempt((n) => n + 1)}
      />
    );
  } else if (state.status === 'missing' || !report) {
    content = (
      <EmptyState
        title="No report yet"
        message={
          weekStart
            ? 'There is no Weekly Player Report for that week.'
            : 'Your first Weekly Player Report arrives Monday morning after your favorite players take the ice. League breaks are skipped.'
        }
      />
    );
  } else {
    content = (
      <>
        <PageIntro
          kicker="Weekly Player Report"
          title={report.label}
          description={report.headline}
        />
        <ul className={styles.cards}>
          {report.players.map((player) => (
            <PlayerCard key={player.playerId} player={player} />
          ))}
        </ul>
        <ReportTeamsSection report={report} />
      </>
    );
  }

  return (
    <>
      <PageHeader />
      <main className={`${styles.page} ds-page-shell ds-container`}>
        {!report && (
          <h1 className="ds-visually-hidden">Weekly Player Report</h1>
        )}
        <section className={shared.section}>{content}</section>
        {token && available && others.length > 0 && (
          <nav className={shared.section} aria-label="Earlier reports">
            <h2 className={shared.sectionTitle}>Other weeks</h2>
            <ul className={styles.weeks}>
              {others.map((other) => (
                <li key={other.weekStart}>
                  <Link
                    className={styles.weekLink}
                    to={`/weekly-report/${other.weekStart}`}
                  >
                    {other.label}
                    {!other.read && (
                      <span className={styles.unreadDot} aria-label="Unread" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        {token && available && <FavoritePlayersList />}
      </main>
    </>
  );
}
