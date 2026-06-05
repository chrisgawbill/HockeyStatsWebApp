require('dotenv').config();
var createError = require('http-errors');
var compression = require('compression');
var cors = require('cors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var healthRouter = require('./routes/health');
var standingsRouter = require('./routes/standings');
var playerRouter = require('./routes/player');
var teamRouter = require('./routes/team');
const {
	router: scheduleRouter,
	refreshScheduleCache,
} = require('./routes/schedule');

const { spawn } = require('child_process');
const { readCache, writeCache, CACHE_TYPES } = require('./utils/cacheManager');
const { runServiceTask } = require('./services/domain/runServiceTask');
const { persistAiSummary } = require('./services/domain/aiSummaryService');

let corsOptions = {
	origin: [
		'http://localhost:3000',
		'http://localhost:5173',
		'https://chrisgawbill.github.io',
	],
	allowedHeaders: ['Content-Type', 'x-diagnostics-key'],
};

var app = express();

app.use(compression());
app.use(cors(corsOptions));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/health', healthRouter);
app.use('/standings', standingsRouter);
app.use('/player', playerRouter);
app.use('/team', teamRouter);
app.use('/schedule', scheduleRouter);

app.post('/python-service', async (req, res, next) => {
	try {
		const message = req.body.content;
		const key = req.body.cacheKey ?? 'default';

		const cached = await readCache(CACHE_TYPES.AI, key);
		if (cached !== null) {
			queueAiSummaryPersistence(key, cached, message);
			return res.send(cached);
		}

		const result = await runAIPythonScript(message);
		await writeCache(CACHE_TYPES.AI, key, result);
		queueAiSummaryPersistence(key, result, message);
		res.send(result);
	} catch (error) {
		next(error);
	}
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	console.error(`${req.method} ${req.originalUrl} failed:`, err);
	res
		.status(err.status || 500)
		.json({ error: err.message ?? 'Internal server error' });
});

const runAIPythonScript = (message) => {
	return new Promise((resolve, reject) => {
		const pythonPath =
			process.env.NODE_ENV === 'production' ?
				'python3'
			:	path.join(__dirname, 'venv/bin/python3');
		const pythonProcess = spawn(pythonPath, [
			path.join(__dirname, 'routes/hockey-ai.py'),
			message,
		]);

		let stdoutData = '';

		pythonProcess.on('error', (err) => {
			console.error('Failed to start python process: ', err);
			reject(`Failed to start python process: ${err.message}`);
		});
		pythonProcess.stdout.on('data', (data) => {
			stdoutData += data.toString();
		});
		pythonProcess.stderr.on('data', (data) => {
			console.error('stderr: ' + data);
		});
		pythonProcess.on('close', (code) => {
			console.log('child process exited with code: ' + code);
			if (code !== 0) {
				reject(`Process exited with code ${code}`);
			} else {
				try {
					const jsonReponse = JSON.parse(stdoutData);
					if (jsonReponse.error) {
						reject(jsonReponse.error);
					} else {
						resolve(jsonReponse.data);
					}
				} catch (e) {
					reject(`Error parsing JSON response\n${stdoutData}`);
				}
			}
		});
	});
};

function queueAiSummaryPersistence(cacheKey, content, prompt) {
	const triCode = cacheKey === 'default' ? null : cacheKey;
	if (!triCode) return;

	runServiceTask(`ai summary ${triCode}`, () =>
		persistAiSummary({
			triCode,
			content,
			prompt,
			modelProvider: 'anthropic',
		}),
	);
}

// Schedule cache refreshes at 8AM, 7PM, 11PM UTC
const REFRESH_HOURS_UTC = [8, 19, 23];
function scheduleNextRefresh() {
	const now = new Date();
	let nextMs = null;
	for (const hour of REFRESH_HOURS_UTC) {
		const candidate = new Date(now);
		candidate.setUTCHours(hour, 0, 0, 0);
		if (candidate.getTime() > now.getTime()) {
			nextMs = candidate.getTime();
			break;
		}
	}
	if (!nextMs) {
		const tomorrow = new Date(now);
		tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
		tomorrow.setUTCHours(REFRESH_HOURS_UTC[0], 0, 0, 0);
		nextMs = tomorrow.getTime();
	}
	setTimeout(async () => {
		await refreshScheduleCache();
		scheduleNextRefresh();
	}, nextMs - now.getTime());
}
scheduleNextRefresh();

module.exports = app;
