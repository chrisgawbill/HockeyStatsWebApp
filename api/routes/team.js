var express = require('express');
const { validateSeason } = require('../utils/seasonHelper');
const { axiosNhl, axiosNhlTeam } = require('../services/nhlApiClient');
const { GetOrFetch, CACHE_TYPES } = require('../utils/cacheManager');
const { mapRoster } = require('../services/mappers/rosterMapper');
const { mapGame } = require('../services/mappers/scheduleMapper');
const { runServiceTask } = require('../services/domain/runServiceTask');
const { persistRoster } = require('../services/domain/rosterService');
const { persistSchedule } = require('../services/domain/scheduleService');
const { persistTeamSeason } = require('../services/domain/teamService');

var router = express.Router();

/**
 * All team routes are season-capable. Resolve the optional `?season=` query
 * once at the router level so each handler can read `req.seasonId`.
 */
router.use(validateSeason);

/**
 * Local-time-aware short weekday for a YYYY-MM-DD club-schedule date.
 * (The club-schedule endpoint has no dayAbbrev like the weekly endpoint does.)
 * @param {string} gameDate
 * @returns {string}
 */
function shortDayOfWeek(gameDate) {
	return new Date(`${gameDate}T12:00:00`).toLocaleDateString('en-US', {
		weekday: 'short',
	});
}

/**
 * GET /team/roster/:triCode?season=
 * Reads a team tri-code and validated season, fetches/caches the raw NHL roster
 * for that team/season, and returns a normalized RosterContract.
 */
router.get('/roster/:triCode', async function (req, res, next) {
	try {
		const { triCode } = req.params;
		const season = req.seasonId;
		const raw = await GetOrFetch(
			CACHE_TYPES.ROSTER,
			`${triCode}_${season}`,
			() => axiosNhl.get(`/roster/${triCode}/${season}`).then((r) => r.data),
		);
		runServiceTask(`roster ${triCode} ${season}`, () =>
			persistRoster({ seasonId: season, triCode, rosterPayload: raw }),
		);
		res.send(mapRoster(raw));
	} catch (e) {
		next(e);
	}
});

/**
 * GET /team/schedule/:triCode?season=
 * Reads a team tri-code and validated season, fetches that club's season
 * schedule, maps each game through the shared ScheduleGameContract mapper, and
 * returns the games sorted by calendar date.
 */
router.get('/schedule/:triCode', async function (req, res, next) {
	try {
		const { triCode } = req.params;
		const season = req.seasonId;
		const raw = await GetOrFetch(
			CACHE_TYPES.SCHEDULE,
			`team_${triCode}_${season}`,
			() =>
				axiosNhl
					.get(`/club-schedule-season/${triCode}/${season}`)
					.then((r) => r.data),
		);
		runServiceTask(`club schedule ${triCode} ${season}`, () =>
			persistSchedule({
				seasonId: season,
				schedulePayload: raw,
				sourceLabel: 'clubSchedule',
			}),
		);
		const games = (raw.games ?? [])
			.map((g) =>
				mapGame(g, { date: g.gameDate, dayAbbrev: shortDayOfWeek(g.gameDate) }),
			)
			.sort(
				(a, b) =>
					new Date(`${a.date}T12:00:00`).getTime() -
					new Date(`${b.date}T12:00:00`).getTime(),
			);
		res.send({ games });
	} catch (e) {
		next(e);
	}
});

/**
 * GET /team/stats?season=
 * Reads a validated season, queries raw league-wide regular-season team summary
 * stats, and passes the NHL stats payload through unchanged.
 */
router.get('/stats', async function (req, res, next) {
	try {
		const season = req.seasonId;
		const url = `/summary?sort=shotsForPerGame&cayenneExp=seasonId=${season} and gameTypeId=2`;
		const data = await GetOrFetch(
			CACHE_TYPES.TEAM,
			`summary_sorted_shotsForPerGame_${season}`,
			() => axiosNhlTeam.get(url).then((r) => r.data),
		);
		runServiceTask(`team stats ${season}`, () =>
			persistTeamSeason({ seasonId: season, teamStatsPayload: data }),
		);
		res.send(data);
	} catch (e) {
		next(e);
	}
});

/**
 * GET /team/:teamId?season=
 * Reads an optional NHL team id and validated season, queries raw regular-season
 * team summary stats for that scope, and passes the NHL stats payload through
 * unchanged.
 */
router.get('/:teamId?', async function (req, res, next) {
	try {
		const { teamId } = req.params;
		const season = req.seasonId;
		const cayenneExp =
			teamId ?
				`teamId%3D${teamId}%20and%20seasonId%3D${season}%20and%20gameTypeId%3D2`
			:	`seasonId%3D${season}%20and%20gameTypeId%3D2`;
		const data = await GetOrFetch(
			CACHE_TYPES.TEAM,
			`summary_${teamId || 'all'}_${season}`,
			() =>
				axiosNhlTeam
					.get(`/summary?cayenneExp=${cayenneExp}`)
					.then((r) => r.data),
		);
		runServiceTask(`team summary ${teamId || 'all'} ${season}`, () =>
			persistTeamSeason({ seasonId: season, teamStatsPayload: data }),
		);
		res.send(data);
	} catch (e) {
		next(e);
	}
});

module.exports = router;
