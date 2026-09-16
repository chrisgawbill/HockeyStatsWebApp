import { describe, expect, it } from 'vitest';
import { StandingsTeam } from '@/features/standings/types/standingsTeam';
import { derivePlayoffRace, PlayoffRaceGame } from './playoffRaceHelper';

function team(id: string, place: number, points: number): StandingsTeam {
  return new StandingsTeam(
    id, '', id, 'Eastern', '', 0, 0, 0, points, 0, place, place, place, 0, '', 0, '',
  );
}

function game(homeTeam: string, awayTeam: string, gameState = 'FUT'): PlayoffRaceGame {
  return { homeTeam, awayTeam, gameState, isPlayoff: false, isPreseason: false };
}

describe('derivePlayoffRace', () => {
  it('calculates remaining, maximum points, cutline pace, and magic number', () => {
    const standings = Array.from({ length: 9 }, (_, index) =>
      team(`T${index + 1}`, index + 1, 100 - index * 4),
    );
    const result = derivePlayoffRace(standings, [game('T1', 'T9'), game('T9', 'T2')]);

    expect(result.cutlinePoints).toBe(72);
    expect(result.teams[0]).toMatchObject({ remainingGames: 1, maxPossiblePoints: 102, magicNumber: 0 });
    expect(result.teams[8]).toMatchObject({ remainingGames: 2, maxPossiblePoints: 72, status: 'chasing' });
  });

  it('identifies a chasing team that can still reach the cutline', () => {
    const standings = Array.from({ length: 10 }, (_, index) =>
      team(`T${index + 1}`, index + 1, 100 - index * 2),
    );
    const result = derivePlayoffRace(standings, [game('T9', 'T10'), game('T9', 'T1')]);

    expect(result.teams[8]).toMatchObject({ maxPossiblePoints: 88, status: 'chasing', tragicNumber: 3 });
    expect(result.teams[9].status).toBe('eliminated');
    expect(result.teams[7].status).toBe('playoff-position');
  });

  it('handles completed seasons and ignores preseason/playoff games', () => {
    const standings = Array.from({ length: 8 }, (_, index) => team(`T${index + 1}`, index + 1, 100 - index));
    const result = derivePlayoffRace(standings, [
      game('T1', 'T2', 'OFF'),
      { ...game('T1', 'T2'), isPlayoff: true },
      { ...game('T1', 'T2'), isPreseason: true },
    ]);

    expect(result.seasonOver).toBe(true);
    expect(result.teams[0].requiredPace).toBeNull();
    expect(result.teams[0].status).toBe('playoff-position');
  });
});
