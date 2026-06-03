var express = require('express');
var cacheManager = require('../utils/cacheManager');
const { authCheck } = require('../utils/auth');

var router = express.Router();
router.use(authCheck);

router.get('/', async function (req, res, next) {
	try {
		res.json({
			status: 'ok',
			version: require('../package.json').version,
			environment: process.env.NODE_ENV || 'development',
			currentSeason: require('../utils/seasonHelper').getCurrentSeasonId(),
			cacheStorageMode: cacheManager.getCacheStorageMode(),
			cacheWritable: await cacheManager.isCacheWritable(),
			externalCacheConfigured: await cacheManager.isExternalCacheConfigured(),
			externalCacheReachable: await cacheManager.isExternalCacheReachable(),
			anthropicKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
			uptime: process.uptime(),
			currentTime: new Date().toISOString(),
		});
	} catch (e) {
		next(e);
	}
});

router.get('/cache-usage', async function (req, res, next) {
	try {
		const usage = await cacheManager.getCacheUsage();
		res.json(usage);
	} catch (e) {
		next(e);
	}
});

module.exports = router;
