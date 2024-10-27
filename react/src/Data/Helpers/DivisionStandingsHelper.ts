import { StandingsTeam } from "../Models/StandingsTeam";

export function CreateDivisionStandingsArray(
  initialStandings: any[],
  matchingDivisionName: string = ""
) {
  let fixedDivisionStandings:StandingsTeam[] = new Array(8);
  let i = 0;
  let currentSize = 0;
  initialStandings = initialStandings.filter((team) =>  team.divisionName === matchingDivisionName);
  do{
    const responseTeam = initialStandings[i];
    if (responseTeam.divisionName === matchingDivisionName) {
      const name = responseTeam.teamCommonName.default;
      const conferenceName = responseTeam.conferenceName;
      const divisionName = responseTeam.divisionName;
      const wins = responseTeam.wins;
      const losses = responseTeam.losses;
      const otLosses = responseTeam.otLosses;
      const fixedTeamRecord =
        wins +
        "-" +
        losses +
        "-" +
        otLosses;
      const points = responseTeam.points;
      const pointsPctg = Math.round((responseTeam.pointPctg*100)*100)/100;
      const leagueStanding = responseTeam.leagueSequence;
      const conferenceStanding = responseTeam.conferenceSequence;
      const divisionStanding = responseTeam.divisionSequence;
      const wildCardRank = responseTeam.wildcardSequence;

      const standingsTeam: StandingsTeam = new StandingsTeam(
        i,
        name,
        conferenceName,
        divisionName,
        wins,
        losses,
        otLosses,
        fixedTeamRecord,
        points,
        pointsPctg,
        leagueStanding,
        conferenceStanding,
        divisionStanding,
        wildCardRank
      );
      fixedDivisionStandings[currentSize] = standingsTeam;
      currentSize++;
    }
    i++;
  }while(currentSize < 8);

  return fixedDivisionStandings;
}