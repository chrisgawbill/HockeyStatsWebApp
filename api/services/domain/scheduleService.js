const { withTransaction } = require('../../db/pool');
const seasonsRepository = require('../../db/repositories/seasonsRepository');
const teamsRepository = require('../../db/repositories/teamsRepository');
const scheduleGamesRepository = require('../../db/repositories/scheduleGamesRepository');
const { buildSeason } = require('../mappers/db/entityBuilders');
const { mapSchedulePayload } = require('../mappers/db/scheduleDbMapper');

/**
 * Upserts a season schedule into `schedule_games`.
 *
 * Accepts either the weekly schedule payload (`{ gameWeek: [...] }`) or the
 * club-schedule payload (`{ games: [...] }`).
 */
async function persistSchedule({
	seasonId,
	schedulePayload,
	sourceLabel = 'schedule',
}) {
	const mapped = mapSchedulePayload({ seasonId, schedulePayload });

	const teams = [];
	const games = [];
	for (const { homeTeam, awayTeam, game } of mapped.rows) {
		if (homeTeam) teams.push(homeTeam);
		if (awayTeam) teams.push(awayTeam);
		games.push(game);
	}

	return await withTransaction(async (client) => {
		// Season row first (FK parent), then teams before games
		// (schedule_games references teams). Batching dedupes the ~32 teams that
		// the payload repeats ~80x each, so teamsUpserted now counts unique teams.
		await seasonsRepository.upsertSeason(
			client,
			buildSeason(seasonId, { [sourceLabel]: schedulePayload ?? null }),
		);

		const teamsUpserted = await teamsRepository.upsertTeams(client, teams);
		const gamesUpserted = await scheduleGamesRepository.upsertScheduleGames(
			client,
			games,
		);

		return { gamesUpserted, teamsUpserted, skipped: mapped.skipped };
	});
}

module.exports = {
	persistSchedule,
};
