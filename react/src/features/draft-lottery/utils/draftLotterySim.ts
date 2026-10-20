/**
 * Pure NHL draft-lottery simulator.
 *
 * Entrants are the non-playoff teams ordered worst -> best (index 0 is the
 * pre-lottery #1). Each carries its draw-1 odds, used as a relative weight.
 * Two draws are made:
 *  - Draw 1 awards the #1 pick.
 *  - Draw 2 (winner of draw 1 removed, weights renormalized) awards the next
 *    open pick (#2).
 * A winner may move up at most 10 spots. An ineligible winner instead moves
 * up exactly 10 spots, and the pick it could not take goes to the worst
 * pre-lottery team not already placed. Every other team fills the remaining
 * picks in its original order.
 */

export const MAX_LOTTERY_MOVE_UP = 10;

export interface LotteryEntrant {
  id: string;
  /** Draw-1 odds; any non-negative scale (e.g. percent). */
  odds: number;
}

export interface LotteryResultEntry {
  id: string;
  /** 1-based position before the lottery (1 = worst record). */
  preLotteryPosition: number;
  /** 1-based final draft pick. */
  pick: number;
  /** Spots gained (positive) or lost (negative) versus pre-lottery order. */
  movement: number;
  /** Which draw (1 or 2) this team won, or null. */
  drawWon: 1 | 2 | null;
}

/** Weighted pick of an index; `rng` must return a value in [0, 1). */
function weightedPick(
  weights: number[],
  candidates: number[],
  rng: () => number,
): number {
  const total = candidates.reduce((sum, i) => sum + weights[i], 0);
  if (total <= 0) return candidates[Math.floor(rng() * candidates.length)];
  const target = rng() * total;
  let cumulative = 0;
  for (const index of candidates) {
    cumulative += weights[index];
    if (target < cumulative) return index;
  }
  return candidates[candidates.length - 1];
}

/**
 * Runs the two-draw lottery. Returns entries sorted by final pick.
 * @param teams entrants ordered worst -> best
 * @param rng   random source returning [0, 1); inject for deterministic tests
 */
export function simulateDraftLottery(
  teams: LotteryEntrant[],
  rng: () => number = Math.random,
): LotteryResultEntry[] {
  const count = teams.length;
  if (count === 0) return [];

  const weights = teams.map((team) => Math.max(0, team.odds));
  const pickByIndex = new Map<number, number>();
  const drawWon = new Map<number, 1 | 2>();
  const takenPicks = new Set<number>();

  const place = (index: number, pick: number) => {
    pickByIndex.set(index, pick);
    takenPicks.add(pick);
  };
  const lowestOpenPick = () => {
    for (let pick = 1; pick <= count; pick++) {
      if (!takenPicks.has(pick)) return pick;
    }
    return count;
  };
  const worstUnplaced = () => {
    for (let index = 0; index < count; index++) {
      if (!pickByIndex.has(index)) return index;
    }
    return -1;
  };

  // Resolves one draw: winner takes `target` if close enough, otherwise moves
  // up exactly 10 and `target` goes to the worst team not yet placed.
  const runDraw = (draw: 1 | 2, candidates: number[]) => {
    if (candidates.length === 0) return;
    const target = lowestOpenPick();
    const winner = weightedPick(weights, candidates, rng);
    drawWon.set(winner, draw);
    const position = winner + 1;
    if (position - target <= MAX_LOTTERY_MOVE_UP) {
      place(winner, target);
      return;
    }
    place(winner, position - MAX_LOTTERY_MOVE_UP);
    const recipient = worstUnplaced();
    if (recipient >= 0) place(recipient, target);
  };

  const all = teams.map((_, index) => index);
  runDraw(1, all);
  // A team cannot win both draws, nor win a pick it already holds.
  const draw2Candidates = all.filter((index) => !pickByIndex.has(index));
  runDraw(2, draw2Candidates);

  // Everyone else fills the remaining picks in original order.
  let nextPick = 1;
  for (let index = 0; index < count; index++) {
    if (pickByIndex.has(index)) continue;
    while (takenPicks.has(nextPick)) nextPick++;
    place(index, nextPick);
  }

  return teams
    .map((team, index) => {
      const pick = pickByIndex.get(index) as number;
      return {
        id: team.id,
        preLotteryPosition: index + 1,
        pick,
        movement: index + 1 - pick,
        drawWon: drawWon.get(index) ?? null,
      };
    })
    .sort((a, b) => a.pick - b.pick);
}
