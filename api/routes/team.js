var express = require("express");
var axios = require("axios");

var router = express.Router();

var axiosNhl = axios.create({
  baseURL: "https://api.nhle.com/stats/rest/en/team",
});

router.get("/", function (req, res, next) {
    try {
      axiosNhl.get("/").then((response) => {
        res.send(response.data);
      });
    } catch (e) {
      res.send(e);
    }
  });
  router.get("/summary?sort=shotsForPerGame&cayenneExp=seasonId=20232024 and gameTypeId=2", function (req, res, next) {
    try {
      axiosNhl.get("/").then((response) => {
        res.send(response.data);
      });
    } catch (e) {
      res.send(e);
    }
  });
  
  module.exports = router;