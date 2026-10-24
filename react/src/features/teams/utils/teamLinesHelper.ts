import { Position, RosterPlayer } from '@/features/teams/types/teamPageTypes';
import {
  LineSlot,
  TeamLinesDto,
  TeamLinesGameDto,
} from '@/features/teams/types/teamLines';
import {
  buildDefensePairs,
  buildForwardLines,
} from '@/features/teams/utils/teamPageHelper';

export interface LineToken {
  slot: LineSlot;
  player: RosterPlayer;
}

export interface DisplayLine {
  key: string;
  /** "Line 1" / "Pair 1" */
  label: string;
  /** Pager label: "L1" / "P1" */
  pagerLabel: string;
  tokens: LineToken[];
  /** Seconds the group shared the ice; null when projected. */
  togetherSeconds: number | null;
}

export interface TeamLinesView {
  source: 'shifts' | 'projected';
  game: TeamLinesGameDto | null;
  forwardLines: DisplayLine[];
  defensePairs: DisplayLine[];
  /** Skaters on the roster that are not in any line/pair. */
  extras: { forwards: RosterPlayer[]; defense: RosterPlayer[] };
  starter: RosterPlayer | null;
  backups: RosterPlayer[];
}

const FORWARD_ORDER: LineSlot[] = ['LW', 'C', 'RW'];
const DEFENSE_ORDER: LineSlot[] = ['LD', 'RD'];

const POSITION_SLOT: Partial<Record<Position, LineSlot>> = {
  'Left Wing': 'LW',
  Center: 'C',
  'Right Wing': 'RW',
};

/** Sort position of a slot within a line's usual left-to-right order. */
function slotRank(order: LineSlot[], slot: LineSlot): number {
  const rank = order.indexOf(slot);
  return rank === -1 ? order.length : rank;
}

/**
 * Maps a line's player ids onto roster players, in slot order. Ids missing
 * from the roster, or already placed in an earlier line (tracked in
 * `usedPlayerIds`), are dropped.
 */
function resolveTokens(
  entries: { id: number; slot: LineSlot }[] | undefined,
  order: LineSlot[],
  playersById: Map<number, RosterPlayer>,
  usedPlayerIds: Set<number>,
): LineToken[] {
  const tokens: LineToken[] = [];
  for (const entry of entries ?? []) {
    const player = playersById.get(entry.id);
    if (!player || usedPlayerIds.has(entry.id)) continue;
    usedPlayerIds.add(entry.id);
    tokens.push({ slot: entry.slot, player });
  }
  return tokens.sort(
    (first, second) =>
      slotRank(order, first.slot) - slotRank(order, second.slot),
  );
}

/** Labels a group of tokens as "Line N" or "Pair N" for display. */
function toDisplayLine(
  index: number,
  prefix: 'Line' | 'Pair',
  tokens: LineToken[],
  togetherSeconds: number | null,
): DisplayLine {
  return {
    key: `${prefix.toLowerCase()}-${index + 1}`,
    label: `${prefix} ${index + 1}`,
    pagerLabel: `${prefix === 'Line' ? 'L' : 'P'}${index + 1}`,
    tokens,
    togetherSeconds,
  };
}

/** Builds lines from the API's shift-based groups, skipping groups that map to no roster player. */
function buildShiftBasedGroups(
  groups: {
    players: { id: number; slot: LineSlot }[];
    togetherSeconds: number;
  }[],
  prefix: 'Line' | 'Pair',
  slotOrder: LineSlot[],
  playersById: Map<number, RosterPlayer>,
  usedPlayerIds: Set<number>,
): DisplayLine[] {
  return groups
    .map((group) => ({
      tokens: resolveTokens(
        group.players,
        slotOrder,
        playersById,
        usedPlayerIds,
      ),
      seconds: group.togetherSeconds,
    }))
    .filter((group) => group.tokens.length > 0)
    .map((group, index) =>
      toDisplayLine(index, prefix, group.tokens, group.seconds),
    );
}

/**
 * Builds lines projected from ice time (no shift data), recording every
 * placed player in `usedPlayerIds`. Forward slots follow each player's
 * position; defensemen are left then right in listed order.
 */
function buildProjectedLines(
  roster: Record<Position, RosterPlayer[]>,
  usedPlayerIds: Set<number>,
) {
  const slotByPlayerId = new Map<number, LineSlot>();
  for (const [position, slot] of Object.entries(POSITION_SLOT)) {
    for (const player of roster[position as Position])
      slotByPlayerId.set(player.id, slot);
  }
  const forwardLines = buildForwardLines(roster)
    .filter((line) => line.label)
    .map((line, index) =>
      toDisplayLine(
        index,
        'Line',
        line.players.map((player) => {
          usedPlayerIds.add(player.id);
          return { slot: slotByPlayerId.get(player.id) ?? 'C', player };
        }),
        null,
      ),
    );
  const defensePairs = buildDefensePairs(roster)
    .filter((pair) => pair.label)
    .map((pair, index) =>
      toDisplayLine(
        index,
        'Pair',
        pair.players.map((player, playerIndex) => {
          usedPlayerIds.add(player.id);
          return { slot: playerIndex === 0 ? 'LD' : 'RD', player };
        }),
        null,
      ),
    );
  return { forwardLines, defensePairs };
}

