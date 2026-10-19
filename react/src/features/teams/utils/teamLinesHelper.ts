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

function slotRank(order: LineSlot[], slot: LineSlot): number {
  const i = order.indexOf(slot);
  return i === -1 ? order.length : i;
}

function resolveTokens(
  entries: { id: number; slot: LineSlot }[] | undefined,
  order: LineSlot[],
  byId: Map<number, RosterPlayer>,
  used: Set<number>,
): LineToken[] {
  const tokens: LineToken[] = [];
  for (const entry of entries ?? []) {
    const player = byId.get(entry.id);
    if (!player || used.has(entry.id)) continue;
    used.add(entry.id);
    tokens.push({ slot: entry.slot, player });
  }
  return tokens.sort(
    (a, b) => slotRank(order, a.slot) - slotRank(order, b.slot),
  );
}

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
    [...forwards, ...roster.Defenseman].map((p) => [p.id, p]),
  );

  let source: TeamLinesView['source'] = 'projected';
  let forwardLines: DisplayLine[] = [];
  let defensePairs: DisplayLine[] = [];
  const used = new Set<number>();

  if (dto?.source === 'shifts') {
    forwardLines = (dto.forwardLines ?? [])
      .map((l) => ({
        tokens: resolveTokens(l.players, FORWARD_ORDER, skaterById, used),
        seconds: l.togetherSeconds,
      }))
      .filter((l) => l.tokens.length > 0)
      .map((l, i) => toDisplayLine(i, 'Line', l.tokens, l.seconds));
    defensePairs = (dto.defensePairs ?? [])
      .map((p) => ({
        tokens: resolveTokens(p.players, DEFENSE_ORDER, skaterById, used),
        seconds: p.togetherSeconds,
      }))
      .filter((p) => p.tokens.length > 0)
      .map((p, i) => toDisplayLine(i, 'Pair', p.tokens, p.seconds));
    if (forwardLines.length > 0 || defensePairs.length > 0) {
      source = 'shifts';
    }
  }

  if (source === 'projected') {
    used.clear();
    const slotById = new Map<number, LineSlot>();
    for (const [pos, slot] of Object.entries(POSITION_SLOT)) {
      for (const p of roster[pos as Position]) slotById.set(p.id, slot);
    }
    forwardLines = buildForwardLines(roster)
      .filter((l) => l.label)
      .map((l, i) =>
        toDisplayLine(
          i,
          'Line',
          l.players.map((player) => {
            used.add(player.id);
            return { slot: slotById.get(player.id) ?? 'C', player };
          }),
          null,
        ),
      );
    defensePairs = buildDefensePairs(roster)
      .filter((l) => l.label)
      .map((l, i) =>
        toDisplayLine(
          i,
          'Pair',
          l.players.map((player, j) => {
            used.add(player.id);
            return { slot: j === 0 ? 'LD' : 'RD', player };
          }),
          null,
        ),
      );
  }

  const goalies = roster.Goalie;
  const starterId = source === 'shifts' ? dto?.goalies?.starterId : null;
  const starter = goalies.find((g) => g.id === starterId) ?? goalies[0] ?? null;

  return {
    source,
    game: source === 'shifts' ? (dto?.game ?? null) : null,
    forwardLines,
    defensePairs,
    extras: {
      forwards: forwards.filter((p) => !used.has(p.id)),
      defense: roster.Defenseman.filter((p) => !used.has(p.id)),
    },
    starter,
    backups: goalies.filter((g) => g !== starter),
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

/** "Connor McDavid, number 97, center" */
export function buildTokenAriaLabel(
  player: RosterPlayer,
  slot: TokenSlot,
): string {
  return `${player.name}, number ${player.number}, ${SLOT_WORDS[slot]}`;
}
