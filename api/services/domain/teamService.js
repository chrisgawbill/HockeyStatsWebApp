const { withTransaction } = require('../../db/pool');
const seasonsRepository = require('../../db/repositories/seasonsRepository');
const teamsRepository = require('../../db/repositories/teamsRepository');
const { buildSeason } = require('../mappers/db/entityBuilders');
const { mapTeamSeasonPayload } = require('../mappers/db/teamDbMapper');

/**
 * Upserts teams and team-season snapshots from raw NHL stats/standings payloads.
 *
 * Call this after `GetOrFetch` has returned raw API data. The raw payload still
 * belongs in `app_cache`; this service stores the normalized app-facing rows.
 *
 * @param {object} params
 * @param {string} params.seasonId NHL season id such as "20252026".
 * @param {object} params.teamStatsPayload Raw NHL stats REST team summary payload.
 * @param {object} [params.standingsPayload] Optional raw NHL standings payload.
 * @returns {Promise<{teamsUpserted: number, snapshotsUpserted: number, skipped: number}>}
 */
async function persistTeamSeason({
	seasonId,
	teamStatsPayload,
	standingsPayload = null,
}) {
	const mapped = mapTeamSeasonPayload({
		seasonId,
		teamStatsPayload,
		standingsPayload,
	});

	return await withTransaction(async (client) => {
		await seasonsRepository.upsertSeason(
			client,
			buildSeason(seasonId, {
				teamStats: teamStatsPayload ?? null,
				standings: standingsPayload ?? null,
			}),
		);

		let teamsUpserted = 0;
		let snapshotsUpserted = 0;

		for (const { team, snapshot } of mapped.rows) {
			await teamsRepository.upsertTeam(client, team);
			await teamsRepository.upsertTeamSeasonSnapshot(client, snapshot);

			teamsUpserted += 1;
			snapshotsUpserted += 1;
		}

		return { teamsUpserted, snapshotsUpserted, skipped: mapped.skipped };
	});
}

module.exports = {
	persistTeamSeason,
};
