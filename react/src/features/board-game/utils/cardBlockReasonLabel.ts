import type {
  CardBlockReason,
  CardDef,
} from '@/features/board-game/types/game';

/** Compact one-line explanation for why a card is currently unplayable. */
export function cardBlockReasonLabel(
  reason: CardBlockReason,
  card: CardDef,
  energy: number,
): string {
  switch (reason) {
    case 'energy':
      return `Costs ${card.cost}⚡ · you have ${energy}`;
    case 'shotOnly':
      return 'Only when shooting';
    case 'checkOnly':
      return 'Only when checking';
    case 'goalieBlockOnly':
      return 'Goalies can only block';
  }
}
