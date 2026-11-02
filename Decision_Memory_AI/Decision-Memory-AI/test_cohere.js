import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.COHERE_API_KEY || '4sbZWu3VQsYfGGeDmvESKreq77gvCwrvfFGRyiEQ';

async function checkModels() {
  try {
    const response = await axios.get('https://api.cohere.ai/v1/models', {
      headers: { Authorization: `Bearer ${key}` }
    });
    console.log('Status:', response.status);
    const data = response.data;
    console.log('Chat models:');
    for (const m of data.models || []) {
      if (m.endpoints && m.endpoints.includes('chat')) {
        console.log(m.name);
      }
    }
  } catch (err) {
    console.error('Error fetching models:', err.response?.data || err.message);
  }
}

checkModels();
