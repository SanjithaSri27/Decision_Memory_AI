import axios from 'axios';
import { COHERE_API_KEY } from '../config.js';

const EMBEDDING_DIM = 1536;

/**
 * Generates a vector embedding for the given text.
 * For Cohere, embed-english-v3.0 outputs 1024 dimensions.
 * We pad Cohere to 1536 dimensions for consistent vector operations.
 */
export async function generateEmbedding(text) {
  if (COHERE_API_KEY) {
    try {
      const response = await axios.post(
        'https://api.cohere.ai/v1/embed',
        {
          texts: [text],
          model: 'embed-english-v3.0',
          input_type: 'search_document'
        },
        {
          headers: {
            'Authorization': `Bearer ${COHERE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      if (response.status === 200 && response.data?.embeddings?.[0]) {
        const embedding = [...response.data.embeddings[0]];
        if (embedding.length < EMBEDDING_DIM) {
          const padding = new Array(EMBEDDING_DIM - embedding.length).fill(0.0);
          return embedding.concat(padding);
        }
        return embedding;
      } else {
        console.warn('Cohere embedding response not successful:', response.data);
      }
    } catch (err) {
      console.error('Cohere embedding API error:', err.response?.data || err.message);
    }
  }

  // Fallback dummy embedding
  return new Array(EMBEDDING_DIM).fill(0.0);
}

/**
 * Calculates cosine similarity between two vector arrays
 */
export function cosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }
  const minLen = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < minLen; i++) {
    const a = Number(vecA[i]) || 0;
    const b = Number(vecB[i]) || 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
