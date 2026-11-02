import { Router } from 'express';
import * as crud from '../repositories/crud.js';
import { inferDecisionFromMr } from '../services/aiService.js';
import db from '../database/db.js';

const router = Router();

router.get(['/decisions', '/decisions/'], async (req, res) => {
  try {
    const skip = parseInt(req.query.skip || '0', 10);
    const limit = parseInt(req.query.limit || '100', 10);
    const records = await crud.getDecisionRecords({ skip, limit });
    res.json(records);
  } catch (err) {
    console.error('Error fetching decision records:', err);
    res.status(500).json({ detail: err.message });
  }
});

router.post(['/decisions', '/decisions/'], async (req, res) => {
  try {
    const record = await crud.createDecisionRecord(req.body);
    res.status(201).json(record);
  } catch (err) {
    console.error('Error creating decision record:', err);
    res.status(500).json({ detail: err.message });
  }
});

router.post('/decisions/infer/:mr_id', async (req, res) => {
  try {
    const mrId = parseInt(req.params.mr_id, 10);
    const mr = await crud.getMergeRequest(mrId);
    if (!mr) {
      return res.status(404).json({ detail: 'Merge Request not found' });
    }

    const mrDetails = {
      title: mr.title,
      description: mr.description,
      commits: mr.commits,
      changed_files: mr.changed_files,
      linked_issues: mr.linked_issues
    };

    const extraction = await inferDecisionFromMr(mrDetails);

    if (extraction.decision_summary && extraction.decision_summary !== 'Failed to extract decision') {
      const recordData = {
        mr_id: mr.id,
        project_id: mr.project_id,
        decision_summary: extraction.decision_summary,
        reasoning: extraction.reasoning,
        impact_level: extraction.impact_level,
        confidence_score: extraction.confidence_score,
        related_files: extraction.related_files,
        related_commits: extraction.related_commits
      };

      const existingDecision = await db.get('SELECT * FROM decision_records WHERE mr_id = ?', [mr.id]);
      let savedRecord;
      if (!existingDecision) {
        savedRecord = await crud.createDecisionRecord(recordData);
      } else {
        savedRecord = await crud.updateDecisionRecord(existingDecision.id, recordData);
      }

      return res.json({
        status: 'success',
        message: 'Decision extracted and saved.',
        data: savedRecord
      });
    } else {
      return res.json({
        status: 'error',
        message: 'AI failed to extract a valid decision.'
      });
    }
  } catch (err) {
    console.error('Error inferring decision:', err);
    res.status(500).json({ detail: `Failed to save record: ${err.message}` });
  }
});

export default router;
