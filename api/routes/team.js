var express = require("express");
var axios = require("axios");
var fs = require("fs");
var path = require("path");

var router = express.Router();

const ROSTER_CACHE_DIR = path.join(__dirname, "../roster-cache");
const ROSTER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function readRosterCache(key) {
  try {
    const entry = JSON.parse(fs.readFileSync(path.join(ROSTER_CACHE_DIR, `${key}.json`), "utf-8"));
    if (Date.now() - entry.timestamp < ROSTER_CACHE_TTL_MS) return entry.data;
  } catch {}
  return null;
}

function writeRosterCache(key, data) {
  fs.mkdirSync(ROSTER_CACHE_DIR, { recursive: true });
  fs.writeFileSync(path.join(ROSTER_CACHE_DIR, `${key}.json`), JSON.stringify({ timestamp: Date.now(), data }));
}

var axiosNhlTeam = axios.create({
  baseURL: "https://api.nhle.com/stats/rest/en/team",
});

var axiosNhlWeb = axios.create({
  baseURL: "https://api-web.nhle.com/v1",
});

router.get("/roster/:triCode", async function (req, res, next) {
  try {
    const { triCode } = req.params;
    const season = getCurrentSeasonId();
    const cacheKey = `${triCode}_${season}`;
    const cached = readRosterCache(cacheKey);
    if (cached !== null) return res.send(cached);
    const response = await axiosNhlWeb.get(`/roster/${triCode}/${season}`);
    writeRosterCache(cacheKey, response.data);
    res.send(response.data);
  } catch (e) {
    next(e);
  }
});

router.get("/schedule/:triCode", async function (req, res, next) {
  try {
    const { triCode } = req.params;
    const season = req.query.season || getCurrentSeasonId();
    const response = await axiosNhlWeb.get(`/club-schedule-season/${triCode}/${season}`);
    res.send(response.data);
  } catch (e) {
    next(e);
  }
});

router.get("/stats", async function (req, res, next) {
  try {
    const url = "/summary?sort=shotsForPerGame&cayenneExp=seasonId=20232024 and gameTypeId=2";
    const response = await axiosNhlTeam.get(url);
    res.send(response.data);
  } catch (e) {
    next(e);
  }
});

router.get("/:teamId?", async function (req, res, next) {
  try {
    const { teamId } = req.params;
    const season = req.query.season || getCurrentSeasonId();
    const cayenneExp = teamId
      ? `teamId%3D${teamId}%20and%20seasonId%3D${season}%20and%20gameTypeId%3D2`
      : `seasonId%3D${season}%20and%20gameTypeId%3D2`;
    const response = await axiosNhlTeam.get(`/summary?cayenneExp=${cayenneExp}`);
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
