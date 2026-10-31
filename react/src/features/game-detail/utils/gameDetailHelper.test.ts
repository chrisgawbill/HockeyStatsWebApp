import { describe, expect, it } from 'vitest';
import {
  computeTeamTotals,
  getLiveClockLabel,
  getLocalPuckDropTime,
  getPeriodGoalsBreakdown,
  getScheduleClockLabel,
  getStateLabel,
  hasBoxscoreStats,
  hasScoringSummary,
  hasThreeStars,
  mapGameStateToStatus,
} from '@/features/game-detail/utils/gameDetailHelper';
import {
  BoxscoreSkater,
  GameDetailBoxscore,
  GameLanding,
  LandingGoal,
  LandingThreeStar,
} from '@/features/game-detail/types/gameDetail';

/** A skater row with the stats the totals read; the rest are zero. */
function skater(overrides: Partial<BoxscoreSkater>): BoxscoreSkater {
  return {
    playerId: 1,
    sweaterNumber: 1,
    name: { default: 'A. Player' },
    position: 'C',
    goals: 0,
    assists: 0,
    points: 0,
    plusMinus: 0,
    pim: 2,
    hits: 1,
    powerPlayGoals: 1,
    sog: 0,
    faceoffWinningPctg: null,
    toi: '10:00',
    blockedShots: 0,
    shifts: 10,
    giveaways: 1,
    takeaways: 0,
    ...overrides,
  };
}

describe('computeTeamTotals', () => {
  it('sums every tracked stat', () => {
    const totals = computeTeamTotals(
      { forwards: [skater({}), skater({})], defense: [], goalies: [] },
      20,
    );
    expect(totals).toMatchObject({ pim: 4, powerPlayGoals: 2, giveaways: 2 });
  });

  it('leaves stats the AHL feed lacks as null instead of 0', () => {
    const ahlSkater = skater({
      powerPlayGoals: null,
      giveaways: null,
      takeaways: null,
    });
    const totals = computeTeamTotals(
      { forwards: [ahlSkater], defense: [], goalies: [] },
      20,
    );
    expect(totals).toMatchObject({
      pim: 2,
      powerPlayGoals: null,
      giveaways: null,
      takeaways: null,
    });
  });
});

/** A boxscore with only the fields the status helpers read; the rest are cast away. */
function boxscore(overrides: Partial<GameDetailBoxscore>): GameDetailBoxscore {
  return {
    gameState: 'LIVE',
    periodDescriptor: { number: 2, periodType: 'REG' },
    ...overrides,
  } as GameDetailBoxscore;
}

/** A goal scored by `teamAbbrev`; other fields are irrelevant to the helpers. */
function goal(teamAbbrev: string): LandingGoal {
  return { teamAbbrev: { default: teamAbbrev } } as LandingGoal;
}

/** A landing payload with the given scoring periods and three stars. */
function landing(
  scoring: GameLanding['summary']['scoring'],
  threeStars: LandingThreeStar[] = [],
): GameLanding {
  return { id: 1, gameState: 'OFF', summary: { scoring, threeStars } };
}

describe('mapGameStateToStatus', () => {
  it.each([
    ['FUT', 'preview'],
    ['PRE', 'preview'],
    ['OFF', 'final'],
    ['FINAL', 'final'],
    ['LIVE', 'live'],
    ['CRIT', 'live'],
    [undefined, 'live'],
  ])('maps %s to %s', (gameState, status) => {
    expect(mapGameStateToStatus(gameState)).toBe(status);
  });
});

describe('getStateLabel', () => {
  it('labels previews, live periods and each final type', () => {
    expect(getStateLabel(boxscore({}), 'preview')).toBe('Scheduled');
    expect(getStateLabel(boxscore({}), 'live')).toBe('Live · P2');
    const finalIn = (lastPeriodType: string) =>
      getStateLabel(boxscore({ gameOutcome: { lastPeriodType } }), 'final');
    expect(finalIn('OT')).toBe('F/OT');
    expect(finalIn('SO')).toBe('F/SO');
    expect(finalIn('REG')).toBe('FINAL');
  });
});

describe('live clock labels', () => {
  const clock = {
    timeRemaining: '12:34',
    running: true,
    inIntermission: false,
  };

  it('shows the time remaining, or INT during an intermission', () => {
    expect(getLiveClockLabel(boxscore({ clock }), 'live')).toBe('12:34');
    expect(
      getLiveClockLabel(
        boxscore({ clock: { ...clock, inIntermission: true } }),
        'live',
      ),
    ).toBe('INT');
  });

  it('is null when the game is not live or has no clock', () => {
    expect(getLiveClockLabel(boxscore({ clock }), 'final')).toBeNull();
    expect(getLiveClockLabel(boxscore({}), 'live')).toBeNull();
    expect(
      getLiveClockLabel(
        boxscore({ clock: { ...clock, timeRemaining: '' } }),
        'live',
      ),
    ).toBeNull();
  });

  it('prefixes the period for schedule cards', () => {
    expect(getScheduleClockLabel(boxscore({ clock }))).toBe('P2 · 12:34');
    expect(
      getScheduleClockLabel(boxscore({ clock, gameState: 'OFF' })),
    ).toBeNull();
  });
});

describe('getLocalPuckDropTime', () => {
  it('is null without a start time so previews can show TBD', () => {
    expect(getLocalPuckDropTime(undefined)).toBeNull();
    expect(getLocalPuckDropTime('2026-10-09T23:00:00Z')).toMatch(
      /^\d{1,2}:\d{2} [AP]M$/,
    );
  });
});

describe('getPeriodGoalsBreakdown', () => {
  it("counts each team's goals per period", () => {
    const scoring = [
      {
        periodDescriptor: { number: 1, periodType: 'REG' },
        goals: [goal('TOR'), goal('MTL'), goal('TOR')],
      },
      {
        periodDescriptor: { number: 4, periodType: 'OT' },
        goals: [goal('MTL')],
      },
    ];
    expect(getPeriodGoalsBreakdown(scoring, 'TOR', 'MTL')).toEqual([
      { periodNum: 1, periodType: 'REG', homeGoals: 2, awayGoals: 1 },
      { periodNum: 4, periodType: 'OT', homeGoals: 0, awayGoals: 1 },
    ]);
  });
});

describe('section guards', () => {
  it('needs at least one goal for a scoring summary', () => {
    const emptyPeriod = {
      periodDescriptor: { number: 1, periodType: 'REG' },
      goals: [],
    };
    expect(hasScoringSummary(null)).toBe(false);
    expect(hasScoringSummary(landing([emptyPeriod]))).toBe(false);
    expect(
      hasScoringSummary(landing([{ ...emptyPeriod, goals: [goal('TOR')] }])),
    ).toBe(true);
  });

  it('needs listed three stars', () => {
    expect(hasThreeStars(null)).toBe(false);
    expect(hasThreeStars(landing([]))).toBe(false);
    expect(hasThreeStars(landing([], [{} as LandingThreeStar]))).toBe(true);
  });

  it('needs player-by-game stats', () => {
    const teamStats = { forwards: [], defense: [], goalies: [] };
    expect(hasBoxscoreStats(null)).toBe(false);
    expect(hasBoxscoreStats(boxscore({}))).toBe(false);
    expect(
      hasBoxscoreStats(
        boxscore({
          playerByGameStats: { homeTeam: teamStats, awayTeam: teamStats },
        }),
      ),
    ).toBe(true);
  });
});
