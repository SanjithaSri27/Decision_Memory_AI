import axios from 'axios';
import { GITLAB_URL, GITLAB_TOKEN, COHERE_API_KEY } from './config.js';

async function testGitLab() {
  console.log(`Testing GitLab API at ${GITLAB_URL}...`);
  if (!GITLAB_TOKEN || GITLAB_TOKEN.includes('your_')) {
    console.log('[-] GITLAB_TOKEN is not set properly.');
    return false;
  }

  const headers = { 'Private-Token': GITLAB_TOKEN };
  try {
    const response = await axios.get(`${GITLAB_URL}/api/v4/user`, { headers, timeout: 10000 });
    if (response.status === 200) {
      console.log(`[+] GitLab Authentication successful! Logged in as: ${response.data.username}`);
      return true;
    }
  } catch (err) {
    if (err.response?.status === 403) {
      // Fine-grained token might be missing read_user, try /projects
      try {
        const projRes = await axios.get(`${GITLAB_URL}/api/v4/projects`, { headers, timeout: 10000 });
        if (projRes.status === 200) {
          console.log('[+] GitLab Authentication successful! Fine-grained token validated via /projects.');
          return true;
        }
      } catch (projErr) {
        console.log(`[-] GitLab Authentication failed: ${projErr.response?.status} - ${JSON.stringify(projErr.response?.data)}`);
        return false;
      }
    }
    console.log(`[-] GitLab Authentication failed: ${err.response?.status || err.message}`);
    return false;
  }
}

async function testLLM() {
  console.log('Testing AI Provider (Cohere)...');
  if (COHERE_API_KEY) {
    console.log('[+] COHERE_API_KEY is configured.');
    try {
      const response = await axios.post(
        'https://api.cohere.ai/v1/chat',
        {
          message: 'Say hello',
          model: 'command-r-plus-08-2024'
        },
        {
          headers: {
            'Authorization': `Bearer ${COHERE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.status === 200) {
        console.log('[+] Cohere Authentication successful! Model answered:', response.data.text?.trim()?.slice(0, 60));
        return true;
      } else {
        console.log(`[-] Cohere test failed: ${response.status} - ${JSON.stringify(response.data)}`);
        return false;
      }
    } catch (err) {
      console.log(`[-] Cohere test failed: ${err.response?.data?.message || err.message}`);
      return false;
    }
  }

  console.log('[-] No valid AI API Key found in .env');
  return false;
}

async function main() {
  console.log('=== API Connectivity Test ===');
  await testGitLab();
  console.log('-'.repeat(30));
  await testLLM();
  console.log('=============================');
}

main();
