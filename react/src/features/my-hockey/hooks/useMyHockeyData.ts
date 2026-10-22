import { useEffect, useRef, useState } from 'react';
import { localTeamList } from '@/lib/teamListData';
import type { FavoritePlayer } from '@/features/favorite-players/types/favoritePlayers';
import {
  fetchGameBoxscore,
  fetchGoalieSeasonTotals,
  fetchSkaterSeasonTotals,
  fetchTeamGames,
} from '@/features/my-hockey/api/myHockeyApi';
import {
  applyBoxscores,
  listGamesToRecheck,
  selectLatestPlayedGame,
} from '@/features/my-hockey/utils/feedSelection';
import type {
  FeedBoxscore,
  FeedGame,
  MyHockeyData,
  SeasonTotals,
} from '@/features/my-hockey/types/myHockey';

/** Background refresh cadence while the tab is visible, like the inbox. */
const POLL_INTERVAL_MS = 5 * 60 * 1000;
/** Returning to the tab refreshes at most this often. */
const FOCUS_REFRESH_MIN_MS = 60 * 1000;

export type MyHockeyDataLoad =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; data: MyHockeyData; loadedAt: number };

/** The players whose season lines and last games the feed shows. */
type FeedPlayerRef = Pick<
  FavoritePlayer,
  'playerId' | 'teamTriCode' | 'position'
>;

/** Loads each team's schedule; a failed one leaves only that team out. */
async function loadGamesByTeam(
  triCodes: string[],
): Promise<Map<string, FeedGame[]>> {
  const schedules = await Promise.allSettled(triCodes.map(fetchTeamGames));
  const gamesByTeam = new Map<string, FeedGame[]>();
  schedules.forEach((schedule, index) => {
    if (schedule.status === 'fulfilled') {
      gamesByTeam.set(triCodes[index], schedule.value);
    } else {
      console.error(
        `Failed to load the ${triCodes[index]} schedule:`,
        schedule.reason,
      );
    }
  });
  return gamesByTeam;
}

/** Loads box scores, skipping ones already loaded and any that fail. */
async function loadBoxscores(
  gameIds: number[],
  boxscoresByGameId: Map<number, FeedBoxscore>,
): Promise<void> {
  const missingGameIds = [...new Set(gameIds)].filter(
    (gameId) => !boxscoresByGameId.has(gameId),
  );
  const boxscores = await Promise.allSettled(
    missingGameIds.map(fetchGameBoxscore),
  );
  boxscores.forEach((boxscore, index) => {
    if (boxscore.status === 'fulfilled') {
      boxscoresByGameId.set(missingGameIds[index], boxscore.value);
    } else {
      console.error('Failed to load a box score:', boxscore.reason);
    }
  });
}

/** Loads current-season totals for the players' teams (skaters and/or goalies). */
async function loadSeasonTotals(
  players: FeedPlayerRef[],
): Promise<Map<number, SeasonTotals>> {
  const requests: Promise<Map<number, SeasonTotals>>[] = [];
  const triCodes = new Set(players.map((player) => player.teamTriCode));
  for (const triCode of triCodes) {
    const teamId = localTeamList.find((team) => team.triCode === triCode)?.id;
    if (!teamId) continue;
    const teamPlayers = players.filter(
      (player) => player.teamTriCode === triCode,
    );
    if (teamPlayers.some((player) => player.position !== 'G')) {
      requests.push(fetchSkaterSeasonTotals(teamId));
    }
    if (teamPlayers.some((player) => player.position === 'G')) {
      requests.push(fetchGoalieSeasonTotals(teamId));
    }
  }
  const totalsByTeam = await Promise.allSettled(requests);
  const seasonTotalsByPlayerId = new Map<number, SeasonTotals>();
  for (const teamTotals of totalsByTeam) {
    if (teamTotals.status === 'rejected') {
      console.error('Failed to load season totals:', teamTotals.reason);
      continue;
    }
    for (const [playerId, totals] of teamTotals.value) {
      seasonTotalsByPlayerId.set(playerId, totals);
    }
  }
  return seasonTotalsByPlayerId;
}

/**
 * Fetches everything the feed shows: one schedule per team, box scores for
 * games the cached schedule may have wrong and for the players' latest games,
 * and the players' season totals.
 */
async function loadMyHockeyData(
  teamTriCodes: string[],
  players: FeedPlayerRef[],
): Promise<MyHockeyData> {
  const playerTeamTriCodes = players
    .map((player) => player.teamTriCode)
    .filter((triCode): triCode is string => Boolean(triCode));
  const now = Date.now();
  const [gamesByTeam, seasonTotalsByPlayerId] = await Promise.all([
    loadGamesByTeam([...new Set([...teamTriCodes, ...playerTeamTriCodes])]),
    loadSeasonTotals(players),
  ]);

  const boxscoresByGameId = new Map<number, FeedBoxscore>();
  await loadBoxscores(
    [...gamesByTeam.values()].flatMap((games) =>
      listGamesToRecheck(games, now).map((game) => game.gameId),
    ),
    boxscoresByGameId,
  );
  const latestPlayedGameIds = [...new Set(playerTeamTriCodes)]
    .map((triCode) => gamesByTeam.get(triCode))
    .map((games) =>
      games
        ? selectLatestPlayedGame(applyBoxscores(games, boxscoresByGameId), now)
        : null,
    )
    .filter((game): game is FeedGame => game !== null)
    .map((game) => game.gameId);
  await loadBoxscores(latestPlayedGameIds, boxscoresByGameId);

  return { gamesByTeam, boxscoresByGameId, seasonTotalsByPlayerId };
}

/**
 * Loads the feed data for the given favorite teams and players while
 * `enabled`, then refreshes on refocus and every 5 minutes while visible.
 * Pass no players for the home "Up next" strip, which needs schedules only.
 */
export function useMyHockeyData(
  enabled: boolean,
  teamTriCodes: string[],
  players: FeedPlayerRef[],
): MyHockeyDataLoad {
  const [load, setLoad] = useState<MyHockeyDataLoad>({ status: 'idle' });
  const lastRequestRef = useRef(0);

  // The effect reads the latest inputs but reruns only when what picks the
  // requests changes, so a tier change or a new array identity does not refetch.
  const inputsRef = useRef({ teamTriCodes, players });
  inputsRef.current = { teamTriCodes, players };
  const requestKey = JSON.stringify([
    [...teamTriCodes].sort(),
    players
      .map(
        (player) =>
          `${player.playerId}:${player.teamTriCode}:${player.position}`,
      )
      .sort(),
  ]);

  useEffect(() => {
    if (!enabled) {
      setLoad({ status: 'idle' });
      return;
    }
    const requested = inputsRef.current;
    let isCurrent = true;

    const refresh = () => {
      lastRequestRef.current = Date.now();
      loadMyHockeyData(requested.teamTriCodes, requested.players).then(
        (data) => {
          if (isCurrent)
            setLoad({ status: 'ready', data, loadedAt: Date.now() });
        },
      );
    };

    // Keep showing the last feed while a changed favorite reloads it.
    setLoad((previous) =>
      previous.status === 'ready' ? previous : { status: 'loading' },
    );
    refresh();
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, POLL_INTERVAL_MS);
    const refreshOnReturn = () => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastRequestRef.current > FOCUS_REFRESH_MIN_MS
      ) {
        refresh();
      }
    };
    document.addEventListener('visibilitychange', refreshOnReturn);
    return () => {
      isCurrent = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshOnReturn);
    };
  }, [enabled, requestKey]);

  return load;
}
