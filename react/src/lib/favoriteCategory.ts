/** The fan tiers a user can put a favorite team or player in, strongest first. */
export const FAN_TIERS = ['diehard', 'fan', 'curious'] as const;

export type FanTier = (typeof FAN_TIERS)[number];

/** The fan tier a new favorite starts in. */
export const DEFAULT_FAN_TIER: FanTier = 'fan';

/** Longest custom label, counted in characters the user sees. */
export const MAX_CATEGORY_LABEL_LENGTH = 24;

export const FAN_TIER_NAMES: Record<FanTier, string> = {
  diehard: 'Diehard',
  fan: 'Fan',
  curious: 'Curious',
};

/** A favorite's display-only category: its tier and an optional label. */
export interface FavoriteCategory {
  tier: FanTier;
  label: string | null;
}

function isFanTier(value: unknown): value is FanTier {
  return FAN_TIERS.some((tier) => tier === value);
}

/** Returns the tier the API sent, or the default when it is missing or unknown. */
export function readFanTier(value: unknown): FanTier {
  return isFanTier(value) ? value : DEFAULT_FAN_TIER;
}

/** Returns the trimmed label, or null when it is missing or blank. */
export function readCategoryLabel(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmedLabel = value.trim();
  return trimmedLabel === '' ? null : trimmedLabel;
}

/** Counts user-perceived characters, so an emoji counts as one. */
export function countGraphemes(text: string): number {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  return Array.from(segmenter.segment(text)).length;
}

/** True when the label has more characters than a favorite may carry. */
export function isCategoryLabelTooLong(label: string): boolean {
  return countGraphemes(label.trim()) > MAX_CATEGORY_LABEL_LENGTH;
}

/** Returns the text for a card badge: the custom label if set, else the tier name. */
export function getCategoryBadgeText(category: FavoriteCategory): string {
  return category.label ?? FAN_TIER_NAMES[category.tier];
}

/** Returns a copy ordered Diehard, Fan, Curious, keeping the given order within a tier. */
export function sortByFanTier<Favorite extends { tier: FanTier }>(
  favorites: readonly Favorite[],
): Favorite[] {
  return [...favorites].sort(
    (first, second) =>
      FAN_TIERS.indexOf(first.tier) - FAN_TIERS.indexOf(second.tier),
  );
}
