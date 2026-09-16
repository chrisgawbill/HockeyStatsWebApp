import { describe, expect, it } from 'vitest';
import { GameLanding } from '@/features/game-detail/types/gameDetail';
import { getGameStoryFacts } from '@/features/game-detail/utils/gameStoryHelper';

function landingWithGoals(
  goals: Array<{
    team: string;
    awayScore: number;
    homeScore: number;
    period?: number;
    time?: string;
  }>,
): GameLanding {
  return {
    id: 1,
    gameState: 'FINAL',
    summary: {
      scoring: [
        {
          periodDescriptor: { number: 1, periodType: 'REG' },
          goals: goals
            .filter((goal) => (goal.period ?? 1) === 1)
            .map((goal) => ({
              strength: 'ev',
              name: { default: `${goal.team} scorer` },
              teamAbbrev: { default: goal.team },
              headshot: '',
              timeInPeriod: goal.time ?? '10:00',
              goalModifier: 'none',
              awayScore: goal.awayScore,
              homeScore: goal.homeScore,
              isHome: goal.team === 'HOM',
              assists: [],
            })),
        },
        {
          periodDescriptor: { number: 2, periodType: 'REG' },
          goals: goals
            .filter((goal) => goal.period === 2)
            .map((goal) => ({
              strength: 'pp',
              name: { default: `${goal.team} scorer` },
              teamAbbrev: { default: goal.team },
              headshot: '',
              timeInPeriod: goal.time ?? '10:00',
              goalModifier: 'none',
              awayScore: goal.awayScore,
              homeScore: goal.homeScore,
              isHome: goal.team === 'HOM',
              assists: [],
            })),
        },
      ],
      threeStars: [],
    },
  };
}

describe('getGameStoryFacts', () => {
  it('keeps scoring events in source order and derives ties and lead changes', () => {
    const facts = getGameStoryFacts(
      landingWithGoals([
        { team: 'AWY', awayScore: 1, homeScore: 0 },
        { team: 'HOM', awayScore: 1, homeScore: 1 },
        { team: 'HOM', awayScore: 1, homeScore: 2 },
        { team: 'AWY', awayScore: 2, homeScore: 2, period: 2 },
        { team: 'AWY', awayScore: 3, homeScore: 2, period: 2 },
      ]),
      'AWY',
      'HOM',
    );

    expect(facts.scoringEvents.map((event) => event.teamAbbrev)).toEqual([
      'AWY',
      'HOM',
      'HOM',
      'AWY',
      'AWY',
    ]);
    expect(facts.tiedEventIndexes).toEqual([1, 3]);
    expect(facts.leadChanges.map((change) => change.teamAbbrev)).toEqual([
      'HOM',
      'AWY',
    ]);
    expect(facts.firstLead?.eventIndex).toBe(0);
    expect(facts.largestLead?.eventIndex).toBe(0);
  });

  it('returns empty facts when the scoring block is absent', () => {
    const facts = getGameStoryFacts(null, 'AWY', 'HOM');
    expect(facts).toEqual({
      scoringEvents: [],
      tiedEventIndexes: [],
      leadChanges: [],
      firstLead: null,
      largestLead: null,
      turningPoints: [],
    });
  });

  it('does not derive lead facts from an event with incomplete scores', () => {
    const landing = landingWithGoals([
      { team: 'AWY', awayScore: Number.NaN, homeScore: 0 },
    ]);
    const facts = getGameStoryFacts(landing, 'AWY', 'HOM');

    expect(facts.scoringEvents[0]?.gameState).toBeNull();
    expect(facts.firstLead).toBeNull();
    expect(facts.largestLead).toBeNull();
  });
});
