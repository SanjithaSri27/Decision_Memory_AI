import axios from 'axios';
import { PORT } from './config.js';

async function runTests() {
  const baseURL = `http://localhost:${PORT}`;

  // Check if server is already running
  try {
    await axios.get(`${baseURL}/health`, { timeout: 1000 });
  } catch (e) {
    // If not running, start it
    await import('./index.js');
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log(`--- Running HTTP Endpoints Tests against ${baseURL} ---`);

  try {
    // 1. Health check
    console.log('Testing GET /health...');
    const healthRes = await axios.get(`${baseURL}/health`);
    console.log(`[+] Health check status: ${healthRes.status}, data:`, healthRes.data);

    // 2. GET /mrs
    console.log('Testing GET /mrs...');
    const mrsRes = await axios.get(`${baseURL}/mrs`);
    console.log(`[+] /mrs returned ${mrsRes.data.length} MRs`);

    // 3. GET /decisions
    console.log('Testing GET /decisions...');
    const decRes = await axios.get(`${baseURL}/decisions`);
    console.log(`[+] /decisions returned ${decRes.data.length} decisions`);

    // 4. POST /api/search/semantic
    console.log('Testing POST /api/search/semantic...');
    const searchRes = await axios.post(`${baseURL}/api/search/semantic`, {
      query: 'Why did we update the files?',
      limit: 3
    });
    console.log('[+] Semantic search response:', {
      answer: searchRes.data.answer?.slice(0, 100) + '...',
      citations: searchRes.data.citations
    });

    console.log('--- All HTTP Endpoint Tests PASSED! ---');
    process.exit(0);
  } catch (err) {
    console.error('[-] HTTP Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();
