var axios = require("axios");

var axiosNhl = axios.create({
  baseURL: "https://api-web.nhle.com/v1",
});
var axiosNhlTeam = axios.create({
  baseURL: "https://api.nhle.com/stats/rest/en/team",
});
var axiosNhlStats = axios.create({
  baseURL: "https://api.nhle.com/stats/rest/en/skater",
});
var axiosNhlGoalie = axios.create({
  baseURL: "https://api.nhle.com/stats/rest/en/goalie",
});

module.exports = { axiosNhl, axiosNhlTeam, axiosNhlStats, axiosNhlGoalie };
