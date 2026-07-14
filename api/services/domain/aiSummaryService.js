const { withTransaction } = require('../../db/pool');
const aiSummariesRepository = require('../../db/repositories/aiSummariesRepository');
const {
  buildAiSummary,
  hashPrompt,
} = require('../mappers/db/aiSummaryDbMapper');

async function persistAiSummary({
  teamId = null,
  triCode,
  content,
  summaryType = 'team_history',
  promptVersion = 'v1',
  modelProvider = null,
  modelName = null,
  prompt = null,
  promptHash = hashPrompt(prompt),
  sourceNotes = [],
}) {
  const summary = buildAiSummary({
    teamId,
    triCode,
    content,
    summaryType,
    promptVersion,
    modelProvider,
    modelName,
    prompt,
    promptHash,
    sourceNotes,
  });

  return await withTransaction(async (client) => {
    return await aiSummariesRepository.upsertAiSummary(client, summary);
  });
}

module.exports = {
  persistAiSummary,
};
