const { toJsonParam } = require('./jsonParam');

async function upsertPlayer(client, player) {
	const result = await client.query(
		`
		INSERT INTO players (
			player_id,
			first_name,
			last_name,
			full_name,
			headshot_url,
			hero_image_url,
			birth_date,
			nationality_code,
			shoots_catches,
			position_code,
			source_payload,
			updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now())
		ON CONFLICT (player_id)
		DO UPDATE SET
			first_name = COALESCE(EXCLUDED.first_name, players.first_name),
			last_name = COALESCE(EXCLUDED.last_name, players.last_name),
			full_name = COALESCE(EXCLUDED.full_name, players.full_name),
			headshot_url = COALESCE(EXCLUDED.headshot_url, players.headshot_url),
			hero_image_url = COALESCE(
				EXCLUDED.hero_image_url,
				players.hero_image_url
			),
			birth_date = COALESCE(EXCLUDED.birth_date, players.birth_date),
			nationality_code = COALESCE(
				EXCLUDED.nationality_code,
				players.nationality_code
			),
			shoots_catches = COALESCE(
				EXCLUDED.shoots_catches,
				players.shoots_catches
			),
			position_code = COALESCE(EXCLUDED.position_code, players.position_code),
			source_payload = EXCLUDED.source_payload,
			updated_at = now()
		RETURNING *
		`,
		[
			player.playerId,
			player.firstName ?? null,
			player.lastName ?? null,
			player.fullName ?? null,
			player.headshotUrl ?? null,
			player.heroImageUrl ?? null,
			player.birthDate ?? null,
			player.nationalityCode ?? null,
			player.shootsCatches ?? null,
			player.positionCode ?? null,
			toJsonParam(player.sourcePayload),
		],
	);
	return result.rows[0];
}

async function getPlayer(client, playerId) {
	const result = await client.query('SELECT * FROM players WHERE player_id = $1', [
		playerId,
	]);
	return result.rows[0] ?? null;
}

module.exports = {
	upsertPlayer,
	getPlayer,
};
