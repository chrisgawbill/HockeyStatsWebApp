const express = require('express');
const axios = require('axios');
const app = express();


const port = process.env.PORT || 8000;

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/home.html');
});
app.get('/Home', function(req, res){
    res.sendFile(__dirname + '/public/home.html');
});
app.get('/GetAllTeams', function(req, res){
    axios.get(
        `https://statsapi.web.nhl.com/api/v1/teams`)
          
              // Print data
              .then(response => {
                 let returnValueArray = new Array();
                 for(let i = 0; i < response.data.teams.length; i++){
                     let returnValue = response.data.teams[i].name + "|" + response.data.teams[i].id;
                     returnValueArray.push(returnValue);
                 }
                 returnValueArray.sort();
                 res.send(returnValueArray);
              })
          
              // Print error message if occur
              .catch(error => res.send('error'))
});
app.get('/GetTeamInfo/:teamID', function(req, res){
    axios.get(
        `https://statsapi.web.nhl.com/api/v1/teams/` + req.params.teamID)
          
              // Print data
              .then(response => {
                let venue = response.data.teams[0].venue.name;
                let city = response.data.teams[0].venue.city;
                let state = response.data.teams[0].locationName;
                let division = response.data.teams[0].division.name;
                let conference = response.data.teams[0].conference.name;
                let establishedYear = response.data.teams[0].firstYearOfPlay;

                let teamInfo = new Array();
                teamInfo.push(venue);
                teamInfo.push(city);
                teamInfo.push(state);
                teamInfo.push(division);
                teamInfo.push(conference);
                teamInfo.push(establishedYear);

                res.send(teamInfo);
              })
          
              // Print error message if occur
              .catch(error => res.send('error'))
});
app.get('/GetQuickTeamStats/:teamID', function(req, res){
    axios.get(
        `https://statsapi.web.nhl.com/api/v1/teams/` + req.params.teamID + '/stats')
          
              // Print data
              .then(response => {

                let wins = response.data.stats[0].splits[0].stat.wins;
                let loses = response.data.stats[0].splits[0].stat.losses;
                let overtimeLoses = response.data.stats[0].splits[0].stat.ot;
                let points = response.data.stats[0].splits[0].stat.pts;

                let record = wins + " - " + loses + " - " + overtimeLoses + "(" + points  + " pts)";
                res.send(record);
 
              })
          
              // Print error message if occur
              .catch(error => res.send('error'))
});
app.get('/GetFullTeamStats/:teamID', function(req, res){
    axios.get(
        `https://statsapi.web.nhl.com/api/v1/teams/` + req.params.teamID + '/stats')
          
              // Print data
              .then(response => {
                let statsData = response.data.stats[0].splits[0].stat;
                let statsRankings = response.data.stats[1].splits[0].stat;

                let statArray = new Array();
                statArray.push(statsData);
                statArray.push(statsRankings);

                res.send(statArray);
              })
          
              // Print error message if occur
              .catch(error => res.send('error'))
});
app.get('/GetTeamRoster/:teamID', function(req, res){
    axios.get(
        `https://statsapi.web.nhl.com/api/v1/teams/` + req.params.teamID + "/roster")
          
              // Print data
              .then(response => {
                let teamRosterArray = new Array();
                for(let i = 0; i < response.data.roster.length; i++){
                  let playerID = response.data.roster[i].person.id;
                  let playerName = response.data.roster[i].person.fullName;
                  let jerseyNumber = response.data.roster[i].jerseyNumber;
                  let playerPosition = response.data.roster[i].position.code;

                  let playerInfoArray = new Array();
                  playerInfoArray.push(playerID);
                  playerInfoArray.push(playerName);
                  playerInfoArray.push(jerseyNumber);
                  playerInfoArray.push(playerPosition);
                  console.log(playerInfoArray);

                  teamRosterArray.push(playerInfoArray);
                }
                res.send(teamRosterArray);
              })
          
              // Print error message if occur
              .catch(error => res.send('error'))
});
app.get('/GetPlayerInfo/:playerID', function(req, res){
  axios.get(
      `https://statsapi.web.nhl.com/api/v1/people/` + req.params.playerID)
        
            // Print data
            .then(response => {
              let fullName = response.data.people[0].fullName;
              let nationality = response.data.people[0].nationality;
              let height = response.data.people[0].height;
              let weight = response.data.people[0].weight;
              let age = response.data.people[0].currentAge;
              let position = response.data.people[0].primaryPosition.abbreviation;

              let playerInfoArray  = new Array();

              playerInfoArray.push(fullName);
              playerInfoArray.push(nationality);
              playerInfoArray.push(height);
              playerInfoArray.push(weight);
              playerInfoArray.push(age);
              playerInfoArray.push(position);

              res.send(playerInfoArray);
            })
        
            // Print error message if occur
            .catch(error => res.send('error'))
});
app.get('/GetNonGoaliePlayerStats/:playerID/:startYear/:endYear', function(req, res){
  axios.get(
      `https://statsapi.web.nhl.com/api/v1/people/` + req.params.playerID + '/stats?stats=statsSingleSeason&season=' + req.params.startYear + req.params.endYear)
        
            // Print data
            .then(response => {
              let goals = response.data.stats[0].splits[0].stat.goals;
              let assists = response.data.stats[0].splits[0].stat.assists;
              let points = response.data.stats[0].splits[0].stat.points;
              let gamesPlayed = response.data.stats[0].splits[0].stat.games;
              let penaltyMinutes = response.data.stats[0].splits[0].stat.penaltyMinutes;
              let plusMinus = response.data.stats[0].splits[0].stat.plusMinus;
              let timeOnIce = response.data.stats[0].splits[0].stat.timeOnIcePerGame;

              let playerStatsArray  = new Array();
              playerStatsArray.push(goals);
              playerStatsArray.push(assists);
              playerStatsArray.push(points);
              playerStatsArray.push(gamesPlayed);
              playerStatsArray.push(penaltyMinutes);
              playerStatsArray.push(plusMinus);
              playerStatsArray.push(timeOnIce);

              res.send(playerStatsArray);
            })
        
            // Print error message if occur
            .catch(error => res.send('error'))
});
app.get('/GetGoaliePlayerStats/:playerID/:startYear/:endYear', function(req, res){
  axios.get(
      `https://statsapi.web.nhl.com/api/v1/people/` + req.params.playerID + '/stats?stats=statsSingleSeason&season=' + req.params.startYear + req.params.endYear)
        
            // Print data
            .then(response => {
              let wins = response.data.stats[0].splits[0].stat.wins;
              let losses = response.data.stats[0].splits[0].stat.losses;
              let ot = response.data.stats[0].splits[0].stat.ot;
              let savePercentage = response.data.stats[0].splits[0].stat.savePercentage;
              let goalAgainstAverage = response.data.stats[0].splits[0].stat.goalAgainstAverage;
              let gamesPlayed = response.data.stats[0].splits[0].stat.games;
              let shutouts = response.data.stats[0].splits[0].stat.shutouts;

              let playerStatsArray  = new Array();
              playerStatsArray.push(wins);
              playerStatsArray.push(losses);
              playerStatsArray.push(ot);
              playerStatsArray.push(savePercentage);
              playerStatsArray.push(goalAgainstAverage);
              playerStatsArray.push(gamesPlayed);
              playerStatsArray.push(shutouts);

              res.send(playerStatsArray);
            })
        
            // Print error message if occur
            .catch(error => res.send('error'))
});
app.listen(port);