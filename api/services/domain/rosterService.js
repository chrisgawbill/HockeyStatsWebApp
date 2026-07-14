const { withTransaction } = require('../../db/pool');
const seasonsRepository = require('../../db/repositories/seasonsRepository');
const playersRepository = require('../../db/repositories/playersRepository');
const teamsRepository = require('../../db/repositories/teamsRepository');
const rostersRepository = require('../../db/repositories/rostersRepository');
const { buildSeason } = require('../mappers/db/entityBuilders');
const { mapRosterPayload } = require('../mappers/db/rosterDbMapper');

async function persistRoster({
  seasonId,
  triCode,
  teamId = null,
  rosterPayload,
}) {
  const mapped = mapRosterPayload({ seasonId, triCode, teamId, rosterPayload });

  return await withTransaction(async (client) => {
    // Season row first (FK parent), then the optional team and players before
    // roster entries (roster_entries references seasons, players, and teams).
    await seasonsRepository.upsertSeason(
      client,
      buildSeason(seasonId, { roster: rosterPayload ?? null }),
    );

    if (teamId) {
      await teamsRepository.upsertTeams(client, [
        { teamId, triCode, sourcePayload: { teamId, triCode } },
      ]);
    }

    const playersUpserted = await playersRepository.upsertPlayers(
      client,
      mapped.rows.map((row) => row.player),
    );
    const rosterEntriesUpserted = await rostersRepository.upsertRosterEntries(
      client,
      mapped.rows.map((row) => row.rosterEntry),
    );

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
