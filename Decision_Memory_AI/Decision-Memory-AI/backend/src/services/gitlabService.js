import axios from 'axios';
import { GITLAB_URL, GITLAB_TOKEN } from '../config.js';

function getHeaders() {
  return GITLAB_TOKEN
    ? { 'Private-Token': GITLAB_TOKEN }
    : {};
}

/**
 * Fetches comprehensive details for a Merge Request including:
 * - Title, Description, Author
 * - Changed Files
 * - Commits
 * - Linked Issues
 * - Discussion Thread
 */
export async function getMergeRequestDetails(projectId, mrIid) {
  const headers = getHeaders();
  const baseUrl = `${GITLAB_URL}/api/v4/projects/${projectId}/merge_requests/${mrIid}`;

  // 1. Basic MR details
  const mrResponse = await axios.get(baseUrl, { headers });
  const mrData = mrResponse.data;

  // 2. Changed files and diff stats
  let changedFiles = [];
  let additions = 0;
  let deletions = 0;

  try {
    const changesResponse = await axios.get(`${baseUrl}/changes`, { headers });
    const changesData = changesResponse.data;
    for (const change of (changesData.changes || [])) {
      if (change.new_path) {
        changedFiles.push(change.new_path);
      }
      const diffText = change.diff || '';
      if (diffText) {
        const plusMatches = diffText.match(/\n\+/g);
        const minusMatches = diffText.match(/\n\-/g);
        additions += plusMatches ? plusMatches.length : 0;
        deletions += minusMatches ? minusMatches.length : 0;
      }
    }
  } catch (err) {
    console.warn(`Could not fetch changes for MR !${mrIid}:`, err.message);
  }

  const diffStats = {
    additions,
    deletions,
    total_files: changedFiles.length
  };

  // 3. Commits
  let commits = [];
  try {
    const commitsResponse = await axios.get(`${baseUrl}/commits`, { headers });
    commits = (commitsResponse.data || []).map(c => ({
      id: c.id,
      title: c.title,
      message: c.message
    }));
  } catch (err) {
    console.warn(`Could not fetch commits for MR !${mrIid}:`, err.message);
  }

  // 4. Linked issues (Closes issues)
  let linkedIssues = [];
  try {
    const issuesResponse = await axios.get(`${baseUrl}/closes_issues`, { headers });
    if (issuesResponse.status === 200) {
      linkedIssues = (issuesResponse.data || []).map(i => ({
        iid: i.iid,
        title: i.title
      }));
    }
  } catch (err) {
    // Failsafe if closes_issues is not accessible or returns 404
    linkedIssues = [];
  }

  // 5. Notes (comments)
  let discussionThread = [];
  try {
    const notesResponse = await axios.get(`${baseUrl}/notes`, { headers });
    if (notesResponse.status === 200) {
      discussionThread = (notesResponse.data || [])
        .filter(n => !n.system)
        .map(n => ({
          author: n.author?.username || 'unknown',
          body: n.body || ''
        }));
    }
  } catch (err) {
    discussionThread = [];
  }

  return {
    id: mrData.id,
    iid: mrData.iid,
    title: mrData.title,
    description: mrData.description,
    author: mrData.author?.username || 'unknown',
    state: mrData.state,
    changed_files: changedFiles,
    commits,
    linked_issues: linkedIssues,
    diff_stats: diffStats,
    discussion_thread: discussionThread
  };
}

/**
 * Posts a comment (note) to a specific Merge Request.
 */
export async function postMergeRequestComment(projectId, mrIid, message) {
  const url = `${GITLAB_URL}/api/v4/projects/${projectId}/merge_requests/${mrIid}/notes`;
  const response = await axios.post(
    url,
    { body: message },
    {
      headers: {
        ...getHeaders(),
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}
