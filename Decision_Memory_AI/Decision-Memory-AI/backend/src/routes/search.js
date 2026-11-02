import { Router } from 'express';
import { generateEmbedding } from '../services/embeddingService.js';
import { answerQuestionWithCitations } from '../services/aiService.js';
import * as crud from '../repositories/crud.js';

const router = Router();

router.post('/api/search/semantic', async (req, res) => {
  const query = req.body?.query || '';
  const limit = parseInt(req.body?.limit || '5', 10);
  const queryText = query.trim();

  console.log(`DEBUG: Started semantic search for: "${queryText}"`);

  if (!queryText || queryText.length < 3 || !/[a-zA-Z0-9]/.test(queryText)) {
    return res.status(400).json({ detail: 'Please enter a meaningful search query containing words.' });
  }

  let queryEmbedding;
  try {
    console.log('DEBUG: Calling generateEmbedding');
    queryEmbedding = await generateEmbedding(queryText);
    console.log('DEBUG: Finished generateEmbedding');
  } catch (err) {
    console.error('DEBUG: generateEmbedding failed:', err);
    return res.status(500).json({ detail: `Failed to generate embedding: ${err.message}` });
  }

  let relevantRecords;
  try {
    console.log('DEBUG: Calling crud.searchDecisionRecords');
    relevantRecords = await crud.searchDecisionRecords(queryEmbedding, limit);
    console.log(`DEBUG: Finished crud.searchDecisionRecords, found ${relevantRecords.length} records`);
  } catch (err) {
    console.error('DEBUG: crud.searchDecisionRecords failed:', err);
    return res.status(500).json({ detail: `Database search failed: ${err.message}` });
  }

  if (!relevantRecords || relevantRecords.length === 0) {
    return res.json({
      answer: 'No relevant decision records found to answer your question.',
      citations: []
    });
  }

  const aiResponse = await answerQuestionWithCitations(queryText, relevantRecords);

  const citedRecords = [];
  const citationIds = Array.isArray(aiResponse.citations) ? aiResponse.citations : [];
  for (const record of relevantRecords) {
    if (citationIds.includes(record.id)) {
      citedRecords.push({
        id: record.id,
        decision_summary: record.decision_summary,
        reasoning: record.reasoning,
        impact_level: record.impact_level
      });
    }
  }

  return res.json({
    answer: aiResponse.answer,
    citations: citedRecords
  });
});

export default router;
