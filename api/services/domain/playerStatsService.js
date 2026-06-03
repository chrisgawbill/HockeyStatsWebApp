const { withTransaction } = require('../../db/pool');
const seasonsRepository = require('../../db/repositories/seasonsRepository');
const playersRepository = require('../../db/repositories/playersRepository');
const playerStatsRepository = require('../../db/repositories/playerStatsRepository');
const { buildSeason } = require('../mappers/db/entityBuilders');
const {
	mapPlayerStatsPayload,
} = require('../mappers/db/playerStatsDbMapper');

async function persistPlayerStats({
	seasonId,
	playerType,
	statsPayload,
	teamId = null,
	teamScope = teamId ? String(teamId) : 'all',
}) {
	const mapped = mapPlayerStatsPayload({
		seasonId,
		playerType,
		statsPayload,
		teamId,
		teamScope,
	});

	return await withTransaction(async (client) => {
		await seasonsRepository.upsertSeason(
			client,
			buildSeason(seasonId, { [`${playerType}Stats`]: statsPayload ?? null }),
		);

		let playersUpserted = 0;
		let statsUpserted = 0;

		for (const { player, stats } of mapped.rows) {
			await playersRepository.upsertPlayer(client, player);
			await playerStatsRepository.upsertPlayerSeasonStats(client, stats);

			playersUpserted += 1;
			statsUpserted += 1;
		}

		return { playersUpserted, statsUpserted, skipped: mapped.skipped };
	});
}

module.exports = {
	persistPlayerStats,
};
