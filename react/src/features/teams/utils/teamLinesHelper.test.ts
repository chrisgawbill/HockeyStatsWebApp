import {
  buildTeamLinesView,
  buildTokenAriaLabel,
  formatGameDate,
  formatLineCaption,
  formatTogether,
  getLastName,
} from '@/features/teams/utils/teamLinesHelper';
import { player, roster } from '@/test/fixtures/teams';
import { baseRoster, dto, lineGame as game } from '@/test/fixtures/teams';
import { describe, expect, it } from 'vitest';

describe('buildTeamLinesView', () => {
  it('maps shift lines to roster players, dropping unknown ids, with extras and goalies', () => {
    const view = buildTeamLinesView(baseRoster, dto());
    expect(view.source).toBe('shifts');
    expect(
      view.forwardLines[0].tokens.map((t) => [t.slot, t.player.id]),
    ).toEqual([
      ['LW', 3],
      ['C', 1],
      ['RW', 5],
    ]);
    expect(view.defensePairs[0].tokens.map((t) => t.slot)).toEqual([
      'LD',
      'RD',
    ]);
    expect(view.forwardLines[0].pagerLabel).toBe('L1');
    expect(view.defensePairs[0].pagerLabel).toBe('P1');
    expect(view.forwardLines[0].togetherSeconds).toBe(872);

    // Drops ids that are not on the roster and empty lines.
    {
      const view = buildTeamLinesView(
        baseRoster,
        dto({
          forwardLines: [
            { players: [{ id: 999, slot: 'C' }], togetherSeconds: 10 },
            {
              players: [
                { id: 2, slot: 'C' },
                { id: 998, slot: 'LW' },
              ],
              togetherSeconds: 20,
            },
          ],
        }),
      );
      expect(view.forwardLines).toHaveLength(1);
      expect(view.forwardLines[0].label).toBe('Line 1');
      expect(view.forwardLines[0].tokens.map((t) => t.player.id)).toEqual([2]);
    }

    // Computes extras as skaters not in any line or pair.
    {
      const view = buildTeamLinesView(baseRoster, dto());
      expect(view.extras.forwards.map((p) => p.id).sort()).toEqual([2, 4, 6]);
      expect(view.extras.defense.map((p) => p.id)).toEqual([9]);
    }

    // Uses the API starter and treats the rest as backups.
    {
      const view = buildTeamLinesView(baseRoster, dto());
      expect(view.starter?.id).toBe(11);
      expect(view.backups.map((g) => g.id)).toEqual([10]);
    }
  });

  it('falls back to projected lines when shifts are unavailable or unusable', () => {
    const view = buildTeamLinesView(
      baseRoster,
      dto({ source: 'none', game: null, forwardLines: [], defensePairs: [] }),
    );
    expect(view.source).toBe('projected');
    expect(view.game).toBeNull();
    expect(view.forwardLines).toHaveLength(2);
    expect(
      view.forwardLines[0].tokens.map((t) => [t.slot, t.player.id]),
    ).toEqual([
      ['LW', 3],
      ['C', 1],
      ['RW', 5],
    ]);
    expect(
      view.defensePairs.map((p) => p.tokens.map((t) => t.player.id)),
    ).toEqual([[7, 8], [9]]);
    expect(view.starter?.id).toBe(10);
    expect(view.extras.forwards).toEqual([]);

    // Falls back when the request failed (null) or every id is unknown.
    {
      expect(buildTeamLinesView(baseRoster, null).source).toBe('projected');
      const view = buildTeamLinesView(
        baseRoster,
        dto({
          forwardLines: [
            { players: [{ id: 999, slot: 'C' }], togetherSeconds: 1 },
          ],
          defensePairs: [],
        }),
      );
      expect(view.source).toBe('projected');
    }

    // Keeps extras beyond the labeled projected lines.
    {
      const many = roster({
        Defenseman: [1, 2, 3, 4, 5, 6, 7].map((i) => player(i)),
      });
      const view = buildTeamLinesView(many, null);
      expect(view.defensePairs).toHaveLength(3);
      expect(view.extras.defense.map((p) => p.id)).toEqual([7]);
    }
  });
});

describe('caption and formatting helpers', () => {
  it('formats shift and projected captions, times, dates, names, and labels', () => {
    const view = buildTeamLinesView(baseRoster, dto());
    expect(formatLineCaption(view.forwardLines[0], view)).toBe(
      'Line 1 · 14:32 together vs BOS · Oct 18',
    );

    // Says "at" for away games.
    {
      const view = buildTeamLinesView(
        baseRoster,
        dto({ game: { ...game, homeAway: 'away' } }),
      );
      expect(formatLineCaption(view.forwardLines[0], view)).toBe(
        'Line 1 · 14:32 together at BOS · Oct 18',
      );
    }

    // Formats projected captions.
    {
      const view = buildTeamLinesView(baseRoster, null);
      expect(formatLineCaption(view.forwardLines[0], view)).toBe(
        'Line 1 · Projected from ice time',
      );
    }

    // Formats time, dates, names and labels.
    expect(formatTogether(65)).toBe('1:05');
    expect(formatGameDate('2026-01-03')).toBe('Jan 3');
    expect(getLastName('Pierre-Luc Dubois')).toBe('Dubois');
    expect(getLastName('Madonna')).toBe('Madonna');
    expect(buildTokenAriaLabel(player(97, 'Connor McDavid'), 'C')).toBe(
      '97 McDavid C: Connor McDavid, center',
    );
    expect(buildTokenAriaLabel(player(97, 'Connor McDavid'), 'C', false)).toBe(
      '97 McDavid: Connor McDavid, center',
    );
  });
});
