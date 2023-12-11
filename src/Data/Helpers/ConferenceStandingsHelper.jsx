export function CreateStandingsArray(initialStandings) {
  const fixedStandings = [];
  for (let i = 0; i < 10; i++) {
    const responseTeam = initialStandings[i];
    const fixedTeamRecord =
      responseTeam.leagueRecord.wins +
      "-" +
      responseTeam.leagueRecord.ot +
      "-" +
      responseTeam.leagueRecord.losses;
    const fixedTeam = {
      id: i,
      standingsPlace: responseTeam.conferenceRank,
      name: responseTeam.team.name,
      record: fixedTeamRecord,
      points: responseTeam.points,
    };
    fixedStandings.push(fixedTeam);
  }
  return fixedStandings;
}
export function CreateConferenceStandingsArray(initialStandings, conferenceName){
  let fixedConferenceStandings = [];
  for(let i = 0; i < initialStandings.length(); i ++){
    const currentReponseStandingTeam = initialStandings[i];
    if(currentReponseStandingTeam.conferenceName === conferenceName){
      fixedConferenceStandings.push(currentReponseStandingTeam)
    }
    return fixedConferenceStandings;
  }
  
  return "";
}
