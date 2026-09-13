/** Contracts for the Rink Quest board game. See docs/board-game-design.md. */

export type TeamId = 'user' | 'cpu';

/** Match length, picked before the game starts. The only difference is goalie poise. */
export type GameLength = 'short' | 'long';

export type Role = 'LW' | 'C' | 'RW' | 'LD' | 'RD' | 'G';

export interface Coord {
  col: number;
  row: number;
}

/** A single player on the ice. `id` looks like `user-C`. */
export interface Skater {
  id: string;
  team: TeamId;
  role: Role;
  pos: Coord;
  stunnedUntilTurn: number | null;
}

export type Puck =
  | { kind: 'carried'; skaterId: string }
  | { kind: 'loose'; pos: Coord };

export type Phase =
  | 'faceoff'
  | 'roll'
  | 'move'
  | 'duel'
  | 'duelResult'
  | 'gameOver';

export type DuelKind = 'faceoff' | 'deke' | 'check' | 'intercept' | 'shot';

/** Why a hand card can't be played right now, for the UI to explain a greyed-out card. */
export type CardBlockReason =
  | 'energy'
  | 'shotOnly'
  | 'checkOnly'
  | 'goalieBlockOnly';

export type CardTag = 'skill' | 'block' | 'shot' | 'check';

export type CardEffect =
  | { type: 'damage'; amount: number }
  | { type: 'block'; amount: number }
  | { type: 'draw'; amount: number };

/** A card definition shared across the match deck. */
export interface CardDef {
  id: string;
  name: string;
  cost: number;
  text: string;
  tags: CardTag[];
  allowedIn: DuelKind[] | 'any';
  exhaust: boolean;
  effects: CardEffect[];
}

/** Card ids in each pile. */
export interface Deck {
  drawPile: string[];
  hand: string[];
  discardPile: string[];
  exhaustPile: string[];
}

export interface Duelist {
  skaterId: string;
  poise: number;
  maxPoise: number;
  block: number;
}

export interface DuelState {
  kind: DuelKind;
  attacker: Duelist;
  defender: Duelist;
  userSide: 'attacker' | 'defender';
  round: number;
  energy: number;
  /** The CPU's secretly-committed card ids for this round, in play order. Hidden from the user until reveal. */
  cpuPlan: string[];
  /** The user's queued (committed but not yet revealed) card ids, in queue order. */
  userQueue: string[];
  receiverId: string | null;
}

/** What both sides committed and dealt when a duel round's simultaneous reveal resolved. Damage counts after block. */
export interface RevealResult {
  round: number;
  userCards: string[];
  cpuCards: string[];
  userDamageDealt: number;
  cpuDamageDealt: number;
  userBlock: number;
  cpuBlock: number;
}

export interface DuelOutcome {
  kind: DuelKind;
  winner: 'attacker' | 'defender';
  byKo: boolean;
  attackerId: string;
  defenderId: string;
  goal: boolean;
  /** Shot duel, defender (goalie) wins: true if the goalie took no poise damage all duel; false otherwise (including non-shot duels). */
  cleanSave: boolean;
  summary: string;
  /** The intended pass receiver, for an intercept duel; null otherwise. */
  receiverId: string | null;
}

export interface GameState {
  phase: Phase;
  length: GameLength;
  activeTeam: TeamId;
  turn: number;
  mp: number;
  dice: [number, number] | null;
  skaters: Skater[];
  puck: Puck;
  deck: Deck;
  cpuDeck: Deck;
  duel: DuelState | null;
  lastOutcome: DuelOutcome | null;
  /** The most recent duel round's simultaneous reveal, for the UI. Cleared when a new duel starts. */
  lastReveal: RevealResult | null;
  winner: TeamId | null;
  rngSeed: number;
  actionsThisTurn: number;
  /** True right after a whistle reset (boxed-in carrier), until START_FACEOFF is dispatched. */
  whistle: boolean;
}

export type Action =
  | { type: 'START_FACEOFF' }
  | { type: 'ROLL_DICE' }
  | { type: 'MOVE'; skaterId: string; to: Coord }
  | { type: 'PASS'; toSkaterId: string }
  | { type: 'SHOOT' }
  | { type: 'CHECK'; skaterId: string }
  | { type: 'END_TURN' }
  | { type: 'PLAY_CARD'; handIndex: number }
  | { type: 'UNQUEUE_CARD'; queueIndex: number }
  | { type: 'END_DUEL_ROUND' }
  | { type: 'DISMISS_DUEL_RESULT' }
  | { type: 'NEW_GAME'; seed: number; length: GameLength };
