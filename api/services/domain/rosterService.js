const { withTransaction } = require('../../db/pool');
const seasonsRepository = require('../../db/repositories/seasonsRepository');
const playersRepository = require('../../db/repositories/playersRepository');
const teamsRepository = require('../../db/repositories/teamsRepository');
const rostersRepository = require('../../db/repositories/rostersRepository');
const { buildSeason } = require('../mappers/db/entityBuilders');
const { mapRosterPayload } = require('../mappers/db/rosterDbMapper');

async function persistRoster({ seasonId, triCode, teamId = null, rosterPayload }) {
	const mapped = mapRosterPayload({ seasonId, triCode, teamId, rosterPayload });

	return await withTransaction(async (client) => {
		await seasonsRepository.upsertSeason(
			client,
			buildSeason(seasonId, { roster: rosterPayload ?? null }),
		);

		if (teamId) {
			await teamsRepository.upsertTeam(client, {
				teamId,
				triCode,
				sourcePayload: { teamId, triCode },
			});
		}

		let playersUpserted = 0;
		let rosterEntriesUpserted = 0;

		for (const { player, rosterEntry } of mapped.rows) {
			await playersRepository.upsertPlayer(client, player);
			await rostersRepository.upsertRosterEntry(client, rosterEntry);

			playersUpserted += 1;
			rosterEntriesUpserted += 1;
		}

		return {
			playersUpserted,
			rosterEntriesUpserted,
			skipped: mapped.skipped,
		};
	});
}

module.exports = {
	persistRoster,
};
