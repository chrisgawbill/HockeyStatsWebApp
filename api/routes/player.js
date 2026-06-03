var express = require('express');
const { validateSeason } = require('../utils/seasonHelper');
const {
	axiosNhl,
	axiosNhlStats,
	axiosNhlGoalie,
} = require('../services/nhlApiClient');
const { GetOrFetch, CACHE_TYPES } = require('../utils/cacheManager');
const {
	mapSkaterSummary,
	mapGoalieSummary,
	mapStatLeaders,
} = require('../services/mappers/playerMapper');
const { runServiceTask } = require('../services/domain/runServiceTask');
const {
	persistPlayerStats,
} = require('../services/domain/playerStatsService');
const {
	persistStatLeaders,
} = require('../services/domain/statLeaderService');

var router = express.Router();

/**
 * GET /player/skater/statLeaders/:statIndicator?season=
 * Reads the requested stat category and validated season, caches the raw NHL
 * top-10 skater leader payload per category/season, and returns a normalized
 * StatLeaderContract array.
 */
router.get(
	'/skater/statLeaders/:statIndicator',
	validateSeason,
	async function (req, res, next) {
		try {
			const { statIndicator } = req.params;
			const seasonId = req.seasonId;
			const raw = await GetOrFetch(
				CACHE_TYPES.STAT_LEADERS,
				`skater_${statIndicator}_${seasonId}`,
				() =>
					axiosNhl
						.get(
							`/skater-stats-leaders/${seasonId}/2?categories=${statIndicator}&limit=10`,
						)
						.then((r) => r.data),
			);
			runServiceTask(`skater leaders ${statIndicator} ${seasonId}`, () =>
				persistStatLeaders({
					seasonId,
					playerType: 'skater',
					category: statIndicator,
					leadersPayload: raw,
				}),
			);
			res.send(mapStatLeaders(raw, statIndicator));
		} catch (e) {
			next(e);
		}
	},
);

/**
 * GET /player/goalie/statLeaders/:statIndicator?season=
 * Reads the requested stat category and validated season, caches the raw NHL
 * top-10 goalie leader payload per category/season, and returns a normalized
 * StatLeaderContract array.
 */
router.get(
	'/goalie/statLeaders/:statIndicator',
	validateSeason,
	async function (req, res, next) {
		try {
			const { statIndicator } = req.params;
			const seasonId = req.seasonId;
			const raw = await GetOrFetch(
				CACHE_TYPES.STAT_LEADERS,
				`goalie_${statIndicator}_${seasonId}`,
				() =>
					axiosNhl
						.get(
							`/goalie-stats-leaders/${seasonId}/2?categories=${statIndicator}&limit=10`,
						)
						.then((r) => r.data),
			);
			runServiceTask(`goalie leaders ${statIndicator} ${seasonId}`, () =>
				persistStatLeaders({
					seasonId,
					playerType: 'goalie',
					category: statIndicator,
					leadersPayload: raw,
				}),
			);
			res.send(mapStatLeaders(raw, statIndicator));
		} catch (e) {
			next(e);
		}
	},
);

/**
 * GET /player/skater/summary?teamId=&season=
 * Accepts an optional NHL team id and validated season, queries regular-season
 * skater totals for that scope, caches the raw stats response, and returns a
 * normalized SkaterSummaryContract array.
 */
router.get('/skater/summary', validateSeason, async function (req, res, next) {
	try {
		const { teamId } = req.query;
		const seasonId = req.seasonId;
		let exp = `seasonId=${seasonId} and gameTypeId=2`;
		if (teamId) exp += ` and teamId=${teamId}`;
		const raw = await GetOrFetch(
			CACHE_TYPES.PLAYER,
			`skater_summary_${teamId || 'all'}_${seasonId}`,
			() =>
				axiosNhlStats
					.get(`/summary?cayenneExp=${encodeURIComponent(exp)}&limit=100`)
					.then((r) => r.data),
		);
		runServiceTask(`skater summary ${teamId || 'all'} ${seasonId}`, () =>
			persistPlayerStats({
				seasonId,
				playerType: 'skater',
				statsPayload: raw,
				teamId: teamId ? Number(teamId) : null,
			}),
		);
		res.send(mapSkaterSummary(raw));
	} catch (e) {
		next(e);
	}
});

/**
 * GET /player/skater/corsi?teamId=&season=
 * Accepts an optional NHL team id and validated season, queries raw SAT/Corsi
 * percentages for that scope, caches the passthrough response, and returns the
 * raw NHL stats payload for frontend merging by playerId.
 */
router.get('/skater/corsi', validateSeason, async function (req, res, next) {
	try {
		const { teamId } = req.query;
		const seasonId = req.seasonId;
		let exp = `seasonId=${seasonId} and gameTypeId=2`;
		if (teamId) exp += ` and teamId=${teamId}`;
		const data = await GetOrFetch(
			CACHE_TYPES.PLAYER,
			`skater_corsi_${teamId || 'all'}_${seasonId}`,
			() =>
				axiosNhlStats
					.get(`/percentages?cayenneExp=${encodeURIComponent(exp)}&limit=100`)
					.then((r) => r.data),
		);
		res.send(data);
	} catch (e) {
		next(e);
	}
});

/**
 * GET /player/goalie/summary?teamId=&season=
 * Accepts an optional NHL team id and validated season, queries regular-season
 * goalie totals for that scope, caches the raw stats response, and returns a
 * normalized GoalieSummaryContract array.
 */
router.get('/goalie/summary', validateSeason, async function (req, res, next) {
	try {
		const { teamId } = req.query;
		const seasonId = req.seasonId;
		let exp = `seasonId=${seasonId} and gameTypeId=2`;
		if (teamId) exp += ` and teamId=${teamId}`;
		const raw = await GetOrFetch(
			CACHE_TYPES.PLAYER,
			`goalie_summary_${teamId || 'all'}_${seasonId}`,
			() =>
				axiosNhlGoalie
					.get(`/summary?cayenneExp=${encodeURIComponent(exp)}&limit=10`)
					.then((r) => r.data),
		);
		runServiceTask(`goalie summary ${teamId || 'all'} ${seasonId}`, () =>
			persistPlayerStats({
				seasonId,
				playerType: 'goalie',
				statsPayload: raw,
				teamId: teamId ? Number(teamId) : null,
			}),
		);
		res.send(mapGoalieSummary(raw));
	} catch (e) {
		next(e);
	}
});

module.exports = router;
