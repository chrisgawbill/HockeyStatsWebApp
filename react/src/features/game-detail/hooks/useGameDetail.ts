import { useEffect, useMemo, useState } from 'react';

import {
  GetGameDetails,
  GetGameLanding,
} from '@/features/game-detail/api/gameDetailApi';
import {
  GameDetailBoxscore,
  GameLanding,
} from '@/features/game-detail/types/gameDetail';
import {
  LIVE_POLL_INTERVAL_MS,
  mapGameStateToStatus,
} from '@/features/game-detail/utils/gameDetailHelper';

/** Fetches a game's boxscore and landing payloads together. */
function fetchGameDetail(gameId: string) {
  return Promise.all([
    GetGameDetails(Number(gameId)),
    GetGameLanding(Number(gameId)),
  ]);
}

/**
 * Loads one game's boxscore and landing data and derives its status
 * (preview, live, or final). Live games only are refreshed on a single
 * interval so the page updates in place; the interval is never scheduled for
 * preview/final games and is cleared on unmount or when the game leaves the
 * live state. A failed poll keeps the last good data rather than surfacing an
 * error.
 */
export function useGameDetail(gameId: string | undefined) {
  const [boxscore, setBoxscore] = useState<GameDetailBoxscore | null>(null);
  const [landing, setLanding] = useState<GameLanding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!gameId) return;
    setLoading(true);
    setError(false);
    fetchGameDetail(gameId)
      .then(([boxscoreData, landingData]) => {
        setBoxscore(boxscoreData);
        setLanding(landingData);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [gameId]);

  const status = useMemo(
    () => mapGameStateToStatus(boxscore?.gameState),
    [boxscore?.gameState],
  );

  useEffect(() => {
    if (!gameId || status !== 'live') return;
    const intervalId = window.setInterval(() => {
      fetchGameDetail(gameId)
        .then(([boxscoreData, landingData]) => {
          setBoxscore(boxscoreData);
          setLanding(landingData);
        })
        .catch(() => {
          // Transient poll failure: keep the last good data and retry on the next tick.
        });
    }, LIVE_POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [gameId, status]);

  return { boxscore, landing, loading, error, status };
}
