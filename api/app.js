require('dotenv').config();
var createError = require('http-errors');
var compression = require('compression');
var cors = require('cors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var helmet = require('helmet');

var healthRouter = require('./routes/health');
var standingsRouter = require('./routes/standings');
var playerRouter = require('./routes/player');
var teamRouter = require('./routes/team');
const { router: scheduleRouter } = require('./routes/schedule');
const rateLimit = require('express-rate-limit');

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

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res
      .status(429)
      .json({ error: 'Too many requests, please try again later.' });
  },
});

var app = express();
app.set('trust proxy', 1);

app.use(compression());
app.use(cors(corsOptions));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());

app.use('/health', healthRouter);
app.use('/standings', standingsRouter);
app.use('/player', playerRouter);
app.use('/team', teamRouter);
app.use('/schedule', scheduleRouter);

app.post('/python-service', rateLimiter, async (req, res, next) => {
  try {
    const message = req.body.content;
    const key = req.body.cacheKey ?? 'default';

    if (key !== 'default' && !/^[A-Z]{3}$/.test(key)) {
      return res.status(400).json({ error: 'Invalid cacheKey format.' });
    }

    const triCode = req.body.triCode;

    const cached = await readCache(CACHE_TYPES.AI, key);
    if (cached !== null) {
      queueAiSummaryPersistence(key, cached, message, triCode);
      return res.send(cached);
    }

    const result = await runAIPythonScript(message);
    await writeCache(CACHE_TYPES.AI, key, result);
    queueAiSummaryPersistence(key, result, message, triCode);
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
      process.env.NODE_ENV === 'production'
        ? 'python3'
        : path.join(__dirname, 'venv/bin/python3');
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

function queueAiSummaryPersistence(cacheKey, content, prompt, triCode) {
  const resolvedTriCode = triCode ?? (cacheKey === 'default' ? null : cacheKey);
  if (resolvedTriCode === null) {
    return;
  }

  runServiceTask(`ai summary ${resolvedTriCode}`, () =>
    persistAiSummary({
      triCode: resolvedTriCode,
      content,
      prompt,
      modelProvider: 'anthropic',
    }),
  );
}

module.exports = app;
