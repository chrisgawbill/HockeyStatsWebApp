var express = require("express");
var axios = require("axios");

var router = express.Router();

var axiosNhl = axios.create({
  baseURL: "https://api-web.nhle.com/v1",
});
router.get("/", async function (req, res, next) {
    try {
      const url = "/schedule/now";
      const response = await axiosNhl.get(url);
      res.send(response.data);
    } catch (e) {
      res.send(e);
    }
  });

  module.exports  = router;