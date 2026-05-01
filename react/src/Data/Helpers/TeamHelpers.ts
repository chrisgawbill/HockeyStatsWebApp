import { Team } from "../Models/Team";
import { TeamStats } from "../Models/TeamStats";

export function ConvertToListOfTeams(teamListData: any[], teamResponseData: any[]) {
  let teamArray: Team[] = [];
  for (let i = 0; i < teamListData.length; i++) {
    try {
      const id: number = teamListData[i].id;
      const teamName: string = teamListData[i].fullName;
      const rawHistoricalListData = teamResponseData.filter(
        (team) => team.teamFullName === teamName
      );
      const seasonStats: TeamStats[] = CreateHistoricalTeamStatsList(
        rawHistoricalListData
      );
      const team: Team = new Team(id, teamName, seasonStats);
      teamArray.push(team);
    } catch (error) {
      console.error(`Error converting team at index ${i}:`, teamListData[i], error);
    }
  }
  return teamArray;
}
function CreateHistoricalTeamStatsList(teamResponseData: any[]) {
  return teamResponseData.map((data) => {
    const seasonId = data.seasonId;
    const wins = data.wins;
    const regulationWins = data.regulationWins;
    const otWins = data.otWins;
    const losses = data.losses;
    const otLosses = data.otLosses;
    const points = data.points;
    const faceoffWinPct = data.faceoffWinPct;
    const goalsAgainst = data.goalsAgainst;
    const goalsAgainstPerGame = data.goalsAgainstPerGame;
    const goalsFor = data.goalsFor;
    const goalsForPerGame = data.goalsPerGame;
    const penaltyKillPct = data.penaltyKillPct;
    const powerPlayPct = data.powerPlayPct;
    const shotsAgainstPerGame = data.shotsAgainstPerGame;
    const shotsForPerGame = data.shotsForPerGame;

    return new TeamStats(
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
  });
}
