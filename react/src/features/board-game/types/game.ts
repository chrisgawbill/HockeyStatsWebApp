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
export type CardBlockReason =
  'energy' | 'shotOnly' | 'checkOnly' | 'faceoffOnly';

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

/**
 * Result of the symmetric head-to-head faceoff contest (BG-A15b cycle 2's
 * `rollFaceoffHeadToHead`): pure model output for one resolved pair of
 * bands, from the user's point of view. `engine/faceoffDuel.ts` turns this
 * into the richer, duel-flow-aware `FaceoffDuelResult` (jump/re-drop and
 * `scrumOnLoss` live there, not here - this function only decides a winner
 * given two already-real bands).
 */
export interface FaceoffHeadToHeadResult {
  /**
   * `'scrum'` when neither side read `clean` - no roll is made, `userWins`
   * and `winChance` are both meaningless (`false`/`0`). `'win'` otherwise:
   * a roll was made and `userWins` says who it favoured.
   */
  outcome: 'win' | 'scrum';
  /** True if the user's side won the roll. Only meaningful when `outcome` is `'win'`. */
  userWins: boolean;
  /** The user's clamped win chance actually rolled against, 0-100, for tests/UI display. 0 on a `scrum` (no roll). */
  winChance: number;
}

/**
 * The user centre's-eye-view result of a fully resolved faceoff draw
 * (BG-A15b cycle 2), surfaced on `GameState.lastFaceoffResult` for the UI
 * (BG-B25) and read by `engine/duelOutcome.ts`'s `applyOutcome` off
 * `DuelState.faceoffResult`. Wraps `rollFaceoffHeadToHead`'s bare
 * win/scrum roll with the duel-flow context the UI needs to narrate the
 * draw: both sides' actual bands, and whether a repeat jump ended it
 * without a roll at all.
 */
export interface FaceoffDuelResult {
  /**
   * The user centre's own reaction band. `'jump'` only on a repeat false
   * start (`forfeitedByJump: true`) - the user's first jump this duel
   * always re-drops instead of producing a `FaceoffDuelResult` at all.
   */
  userBand: FaceoffBand;
  /** The CPU centre's own reaction band. Never `'jump'` - that's a human-only false start. */
  cpuBand: Exclude<FaceoffBand, 'jump'>;
  /** From the user centre's side: did they win the puck, lose it, or was it a scrum. */
  outcome: 'win' | 'loss' | 'scrum';
  /**
   * The user's clamped win chance actually rolled against, 0-100 (mirrors
   * `rollFaceoffHeadToHead`'s `winChance`). 0 on a `scrum` and 0 on a
   * repeat-jump forfeit - both resolve without a roll.
   */
  winChance: number;
  /**
   * True only when the user's SECOND jump this duel ended the draw
   * outright: no roll was made, the CPU wins by default (its own card's
   * `faceoffEffect` can still fire, gated on its own `cpuBand` as usual).
   */
  forfeitedByJump: boolean;
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
  /**
   * Faceoff duel only (BG-A15b): the user centre's picked ante card id, once
   * chosen from the offer sitting in `deck.hand`. Null before the pick and
   * for every other duel kind.
   */
  faceoffPickedCardId: string | null;
  /**
   * Faceoff duel only (BG-A15b): the CPU centre's picked ante card id,
   * chosen immediately when the duel is created (the CPU has no UI to wait
   * on). Null when the faceoff pool was exhausted and the CPU drew no card.
   */
  faceoffCpuCardId: string | null;
  /**
   * Faceoff duel only (BG-A15b): true once the user's draw has already had
   * one false start this duel, so a second `jump` is a repeat (outright
   * loss, not a re-drop) and `faceoffBandWindowsFor` narrows the clean
   * window on the retry - unless the picked card's `freeJump` effect says
   * otherwise.
   */
  faceoffJumped: boolean;
  /**
   * Faceoff duel only (BG-A15b cycle 2): the fully resolved head-to-head
   * result once both centres' bands are in - `applyOutcome` reads this to
   * place the puck and fire effects. Null until resolved (including while
   * a re-drop is pending).
   */
  faceoffResult: FaceoffDuelResult | null;
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
  /**
   * The `FaceoffDuelResult` for the faceoff `RESOLVE_FACEOFF_BAND`/
   * `AUTO_RESOLVE_FACEOFF` most recently resolved (BG-A15b), mirroring
   * `lastShotSaveResult`'s lifecycle: null on `NEW_GAME` and
   * `DISMISS_DUEL_RESULT`, set whenever a faceoff resolves, otherwise
   * stale-but-unread between faceoffs. Carries both centres' bands, so the
   * UI (BG-B25) can narrate the draw ("you were clean, they were late")
   * without reaching into the (by-then-cleared) `DuelState`.
   */
  lastFaceoffResult: FaceoffDuelResult | null;
  /**
   * The faceoff dot the current/most recent draw happened at (BG-A15b):
   * `FACEOFF_SPOTS.centreIce` for a new game or a boxed-in whistle, or one
   * of `FACEOFF_SPOTS.defendingDots[team]` for a covered-puck whistle. Set
   * whenever a whistle moves `phase` to `'faceoff'`, read by
   * `createFaceoffDuel` (full formation reset vs. two-centres-only) and by
   * `applyOutcome`'s scrum branch (which tile the loose puck lands on).
   */
  faceoffSpot: Coord;
  /**
   * MP to add on top of the next `ROLL_DICE` roll (BG-A15b's `bonusMp`
   * faceoff effect). Zero except right after a clean faceoff win with that
   * effect; `ROLL_DICE` consumes and clears it.
   */
  pendingBonusMp: number;
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
  /** Faceoff duel only (BG-A15b): the user centre picks their ante card, offered at `deck.hand[handIndex]`. */
  | { type: 'PICK_FACEOFF_CARD'; handIndex: number }
  /** Faceoff duel only (BG-A15b): the UI reports the drop's reaction band, so the engine can roll the contest. */
  | { type: 'RESOLVE_FACEOFF_BAND'; band: FaceoffBand }
  /** Faceoff duel only (BG-A15b): resolves without a real reaction press, rolling a band from the picked card's anticipation - `prefers-reduced-motion` and headless play. */
  | { type: 'AUTO_RESOLVE_FACEOFF' }
  | { type: 'DISMISS_DUEL_RESULT' }
  | { type: 'NEW_GAME'; seed: number; length: GameLength };
