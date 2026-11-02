import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root is 2 directories up from backend/src
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const BACKEND_DIR = path.resolve(__dirname, '../');

// Load environment variables from backend/.env or root .env
const rootEnvPath = path.join(PROJECT_ROOT, '.env');
const backendEnvPath = path.join(BACKEND_DIR, '.env');

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
}
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath, override: false });
}

export const PORT = parseInt(process.env.PORT || '8000', 10);
export const GITLAB_URL = (process.env.GITLAB_URL || 'https://gitlab.com').replace(/\/+$/, '');
export const GITLAB_TOKEN = process.env.GITLAB_TOKEN || '';
export const COHERE_API_KEY = process.env.COHERE_API_KEY || '';

// Handle default DATABASE_URL: fallback to SQLite database in project root
export const DATABASE_URL = process.env.DATABASE_URL || `sqlite:///${path.join(PROJECT_ROOT, 'decision_memory.db').replace(/\\/g, '/')}`;

export { PROJECT_ROOT, BACKEND_DIR };
