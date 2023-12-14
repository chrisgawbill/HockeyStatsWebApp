var express = require("express");
var axios = require("axios");

var router = express.Router();

var axiosNhl = axios.create({
  baseURL: "https://api-web.nhle.com/v1",
});

router.get("/", function (req, res, next) {
  try {
    axiosNhl.get("/standings/now").then((response) => {
      res.send(response.data);
    });
  } catch (e) {
    res.send(e);
  }
});

module.exports = router;
