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
  { kind: 'carried'; skaterId: string } | { kind: 'loose'; pos: Coord };

export type Phase =
  'faceoff' | 'roll' | 'move' | 'duel' | 'duelResult' | 'gameOver';

export type DuelKind = 'faceoff' | 'deke' | 'check' | 'intercept' | 'shot';

/** Why a hand card can't be played right now, for the UI to explain a greyed-out card. */
export type CardBlockReason = 'energy' | 'shotOnly' | 'checkOnly';

export type CardTag = 'skill' | 'block' | 'shot' | 'check' | 'faceoff';

export type CardEffect =
  | { type: 'damage'; amount: number }
  | { type: 'block'; amount: number }
  | { type: 'draw'; amount: number };

/**
 * Faceoff-ante outcome effect (BG-A15a): fires at contest-resolution time,
 * not during a reveal, so it is deliberately kept off `CardEffect`. One
 * optional enum field, exactly as additive as `accuracy`/`power` were -
 * BG-A15b is what actually applies these.
 */
export type FaceoffCardEffect =
  'backDraw' | 'stunLoser' | 'bonusMp' | 'scrumOnLoss' | 'freeJump';

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
  /** Shot-ante stat (BG-A14a): widens the perfect/yellow timing band. Only shot-pool cards set this. */
  accuracy?: number;
  /** Shot-ante stat (BG-A14a): subtracted from the goalie's save chance and drained from its poise on a save. */
  power?: number;
  /** Faceoff-ante stat (BG-A15a): widens the clean reaction window. Only faceoff-pool cards set this. */
  anticipation?: number;
  /** Faceoff-ante stat (BG-A15a): flat bonus to the contest roll, and (at BG-A15b) the size of the buff a clean win carries out. */
  grip?: number;
  /** Faceoff-ante effect (BG-A15a), fired at outcome time by BG-A15b. Only faceoff-pool cards set this. */
  faceoffEffect?: FaceoffCardEffect;
}

/**
 * A shot's timing-bar outcome (BG-A14a): a narrow `perfect` (yellow) zone at
 * the centre, a wider `good` (light blue) zone around it, `weak` for the rest
 * of the track, and `miss` if nothing was pressed before the cycle ended.
 */
export type ShotBand = 'perfect' | 'good' | 'weak' | 'miss';

/**
 * Widths of the two concentric shot-timing zones, as fractions of the full
 * `[0, 1]` track, both centred on `0.5`. `yellowWidth` is the full width of
 * the perfect zone; `blueWidth` is the full width of the good zone, which
 * strictly contains the yellow zone (e.g. `blueWidth: 0.3` covers
 * `[0.35, 0.65]`, with the yellow zone sitting inside it). The UI (BG-B22)
 * renders these as nested bands and must not hardcode the numbers.
 */
export interface ShotBandWidths {
  yellowWidth: number;
  blueWidth: number;
}

/**
 * A faceoff draw's reaction outcome (BG-A15a): `clean` (within the narrow
 * on-time window), `scrum` (within the wider-but-still-timely window),
 * `late` (anything slower), and `jump` (pressed before the drop - a false
 * start, never produced by a random band roll, exactly as `miss` is
 * human-only for shots).
 */
export type FaceoffBand = 'clean' | 'scrum' | 'late' | 'jump';

/**
 * Widths of the two nested faceoff reaction windows, in ms, both measured
 * from the drop: `cleanWindowMs` is the outer edge of the `clean` band,
 * `scrumWindowMs` the outer edge of the `scrum` band (which strictly
 * contains `cleanWindowMs`, e.g. `scrumWindowMs: 260` covers a `cleanWindowMs`
 * of up to that). Anything slower than `scrumWindowMs` is `late`. The UI
 * (BG-B25) renders these as the drop's timing feedback and must not
 * hardcode the numbers.
 */
export interface FaceoffBandWindows {
  cleanWindowMs: number;
  scrumWindowMs: number;
}

/** Result of rolling a goalie's save for a shot band (BG-A14a's `rollShotSave`). */
export interface ShotSaveResult {
  band: ShotBand;
  saved: boolean;
  /** The clamped save chance actually rolled against, 0-100, for tests/UI display. */
  saveChance: number;
  /** Poise to subtract from the goalie: `power` on any save, 0 on a goal. */
  poiseDrain: number;
  /** True on a `weak`/`miss` save: the existing clean-save freeze path. */
  freeze: boolean;
  /** True on a `good`/`perfect` save that isn't covered: kicks out a rebound. */
  rebound: boolean;
  /**
   * True on a `good`/`perfect` save the goalie smothers instead of
   * rebounding (BG-A16), rolled against `SHOT_COVER_CHANCE`. Mutually
   * exclusive with `rebound` - a covered save always has `rebound: false`.
   * Whistles play dead and routes to the faceoff phase.
   */
  covered: boolean;
}

/** Result of rolling the contest for a resolved faceoff band (BG-A15a's `rollFaceoffContest`). */
export interface FaceoffContestResult {
  band: FaceoffBand;
  /** True on a `clean`/`scrum`/`late` band if the contest roll was won. Always false on a `jump` - no contest is rolled. */
  won: boolean;
  /** The clamped win chance actually rolled against, 0-100, for tests/UI display. 0 on a `jump`, since no contest is rolled. */
  winChance: number;
  /**
   * True on a `jump` that earns a re-drop (the first jump) rather than an
   * outright loss (a second jump). Always false on `clean`/`scrum`/`late`.
   */
  reDrop: boolean;
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
  /** Card ids each `userQueue` entry drew when queued (usually `[]`), parallel to `userQueue`. */
  queueDraws: string[][];
  receiverId: string | null;
  /**
   * Shot duel only (BG-A14b): the shooter's picked ante card id, once chosen
   * from the 3-card offer sitting in the shooter's hand. Null before the
   * pick and for every other duel kind.
   */
  shotPickedCardId: string | null;
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
  /**
   * Each team's goalie poise (BG-A14b), persisted across the whole match -
   * this, not a per-duel `Duelist`, is what keeps `length` meaningful
   * (`GOALIE_POISE_BY_LENGTH` seeds it on `NEW_GAME`). Drains by a shot's
   * `power` on every save.
   */
  goaliePoise: Record<TeamId, number>;
  /**
   * The real `rollShotSave` result for the shot `RESOLVE_SHOT_BAND` most
   * recently resolved (BG-B24), so the UI can display the engine's own
   * outcome rather than re-deriving or re-rolling it. Follows `lastOutcome`'s
   * lifecycle: null on `NEW_GAME` and `DISMISS_DUEL_RESULT`, set whenever a
   * shot resolves, otherwise stale-but-unread between shots.
   */
  lastShotSaveResult: ShotSaveResult | null;
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
  /** Shot duel only (BG-A14b): the user shooter picks their ante card, offered at `deck.hand[handIndex]`. */
  | { type: 'PICK_SHOT_CARD'; handIndex: number }
  /** Shot duel only (BG-A14b): the UI reports the timing bar's band, so the engine can roll the save. */
  | { type: 'RESOLVE_SHOT_BAND'; band: ShotBand }
  /** Shot duel only (BG-A14b): resolves without a timing-bar press, rolling a band from the picked card's accuracy - `prefers-reduced-motion` and headless play. */
  | { type: 'AUTO_RESOLVE_SHOT' }
  | { type: 'DISMISS_DUEL_RESULT' }
  | { type: 'NEW_GAME'; seed: number; length: GameLength };
