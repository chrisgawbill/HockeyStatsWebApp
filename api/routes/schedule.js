var express = require("express");
const { axiosNhl } = require("../services/nhlApiClient");
const { GetOrFetch, writeCache, CACHE_TYPES } = require("../utils/cacheManager");
const { getCurrentSeasonId, validateSeason } = require("../utils/seasonHelper");
const { mapGame } = require("../services/mappers/scheduleMapper");
const { runServiceTask } = require("../services/domain/runServiceTask");
const { persistSchedule } = require("../services/domain/scheduleService");

var router = express.Router();

/**
 * Flatten the raw weekly season payload into a list of ScheduleGameContract.
 * The week supplies date/dayAbbrev; each of its games is mapped with that ctx.
 * @param {{ gameWeek?: any[] }} raw
 * @returns {import("../services/mappers/scheduleMapper").ScheduleGameContract[]}
 */
function mapSeasonSchedule(raw) {
  const games = [];
  for (const week of raw?.gameWeek ?? []) {
    for (const g of week.games ?? []) {
      games.push(mapGame(g, { date: week.date, dayAbbrev: week.dayAbbrev }));
    }
  }
  return games;
}

/**
 * Fetches a whole season's schedule from the NHL weekly endpoint. The NHL only
 * serves a week at a time, so this walks the season in 7-day steps and merges
 * every week's games into one raw `{ gameWeek }` payload (failed weeks are
 * skipped rather than failing the whole fetch).
 * @param {string} seasonId
 * @returns {Promise<{ gameWeek: any[] }>} Raw, unmapped weekly payloads combined.
 */
async function fetchSeasonSchedule(seasonId) {
  const startYear = Number(seasonId.slice(0, 4));
  const startDate = new Date(`${startYear}-10-01`);

  let endDate;
  if (seasonId === getCurrentSeasonId()) {
    endDate = new Date();
    endDate.setDate(endDate.getDate() + 28);
  } else {
    endDate = new Date(`${startYear + 1}-06-30`);
  }

  const weekDates = [];
  const cur = new Date(startDate);
  while (cur <= endDate) {
    weekDates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 7);
  }

  const responses = await Promise.all(
    weekDates.map(date => axiosNhl.get(`/schedule/${date}`).catch(() => null))
  );

  const allGameWeeks = [];
  for (const resp of responses) {
    if (resp?.data?.gameWeek) allGameWeeks.push(...resp.data.gameWeek);
  }
  return { gameWeek: allGameWeeks };
}

/**
 * Re-fetches the current season's schedule and overwrites its cache entry.
 * Invoked on a timer by app.js so the cached schedule stays current without a
 * user request triggering the fetch. Errors are logged, not thrown, so a failed
 * refresh never crashes the scheduler.
 */
async function refreshScheduleCache() {
  try {
    const seasonId = getCurrentSeasonId();
    const data = await fetchSeasonSchedule(seasonId);
    await writeCache(CACHE_TYPES.SCHEDULE, seasonId, data);
    console.log('Schedule cache refreshed at', new Date().toISOString());
  } catch (e) {
    console.error('Failed to refresh schedule cache:', e);
  }
}

/**
 * GET /schedule/?season=
 * Reads an optional validated season id from `req.seasonId`, fetches/caches the
 * raw weekly NHL schedule payload for that season, and returns mapped
 * ScheduleGameContract models in a `{ games }` envelope.
 */
router.get("/", validateSeason, async function (req, res, next) {
  try {
    const seasonId = req.seasonId;
    const raw = await GetOrFetch(CACHE_TYPES.SCHEDULE, seasonId, () =>
      fetchSeasonSchedule(seasonId)
    );
    runServiceTask(`season schedule ${seasonId}`, () =>
      persistSchedule({ seasonId, schedulePayload: raw })
    );
    res.send({ games: mapSeasonSchedule(raw) });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /schedule/landing/:gameID
 * Accepts an NHL game id path param, loads the public gamecenter landing
 * payload, and passes it through unchanged for game-detail preview/final views.
 */
router.get("/landing/:gameID", async function (req, res, next) {
  try {
    const url = `/gamecenter/${req.params.gameID}/landing`;
    const data = await GetOrFetch(
      CACHE_TYPES.SCHEDULE,
      `landing_${req.params.gameID}`,
      () => axiosNhl.get(url).then((r) => r.data),
      { ttlMs: 5 * 60 * 1000 }
    );
    res.send(data);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /schedule/:gameID
 * Accepts an NHL game id path param, loads the public gamecenter boxscore
 * payload, and passes it through unchanged so the frontend can backfill scores
 * and render game details.
 */
router.get("/:gameID", async function (req, res, next) {
  try {
    const url = `/gamecenter/${req.params.gameID}/boxscore`;
    const data = await GetOrFetch(
      CACHE_TYPES.SCHEDULE,
      `boxscore_${req.params.gameID}`,
      () => axiosNhl.get(url).then((r) => r.data),
      { ttlMs: 5 * 60 * 1000 }
    );
    res.send(data);
  } catch (e) {
    next(e);
  }
});

module.exports = { router, refreshScheduleCache };
