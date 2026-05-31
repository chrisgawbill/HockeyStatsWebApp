var express = require("express");
const { getCurrentSeasonId } = require("../utils/seasonHelper");
const { axiosNhl, axiosNhlTeam } = require("../services/nhlApiClient");
const { GetOrFetch, CACHE_TYPES } = require("../utils/cacheManager");
const { mapRoster } = require("../services/mappers/rosterMapper");
const { mapGame } = require("../services/mappers/scheduleMapper");

var router = express.Router();

/**
 * Local-time-aware short weekday for a YYYY-MM-DD club-schedule date.
 * (The club-schedule endpoint has no dayAbbrev like the weekly endpoint does.)
 * @param {string} gameDate
 * @returns {string}
 */
function shortDayOfWeek(gameDate) {
  return new Date(`${gameDate}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

router.get("/roster/:triCode", async function (req, res, next) {
  try {
    const { triCode } = req.params;
    const season = getCurrentSeasonId();
    const raw = await GetOrFetch(
      CACHE_TYPES.ROSTER,
      `${triCode}_${season}`,
      () => axiosNhl.get(`/roster/${triCode}/${season}`).then(r => r.data)
    );
    res.send(mapRoster(raw));
  } catch (e) {
    next(e);
  }
});

router.get("/schedule/:triCode", async function (req, res, next) {
  try {
    const { triCode } = req.params;
    const season = req.query.season || getCurrentSeasonId();
    const response = await axiosNhl.get(`/club-schedule-season/${triCode}/${season}`);
    const games = (response.data.games ?? [])
      .map((g) =>
        mapGame(g, { date: g.gameDate, dayAbbrev: shortDayOfWeek(g.gameDate) }),
      )
      .sort((a, b) =>
        new Date(`${a.date}T12:00:00`).getTime() -
        new Date(`${b.date}T12:00:00`).getTime(),
      );
    res.send({ games });
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

module.exports = router;
