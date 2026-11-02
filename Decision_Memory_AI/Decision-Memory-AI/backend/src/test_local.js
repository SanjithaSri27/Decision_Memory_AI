import * as crud from './repositories/crud.js';
import db from './database/db.js';

async function runTests() {
  console.log('--- Testing Node.js Backend DB & CRUD ---');
  await db.connect();

  console.log('1. Testing getProjects...');
  const projects = await crud.getProjects();
  console.log(`   Found ${projects.length} project(s)`);

  console.log('2. Testing getDevelopers...');
  const devs = await crud.getDevelopers();
  console.log(`   Found ${devs.length} developer(s)`);

  console.log('3. Testing getMergeRequests...');
  const mrs = await crud.getMergeRequests({ limit: 5 });
  console.log(`   Found ${mrs.length} MR(s)`);
  if (mrs.length > 0) {
    console.log(`   Sample MR: !${mrs[0].mr_iid} "${mrs[0].title}" by ${mrs[0].author_username} (decision extracted: ${mrs[0].decision_extracted})`);
  }

  console.log('4. Testing getDecisionRecords...');
  const decisions = await crud.getDecisionRecords({ limit: 5 });
  console.log(`   Found ${decisions.length} decision record(s)`);
  if (decisions.length > 0) {
    console.log(`   Sample Decision: "${decisions[0].decision_summary}" (Confidence: ${decisions[0].confidence_score}%, Impact: ${decisions[0].impact_level})`);
  }

  console.log('5. Testing searchDecisionRecords (vector similarity)...');
  // Dummy query embedding
  const dummyEmbedding = new Array(1536).fill(0.01);
  const searchResults = await crud.searchDecisionRecords(dummyEmbedding, 3);
  console.log(`   Search returned ${searchResults.length} matched record(s)`);

  await db.close();
  console.log('--- All DB & CRUD tests passed successfully! ---');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
