var express = require("express");
var axios = require("axios");

var router = express.Router();

var axiosNhl = axios.create({
  baseURL: "https://api.nhle.com/stats/rest/en/team",
});

router.get("/", async function (req, res, next) {
    try {
      const url = "/";
      const response = await axiosNhl.get(url);
      res.send(response.data);
    } catch (e) {
      res.send(e);
    }
  });
router.get("/stats", async function (req, res, next) {
    try {
      const url = "/summary?sort=shotsForPerGame&cayenneExp=seasonId=20232024 and gameTypeId=2";
      const response = await axiosNhl.get(url);
      res.send(response.data)
    } catch (e) {
      res.send(e);
    }
  });
  
  module.exports = router;