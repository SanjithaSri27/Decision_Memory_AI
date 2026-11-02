import db from '../database/db.js';
import { generateEmbedding, cosineSimilarity } from '../services/embeddingService.js';

// Safe JSON parser helper
function safeJsonParse(val, fallback = null) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

// Safe JSON stringify helper
function safeJsonStringify(val) {
  if (val === null || val === undefined) return null;
  return typeof val === 'string' ? val : JSON.stringify(val);
}

// ----------------------------------------------------
// Projects
// ----------------------------------------------------

export async function getProject(id) {
  return await db.get('SELECT * FROM projects WHERE id = ?', [id]);
}

export async function getProjectByGitlabId(gitlabProjectId) {
  return await db.get('SELECT * FROM projects WHERE gitlab_project_id = ?', [gitlabProjectId]);
}

export async function createProject({ gitlab_project_id, name }) {
  const result = await db.run(
    'INSERT INTO projects (gitlab_project_id, name) VALUES (?, ?)',
    [gitlab_project_id, name]
  );
  return await getProject(result.lastInsertRowid);
}

export async function getProjects({ skip = 0, limit = 100 } = {}) {
  return await db.all('SELECT * FROM projects ORDER BY id LIMIT ? OFFSET ?', [limit, skip]);
}

// ----------------------------------------------------
// Developers
// ----------------------------------------------------

export async function getDeveloper(id) {
  return await db.get('SELECT * FROM developers WHERE id = ?', [id]);
}

export async function getDeveloperByUsername(username) {
  return await db.get('SELECT * FROM developers WHERE gitlab_username = ?', [username]);
}

export async function createDeveloper({ gitlab_username, name = null, email = null }) {
  const result = await db.run(
    'INSERT INTO developers (gitlab_username, name, email) VALUES (?, ?, ?)',
    [gitlab_username, name || gitlab_username, email]
  );
  return await getDeveloper(result.lastInsertRowid);
}

export async function getDevelopers({ skip = 0, limit = 100 } = {}) {
  return await db.all('SELECT * FROM developers ORDER BY id LIMIT ? OFFSET ?', [limit, skip]);
}

// ----------------------------------------------------
// Merge Requests
// ----------------------------------------------------

function formatMergeRequest(mr, author = null, project = null, decisionRecord = null) {
  if (!mr) return null;
  return {
    ...mr,
    author_username: author ? author.gitlab_username : 'unknown',
    state: mr.status,
    decision_extracted: !!decisionRecord,
    changed_files: safeJsonParse(mr.changed_files, []),
    commits: safeJsonParse(mr.commits, []),
    linked_issues: safeJsonParse(mr.linked_issues, []),
    diff_stats: safeJsonParse(mr.diff_stats, {}),
    author: author || null,
    project: project || null,
    decision_record: decisionRecord || null
  };
}

export async function getMergeRequest(id) {
  const mr = await db.get('SELECT * FROM merge_requests WHERE id = ?', [id]);
  if (!mr) return null;

  const author = mr.author_id ? await getDeveloper(mr.author_id) : null;
  const project = mr.project_id ? await getProject(mr.project_id) : null;
  const decisionRecord = await db.get('SELECT * FROM decision_records WHERE mr_id = ?', [mr.id]);

  return formatMergeRequest(mr, author, project, decisionRecord ? formatDecisionRecord(decisionRecord) : null);
}

export async function getMergeRequestByIid(projectId, mrIid) {
  const mr = await db.get(
    'SELECT * FROM merge_requests WHERE project_id = ? AND mr_iid = ?',
    [projectId, mrIid]
  );
  if (!mr) return null;

  const author = mr.author_id ? await getDeveloper(mr.author_id) : null;
  const project = mr.project_id ? await getProject(mr.project_id) : null;
  const decisionRecord = await db.get('SELECT * FROM decision_records WHERE mr_id = ?', [mr.id]);

  return formatMergeRequest(mr, author, project, decisionRecord ? formatDecisionRecord(decisionRecord) : null);
}

export async function getMergeRequests({ skip = 0, limit = 100 } = {}) {
  const mrs = await db.all(
    'SELECT * FROM merge_requests ORDER BY id DESC LIMIT ? OFFSET ?',
    [limit, skip]
  );

  const results = [];
  for (const mr of mrs) {
    const author = mr.author_id ? await getDeveloper(mr.author_id) : null;
    const project = mr.project_id ? await getProject(mr.project_id) : null;
    const decisionRecord = await db.get('SELECT * FROM decision_records WHERE mr_id = ?', [mr.id]);
    results.push(formatMergeRequest(mr, author, project, decisionRecord ? formatDecisionRecord(decisionRecord) : null));
  }
  return results;
}

