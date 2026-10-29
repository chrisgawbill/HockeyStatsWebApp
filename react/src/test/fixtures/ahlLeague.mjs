// A synthetic AHL league in the API-AHL-02 shapes, for Spotter specs. Toronto
// is on purpose: the Marlies share `TOR` with the Maple Leafs, so an NHL leak
// shows up as Leafs data.

export const SEASON = '20262027';
const AHL_LOGO = 'https://assets.leaguestat.com/ahl/logos';

const AHL_TEAMS = [
  ['TOR', 335, 'Toronto Marlies', 'Marlies', 'Eastern', 'North', '335_94'],
  ['LAV', 415, 'Laval Rocket', 'Rocket', 'Eastern', 'North', '415'],
  ['HER', 319, 'Hershey Bears', 'Bears', 'Eastern', 'Atlantic', '319'],
  ['CLT', 384, 'Charlotte Checkers', 'Checkers', 'Eastern', 'Atlantic', '384'],
  ['CHI', 330, 'Chicago Wolves', 'Wolves', 'Western', 'Central', '330'],
  ['ABB', 440, 'Abbotsford Canucks', 'Canucks', 'Western', 'Pacific', '440'],
];

const standings = AHL_TEAMS.map(
  ([triCode, , , name, conference, division, logo], index) => ({
    teamId: triCode,
    teamLogo: `${AHL_LOGO}/${logo}.png`,
    name,
    conferenceName: `${conference} Conference`,
    divisionName: `${division} Division`,
    wins: 8 - index,
    losses: index,
    otLosses: 0,
    points: 16 - index * 2,
    pointPctg: (8 - index) / 8,
    leagueSequence: index + 1,
    conferenceSequence: (index % 4) + 1,
    divisionSequence: (index % 2) + 1,
    wildcardSequence: null,
    clinchingIndicator: '',
    leagueL10Sequence: null,
    league: 'ahl',
  }),
);

const teamSummaries = AHL_TEAMS.map(([, teamId, teamFullName], index) => ({
  teamId,
  teamFullName,
  seasonId: Number(SEASON),
  gamesPlayed: 8,
  wins: 8 - index,
  losses: index,
  otLosses: 0,
  points: 16 - index * 2,
  pointPct: (8 - index) / 8,
  goalsFor: 30 - index,
  goalsAgainst: 20 + index,
  goalsForPerGame: (30 - index) / 8,
  goalsAgainstPerGame: (20 + index) / 8,
  powerPlayPct: 0.2,
  penaltyKillPct: 0.8,
  faceoffWinPct: null,
  shotsForPerGame: null,
  shotsAgainstPerGame: null,
  powerPlayNetPct: null,
  penaltyKillNetPct: null,
  regulationAndOtWins: 7 - index,
  winsInRegulation: 6 - index,
  winsInShootout: 0,
  teamShutouts: null,
  ties: null,
}));

/** One AHL schedule row: away at home, final unless `gameState` says otherwise. */
function scheduleGame(gameId, away, home, date, gameState = 'OFF') {
  return {
    gameId,
    date,
    gameTime: `${date}T23:00:00Z`,
    dayOfWeek: 'Fri',
    venue: 'Coca-Cola Coliseum',
    homeTeam: home,
    homeLogo: `${AHL_LOGO}/335_94.png`,
    homeScore: gameState === 'OFF' ? 4 : null,
    awayTeam: away,
    awayLogo: `${AHL_LOGO}/415.png`,
    awayScore: gameState === 'OFF' ? 2 : null,
    broadcasts: [],
    ticketLink: null,
    gameCenter: null,
    isPlayoff: false,
    isPreseason: false,
    playoffRound: null,
    periodType: 'REG',
    seriesWins: null,
    topSeedTeamAbbrev: null,
    bottomSeedTeamAbbrev: null,
    gameState,
  };
}

const games = [
  scheduleGame(1029001, 'LAV', 'TOR', '2026-10-09'),
  scheduleGame(1029002, 'TOR', 'LAV', '2099-10-10', 'FUT'),
];

const roster = {
  players: [
    [9119, 'Brendan Brisson', 11, 'L'],
    [4573, 'Logan Shaw', 12, 'C'],
    [7001, 'Marlie Defender', 4, 'D'],
    [7002, 'Marlie Goalie', 30, 'G'],
  ].map(([id, name, number, position]) => ({
    id,
    name,
    number,
    position,
    headshot: `https://assets.leaguestat.com/ahl/240x240/${id}.jpg`,
  })),
  league: 'ahl',
};

const skaters = [
  {
    playerId: 9119,
    name: 'Brendan Brisson',
    position: 'L',
    teamTriCodes: ['TOR'],
    gamesPlayed: 8,
    goals: 7,
    assists: 6,
    points: 13,
    plusMinus: 2,
    shots: 19,
    shootingPct: 0.37,
    powerPlayGoals: 1,
    penaltyMinutes: 2,
    faceoffWinPct: null,
    toiPerGame: null,
    league: 'ahl',
  },
];

const statLeaders = [
  {
    id: 9119,
    firstName: 'Brendan',
    lastName: 'Brisson',
    sweaterNumber: 11,
    headshot: `https://assets.leaguestat.com/ahl/240x240/9119.jpg`,
    teamAbbrev: 'TOR',
    teamName: 'Toronto Marlies',
    teamLogo: `${AHL_LOGO}/335_94.png`,
    position: 'L',
    value: 7,
    league: 'ahl',
  },
];

/** The synthetic AHL answer for one API path, or undefined (404). */
function ahlResponse(pathname) {
  if (pathname === '/standings') return { standings, league: 'ahl' };
  if (pathname === '/schedule/' || pathname === '/team/schedule/TOR')
    return { games, league: 'ahl' };
  if (pathname === '/team/' || pathname === '/team')
    return { data: teamSummaries, total: teamSummaries.length, league: 'ahl' };
  if (pathname === '/team/335')
    return { data: [teamSummaries[0]], total: 1, league: 'ahl' };
  if (pathname === '/team/roster/TOR') return roster;
  if (pathname === '/player/skater/summary') return skaters;
  if (pathname === '/player/goalie/summary') return [];
  if (/\/statLeaders\/(goals|assists|points)$/.test(pathname))
    return statLeaders;
  if (pathname.includes('/statLeaders/')) return [];
  if (pathname === '/player/stats/version')
    return { version: null, league: 'ahl' };
  return undefined;
}

/** Answers every `league=ahl` call from the synthetic league. */
export async function routeAhlApi(page) {
  const ahlRequests = [];
  await page.route(/[?&]league=ahl/, (route) => {
    const { pathname } = new URL(route.request().url());
    ahlRequests.push(pathname);
    const body = ahlResponse(pathname);
    return body
      ? route.fulfill({ json: body })
      : route.fulfill({ status: 404, json: { error: 'NHL only' } });
  });
  return ahlRequests;
}
