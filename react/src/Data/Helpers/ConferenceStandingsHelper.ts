import { StandingsTeam } from "../Models/StandingsTeam";

export function CreateConferenceStandingsArray(
  initialStandings: any[],
  matchingConferenceName: string
) {
  let fixedConferenceStandings:StandingsTeam[] = new Array(16);
  for (let i = 0; i < initialStandings.length; i++) {
    const responseTeam = initialStandings[i];
    if (responseTeam.conferenceName === matchingConferenceName) {

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
      const divisionStanding = responseTeam.divisionStanding;

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
      );
      fixedConferenceStandings[i] = standingsTeam;
    }
  }
  return fixedConferenceStandings;
}
