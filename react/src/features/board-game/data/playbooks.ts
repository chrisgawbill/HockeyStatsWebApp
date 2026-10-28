import type { Identity } from '@/features/board-game/types/game';

/**
 * A team identity's playbook slots: three ordinary battle cards, the first
 * two of which double as its secondary package, plus one shot or faceoff card.
 */
export interface IdentityPackage {
  battleCards: readonly [string, string, string];
  specialCard: string;
}

/** The cards every playbook starts from, with duplicate ids repeated. */
export const UNIVERSAL_CORE: readonly string[] = [
  'deke',
  'toe_drag',
  'protect_puck',
  'protect_puck',
  'stickhandle',
  'stickhandle',
  'slip_the_check',
  'poke_check',
  'poke_check',
  'poke_check',
  'body_check',
  'angle_out',
  'stick_lift',
  'read_the_lane',
  'wrist_shot',
  'snap_shot',
  'slapshot',
  'quick_hands',
  'tie_it_up',
  'forehand_pull',
  'win_it_back',
];

/** Each identity's primary package; strength and weakness noted per entry. */
export const IDENTITY_PACKAGES: Record<Identity, IdentityPackage> = {
  // Wins check battles and cracks resistance; nothing for the carrier, costly cards.
  forecheck: {
    battleCards: ['pin_to_boards', 'body_check', 'finish_the_check'],
    specialCard: 'body_the_dot',
  },
  // Wins deke and interception races; weak check defense, exhaust cards burn out.
  transition: {
    battleCards: ['drive_wide', 'step_up', 'cutback'],
    specialCard: 'one_timer',
  },
  // Card flow and beats resistance on passes; low ceiling, struggles to finish dekes.
  possession: {
    battleCards: ['saucer_pass', 'quick_touch', 'stickhandle'],
    specialCard: 'cheat_the_draw',
  },
  // Wins battles of attrition; little pressure, no draw, slow knockouts.
  physical: {
    battleCards: ['brace_for_contact', 'gap_control', 'protect_puck'],
    specialCard: 'slapshot',
  },
  // Shuts down passing and wins on timeouts; weak carrier support, struggles in check battles.
  structure: {
    battleCards: ['active_stick', 'deflect_pass', 'read_the_lane'],
    specialCard: 'tie_it_up',
  },
};

/** Fills the primary slots when a team has no primary identity. */
export const NEUTRAL_PRIMARY: IdentityPackage = {
  battleCards: ['deke', 'poke_check', 'protect_puck'],
  specialCard: 'one_timer',
};

/** Fills the secondary slots when a team has no secondary identity. */
export const NEUTRAL_SECONDARY: readonly [string, string] = [
  'stickhandle',
  'poke_check',
];

/** The two secondary-slot cards an identity contributes: its package's first two battle cards. */
export function secondaryCardsOf(identity: Identity): readonly string[] {
  return IDENTITY_PACKAGES[identity].battleCards.slice(0, 2);
}

/**
 * Builds a 27-card playbook: the universal core, the primary package (or
 * neutral fill), then the secondary package (or neutral fill). Throws when
 * the secondary repeats the primary, since a team's two identities must differ.
 */
export function composePlaybook(
  primary?: Identity,
  secondary?: Identity,
): string[] {
  if (primary && primary === secondary) {
    throw new Error(`Secondary identity must differ from primary: ${primary}`);
  }
  const primaryPackage = primary ? IDENTITY_PACKAGES[primary] : NEUTRAL_PRIMARY;
  const secondaryCards = secondary
    ? secondaryCardsOf(secondary)
    : NEUTRAL_SECONDARY;
  return [
    ...UNIVERSAL_CORE,
    ...primaryPackage.battleCards,
    primaryPackage.specialCard,
    ...secondaryCards,
  ];
}
