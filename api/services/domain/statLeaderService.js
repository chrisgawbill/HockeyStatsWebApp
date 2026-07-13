const { withTransaction } = require('../../db/pool');
const seasonsRepository = require('../../db/repositories/seasonsRepository');
const playersRepository = require('../../db/repositories/playersRepository');
const statLeadersRepository = require('../../db/repositories/statLeadersRepository');
const { buildSeason } = require('../mappers/db/entityBuilders');
const { mapStatLeaderPayload } = require('../mappers/db/statLeaderDbMapper');

async function persistStatLeaders({
	seasonId,
	playerType,
	category,
	leadersPayload,
	teamScope = 'all',
}) {
	const mapped = mapStatLeaderPayload({
		seasonId,
		playerType,
		category,
		leadersPayload,
		teamScope,
	});

	return await withTransaction(async (client) => {
		// Create/lock the FK-parent season row first (children reference it), then
		// batch the children. Batching keeps the whole transaction ~a handful of
		// statements, so the shared seasons-row lock is held only briefly.
		await seasonsRepository.upsertSeason(
			client,
			buildSeason(seasonId, { [`${playerType}Leaders`]: leadersPayload ?? null }),
		);

		// Players before leaders: stat_leaders.player_id references players.
		const playersUpserted = await playersRepository.upsertPlayers(
			client,
			mapped.rows.map((row) => row.player),
		);
		const leadersUpserted = await statLeadersRepository.upsertStatLeaders(
			client,
			mapped.rows.map((row) => row.leader),
		);

		return { playersUpserted, leadersUpserted, skipped: mapped.skipped };
	});
}

module.exports = {
	persistStatLeaders,
};
