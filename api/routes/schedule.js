var express = require("express");
var axios = require("axios");

var router = express.Router();

var axiosNhl = axios.create({
  baseURL: "https://api-web.nhle.com/v1",
});

let seasonCache = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

router.get("/", async function (req, res, next) {
    try {
      const now = Date.now();
      if (seasonCache && (now - seasonCache.fetchedAt) < CACHE_TTL) {
        return res.send(seasonCache.data);
      }

      const today = new Date();
      const seasonStartYear = today.getMonth() >= 9 ? today.getFullYear() : today.getFullYear() - 1;
      const startDate = new Date(`${seasonStartYear}-10-01`);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 28);

      const weekDates = [];
      const cur = new Date(startDate);
      while (cur <= endDate) {
        weekDates.push(cur.toISOString().split("T")[0]);
        cur.setDate(cur.getDate() + 7);
      }

      const responses = await Promise.all(
        weekDates.map((date) => axiosNhl.get(`/schedule/${date}`).catch(() => null))
      );

      const allGameWeeks = [];
      for (const resp of responses) {
        if (resp?.data?.gameWeek) {
          allGameWeeks.push(...resp.data.gameWeek);
        }
      }

      const result = { gameWeek: allGameWeeks };
      seasonCache = { data: result, fetchedAt: now };
      res.send(result);
    } catch (e) {
      res.send(e);
    }
  });
  router.get("/:gameID", async function (req, res, next) {
    try {
      const url = `/gamecenter/${req.params.gameID}/boxscore`;
      const response = await axiosNhl.get(url);
      res.send(response.data);
    } catch (e) {
      res.send(e);
    }
  });

  module.exports  = router;