import { CARDS } from '@/features/board-game/data/cards';
import {
  composePlaybook,
  IDENTITY_PACKAGES,
  NEUTRAL_PRIMARY,
  NEUTRAL_SECONDARY,
  UNIVERSAL_CORE,
} from '@/features/board-game/data/playbooks';
import type {
  BattleSide,
  DuelKind,
  Identity,
} from '@/features/board-game/types/game';
import { describe, expect, it } from 'vitest';

const IDENTITIES: Identity[] = [
  'forecheck',
  'transition',
  'possession',
  'physical',
  'structure',
];
const ORDINARY_KINDS: DuelKind[] = ['deke', 'check', 'intercept'];
const BATTLE_SIDES: BattleSide[] = ['possession', 'challenger'];
const MIN_ELIGIBLE_CARDS = 5;

/** Every legal (primary, secondary) pair, `undefined` meaning neutral fill. */
const IDENTITY_COMBOS: [Identity | undefined, Identity | undefined][] = [
  undefined,
  ...IDENTITIES,
].flatMap((primary) =>
  [undefined, ...IDENTITIES]
    .filter((secondary) => !primary || primary !== secondary)
    .map(
      (secondary) =>
        [primary, secondary] as [Identity | undefined, Identity | undefined],
    ),
);

/** A readable name for a combo in failure messages. */
function comboName([primary, secondary]: [
  Identity | undefined,
  Identity | undefined,
]): string {
  return `${primary ?? 'neutral'}+${secondary ?? 'neutral'}`;
}

/** True for a card legal in at least one ordinary battle. */
function isBattleCard(id: string): boolean {
  return (
    ORDINARY_KINDS.some((kind) => CARDS[id].allowedIn[kind]) ||
    Boolean(CARDS[id].allowedIn.netFront)
  );
}

/** True for a shot- or faceoff-pool card. */
function isShotOrFaceoffCard(id: string): boolean {
  const contexts = CARDS[id].allowedIn;
  return Boolean(contexts.shot || contexts.faceoff);
}

describe('composePlaybook', () => {
  it('builds the neutral playbook from the core and both neutral fills', () => {
    expect(composePlaybook()).toEqual([
      ...UNIVERSAL_CORE,
      ...NEUTRAL_PRIMARY.battleCards,
      NEUTRAL_PRIMARY.specialCard,
      ...NEUTRAL_SECONDARY,
    ]);
  });

  it('assembles 31 known cards with the same slot types for every combo', () => {
    for (const combo of IDENTITY_COMBOS) {
      const playbook = composePlaybook(...combo);
      const name = comboName(combo);
      expect(playbook, name).toHaveLength(31);
      expect(
        playbook.every((id) => CARDS[id]),
        name,
      ).toBe(true);
      expect(playbook.slice(0, UNIVERSAL_CORE.length), name).toEqual(
        UNIVERSAL_CORE,
      );
      const [first, second, third, special, fifth, sixth] = playbook.slice(
        UNIVERSAL_CORE.length,
      );
      for (const id of [first, second, third, fifth, sixth])
        expect(isBattleCard(id), `${name} ${id}`).toBe(true);
      expect(isShotOrFaceoffCard(special), `${name} ${special}`).toBe(true);
    }
  });

  it('adds the four universal net-front cards and replaces the approved package slots', () => {
    expect(UNIVERSAL_CORE).toHaveLength(25);
    for (const id of [
      'establish_position',
      'find_the_rebound',
      'clear_the_crease',
      'lift_the_stick',
    ])
      expect(UNIVERSAL_CORE).toContain(id);
    expect(IDENTITY_PACKAGES.physical.battleCards).toContain(
      'hold_your_ground',
    );
    expect(IDENTITY_PACKAGES.structure.battleCards).toContain(
      'front_the_shooter',
    );
  });

  it('fills primary with the full package and secondary with its first two battle cards', () => {
    for (const identity of IDENTITIES) {
      const identityPackage = IDENTITY_PACKAGES[identity];
      const asPrimary = composePlaybook(identity).slice(UNIVERSAL_CORE.length);
      expect(asPrimary).toEqual([
        ...identityPackage.battleCards,
        identityPackage.specialCard,
        ...NEUTRAL_SECONDARY,
      ]);
      const asSecondary = composePlaybook(undefined, identity).slice(
        UNIVERSAL_CORE.length + 4,
      );
      expect(asSecondary).toEqual(identityPackage.battleCards.slice(0, 2));
    }
  });

  it('rejects a secondary identity equal to the primary', () => {
    for (const identity of IDENTITIES)
      expect(() => composePlaybook(identity, identity)).toThrow();
  });

  it(`holds at least ${MIN_ELIGIBLE_CARDS} eligible cards per ordinary battle and side in every deck`, () => {
    const shortfalls: string[] = [];
    for (const combo of IDENTITY_COMBOS) {
      const playbook = composePlaybook(...combo);
      for (const kind of ORDINARY_KINDS) {
        for (const side of BATTLE_SIDES) {
          const eligibleCount = playbook.filter((id) =>
            CARDS[id].allowedIn[kind]?.includes(side),
          ).length;
          if (eligibleCount < MIN_ELIGIBLE_CARDS)
            shortfalls.push(
              `${comboName(combo)} ${kind}/${side}: ${eligibleCount}`,
            );
        }
      }
    }
    expect(shortfalls).toEqual([]);
  });
});
