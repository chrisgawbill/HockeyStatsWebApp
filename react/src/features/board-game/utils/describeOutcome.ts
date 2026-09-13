import { TEAM_NAME } from '@/features/board-game/data/teams';
import type { DuelOutcome, Skater } from '@/features/board-game/types/game';

function label(skaterId: string, skaters: Skater[]): string {
  const skater = skaters.find((s) => s.id === skaterId);
  return skater ? `${TEAM_NAME[skater.team]} ${skater.role}` : skaterId;
}

/**
 * Human-readable duel result for the UI. The engine's `summary` field stays
 * terse for logs/tests.
 */
export function describeOutcome(
  outcome: DuelOutcome,
  skaters: Skater[],
): string {
  const attacker = label(outcome.attackerId, skaters);
  const defender = label(outcome.defenderId, skaters);
  const attackerWins = outcome.winner === 'attacker';

  if (outcome.kind === 'shot') {
    if (attackerWins) return `GOAL! ${attacker} scores`;
    return outcome.cleanSave
      ? `${defender} freezes the puck — clean save`
      : `${defender} makes the save — rebound!`;
  }

  let text: string;
  switch (outcome.kind) {
    case 'faceoff':
      text = `${attackerWins ? attacker : defender} wins the faceoff`;
      break;
    case 'deke':
      text = attackerWins
        ? `${attacker} dekes past ${defender}`
        : `${defender} strips ${attacker}`;
      break;
    case 'check':
      text = attackerWins
        ? `${attacker} checks ${defender} and takes the puck`
        : `${defender} shrugs off ${attacker}'s check`;
      break;
    case 'intercept':
      text = attackerWins
        ? `Pass completed to ${outcome.receiverId ? label(outcome.receiverId, skaters) : attacker}`
        : `${defender} intercepts the pass`;
      break;
    default:
      text = outcome.summary;
  }

  if (outcome.byKo) {
    text += ', by knockout';
  }
  return text;
}
