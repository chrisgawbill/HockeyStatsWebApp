import { StandingsTeam } from '@/features/standings/types/standingsTeam';

/**
 * The backend (api/services/mappers/standingsMapper.js) now returns each team in
 * the StandingsTeamContract shape (id resolved, clinch indicator normalized, raw
 * pointPctg). This helper only layers on app/display logic: pointsPctg rounding
 * and the locally-computed draft-lottery odds + trend.
 */
export function CreateLeagueStandingsArray(initialStandings: any[]) {
  let leageuStandingsArray: StandingsTeam[] = [];
  for (let i = 0; i < initialStandings.length; i++) {
    const responseTeam = initialStandings[i];
    const teamId = responseTeam.teamId;
    const teamLogo = responseTeam.teamLogo;
    const name = responseTeam.name;
    const conferenceName = responseTeam.conferenceName;
    const divisionName = responseTeam.divisionName;
    const wins = responseTeam.wins;
    const losses = responseTeam.losses;
    const otLosses = responseTeam.otLosses;
    const points = responseTeam.points;
    const pointsPctg = Math.round(responseTeam.pointPctg * 100 * 100) / 100;
    const leagueStanding = responseTeam.leagueSequence;
    const conferenceStanding = responseTeam.conferenceSequence;
    const divisionStanding = responseTeam.divisionSequence;
    const wildCardRank = responseTeam.wildcardSequence;
    const clinchingIndicator = responseTeam.clinchingIndicator;

    const teamLastTenLeagueRank: number = responseTeam.leagueL10Sequence;
    const teamDraftLotteryOdds: number = DraftLotteryOddsHelper(leagueStanding);
    const draftLotteryOddsTrend: string = DraftLotteryOddsTrendHelper(
      leagueStanding,
      teamLastTenLeagueRank,
    );

    const standingsTeam: StandingsTeam = new StandingsTeam(
      teamId,
      teamLogo,
      name,
      conferenceName,
      divisionName,
      wins,
      losses,
      otLosses,
      points,
      pointsPctg,
      leagueStanding,
      conferenceStanding,
      divisionStanding,
      wildCardRank,
      clinchingIndicator,
      teamDraftLotteryOdds,
      draftLotteryOddsTrend,
    );
    leageuStandingsArray.push(standingsTeam);
  }
  return leageuStandingsArray;
}
function DraftLotteryOddsTrendHelper(leagueRank: number, lastTenRank: number) {
  const currentOdds = DraftLotteryOddsHelper(leagueRank);
  const lastTenOdds = DraftLotteryOddsHelper(lastTenRank);
  if (currentOdds > lastTenOdds) {
    return 'UP';
  } else if (currentOdds < lastTenOdds) {
    return 'DOWN';
  }
  return 'SAME';
}
function DraftLotteryOddsHelper(leagueRank: number) {
  let draftLotteryOdds: number = 0.0;
  switch (leagueRank) {
    case 32:
      draftLotteryOdds = 18.5;
      break;
    case 31:
      draftLotteryOdds = 13.5;
      break;
    case 30:
      draftLotteryOdds = 11.5;
      break;
    case 29:
      draftLotteryOdds = 9.5;
      break;
    case 28:
      draftLotteryOdds = 8.5;
      break;
    case 27:
      draftLotteryOdds = 7.5;
      break;
    case 26:
      draftLotteryOdds = 6.5;
      break;
    case 25:
      draftLotteryOdds = 6.0;
      break;
    case 24:
      draftLotteryOdds = 5.0;
      break;
    case 23:
      draftLotteryOdds = 3.5;
      break;
    case 22:
      draftLotteryOdds = 3.0;
      break;
    case 21:
      draftLotteryOdds = 2.5;
      break;
    case 20:
      draftLotteryOdds = 2.0;
      break;
    case 19:
      draftLotteryOdds = 1.5;
      break;
    case 18:
      draftLotteryOdds = 0.5;
      break;
    case 17:
      draftLotteryOdds = 0.5;
      break;
    case 16:
      draftLotteryOdds = 0.5;
      break;
    default:
      draftLotteryOdds = 0.5;
      break;
  }
  return draftLotteryOdds;
}
