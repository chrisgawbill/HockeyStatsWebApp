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

	return await withTransaction(async (client) => {
		await seasonsRepository.upsertSeason(
			client,
			buildSeason(seasonId, { [sourceLabel]: schedulePayload ?? null }),
		);

		let teamsUpserted = 0;
		let gamesUpserted = 0;

		for (const { homeTeam, awayTeam, game } of mapped.rows) {
			if (homeTeam) {
				await teamsRepository.upsertTeam(client, homeTeam);
				teamsUpserted += 1;
			}
			if (awayTeam) {
				await teamsRepository.upsertTeam(client, awayTeam);
				teamsUpserted += 1;
			}

			await scheduleGamesRepository.upsertScheduleGame(client, game);
			gamesUpserted += 1;
		}

		return { gamesUpserted, teamsUpserted, skipped: mapped.skipped };
	});
}

module.exports = {
	persistSchedule,
};
