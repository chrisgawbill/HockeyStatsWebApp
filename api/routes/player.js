var express = require("express");
var axios = require("axios");

var router = express.Router();

var axiosNhl = axios.create({
  baseURL: "https://api-web.nhle.com/v1",
});

router.get("/skater/statLeaders/:statIndicator", function (req, res, next) {
  try {
    const url =
      "/skater-stats-leaders/current?categories=" +
      req.params.statIndicator +
      "&limit=10";
    axiosNhl.get(url).then((response) => {
      res.send(response.data);
    });
  } catch (e) {
    res.send(e);
  }
});
router.get("/goalie/statLeaders/:statIndicator", function(req,res,next){
    try{
        const url ="https://api-web.nhle.com/v1/goalie-stats-leaders/current?categories=" + req.params.statIndicator + "&limit=10";
        axiosNhl.get(url).then((response) => {
            res.send(response.data);
          });
    }catch(e){
        res.send(e);
    }
})
module.exports = router;