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

                console.log(response.data);
              })
          
              // Print error message if occur
              .catch(error => res.send('error'))
});
app.get('/GetQuickTeamStats/:teamID', function(req, res){
    axios.get(
        `https://statsapi.web.nhl.com/api/v1/teams/` + req.params.teamID + "/stats")
          
              // Print data
              .then(response => {
                let wins = response.data.stats[0].splits[0].stat.wins;
                let loses = response.data.stats[0].splits[0].stat.loses;
                let overtimeLoses = response.data.stats[0].stat.splits[0].ot;
                let points = response.data.stats[0].splits[0].stat.pts;
                console.log(response.data);
              })
          
              // Print error message if occur
              .catch(error => res.send('error'))
});
app.get('/GetFullTeamStatss/:teamID', function(req, res){
    axios.get(
        `https://statsapi.web.nhl.com/api/v1/teams/` + req.params.teamID + "/stats")
          
              // Print data
              .then(response => {
                let statsData = response.data.stats.splits[0].stat;
                let statsRankings = response.data.stats[1].splits[0].stats;
                console.log(response.data);
              })
          
              // Print error message if occur
              .catch(error => res.send('error'))
});
app.get('/GetTeamRoster/:teamID', function(req, res){
    axios.get(
        `https://statsapi.web.nhl.com/api/v1/teams/` + req.params.teamID + "/roster")
          
              // Print data
              .then(response => {
                console.log(response.data);
              })
          
              // Print error message if occur
              .catch(error => res.send('error'))
});
app.listen(port);