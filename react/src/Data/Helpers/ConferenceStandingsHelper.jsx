export function CreateStandingsArray(initialStandings) {
  const fixedStandings = new Array(16);
  for (let i = 0; i < 10; i++) {
    const responseTeam = initialStandings[i];
    const fixedTeamRecord =
      responseTeam.wins +
      "-" +
      responseTeam.losses +
      "-" +
      responseTeam.otLosses;
    const fixedTeam = {
      id: i,
      conferenceStandingsPlace: responseTeam.conferenceSequence,
      divisionStandingsPlace: responseTeam.divisionSequence,
      teamName: responseTeam.teamCommonName.default,
      record: fixedTeamRecord,
      points: responseTeam.points,
      pointsPercentage: responseTeam.pointPctg,
      originalObject: responseTeam
    };
    fixedStandings[i] = fixedTeam;
  }
  return fixedStandings;
}
export function CreateConferenceStandingsArray(initialStandings, matchingConferenceName){
  let fixedConferenceStandings = [];
  for(let i = 0; i < initialStandings.length; i ++){
    const currentReponseStandingTeam = initialStandings[i];
    if(currentReponseStandingTeam.conferenceName === matchingConferenceName){
      fixedConferenceStandings.push(currentReponseStandingTeam)
    }
  }
  return fixedConferenceStandings;
}
