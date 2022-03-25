const express = require('express');
const axios = require('axios');
const app = express();


const port = process.env.PORT || 8000;

app.use(express.static(__dirname));
app.get('/', function(req, res){
    res.sendFile(__dirname + '/home.html');
});
app.get('/Home', function(req, res){
    res.sendFile(__dirname + '/home.html');
});
app.get('/GetAllTeams', function(req, res){
    axios.get(
        `https://statsapi.web.nhl.com/api/v1/teams`)
          
              // Print data
              .then(response => {
                 console.log(response.data);
                 res.send(response.data);
              })
          
              // Print error message if occur
              .catch(error => res.send('error'))
});
app.listen(port);