const { toJsonParam } = require('./jsonParam');

async function upsertStatLeader(client, leader) {
	const result = await client.query(
		`
		INSERT INTO stat_leaders (
			season_id,
			player_id,
			player_type,
			category,
			rank,
			team_scope,
			value,
			leader_payload,
			updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
		ON CONFLICT (season_id, player_type, category, team_scope, player_id)
		DO UPDATE SET
			rank = COALESCE(EXCLUDED.rank, stat_leaders.rank),
			value = COALESCE(EXCLUDED.value, stat_leaders.value),
			leader_payload = EXCLUDED.leader_payload,
			updated_at = now()
		RETURNING *
		`,
		[
			leader.seasonId,
			leader.playerId,
			leader.playerType,
			leader.category,
			leader.rank ?? null,
			leader.teamScope ?? 'all',
			leader.value ?? null,
			toJsonParam(leader.leaderPayload),
		],
	);
	return result.rows[0];
}

async function getStatLeaders(
	client,
	{ seasonId, playerType, category, teamScope = 'all' },
) {
	const result = await client.query(
		`
		SELECT
			to_jsonb(stat_leaders) AS leader,
			to_jsonb(players) AS player
		FROM stat_leaders
		JOIN players ON players.player_id = stat_leaders.player_id
		WHERE stat_leaders.season_id = $1
			AND stat_leaders.player_type = $2
			AND stat_leaders.category = $3
			AND stat_leaders.team_scope = $4
		ORDER BY stat_leaders.rank NULLS LAST, stat_leaders.value DESC NULLS LAST
		`,
		[seasonId, playerType, category, teamScope],
	);
	return result.rows;
}

module.exports = {
	upsertStatLeader,
	getStatLeaders,
};