export async function createMergeRequest(mrData) {
  const result = await db.run(
    `INSERT INTO merge_requests (
      gitlab_mr_id, mr_iid, project_id, author_id, title, description, status,
      changed_files, commits, linked_issues, diff_stats
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      mrData.gitlab_mr_id || null,
      mrData.mr_iid,
      mrData.project_id,
      mrData.author_id,
      mrData.title || '',
      mrData.description || '',
      mrData.status || 'opened',
      safeJsonStringify(mrData.changed_files || []),
      safeJsonStringify(mrData.commits || []),
      safeJsonStringify(mrData.linked_issues || []),
      safeJsonStringify(mrData.diff_stats || {})
    ]
  );
  return await getMergeRequest(result.lastInsertRowid);
}

export async function updateMergeRequest(id, mrData) {
  await db.run(
    `UPDATE merge_requests SET
      gitlab_mr_id = ?,
      mr_iid = ?,
      project_id = ?,
      author_id = ?,
      title = ?,
      description = ?,
      status = ?,
      changed_files = ?,
      commits = ?,
      linked_issues = ?,
      diff_stats = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      mrData.gitlab_mr_id || null,
      mrData.mr_iid,
      mrData.project_id,
      mrData.author_id,
      mrData.title || '',
      mrData.description || '',
      mrData.status || 'opened',
      safeJsonStringify(mrData.changed_files || []),
      safeJsonStringify(mrData.commits || []),
      safeJsonStringify(mrData.linked_issues || []),
      safeJsonStringify(mrData.diff_stats || {}),
      id
    ]
  );
  return await getMergeRequest(id);
}

// ----------------------------------------------------
// Decision Records
// ----------------------------------------------------

function formatDecisionRecord(record, histories = []) {
  if (!record) return null;
  return {
    ...record,
    related_files: safeJsonParse(record.related_files, []),
    related_commits: safeJsonParse(record.related_commits, []),
    embedding: safeJsonParse(record.embedding, []),
    histories: histories.map(h => ({
      ...h,
      previous_content: safeJsonParse(h.previous_content, {}),
      updated_content: safeJsonParse(h.updated_content, {})
    }))
  };
}

export async function getDecisionRecord(id) {
  const record = await db.get('SELECT * FROM decision_records WHERE id = ?', [id]);
  if (!record) return null;
  const histories = await getDecisionHistoriesByRecord(id);
  return formatDecisionRecord(record, histories);
}

export async function getDecisionRecords({ skip = 0, limit = 100 } = {}) {
  const records = await db.all(
    'SELECT * FROM decision_records ORDER BY id DESC LIMIT ? OFFSET ?',
    [limit, skip]
  );
  const formatted = [];
  for (const r of records) {
    const histories = await getDecisionHistoriesByRecord(r.id);
    formatted.push(formatDecisionRecord(r, histories));
  }
  return formatted;
}

export async function createDecisionRecord(recordData) {
  const searchableText = `Summary: ${recordData.decision_summary || ''}\nReasoning: ${recordData.reasoning || ''}`;
  const embedding = await generateEmbedding(searchableText);

  const result = await db.run(
    `INSERT INTO decision_records (
      mr_id, project_id, decision_summary, reasoning, impact_level, confidence_score,
      related_files, related_commits, embedding
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      recordData.mr_id,
      recordData.project_id,
      recordData.decision_summary || '',
      recordData.reasoning || '',
      recordData.impact_level || 'low',
      recordData.confidence_score || 0,
      safeJsonStringify(recordData.related_files || []),
      safeJsonStringify(recordData.related_commits || []),
      safeJsonStringify(embedding)
    ]
  );

  return await getDecisionRecord(result.lastInsertRowid);
}

export async function updateDecisionRecord(id, recordData) {
  const searchableText = `Summary: ${recordData.decision_summary || ''}\nReasoning: ${recordData.reasoning || ''}`;
  const embedding = await generateEmbedding(searchableText);

  await db.run(
    `UPDATE decision_records SET
      decision_summary = ?,
      reasoning = ?,
      impact_level = ?,
      confidence_score = ?,
      related_files = ?,
      related_commits = ?,
      embedding = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      recordData.decision_summary || '',
      recordData.reasoning || '',
      recordData.impact_level || 'low',
      recordData.confidence_score || 0,
      safeJsonStringify(recordData.related_files || []),
      safeJsonStringify(recordData.related_commits || []),
      safeJsonStringify(embedding),
      id
    ]
  );

  return await getDecisionRecord(id);
}

export async function searchDecisionRecords(queryEmbedding, limit = 5) {
  // Fetch all records with embeddings
  const allRecords = await db.all('SELECT * FROM decision_records ORDER BY id DESC');
  if (!allRecords || allRecords.length === 0) return [];

  // Compute cosine similarity for each record
  const scored = allRecords.map(record => {
    const embedding = safeJsonParse(record.embedding, []);
    const similarity = (Array.isArray(embedding) && embedding.length > 0)
      ? cosineSimilarity(queryEmbedding, embedding)
      : 0;
    return {
      record: formatDecisionRecord(record),
      similarity
    };
  });

  // Sort descending by similarity score
  scored.sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, limit).map(s => s.record);
}

// ----------------------------------------------------
// Decision History
// ----------------------------------------------------

export async function createDecisionHistory(historyData) {
  const result = await db.run(
    `INSERT INTO decision_history (
      decision_record_id, changed_by, previous_content, updated_content
    ) VALUES (?, ?, ?, ?)`,
    [
      historyData.decision_record_id,
      historyData.changed_by || null,
      safeJsonStringify(historyData.previous_content || {}),
      safeJsonStringify(historyData.updated_content || {})
    ]
  );
  return await db.get('SELECT * FROM decision_history WHERE id = ?', [result.lastInsertRowid]);
}

export async function getDecisionHistoriesByRecord(recordId) {
  return await db.all(
    'SELECT * FROM decision_history WHERE decision_record_id = ? ORDER BY id ASC',
    [recordId]
  );
}
