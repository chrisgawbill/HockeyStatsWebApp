import { describe, expect, it } from 'vitest';
import { Team } from '@/features/teams/types/team';
import { TeamStats } from '@/features/teams/types/teamStats';
import {
  buildTeamDna,
  competitionRank,
  ordinal,
  scalePosition,
  tierForRank,
} from '@/lib/teamDna';

const SEASON = '20262027';

interface Overrides {
  gf?: number;
  ga?: number;
  pp?: number;
  pk?: number;
  sf?: number;
  sa?: number;
  fo?: number;
  gp?: number;
}

function team(id: number, name: string, o: Overrides = {}): Team {
  const gp = o.gp ?? 40;
  return new Team(id, name, [
    new TeamStats(
      Number(SEASON),
      gp - 10,
      0,
      0,
      7,
      3,
      0,
      o.fo ?? 0.5,
      0,
      o.ga ?? 3,
      0,
      o.gf ?? 3,
      o.pk ?? 0.8,
      o.pp ?? 0.2,
      o.sa ?? 30,
      o.sf ?? 30,
    ),
  ]);
}

/** n teams; team `i` (1-based) gets GF 2+i/10 so team n is best offense. */
function league(n: number, tweak?: (i: number) => Overrides): Team[] {
  return Array.from({ length: n }, (_, k) => {
    const i = k + 1;
    return team(i, `Team ${i}`, {
      gf: 2 + i / 10,
      ga: 2 + i / 10,
      pp: 0.1 + i / 100,
      pk: 0.7 + i / 100,
      sf: 25 + i,
      sa: 25 + i,
      fo: 0.45 + i / 200,
      ...tweak?.(i),
    });
  });
}

const row = (profile: ReturnType<typeof buildTeamDna>, key: string) =>
  profile.rows.find((r) => r.key === key)!;

function build(teams: Team[], name: string, extra = {}) {
  return buildTeamDna({
    stats: { teamFullName: name, wins: 30, losses: 7, otLosses: 3 },
    league: teams,
    season: SEASON,
    ...extra,
  });
}

describe('ranking helpers', () => {
  it('ranks with competition ties, formats ordinals, maps scores, and assigns tiers', () => {
    expect(competitionRank(5, [5, 4, 3], true)).toBe(1);
    expect(competitionRank(3, [5, 4, 3], true)).toBe(3);
    expect(competitionRank(3, [5, 4, 3], false)).toBe(1);
    expect(competitionRank(4, [5, 4, 4, 3], true)).toBe(2);
    expect(competitionRank(3, [5, 4, 4, 3], true)).toBe(4);

    // Formats ordinals.
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 32].map(ordinal)).toEqual([
      '1st',
      '2nd',
      '3rd',
      '4th',
      '11th',
      '12th',
      '13th',
      '21st',
      '22nd',
      '32nd',
    ]);

    // Maps best to 100, worst to 4, and honors direction.
    const values = [1, 2, 3];
    expect(scalePosition(3, values, true)).toBe(100);
    expect(scalePosition(1, values, true)).toBe(4);
    expect(scalePosition(1, values, false)).toBe(100);
    expect(scalePosition(3, values, false)).toBe(4);
    expect(scalePosition(2, values, true)).toBeCloseTo(52);

    // Assigns tiers by rank among N.
    const tiers = Array.from({ length: 32 }, (_, k) => tierForRank(k + 1, 32));
    expect(tiers.slice(0, 5)).toEqual(Array(5).fill('elite'));
    expect(tiers[5]).toBe('above');
    expect(tiers[9]).toBe('above');
    expect(tiers[10]).toBe('average');
    expect(tiers[20]).toBe('average');
    expect(tiers[21]).toBe('below');
    expect(tiers[26]).toBe('below');
    expect(tiers.slice(27)).toEqual(Array(5).fill('weak'));
  });
});

