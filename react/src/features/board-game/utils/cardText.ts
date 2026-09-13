import {
  cardEffects,
  perkBonus,
} from '@/features/board-game/engine/duelShared';
import type { CardDef, Role } from '@/features/board-game/types/game';

/** Card display text: `card.text` with no role, else effects recomputed for `role`'s perks (e.g. an LD's block card shows the bonus amount). */
export function cardText(card: CardDef, role?: Role): string {
  if (!role) return card.text;
  const totals = cardEffects(card, role);
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const effect of card.effects) {
    if (seen.has(effect.type)) continue;
    seen.add(effect.type);
    if (effect.type === 'damage') parts.push(`${totals.damage} damage`);
    else if (effect.type === 'block') parts.push(`${totals.block} block`);
    else parts.push(`draw ${totals.draw}`);
  }
  if (card.exhaust) parts.push('exhaust');
  return parts.join(', ');
}

/** Perk badge text for a card given the acting role, or null if no position perk applies (e.g. `LD +2`). */
export function cardPerkBadge(card: CardDef, role?: Role): string | null {
  if (!role) return null;
  const bonus =
    perkBonus(role, card.tags, 'damage') || perkBonus(role, card.tags, 'block');
  return bonus > 0 ? `${role} +${bonus}` : null;
}
