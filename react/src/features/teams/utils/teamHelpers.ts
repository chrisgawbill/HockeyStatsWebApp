import { Team } from '@/features/teams/types/team';
import { TeamStats } from '@/features/teams/types/teamStats';
import { TeamHistoryDto } from '@/features/teams/api/teamsApi';

/** Builds Team models by matching each local team to its per-season stat rows. */
export function ConvertToListOfTeams(
  teamListData: { id: number; fullName: string }[],
  teamResponseData: TeamHistoryDto[],
) {
  let teamArray: Team[] = [];
  for (let i = 0; i < teamListData.length; i++) {
    try {
      const id: number = teamListData[i].id;
      const teamName: string = teamListData[i].fullName;
      const rawHistoricalListData = teamResponseData.filter(
        (team) => team.teamFullName === teamName,
      );
      const seasonStats: TeamStats[] = CreateHistoricalTeamStatsList(
        rawHistoricalListData,
      );
      const team: Team = new Team(id, teamName, seasonStats);
      teamArray.push(team);
    } catch (error) {
      console.error(
        `Error converting team at index ${i}:`,
        teamListData[i],
        error,
      );
    }
  }
  return teamArray;
}
/** Converts API history rows into TeamStats models. */
function CreateHistoricalTeamStatsList(teamResponseData: TeamHistoryDto[]) {
  return teamResponseData.map((historyRow) => {
    const seasonId = historyRow.seasonId;
    const wins = historyRow.wins;
    const regulationWins = historyRow.regulationWins;
    const otWins = historyRow.otWins;
    const losses = historyRow.losses;
    const otLosses = historyRow.otLosses;
    const points = historyRow.points;
    const faceoffWinPct = historyRow.faceoffWinPct;
    const goalsAgainst = historyRow.goalsAgainst;
    const goalsAgainstPerGame = historyRow.goalsAgainstPerGame;
    const goalsFor = historyRow.goalsFor;
    const goalsForPerGame =
      historyRow.goalsForPerGame ?? historyRow.goalsPerGame ?? 0;
    const penaltyKillPct = historyRow.penaltyKillPct;
    const powerPlayPct = historyRow.powerPlayPct;
    const shotsAgainstPerGame = historyRow.shotsAgainstPerGame;
    const shotsForPerGame = historyRow.shotsForPerGame;

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
      shotsForPerGame,
    );
  });
}
