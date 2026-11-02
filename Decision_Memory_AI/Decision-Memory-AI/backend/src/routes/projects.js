import { Router } from 'express';
import * as crud from '../repositories/crud.js';

const router = Router();

router.get(['/projects', '/projects/'], async (req, res) => {
  try {
    const skip = parseInt(req.query.skip || '0', 10);
    const limit = parseInt(req.query.limit || '100', 10);
    const projects = await crud.getProjects({ skip, limit });
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ detail: err.message });
  }
});

router.get('/projects/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const project = await crud.getProject(projectId);
    if (!project) {
      return res.status(404).json({ detail: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ detail: err.message });
  }
});

router.post(['/projects', '/projects/'], async (req, res) => {
  try {
    const project = await crud.createProject(req.body);
    res.status(201).json(project);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ detail: err.message });
  }
});

export default router;
