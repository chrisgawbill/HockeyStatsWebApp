import { getGameStoryFacts } from '@/features/game-detail/utils/gameStoryHelper';
import { landingWithGoals } from '@/test/fixtures/matchup';
import { describe, expect, it } from 'vitest';

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

  it('returns empty or partial facts for missing or incomplete scoring', () => {
    const facts = getGameStoryFacts(null, 'AWY', 'HOM');
    expect(facts).toEqual({
      scoringEvents: [],
      tiedEventIndexes: [],
      leadChanges: [],
      firstLead: null,
      largestLead: null,
      turningPoints: [],
    });

    // An event with incomplete scores yields no lead facts.
    const landing = landingWithGoals([
      { team: 'AWY', awayScore: Number.NaN, homeScore: 0 },
    ]);
    const partial = getGameStoryFacts(landing, 'AWY', 'HOM');

    expect(partial.scoringEvents[0]?.gameState).toBeNull();
    expect(partial.firstLead).toBeNull();
    expect(partial.largestLead).toBeNull();
  });
});
