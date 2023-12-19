import { DraftLotteryTeam } from "../Models/DraftLotteryTeam";

export function CreateDraftLotteryOddsArray(initialStandings: any[]) {
  let draftLotteryOddsArray: DraftLotteryTeam[] = new Array(16);

  for (let i = 31; i > 10; i--) {
    const responseTeam = initialStandings[i];
    if (responseTeam.wildcardSequence > 2) {
      const teamId:number = i;
      const teamName:string = responseTeam.teamCommonName.default;
      const teamImage:string = responseTeam.teamLogo;
      const teamLeagueRank:number = parseInt(responseTeam.leagueSequence);
      const teamLastTenLeagueRank:number = responseTeam.leagueL10Sequence;
      const teamDraftLotteryOdds:string = DraftLotteryOddsHelper(teamLeagueRank);
      const draftLotteryOddsTrend:string = DraftLotteryOddsTrendHelper(
        teamLeagueRank,
        teamLastTenLeagueRank
      );
      const teamInfo = teamDraftLotteryOdds + "(" + draftLotteryOddsTrend + ")";
      const draftLotteryTeam: DraftLotteryTeam = new DraftLotteryTeam(
        i,
        teamName,
        teamInfo,
        teamImage,
        "team",
        teamId,
        "draftLotteryOdds",
        teamDraftLotteryOdds,
        draftLotteryOddsTrend,
      );
      draftLotteryOddsArray[i] = draftLotteryTeam;
    }
  }
  draftLotteryOddsArray = draftLotteryOddsArray.sort((n1,n2)=>{
    const n1Odds = parseFloat(n1.draftLotteryOdds);
    const n2Odds = parseFloat(n2.draftLotteryOdds);

    if(n1Odds > n2Odds){
      return -1;
    }
    if(n1Odds < n2Odds){
      return 1;
    }
    return 0;
  })
  return draftLotteryOddsArray;
}
function DraftLotteryOddsTrendHelper(leagueRank: number, lastTenRank: number) {
  let draftLotteryTrend = "SAME";
  if (leagueRank > lastTenRank) {
    draftLotteryTrend = "UP";
  } else if (leagueRank < lastTenRank) {
    draftLotteryTrend = "DOWN";
  }
  return draftLotteryTrend;
}
function DraftLotteryOddsHelper(leagueRank: number) {
  let draftLotteryOdds = "0.00%";
  switch (leagueRank) {
    case 32:
      draftLotteryOdds = "18.5%";
      break;
    case 31:
      draftLotteryOdds = "13.5%";
      break;
    case 30:
      draftLotteryOdds = "11.5%";
      break;
    case 29:
      draftLotteryOdds = "9.5%";
      break;
    case 28:
      draftLotteryOdds = "8.5%";
      break;
    case 27:
      draftLotteryOdds = "7.5%";
      break;
    case 26:
      draftLotteryOdds = "6.5%";
      break;
    case 25:
      draftLotteryOdds = "6.0%";
      break;
    case 24:
      draftLotteryOdds = "5.0%";
      break;
    case 23:
      draftLotteryOdds = "3.5%";
      break;
    case 22:
      draftLotteryOdds = "3.0%";
      break;
    case 21:
      draftLotteryOdds = "2.5%";
      break;
    case 20:
      draftLotteryOdds = "2.0%";
      break;
    case 19:
      draftLotteryOdds = "1.5%";
      break;
    case 18:
      draftLotteryOdds = "0.5%";
      break;
    case 17:
      draftLotteryOdds = "0.5%";
      break;
    case 16:
      draftLotteryOdds = "0.5%";
      break;
    default:
      draftLotteryOdds = "0.5%";
      break;
  }
  return draftLotteryOdds;
}
