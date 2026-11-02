import { Router } from 'express';
import { GITLAB_TOKEN } from '../config.js';
import { getMergeRequestDetails, postMergeRequestComment } from '../services/gitlabService.js';
import { inferDecisionFromMr } from '../services/aiService.js';
import * as crud from '../repositories/crud.js';
import db from '../database/db.js';

const router = Router();

export async function processMrWebhook(payload) {
  const projectId = payload.project?.id;
  const objectAttributes = payload.object_attributes || {};

  let mrIid;
  if (payload.object_kind === 'note') {
    mrIid = payload.merge_request?.iid;
  } else {
    mrIid = objectAttributes.iid;
  }

  if (!projectId || !mrIid) {
    return;
  }

  try {
    // Fetch rich MR details from GitLab API
    const mrDetails = await getMergeRequestDetails(projectId, mrIid);

    // 1. Handle Project
    const projectName = payload.project?.name || `Project ${projectId}`;
    let dbProject = await crud.getProjectByGitlabId(projectId);
    if (!dbProject) {
      dbProject = await crud.createProject({
        gitlab_project_id: projectId,
        name: projectName
      });
    }

    // 2. Handle Developer
    const authorUsername = mrDetails.author;
    let dbDeveloper = await crud.getDeveloperByUsername(authorUsername);
    if (!dbDeveloper) {
      dbDeveloper = await crud.createDeveloper({
        gitlab_username: authorUsername,
        name: authorUsername
      });
    }

    // 3. Save / Update MR in DB
    const mrData = {
      mr_iid: mrDetails.iid,
      gitlab_mr_id: mrDetails.id,
      project_id: dbProject.id,
      author_id: dbDeveloper.id,
      title: mrDetails.title,
      description: mrDetails.description,
      status: mrDetails.state,
      changed_files: mrDetails.changed_files,
      commits: mrDetails.commits,
      linked_issues: mrDetails.linked_issues,
      diff_stats: mrDetails.diff_stats || {}
    };

    const existingMr = await crud.getMergeRequestByIid(dbProject.id, mrDetails.iid);
    let dbMr;
    if (!existingMr) {
      dbMr = await crud.createMergeRequest(mrData);
    } else {
      dbMr = await crud.updateMergeRequest(existingMr.id, mrData);
    }

    // 4. Trigger AI Decision Engine
    const aiResponse = await inferDecisionFromMr(mrDetails);

    // Save decision if extracted
    if (aiResponse.decision_summary !== 'Failed to extract decision') {
      const decisionData = {
        mr_id: dbMr.id,
        project_id: dbProject.id,
        decision_summary: aiResponse.decision_summary,
        reasoning: aiResponse.reasoning,
        impact_level: aiResponse.impact_level,
        confidence_score: aiResponse.confidence_score,
        related_files: aiResponse.related_files,
        related_commits: aiResponse.related_commits
      };

      const existingDecision = await db.get('SELECT * FROM decision_records WHERE mr_id = ?', [dbMr.id]);
      if (!existingDecision) {
        await crud.createDecisionRecord(decisionData);
      } else {
        await crud.updateDecisionRecord(existingDecision.id, decisionData);
      }
    }

    // 5. Ask question if confidence is low (< 60) or extraction failed
    if (aiResponse.decision_summary === 'Failed to extract decision' || aiResponse.confidence_score < 60) {
      const discussionThread = mrDetails.discussion_thread || [];

      // Check if AI already posted a question and user hasn't replied yet
      let alreadyAsked = false;
      if (discussionThread.length > 0) {
        const latestNote = discussionThread[0];
        if (latestNote.body && latestNote.body.startsWith('🤖 **Decision Memory AI:**')) {
          alreadyAsked = true;
        }
      }

      if (!alreadyAsked) {
        const baseMsg = '🤖 **Decision Memory AI:** Hi! I had trouble clearly extracting the architectural decisions from this Merge Request.';
        let questionMsg;
        if (aiResponse.follow_up_question) {
          questionMsg = `${baseMsg} ${aiResponse.follow_up_question}`;
        } else {
          questionMsg = `${baseMsg} Could you please provide a brief summary of the technical decisions made here so I can document them for the team?`;
        }

        try {
          await postMergeRequestComment(projectId, mrIid, questionMsg);
        } catch (commentErr) {
          console.error('Error posting comment to MR:', commentErr.message);
        }
      }
    }
  } catch (err) {
    console.error('Error processing webhook:', err);
  }
}

router.post('/webhook/gitlab', (req, res) => {
  // Validate token
  const token = req.headers['x-gitlab-token'];
  if (GITLAB_TOKEN && token !== GITLAB_TOKEN) {
    return res.status(401).json({ detail: 'Invalid X-Gitlab-Token' });
  }

  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ detail: 'Invalid JSON payload' });
  }

  console.log('INCOMING WEBHOOK PAYLOAD:', JSON.stringify(payload));
  const objectKind = payload.object_kind;

  if (objectKind === 'merge_request') {
    const action = payload.object_attributes?.action;
    if (['open', 'update', 'merge'].includes(action)) {
      // Background task processing
      setImmediate(() => {
        processMrWebhook(payload).catch(err => console.error('Background process error:', err));
      });
      return res.json({ status: 'accepted', action });
    }
  } else if (objectKind === 'note') {
    const noteableType = payload.object_attributes?.noteable_type;
    const noteBody = payload.object_attributes?.note || '';

    // Prevent infinite loops: ignore comments posted by the AI itself
    if (noteBody.includes('🤖 **Decision Memory AI:**')) {
      return res.json({ status: 'ignored', reason: 'AI comment' });
    }

    if (noteableType === 'MergeRequest') {
      setImmediate(() => {
        processMrWebhook(payload).catch(err => console.error('Background process error:', err));
      });
      return res.json({ status: 'accepted', action: 'comment_added' });
    }
  }

  return res.json({ status: 'ignored' });
});

export default router;
