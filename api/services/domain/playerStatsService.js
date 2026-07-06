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
		// Season row first (FK parent), then players before stats
		// (player_season_stats references players).
		await seasonsRepository.upsertSeason(
			client,
			buildSeason(seasonId, { [`${playerType}Stats`]: statsPayload ?? null }),
		);

		const playersUpserted = await playersRepository.upsertPlayers(
			client,
			mapped.rows.map((row) => row.player),
		);
		const statsUpserted = await playerStatsRepository.upsertPlayerSeasonStats(
			client,
			mapped.rows.map((row) => row.stats),
		);

		return { playersUpserted, statsUpserted, skipped: mapped.skipped };
	});
}

module.exports = {
	persistPlayerStats,
};
