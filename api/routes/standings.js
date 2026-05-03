var express = require("express");
var axios = require("axios");

var router = express.Router();

var axiosNhl = axios.create({
  baseURL: "https://api-web.nhle.com/v1",
});

router.get("/", async function (req, res, next) {
  try {
    const url = "/standings/now";
    const response = await axiosNhl.get(url);
    const standings = response.data.standings?.map((team) => ({
      ...team,
      clinchingIndicator: team.clinchingIndicator ?? team.clinchIndicator ?? "",
    }));

    res.send({
      ...response.data,
      standings,
    });
  } catch (e) {
    res.send(e);
  }
});

module.exports = router;
