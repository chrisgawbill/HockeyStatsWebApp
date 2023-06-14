const conferenceStandingsHelper = () => {
    function createStandingsArray(initialStandings) {
        const fixedStandings = Array();
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
      return {
        createStandingsArray
      }
}
export default conferenceStandingsHelper;