import express from 'express';
import cors from 'cors';
import { PORT } from './config.js';
import db from './database/db.js';

import webhooksRouter from './routes/webhooks.js';
import mrsRouter from './routes/mrs.js';
import decisionsRouter from './routes/decisions.js';
import projectsRouter from './routes/projects.js';
import developersRouter from './routes/developers.js';
import searchRouter from './routes/search.js';

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['*'],
  allowedHeaders: ['*']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mount routers
app.use(webhooksRouter);
app.use(mrsRouter);
app.use(decisionsRouter);
app.use(projectsRouter);
app.use(developersRouter);
app.use(searchRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ detail: err.message || 'Internal Server Error' });
});

// Initialize database and start server
async function startServer() {
  try {
    await db.connect();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Decision Memory AI Backend running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database or start server:', err);
    process.exit(1);
  }
}

startServer();

export default app;
