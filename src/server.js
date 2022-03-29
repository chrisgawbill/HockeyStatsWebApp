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
                console.log(response.data);
              })
          
              // Print error message if occur
              .catch(error => res.send('error'))
});
app.get('/GetTeamStats/:teamID', function(req, res){
    axios.get(
        `https://statsapi.web.nhl.com/api/v1/teams/` + req.params.teamID + "/stats")
          
              // Print data
              .then(response => {
                console.log(response.data);
              })
          
              // Print error message if occur
              .catch(error => res.send('error'))
});
app.listen(port);