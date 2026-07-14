const assert = require('node:assert/strict');
const test = require('node:test');

const {
  INVALID_SEASON_MSG,
  getCurrentSeasonId,
  isValidSeasonId,
} = require('#platform/seasonHelper.js');
const {
  validateSeason,
} = require('#presentation/middleware/validateSeason.js');

function makeResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
  };
}

test('isValidSeasonId accepts eight digit consecutive season ids', () => {
  assert.equal(isValidSeasonId('20232024'), true);
  assert.equal(isValidSeasonId('20252026'), true);
});

test('isValidSeasonId rejects malformed season ids', () => {
  assert.equal(isValidSeasonId('2023'), false);
  assert.equal(isValidSeasonId('20232025'), false);
  assert.equal(isValidSeasonId('abcd2024'), false);
  assert.equal(isValidSeasonId(''), false);
  assert.equal(isValidSeasonId(undefined), false);
});

test('getCurrentSeasonId returns the current NHL season for this environment', () => {
  assert.equal(getCurrentSeasonId(), '20252026');
});

test('validateSeason uses explicit valid season and calls next', () => {
  const req = { query: { season: '20232024' } };
  const res = makeResponse();
  let nextCalled = false;

  validateSeason(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.seasonId, '20232024');
  assert.equal(res.statusCode, 200);
  assert.equal(res.body, null);
});

test('validateSeason defaults missing season to current season and calls next', () => {
  const req = { query: {} };
  const res = makeResponse();
  let nextCalled = false;

  validateSeason(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.seasonId, getCurrentSeasonId());
  assert.equal(res.statusCode, 200);
  assert.equal(res.body, null);
});

test('validateSeason responds 400 for invalid season and does not call next', () => {
  const req = { query: { season: 'bad' } };
  const res = makeResponse();
  let nextCalled = false;

  validateSeason(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(req.seasonId, undefined);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: INVALID_SEASON_MSG });
});
