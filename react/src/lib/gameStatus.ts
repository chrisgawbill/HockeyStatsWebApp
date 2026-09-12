/**
 * NHL `gameState` predicates shared across features (schedule, teams,
 * game-detail). Take the bare `gameState` string rather than a feature's game
 * model, so this stays a primitive lib/ has no reason to import feature types
 * for.
 */

/**
 * Returns true for a completed NHL game state (regulation, OT, or shootout
 * final).
 */
export function isCompletedGameState(gameState: string): boolean {
  return gameState === 'OFF' || gameState === 'FINAL';
}

/**
 * Returns true for a live/in-progress NHL game state by excluding pre-game
 * and completed states.
 */
export function isInProgressGameState(gameState: string): boolean {
  return (
    gameState !== 'FUT' &&
    gameState !== 'PRE' &&
    !isCompletedGameState(gameState)
  );
}
