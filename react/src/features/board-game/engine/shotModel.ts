/**
 * Shot minigame engine model. Widths come from `bandWidthsForAccuracy` —
 * the UI must not hardcode band geometry.
 */
import {
  BASE_SAVE_BY_BAND,
  CPU_SHOT_ACCURACY,
  MAX_SAVE_CHANCE,
  MIN_SAVE_CHANCE,
  PERK_WING_SHOT_ACCURACY,
  POISE_SAVE_PENALTY_MAX,
  SHOT_BLUE_BAND_WIDTH,
  SHOT_COVER_CHANCE,
  SHOT_YELLOW_BASE_WIDTH,
  SHOT_YELLOW_WIDTH_PER_ACCURACY,
} from '@/features/board-game/data/balance';
import { nextFloat } from '@/features/board-game/engine/rng';
import type {
  Role,
  ShotBand,
  ShotBandWidths,
  ShotSaveResult,
} from '@/features/board-game/types/game';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** LW/RW accuracy bonus for a shot card, on the 0-100 accuracy scale (`PERK_WING_SHOT_ACCURACY`; applied in the shot ante - see `shotDuel.ts`). */
export function shotAccuracyBonus(role: Role): number {
  return role === 'LW' || role === 'RW' ? PERK_WING_SHOT_ACCURACY : 0;
}

/**
 * Two concentric band widths for a given accuracy (0-100, clamped). Blue
 * (good) is constant; only yellow (perfect) widens with accuracy. The UI
 * must not hardcode this geometry.
 */
export function bandWidthsForAccuracy(accuracy: number): ShotBandWidths {
  const clampedAccuracy = clamp(accuracy, 0, 100);
  return {
    yellowWidth:
      SHOT_YELLOW_BASE_WIDTH + clampedAccuracy * SHOT_YELLOW_WIDTH_PER_ACCURACY,
    blueWidth: SHOT_BLUE_BAND_WIDTH,
  };
}

/** Which band a track position (0-1) falls in, given the two concentric widths. Never returns `miss` - that's a UI-only "no press" state. */
export function bandForPosition(
  position: number,
  widths: ShotBandWidths,
): Exclude<ShotBand, 'miss'> {
  const distanceFromCentre = Math.abs(position - 0.5);
  if (distanceFromCentre <= widths.yellowWidth / 2) return 'perfect';
  if (distanceFromCentre <= widths.blueWidth / 2) return 'good';
  return 'weak';
}

/**
 * Random track position for an accuracy-driven aim (CPU shot, or the UI's
 * reduced-motion auto-resolve), bucketed via the same `bandForPosition` a human press uses.
 */
export function rollBandFromAccuracy(
  accuracy: number,
  seed: number,
): [Exclude<ShotBand, 'miss'>, number] {
  const [position, nextSeed] = nextFloat(seed);
  return [bandForPosition(position, bandWidthsForAccuracy(accuracy)), nextSeed];
}

/** The CPU's seeded shot band roll against its fixed aim difficulty. Same `rollShotSave` resolves it afterward - no second path for the CPU. */
export function rollCpuShotBand(
  seed: number,
): [Exclude<ShotBand, 'miss'>, number] {
  return rollBandFromAccuracy(CPU_SHOT_ACCURACY, seed);
}

/** Save-chance bonus/penalty from goalie freshness: 0 at full poise, down to `-POISE_SAVE_PENALTY_MAX` at 0 poise. */
export function poiseFactor(poise: number, maxPoise: number): number {
  if (maxPoise <= 0) return -POISE_SAVE_PENALTY_MAX;
  const missingFraction = 1 - clamp(poise, 0, maxPoise) / maxPoise;
  return missingFraction === 0 ? 0 : -POISE_SAVE_PENALTY_MAX * missingFraction;
}

/**
 * Goalie's save for a resolved band: `saveChance = BASE_SAVE_BY_BAND[band] +
 * poiseFactor(goaliePoise) - power`, clamped, rolled through `engine/rng.ts`
 * (never `Math.random`). On a save, poise drains by `power`; `weak`/`miss`
 * freezes, `good`/`perfect` rolls a separate `SHOT_COVER_CHANCE` check
 * (`covered` XOR `rebound`, never rolled on `weak`/`miss`). One shared path
 * for both the human and CPU shooter.
 */
export function rollShotSave(
  band: ShotBand,
  power: number,
  goaliePoise: number,
  goalieMaxPoise: number,
  seed: number,
): [ShotSaveResult, number] {
  const rawChance =
    BASE_SAVE_BY_BAND[band] + poiseFactor(goaliePoise, goalieMaxPoise) - power;
  const saveChance = clamp(rawChance, MIN_SAVE_CHANCE, MAX_SAVE_CHANCE);
  const [roll, seedAfterSave] = nextFloat(seed);
  const saved = roll * 100 < saveChance;
  if (!saved) {
    return [
      {
        band,
        saved,
        saveChance,
        poiseDrain: 0,
        freeze: false,
        rebound: false,
        covered: false,
      },
      seedAfterSave,
    ];
  }
  const freeze = band === 'weak' || band === 'miss';
  const canCover = band === 'good' || band === 'perfect';
  const [coverRoll, nextSeed] = canCover
    ? nextFloat(seedAfterSave)
    : [1, seedAfterSave];
  const covered = canCover && coverRoll * 100 < SHOT_COVER_CHANCE;
  const rebound = canCover && !covered;
  return [
    { band, saved, saveChance, poiseDrain: power, freeze, rebound, covered },
    nextSeed,
  ];
}
