import axios from 'axios';
import { COHERE_API_KEY } from '../config.js';

async function generateJsonText(prompt) {
  if (!COHERE_API_KEY) {
    return '{"error": "No AI provider configured."}';
  }
  try {
    const response = await axios.post(
      'https://api.cohere.ai/v1/chat',
      {
        message: prompt,
        model: 'command-r-plus-08-2024',
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    if (response.status === 200 && response.data?.text) {
      return response.data.text;
    }
    return JSON.stringify({ error: `Cohere API error: ${JSON.stringify(response.data)}` });
  } catch (err) {
    return JSON.stringify({ error: `Exception calling Cohere: ${err.response?.data?.message || err.message}` });
  }
}

/**
 * Given rich Merge Request details, infers the engineering decision.
 * Strictly follows the provided data to avoid hallucination.
 */
export async function inferDecisionFromMr(mrDetails) {
  const prompt = `
You are an expert software architect AI. Your task is to extract architectural and engineering decisions from a Merge Request.

You will be provided with the Merge Request details including Title, Description, Commits, Changed Files, and Linked Issues.

Based on this context, infer the engineering decision made.
You MUST ONLY use the fetched MR data. DO NOT guess or hallucinate reasoning.

CRITICAL INSTRUCTION FOR CONFIDENCE SCORE AND FOLLOW-UP QUESTIONS:
If the MR description is empty, missing, or very short (like "u"), AND the commit messages are generic (like "Update 3 files" or "Fix bug"), you DO NOT have enough context to know the architectural "Why". 
In these cases, you MUST:
1. Set your \`confidence_score\` to something VERY LOW (e.g., 20 or 30).
2. State in your \`decision_summary\` that you need more information.
3. Provide a \`follow_up_question\` that is highly accurate and context-aware. Analyze the \`Changed Files\` and formulate a precise, technical question (e.g., "I noticed modifications to the authentication middleware (\`auth.py\`). Could you elaborate on the security reasoning behind these specific changes?").

CRITICAL INSTRUCTION FOR COMMENTS:
You have access to the "Discussion Thread" which contains comments from the developer.
- If the developer explains the decision in the comments, use it! It is highly authoritative.
- If the developer provides a vague or unhelpful reply (e.g., "hh", "fix", "test"), you MUST acknowledge their reply politely but firmly ask for more specific technical details based on the files they changed. Set \`confidence_score\` low so it asks again.
- If the developer explicitly states they don't know (e.g., "I lack knowledge", "idk", "not sure", "I don't know"), you MUST summarize whatever little you can, but set your \`confidence_score\` slightly higher (e.g., 65) so the system stops pestering them with questions. Note that the architecture is undefined.

Your output MUST be valid JSON matching the following schema:
{
  "decision_summary": "Summary of the decision",
  "reasoning": "The reasoning behind the decision extracted from the MR description or commits",
  "impact_level": "low" | "medium" | "high",
  "confidence_score": integer (0-100),
  "related_files": ["file1.py", "file2.ts"],
  "related_commits": ["commit_sha_or_id"],
  "follow_up_question": "Your specific follow-up question, or null if confidence is high"
}

Merge Request Context:
Title: ${mrDetails.title || ''}
Description: ${mrDetails.description || ''}
Commits: ${JSON.stringify(mrDetails.commits || [], null, 2)}
Changed Files: ${JSON.stringify(mrDetails.changed_files || [], null, 2)}
Linked Issues: ${JSON.stringify(mrDetails.linked_issues || [], null, 2)}
Discussion Thread: ${JSON.stringify(mrDetails.discussion_thread || [], null, 2)}
`;

  const responseText = await generateJsonText(prompt);
  try {
    const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);
    return {
      decision_summary: data.decision_summary || 'No summary provided',
      reasoning: data.reasoning || '',
      impact_level: data.impact_level || 'low',
      confidence_score: typeof data.confidence_score === 'number' ? data.confidence_score : 50,
      related_files: Array.isArray(data.related_files) ? data.related_files : [],
      related_commits: Array.isArray(data.related_commits) ? data.related_commits : [],
      follow_up_question: data.follow_up_question || null
    };
  } catch (err) {
    console.error('Error parsing AI response:', err, '\nResponse:', responseText);
    return {
      decision_summary: 'Failed to extract decision',
      reasoning: 'AI extraction failed or returned invalid JSON',
      impact_level: 'low',
      confidence_score: 0,
      related_files: [],
      related_commits: [],
      follow_up_question: null
    };
  }
}

/**
 * Given a user's question and a list of relevant Decision Records (from vector search),
 * generate an answer with citations.
 */
export async function answerQuestionWithCitations(question, contextRecords) {
  if (!COHERE_API_KEY) {
    return {
      answer: 'AI service is not configured.',
      citations: []
    };
  }

  let recordsContext = '';
  for (const r of contextRecords) {
    recordsContext += `--- Record ID: ${r.id} ---\nSummary: ${r.decision_summary}\nReasoning: ${r.reasoning}\nImpact: ${r.impact_level}\n\n`;
  }

  const prompt = `
You are an AI assistant helping developers understand engineering decisions.
You are given a user question and a set of relevant Decision Records.

User Question: ${question}

Decision Records:
${recordsContext}

Please answer the user's question using the provided Decision Records.
If the exact answer isn't in the records, summarize the most relevant information you DO have from the records that might help, rather than just saying you don't know.

Your output MUST be a JSON object matching this schema:
{
  "answer": "Your detailed response",
  "citations": [123, 456] // Integer IDs of the Decision Records used
}
`;

  const responseText = await generateJsonText(prompt);
  try {
    const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);
    return {
      answer: data.answer || 'No answer generated.',
      citations: Array.isArray(data.citations) ? data.citations : []
    };
  } catch (err) {
    console.error('Error parsing AI response:', err, '\nResponse:', responseText);
    return {
      answer: 'Sorry, I encountered an error while trying to formulate the answer.',
      citations: []
    };
  }
}
