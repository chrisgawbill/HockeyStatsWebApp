var express = require("express");
var axios = require("axios");
var fs = require("fs");
var path = require("path");

var router = express.Router();

const PLAYER_CACHE_DIR = path.join(__dirname, "../player-cache");
const PLAYER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function readPlayerCache(key) {
  try {
    const entry = JSON.parse(fs.readFileSync(path.join(PLAYER_CACHE_DIR, `${key}.json`), "utf-8"));
    if (Date.now() - entry.timestamp < PLAYER_CACHE_TTL_MS) return entry.data;
  } catch {}
  return null;
}

function writePlayerCache(key, data) {
  fs.mkdirSync(PLAYER_CACHE_DIR, { recursive: true });
  fs.writeFileSync(path.join(PLAYER_CACHE_DIR, `${key}.json`), JSON.stringify({ timestamp: Date.now(), data }));
}

var axiosNhl = axios.create({
  baseURL: "https://api-web.nhle.com/v1",
});

var axiosNhlStats = axios.create({
  baseURL: "https://api.nhle.com/stats/rest/en/skater",
});

var axiosNhlGoalie = axios.create({
  baseURL: "https://api.nhle.com/stats/rest/en/goalie",
});

router.get("/skater/statLeaders/:statIndicator", async function (req, res, next) {
  try {
    const url =
      "/skater-stats-leaders/current?categories=" +
      req.params.statIndicator +
      "&limit=10";
    const response = await axiosNhl.get(url);
    res.send(response.data);
  } catch (e) {
    res.send(e);
  }
});
router.get("/goalie/statLeaders/:statIndicator", async function(req,res,next){
    try{
        const url ="https://api-web.nhle.com/v1/goalie-stats-leaders/current?categories=" + req.params.statIndicator + "&limit=10";
        const response = await axiosNhl.get(url);
        res.send(response.data);
    }catch(e){
        res.send(e);
    }
})
// G, A, P, +/-, PIM, FO% — optional ?teamId=4 &season=20252026
router.get("/skater/summary", async function (req, res, next) {
  try {
    const { teamId, season } = req.query;
    const seasonId = season || getCurrentSeasonId();
    const cacheKey = `skater_summary_${teamId || "all"}_${seasonId}`;
    const cached = readPlayerCache(cacheKey);
    if (cached !== null) return res.send(cached);
    let exp = `seasonId=${seasonId} and gameTypeId=2`;
    if (teamId) exp += ` and teamId=${teamId}`;
    const response = await axiosNhlStats.get(
      `/summary?cayenneExp=${encodeURIComponent(exp)}&limit=100`
    );
    writePlayerCache(cacheKey, response.data);
    res.send(response.data);
  } catch (e) {
    next(e);
  }
});

// Corsi (SAT%) — optional ?teamId=4 &season=20252026
router.get("/skater/corsi", async function (req, res, next) {
  try {
    const { teamId, season } = req.query;
    const seasonId = season || getCurrentSeasonId();
    const cacheKey = `skater_corsi_${teamId || "all"}_${seasonId}`;
    const cached = readPlayerCache(cacheKey);
    if (cached !== null) return res.send(cached);
    let exp = `seasonId=${seasonId} and gameTypeId=2`;
    if (teamId) exp += ` and teamId=${teamId}`;
    const response = await axiosNhlStats.get(
      `/percentages?cayenneExp=${encodeURIComponent(exp)}&limit=100`
    );
    writePlayerCache(cacheKey, response.data);
    res.send(response.data);
  } catch (e) {
    next(e);
  }
});

router.get("/goalie/summary", async function (req, res, next) {
  try {
    const { teamId, season } = req.query;
    const seasonId = season || getCurrentSeasonId();
    const cacheKey = `goalie_summary_${teamId || "all"}_${seasonId}`;
    const cached = readPlayerCache(cacheKey);
    if (cached !== null) return res.send(cached);
    let exp = `seasonId=${seasonId} and gameTypeId=2`;
    if (teamId) exp += ` and teamId=${teamId}`;
    const response = await axiosNhlGoalie.get(
      `/summary?cayenneExp=${encodeURIComponent(exp)}&limit=10`
    );
    writePlayerCache(cacheKey, response.data);
    res.send(response.data);
  } catch (e) {
    next(e);
  }
});

function getCurrentSeasonId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startYear = month >= 10 ? year : year - 1;
  return `${startYear}${startYear + 1}`;
}

module.exports = router;