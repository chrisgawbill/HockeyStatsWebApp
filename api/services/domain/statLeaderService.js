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
		await seasonsRepository.upsertSeason(
			client,
			buildSeason(seasonId, { [`${playerType}Leaders`]: leadersPayload ?? null }),
		);

		let playersUpserted = 0;
		let leadersUpserted = 0;

		for (const { player, leader } of mapped.rows) {
			await playersRepository.upsertPlayer(client, player);
			await statLeadersRepository.upsertStatLeader(client, leader);

			playersUpserted += 1;
			leadersUpserted += 1;
		}

		return { playersUpserted, leadersUpserted, skipped: mapped.skipped };
	});
}

module.exports = {
	persistStatLeaders,
};
