const { Pool } = require('pg');

let pool = null;

function getDatabaseUrl() {
	return process.env.DATABASE_URL || process.env.CACHE_DATABASE_URL;
}

function getSslConfig() {
	if (process.env.CACHE_DATABASE_SSL === 'false') return false;
	if (
		process.env.NODE_ENV === 'production' ||
		process.env.CACHE_DATABASE_SSL === 'true'
	) {
		return { rejectUnauthorized: false };
	}
	return undefined;
}

function getDbPool() {
	const connectionString = getDatabaseUrl();
	if (!connectionString) {
		throw new Error('DATABASE_URL or CACHE_DATABASE_URL is required.');
	}
	if (!pool) {
		pool = new Pool({
			connectionString,
			ssl: getSslConfig(),
		});
	}
	return pool;
}

async function withDbClient(callback) {
	const client = await getDbPool().connect();
	try {
		return await callback(client);
	} finally {
		client.release();
	}
}

async function withTransaction(callback) {
	return await withDbClient(async (client) => {
		await client.query('BEGIN');
		try {
			const result = await callback(client);
			await client.query('COMMIT');
			return result;
		} catch (error) {
			await client.query('ROLLBACK');
			throw error;
		}
	});
}

async function closeDbPool() {
	if (!pool) return;
	await pool.end();
	pool = null;
}

module.exports = {
	getDbPool,
	withDbClient,
	withTransaction,
	closeDbPool,
};
