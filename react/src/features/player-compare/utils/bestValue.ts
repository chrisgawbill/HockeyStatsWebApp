/** Which way a stat improves; 'none' stats (games played) are never highlighted. */
export type BetterDirection = 'higher' | 'lower' | 'none';

/**
 * Marks the best value in one stat row, one flag per column. Values should be
 * rounded as displayed, so two cells that read the same tie. Missing values
 * are skipped; every tied leader is marked; a row needs at least two values
 * and is left unmarked when they are all equal.
 */
export function findBestColumns(
  values: (number | null)[],
  better: BetterDirection,
): boolean[] {
  const noneMarked = values.map(() => false);
  if (better === 'none') return noneMarked;

  const comparedValues = values.filter(
    (value): value is number => value !== null,
  );
  if (comparedValues.length < 2) return noneMarked;

  const bestValue =
    better === 'higher'
      ? Math.max(...comparedValues)
      : Math.min(...comparedValues);
  if (comparedValues.every((value) => value === bestValue)) return noneMarked;

  return values.map((value) => value === bestValue);
}
