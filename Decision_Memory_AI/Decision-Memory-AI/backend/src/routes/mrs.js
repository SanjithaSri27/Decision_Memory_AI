import { Router } from 'express';
import * as crud from '../repositories/crud.js';

const router = Router();

router.get(['/mrs', '/mrs/'], async (req, res) => {
  try {
    const skip = parseInt(req.query.skip || '0', 10);
    const limit = parseInt(req.query.limit || '100', 10);
    const mrs = await crud.getMergeRequests({ skip, limit });
    res.json(mrs);
  } catch (err) {
    console.error('Error fetching MRs:', err);
    res.status(500).json({ detail: err.message });
  }
});

router.get('/mrs/:id', async (req, res) => {
  try {
    const mrId = parseInt(req.params.id, 10);
    const mr = await crud.getMergeRequest(mrId);
    if (!mr) {
      return res.status(404).json({ detail: 'Merge Request not found' });
    }
    res.json(mr);
  } catch (err) {
    console.error('Error fetching MR:', err);
    res.status(500).json({ detail: err.message });
  }
});

export default router;