describe('buildTeamDna', () => {
  it('produces seven ranked rows with formatted values, directions, and competition ties', () => {
    const p = build(league(32), 'Team 32');
    expect(p.rows.map((r) => r.key)).toEqual([
      'offense',
      'defense',
      'power-play',
      'penalty-kill',
      'shot-volume',
      'shot-suppression',
      'faceoffs',
    ]);
    expect(row(p, 'offense').value).toBe('5.20 GF/GP');
    expect(row(p, 'defense').value).toBe('5.20 GA/GP');
    expect(row(p, 'power-play').value).toBe('42.0%');
    expect(row(p, 'shot-volume').value).toBe('57.0 shots/GP');
    expect(row(p, 'shot-suppression').value).toBe('57.0 against/GP');
    expect(row(p, 'faceoffs').value).toBe('61.0%');
    expect(p.ranked).toBe(true);
    expect(p.teamCount).toBe(32);
    expect(p.gamesPlayed).toBe(40);

    // Ranks higher-better and lower-better metrics in opposite directions.
    {
      const p = build(league(32), 'Team 32');
      expect(row(p, 'offense').rank).toBe(1);
      expect(row(p, 'defense').rank).toBe(32);
      expect(row(p, 'defense').fill).toBe(4);
      expect(row(p, 'offense').fill).toBe(100);
      expect(row(p, 'shot-suppression').rank).toBe(32);
    }

    // Uses standard competition ranking for ties.
    {
      const teams = league(6, (i) => ({ gf: i <= 2 ? 4 : 2 + i / 10 }));
      const p = build(teams, 'Team 1');
      // Teams 1 and 2 tie at 4.0 and trail only Team 6 (2.6)? no: 4.0 is best.
      expect(row(p, 'offense').rank).toBe(1);
      expect(row(build(teams, 'Team 2'), 'offense').rank).toBe(1);
      expect(row(build(teams, 'Team 6'), 'offense').rank).toBe(3);
    }
  });

  it('handles partial leagues, the average tick, and id matching', () => {
    const p = build(league(30), 'Team 1');
    expect(p.teamCount).toBe(30);
    expect(row(p, 'offense').of).toBe(30);
    expect(row(p, 'offense').rank).toBe(30);
    expect(row(p, 'offense').tier).toBe('weak');

    // Places the league average tick on the same scale.
    {
      // Offense values 2.1..5.2 are evenly spaced, so the mean is the midpoint.
      const p = build(league(32), 'Team 1');
      expect(row(p, 'offense').average).toBeCloseTo(52, 5);
      // Lower-better: mean is mirrored but still the midpoint here.
      expect(row(p, 'defense').average).toBeCloseTo(52, 5);
      const skewed = league(4, (i) => ({ gf: i === 4 ? 10 : 2 }));
      const q = build(skewed, 'Team 1');
      // mean = 4, worst = 2, best = 10 -> 4 + (2/8) * 96 = 28
      expect(row(q, 'offense').average).toBeCloseTo(28, 5);
      expect(row(q, 'offense').fill).toBe(4);
    }

    // Matches teams by id when the name does not match.
    {
      const p = buildTeamDna({
        stats: { teamFullName: 'Renamed' },
        league: league(32),
        season: SEASON,
        teamId: 32,
      });
      expect(p.ranked).toBe(true);
      expect(row(p, 'offense').rank).toBe(1);
    }
  });

  it('builds strength/weakness chips, neutral and early-season states', () => {
    // Team 32: best offense/PP/PK/volume/faceoffs, worst defense/suppression.
    const p = build(league(32), 'Team 32');
    expect(p.chips.map((c) => [c.kind, c.label])).toEqual([
      ['strength', 'Elite offense'],
      ['strength', 'Elite power play'],
      ['weakness', 'Leaky defense'],
      ['weakness', 'Allows lots of shots'],
    ]);

    // Uses the non-elite strength wording for ranks 6 to 8.
    const seventh = build(
      league(32).map((t) =>
        t.id === 26 ? team(26, 'Team 26', { gf: 4.6 }) : t,
      ),
      'Team 26',
    );
    expect(row(seventh, 'offense').rank).toBe(7);
    expect(seventh.chips).toContainEqual({
      kind: 'strength',
      label: 'Strong offense',
    });

    // Shows a neutral chip when nothing stands out.
    {
      const p = build(league(32), 'Team 16');
      expect(row(p, 'offense').rank).toBe(17);
      expect(row(p, 'defense').rank).toBe(16);
      expect(p.chips).toEqual([
        { kind: 'neutral', label: 'Middle of the pack' },
      ]);
    }

    // Flags early-season samples.
    const teams = league(32).map((t) => t);
    teams[0] = team(1, 'Team 1', { gp: 4 });
    expect(build(teams, 'Team 1').earlySample).toBe(true);
    expect(build(teams, 'Team 2').earlySample).toBe(false);
  });

  it('falls back to own stats without ranks when league data is unusable, else no rows', () => {
    const p = buildTeamDna({
      stats: {
        teamFullName: 'Team 1',
        wins: 1,
        losses: 2,
        otLosses: 0,
        goalsForPerGame: 3.123,
        goalsAgainstPerGame: 2.71,
        powerPlayPct: 0.241,
        penaltyKillPct: 0.8,
        shotsForPerGame: 31.4,
        shotsAgainstPerGame: 28.9,
        faceoffWinPct: 0.512,
      },
      league: [],
      season: SEASON,
    });
    expect(p.ranked).toBe(false);
    expect(p.chips).toEqual([]);
    expect(p.rows).toHaveLength(7);
    expect(p.rows.every((r) => r.rank == null && r.fill == null)).toBe(true);
    expect(row(p, 'power-play').value).toBe('24.1%');
    expect(row(p, 'faceoffs').value).toBe('51.2%');
    expect(p.earlySample).toBe(true);

    // Falls back when the team is missing from the league data.
    {
      const p = buildTeamDna({
        stats: { teamFullName: 'Ghost FC', goalsForPerGame: 3 },
        league: league(32),
        season: SEASON,
      });
      expect(p.ranked).toBe(false);
      expect(p.rows.map((r) => r.key)).toEqual(['offense']);
    }

    // Falls back when the league has no rows for the season.
    {
      const p = buildTeamDna({
        stats: { teamFullName: 'Team 1', goalsForPerGame: 3 },
        league: league(32),
        season: '20252026',
      });
      expect(p.ranked).toBe(false);
    }

    // Returns no rows when neither source has data.
    {
      const p = buildTeamDna({
        stats: { teamFullName: '' },
        league: [],
        season: SEASON,
      });
      expect(p.rows).toEqual([]);
    }
  });
});
