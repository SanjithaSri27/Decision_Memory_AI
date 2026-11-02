import { Router } from 'express';
import * as crud from '../repositories/crud.js';

const router = Router();

router.get(['/developers', '/developers/'], async (req, res) => {
  try {
    const skip = parseInt(req.query.skip || '0', 10);
    const limit = parseInt(req.query.limit || '100', 10);
    const devs = await crud.getDevelopers({ skip, limit });
    res.json(devs);
  } catch (err) {
    console.error('Error fetching developers:', err);
    res.status(500).json({ detail: err.message });
  }
});

router.get('/developers/:id', async (req, res) => {
  try {
    const devId = parseInt(req.params.id, 10);
    const dev = await crud.getDeveloper(devId);
    if (!dev) {
      return res.status(404).json({ detail: 'Developer not found' });
    }
    res.json(dev);
  } catch (err) {
    console.error('Error fetching developer:', err);
    res.status(500).json({ detail: err.message });
  }
});

router.post(['/developers', '/developers/'], async (req, res) => {
  try {
    const dev = await crud.createDeveloper(req.body);
    res.status(201).json(dev);
  } catch (err) {
    console.error('Error creating developer:', err);
    res.status(500).json({ detail: err.message });
  }
});

export default router;
