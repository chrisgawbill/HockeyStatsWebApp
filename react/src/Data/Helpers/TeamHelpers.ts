import { Team } from "../Models/Team";
import { TeamStats } from "../Models/TeamStats";

export function ConvertToListOfTeams(teamListData:any[], teamResponseData: any[]) {
  let teamArray: Team[] = new Array(32);
  console.log(teamListData)
  console.log(teamResponseData)
  for (let i = 0; i < teamListData.length; i++) {
    const id: number = teamListData[i].franchiseId;
    const teamName: string = teamListData[i].fullName;
    const rawHistoricalListData = teamResponseData.filter(
      (team) => team.teamFullName === teamName
    );
    const seasonStats: TeamStats[] = CreateHistoricalTeamStatsList(
      rawHistoricalListData
    );
    const team: Team = new Team(id, teamName, seasonStats);
    teamArray[i] = team;
  }
  return teamArray;
}
function CreateHistoricalTeamStatsList(teamResponseData: any[]) {
  const historicalSeasonStatsList: TeamStats[] = new Array(10);
  for (let i = 0; i < teamResponseData.length; i++) {
    const seasonId = teamResponseData[i].seasonId;
    const wins = teamResponseData[i].wins;
    const regulationWins = teamResponseData[i].regulationWins;
    const otWins = teamResponseData[i].otWins;
    const losses = teamResponseData[i].losses;
    const otLosses = teamResponseData[i].otLosses;
    const points = teamResponseData[i].points;
    const faceoffWinPct = teamResponseData[i].faceoffWinPct;
    const goalsAgainst = teamResponseData[i].goalsAgainst;
    const goalsAgainstPerGame = teamResponseData[i].goalsAgainstPerGame;
    const goalsFor = teamResponseData[i].goalsFor;
    const goalsForPerGame = teamResponseData[i].goalsPerGame;
    const penaltyKillPct = teamResponseData[i].penaltyKillPct;
    const powerPlayPct = teamResponseData[i].powerPlayPct;
    const shotsAgainstPerGame = teamResponseData[i].shotsAgainstPerGame;
    const shotsForPerGame = teamResponseData[i].shotsForPerGame;

    const teamStat: TeamStats = new TeamStats(
      seasonId,
      wins,
      regulationWins,
      otWins,
      losses,
      otLosses,
      points,
      faceoffWinPct,
      goalsAgainst,
      goalsAgainstPerGame,
      goalsFor,
      goalsForPerGame,
      penaltyKillPct,
      powerPlayPct,
      shotsAgainstPerGame,
      shotsForPerGame
    );
    historicalSeasonStatsList[i] = teamStat;
  }
  return historicalSeasonStatsList;
}
