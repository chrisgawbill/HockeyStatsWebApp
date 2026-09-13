import type { CardDef } from '@/features/board-game/types/game';

/** All card definitions, keyed by id. See design doc §5. */
export const CARDS: Record<string, CardDef> = {
  deke: {
    id: 'deke',
    name: 'Deke',
    cost: 1,
    text: '6 damage',
    tags: ['skill'],
    allowedIn: 'any',
    exhaust: false,
    effects: [{ type: 'damage', amount: 6 }],
  },
  toe_drag: {
    id: 'toe_drag',
    name: 'Toe Drag',
    cost: 2,
    text: '10 damage',
    tags: ['skill'],
    allowedIn: 'any',
    exhaust: false,
    effects: [{ type: 'damage', amount: 10 }],
  },
  protect_puck: {
    id: 'protect_puck',
    name: 'Protect Puck',
    cost: 1,
    text: '5 block',
    tags: ['block'],
    allowedIn: 'any',
    exhaust: false,
    effects: [{ type: 'block', amount: 5 }],
  },
  stickhandle: {
    id: 'stickhandle',
    name: 'Stickhandle',
    cost: 1,
    text: '3 damage, draw 1',
    tags: ['skill'],
    allowedIn: 'any',
    exhaust: false,
    effects: [
      { type: 'damage', amount: 3 },
      { type: 'draw', amount: 1 },
    ],
  },
  wrist_shot: {
    id: 'wrist_shot',
    name: 'Wrist Shot',
    cost: 1,
    text: 'A quick, accurate release.',
    tags: ['shot'],
    allowedIn: ['shot'],
    exhaust: false,
    effects: [{ type: 'damage', amount: 7 }],
    // BG-A14a shot-ante stats (unused by the still-live card duel above).
    accuracy: 70,
    power: 4,
  },
  slapshot: {
    id: 'slapshot',
    name: 'Slapshot',
    cost: 2,
    text: 'A booming, hard-to-place blast.',
    tags: ['shot'],
    allowedIn: ['shot'],
    exhaust: true,
    effects: [{ type: 'damage', amount: 14 }],
    accuracy: 30,
    power: 9,
  },
  // BG-A14a: two more shot-pool cards so the 3-card ante isn't the same
  // offer every time. BG-A14b adds them to STARTER_DECK (see below) now
  // that the shot ante draws from it.
  snap_shot: {
    id: 'snap_shot',
    name: 'Snap Shot',
    cost: 1,
    text: 'A balanced release off the toe.',
    tags: ['shot'],
    allowedIn: ['shot'],
    exhaust: false,
    effects: [{ type: 'damage', amount: 9 }],
    accuracy: 50,
    power: 6,
  },
  one_timer: {
    id: 'one_timer',
    name: 'One-Timer',
    cost: 2,
    text: 'A blistering shot straight off the pass.',
    tags: ['shot'],
    allowedIn: ['shot'],
    exhaust: false,
    effects: [{ type: 'damage', amount: 11 }],
    accuracy: 20,
    power: 11,
  },
  body_check: {
    id: 'body_check',
    name: 'Body Check',
    cost: 2,
    text: '9 damage',
    tags: ['check'],
    allowedIn: ['check'],
    exhaust: false,
    effects: [{ type: 'damage', amount: 9 }],
  },
  poke_check: {
    id: 'poke_check',
    name: 'Poke Check',
    cost: 1,
    text: '5 damage',
    tags: ['check'],
    allowedIn: 'any',
    exhaust: false,
    effects: [{ type: 'damage', amount: 5 }],
  },
};

/**
 * The user's 13-card starter deck (card ids, duplicates repeated). See
 * design doc §5. BG-A14b: one of each of the 4 shot-pool cards (was
 * `wrist_shot` x2 + `slapshot` x1) so the 3-card shot ante - now drawn from
 * this deck - offers real variety instead of the same two cards every time.
 */
export const STARTER_DECK: string[] = [
  'deke',
  'deke',
  'toe_drag',
  'protect_puck',
  'protect_puck',
  'stickhandle',
  'stickhandle',
  'wrist_shot',
  'slapshot',
  'snap_shot',
  'one_timer',
  'body_check',
  'poke_check',
];
