const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

const cacheManagerPath = require.resolve('../utils/cacheManager');
const pgPath = require.resolve('pg');
const originalPgCache = require.cache[pgPath];
const originalEnv = {
	CACHE_DATABASE_URL: process.env.CACHE_DATABASE_URL,
	CACHE_STORAGE: process.env.CACHE_STORAGE,
};

function restorePg() {
	if (originalPgCache) {
		require.cache[pgPath] = originalPgCache;
	} else {
		delete require.cache[pgPath];
	}
}

function installPgMock(cacheUsageRows) {
	require.cache[pgPath] = {
		id: pgPath,
		filename: pgPath,
		loaded: true,
		exports: {
			Pool: class {
				async query(sql) {
					if (
						String(sql).includes('FROM app_cache') &&
						String(sql).includes('GROUP BY type')
					) {
						return { rows: cacheUsageRows };
					}
					return { rows: [] };
				}
			},
		},
	};
}

function restoreEnv() {
	for (const [key, value] of Object.entries(originalEnv)) {
		if (value === undefined) {
			delete process.env[key];
		} else {
			process.env[key] = value;
		}
	}
	delete require.cache[cacheManagerPath];
	restorePg();
}

function loadCacheManager(env = {}, pgRows = null) {
	delete require.cache[cacheManagerPath];
	restorePg();
	if (pgRows) {
		installPgMock(pgRows);
	}
	for (const key of Object.keys(originalEnv)) {
		delete process.env[key];
	}
	for (const [key, value] of Object.entries(env)) {
		process.env[key] = value;
	}
	return require('../utils/cacheManager');
}

afterEach(restoreEnv);

test('cache storage defaults to filesystem without a database URL', () => {
	const cacheManager = loadCacheManager();

	assert.equal(cacheManager.getCacheStorageMode(), 'filesystem');
});

test('cache storage defaults to postgres when a database URL is configured', () => {
	const cacheManager = loadCacheManager({
		CACHE_DATABASE_URL: 'postgres://user:pass@localhost:5432/hockey',
	});

	assert.equal(cacheManager.getCacheStorageMode(), 'postgres');
});

test('cache storage accepts explicit filesystem mode even with a database URL', () => {
	const cacheManager = loadCacheManager({
		CACHE_DATABASE_URL: 'postgres://user:pass@localhost:5432/hockey',
		CACHE_STORAGE: 'filesystem',
	});

	assert.equal(cacheManager.getCacheStorageMode(), 'filesystem');
});

test('cache storage accepts explicit hybrid mode', () => {
	const cacheManager = loadCacheManager({
		CACHE_DATABASE_URL: 'postgres://user:pass@localhost:5432/hockey',
		CACHE_STORAGE: 'hybrid',
	});

	assert.equal(cacheManager.getCacheStorageMode(), 'hybrid');
});

test('cache storage ignores unknown modes and falls back from environment', () => {
	const cacheManager = loadCacheManager({
		CACHE_DATABASE_URL: 'postgres://user:pass@localhost:5432/hockey',
		CACHE_STORAGE: 'redis',
	});

	assert.equal(cacheManager.getCacheStorageMode(), 'postgres');
});

test('cache usage reports postgres bytes as the primary cache when configured', async () => {
	const cacheManager = loadCacheManager(
		{
			CACHE_DATABASE_URL: 'postgres://user:pass@localhost:5432/hockey',
		},
		[
			{ type: 'schedule', entries: 2, bytes: 500 },
			{ type: 'team', entries: 1, bytes: 1000 },
		],
	);

	const usage = await cacheManager.getCacheUsage();

	assert.equal(usage.storageMode, 'postgres');
	assert.equal(usage.primaryStore, 'postgres');
	assert.deepEqual(usage.sections, { schedule: 500, team: 1000 });
	assert.deepEqual(usage.largestSection, { type: 'team', size: 1000 });
	assert.equal(usage.total, 1500);
	assert.equal(usage.external.reachable, true);
	assert.equal(usage.external.totalEntries, 3);
	assert.equal(usage.external.totalBytes, 1500);
	assert.ok(usage.local);
});
