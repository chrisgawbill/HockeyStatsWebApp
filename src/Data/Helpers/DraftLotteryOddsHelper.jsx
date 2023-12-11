export function CreateDraftLotteryOddsArray(initialStandings) {
  const draftLotteryOddsArray = [];

  for (let i = 31; i > 10; i--) {
    const responseTeam = initialStandings[i];
    if (responseTeam.wildCardRank > 2) {
      const teamId = responseTeam.team.id;
      const teamImage = responseTeam.teamLogo;
      const teamLeagueRank = parseInt(responseTeam.leagueRank);
      const teamLastTenLeagueRank = responseTeam.leagueL10Rank;
      const teamDraftLotteryOdds = DraftLotteryOddsHelper(teamLeagueRank);
      const draftLotteryOddsTrend = DraftLotteryOddsTrendHelper(
        teamLeagueRank,
        teamLastTenLeagueRank
      );
      const teamInfo = teamDraftLotteryOdds + "(" + draftLotteryOddsTrend + ")";
      const fixedTeam = {
        id: i,
        name: responseTeam.team.name,
        info: teamInfo,
        image: teamImage,
        typeOfData: "team",
        dataId: teamId,
        rowId: "draftLotteryOdds",
      };
      draftLotteryOddsArray.push(fixedTeam);
    }
  }
  return draftLotteryOddsArray;
}
function DraftLotteryOddsTrendHelper(leagueRank, lastTenRank) {
  let draftLotteryTrend = "SAME";
  if (leagueRank > lastTenRank) {
    draftLotteryTrend = "UP";
  } else if (leagueRank < lastTenRank) {
    draftLotteryTrend = "DOWN";
  }
  return draftLotteryTrend;
}
function DraftLotteryOddsHelper(leagueRank) {
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