/**
 * Turns the roster plus the (optional) `/team/lines` response into what the
 * Roster tab renders. Real shift-based lines are used when the response has
 * source "shifts" and at least one line survives mapping to the roster;
 * otherwise lines are projected from ice time via buildForwardLines /
 * buildDefensePairs. Ids that are not on the roster are dropped.
 */
export function buildTeamLinesView(
  roster: Record<Position, RosterPlayer[]>,
  dto: TeamLinesDto | null,
): TeamLinesView {
  const forwards = [
    ...roster['Left Wing'],
    ...roster.Center,
    ...roster['Right Wing'],
  ];
  const skaterById = new Map(
    [...forwards, ...roster.Defenseman].map((player) => [player.id, player]),
  );

  let source: TeamLinesView['source'] = 'projected';
  let forwardLines: DisplayLine[] = [];
  let defensePairs: DisplayLine[] = [];
  const usedPlayerIds = new Set<number>();

  if (dto?.source === 'shifts') {
    forwardLines = buildShiftBasedGroups(
      dto.forwardLines ?? [],
      'Line',
      FORWARD_ORDER,
      skaterById,
      usedPlayerIds,
    );
    defensePairs = buildShiftBasedGroups(
      dto.defensePairs ?? [],
      'Pair',
      DEFENSE_ORDER,
      skaterById,
      usedPlayerIds,
    );
    if (forwardLines.length > 0 || defensePairs.length > 0) {
      source = 'shifts';
    }
  }

  if (source === 'projected') {
    usedPlayerIds.clear();
    ({ forwardLines, defensePairs } = buildProjectedLines(
      roster,
      usedPlayerIds,
    ));
  }

  const goalies = roster.Goalie;
  const starterId = source === 'shifts' ? dto?.goalies?.starterId : null;
  const starter =
    goalies.find((goalie) => goalie.id === starterId) ?? goalies[0] ?? null;

  return {
    source,
    game: source === 'shifts' ? (dto?.game ?? null) : null,
    forwardLines,
    defensePairs,
    extras: {
      forwards: forwards.filter((player) => !usedPlayerIds.has(player.id)),
      defense: roster.Defenseman.filter(
        (player) => !usedPlayerIds.has(player.id),
      ),
    },
    starter,
    backups: goalies.filter((goalie) => goalie !== starter),
  };
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** "2025-10-18" -> "Oct 18" (parsed by hand so the time zone cannot shift the day). */
export function formatGameDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return isoDate;
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} ${Number(match[3])}` : isoDate;
}

/** Seconds -> "m:ss". */
export function formatTogether(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Strip caption: real shared-ice time and game for shift-based lines, "Projected" otherwise. */
export function formatLineCaption(
  line: DisplayLine,
  view: Pick<TeamLinesView, 'source' | 'game'>,
): string {
  if (view.source !== 'shifts' || line.togetherSeconds == null) {
    return `${line.label} · Projected from ice time`;
  }
  const together = `${formatTogether(line.togetherSeconds)} together`;
  if (!view.game) return `${line.label} · ${together}`;
  return `${line.label} · ${together} ${view.game.homeAway === 'away' ? 'at' : 'vs'} ${view.game.opponent} · ${formatGameDate(view.game.gameDate)}`;
}

/** Everything after the first name token ("Pierre-Luc Dubois" -> "Dubois", "Mikko Van Riemsdyk" -> "Van Riemsdyk"). */
export function getLastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(' ') : name;
}

export type TokenSlot = LineSlot | 'G' | 'F' | 'D';

const SLOT_WORDS: Record<TokenSlot, string> = {
  LW: 'left wing',
  C: 'center',
  RW: 'right wing',
  LD: 'left defense',
  RD: 'right defense',
  G: 'goalie',
  F: 'forward',
  D: 'defense',
};

/**
 * "97 McDavid C: Connor McDavid, center". Starts with the token's visible
 * text (number, last name, slot label when shown) so the spoken name
 * matches what is on screen.
 */
export function buildTokenAriaLabel(
  player: RosterPlayer,
  slot: TokenSlot,
  showSlotLabel = true,
): string {
  const visible = [String(player.number), getLastName(player.name)];
  if (showSlotLabel) visible.push(slot);
  return `${visible.join(' ')}: ${player.name}, ${SLOT_WORDS[slot]}`;
}
