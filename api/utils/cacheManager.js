var fs = require("fs");
var path = require("path");

const inFlight = new Map();

const CACHE_TYPES = {
  PLAYER:      'player',
  ROSTER:      'roster',
  AI:          'ai',
  SCHEDULE:    'schedule',
  STANDINGS:   'standings',
  STAT_LEADERS:'stat-leaders',
};

const CACHE_DIRS = {
  [CACHE_TYPES.PLAYER]:       path.join(__dirname, "../player-cache/"),
  [CACHE_TYPES.ROSTER]:       path.join(__dirname, "../roster-cache/"),
  [CACHE_TYPES.AI]:           path.join(__dirname, "../ai-cache/"),
  [CACHE_TYPES.SCHEDULE]:     path.join(__dirname, "../schedule-cache/"),
  [CACHE_TYPES.STANDINGS]:    path.join(__dirname, "../standings-cache/"),
  [CACHE_TYPES.STAT_LEADERS]: path.join(__dirname, "../stat-leaders-cache/"),
};

const CACHE_TTLS = {
  [CACHE_TYPES.PLAYER]:       24  * 60 * 60 * 1000,
  [CACHE_TYPES.ROSTER]:       24  * 60 * 60 * 1000,
  [CACHE_TYPES.AI]:           365 * 24 * 60 * 60 * 1000,
  [CACHE_TYPES.SCHEDULE]:     12  * 60 * 60 * 1000,
  [CACHE_TYPES.STANDINGS]:    24  * 60 * 60 * 1000,
  [CACHE_TYPES.STAT_LEADERS]: 24  * 60 * 60 * 1000,
};

async function readCache(type, key) {
  const filePath = path.join(CACHE_DIRS[type], `${key}.json`);
  try {
    const entry = JSON.parse(await fs.promises.readFile(filePath, "utf-8"));
    if (Date.now() - entry.timestamp < CACHE_TTLS[type]){
      return entry.data;
    } 
  } catch {}
  return null;
}

async function writeCache(type, key, data) {
  const filePath = path.join(CACHE_DIRS[type], `${key}.json`);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, JSON.stringify({ timestamp: Date.now(), data }));
}

async function GetOrFetch(type, key, fetcher){
  const cached = await readCache(type, key);
  if(cached !== null){
    return cached;
  }
  const inFlightKey = `${type}:${key}`;
  if(inFlight.has(inFlightKey)){
    return await inFlight.get(inFlightKey);
  }
  const promise = fetcher().then(async data => {
    await writeCache(type, key, data);
    return data;
  }).finally(() => inFlight.delete(inFlightKey));

  inFlight.set(inFlightKey, promise);
  return await promise;
}

module.exports = { readCache, writeCache, CACHE_TYPES, GetOrFetch };
