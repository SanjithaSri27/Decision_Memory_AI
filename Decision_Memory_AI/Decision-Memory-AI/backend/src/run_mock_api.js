import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { PORT, COHERE_API_KEY, GITLAB_TOKEN, GITLAB_URL } from './config.js';

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

app.get(['/mrs', '/mrs/'], async (req, res) => {
  console.log('DEBUG: get_mrs called. GITLAB_TOKEN is configured:', !!GITLAB_TOKEN);
  if (GITLAB_TOKEN) {
    try {
      const url = `${GITLAB_URL}/api/v4/projects/83605546/merge_requests?state=opened`;
      const resp = await axios.get(url, {
        headers: { 'PRIVATE-TOKEN': GITLAB_TOKEN },
        timeout: 5000
      });
      if (resp.status === 200) {
        const gitlabMrs = resp.data;
        console.log('DEBUG: gitlab_mrs length:', gitlabMrs.length);
        return res.json(gitlabMrs.map(mr => ({
          id: mr.id,
          project_id: mr.project_id,
          mr_iid: mr.iid,
          title: mr.title,
          description: mr.description || '',
          author_username: mr.author?.username || 'unknown',
          state: mr.state,
          decision_extracted: false
        })));
      }
    } catch (err) {
      console.log('Error fetching MRs from GitLab:', err.message);
    }
  }

  // Fallback to mock data
  console.log('DEBUG: falling back to mock data');
  return res.json([
    {
      id: 1,
      project_id: 101,
      mr_iid: 42,
      title: 'Replace Redis with Valkey',
      description: 'Swapping redis out',
      author_username: 'alice.dev',
      state: 'merged',
      decision_extracted: true
    }
  ]);
});

app.get(['/decisions', '/decisions/'], (req, res) => {
  return res.json([
    {
      id: 1,
      mr_id: 1,
      decision_summary: 'Migrate to pgvector',
      reasoning: 'Pinecone was adding external network latency and cost to our stack.',
      impact_level: 'High',
      confidence_score: 95,
      created_at: '2026-06-22T00:00:00Z'
    },
    {
      id: 2,
      mr_id: 2,
      decision_summary: 'Adopt Tailwind CSS',
      reasoning: 'Inconsistent UI styling and slow CSS compilation.',
      impact_level: 'Medium',
      confidence_score: 88,
      created_at: '2026-06-22T00:00:00Z'
    }
  ]);
});

app.post('/api/search/semantic', async (req, res) => {
  const query = req.body?.query || '';

  if (!COHERE_API_KEY) {
    return res.json({
      answer: `Mock AI Response for query: '${query}'. We chose pgvector to reduce latency. (COHERE_API_KEY not found)`,
      citations: [1]
    });
  }

  const context = `
Record 1: Migrate to pgvector because Pinecone was adding external network latency and cost to our stack. Impact: High.
Record 2: Adopt Tailwind CSS because of Inconsistent UI styling and slow CSS compilation. Impact: Medium.
`;
  const prompt = `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer the question based only on the context provided. If it's not in the context, just say you don't know.`;

  try {
    const response = await axios.post(
      'https://api.cohere.ai/v1/chat',
      {
        message: prompt,
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
      return res.json({
        answer: response.data?.text || 'No answer generated.',
        citations: [1, 2]
      });
    } else {
      return res.json({
        answer: `API Error: ${JSON.stringify(response.data)}`,
        citations: []
      });
    }
  } catch (err) {
    return res.json({
      answer: `Exception calling Cohere: ${err.message}`,
      citations: []
    });
  }
});

app.post('/webhook/gitlab', async (req, res) => {
  const payload = req.body || {};
  if (payload.object_kind === 'note' && payload.merge_request) {
    const mr = payload.merge_request;
    const projectId = payload.project?.id;
    const mrIid = mr.iid;

    if (GITLAB_TOKEN && projectId && mrIid) {
      const url = `${GITLAB_URL}/api/v4/projects/${projectId}/merge_requests/${mrIid}/notes`;
      const data = {
        body: '🤖 **Mock AI Response:**\n\nI am the Decision Memory AI running in presentation mode. I received your webhook successfully!'
      };
      try {
        await axios.post(url, data, {
          headers: {
            'PRIVATE-TOKEN': GITLAB_TOKEN,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
      } catch (err) {
        console.error('Mock GitLab Post Error:', err.message);
      }
    }
  }

  return res.json({ status: 'accepted', action: 'open' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock API Server running on port ${PORT}`);
});
