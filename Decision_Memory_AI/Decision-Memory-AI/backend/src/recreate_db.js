import db from './database/db.js';
import { SQLITE_SCHEMA, POSTGRES_SCHEMA } from './database/schema.js';

async function recreateDb() {
  console.log('Connecting to database...');
  await db.connect();

  console.log('Dropping existing tables...');
  const dropTables = [
    'DROP TABLE IF EXISTS decision_history CASCADE;',
    'DROP TABLE IF EXISTS decision_records CASCADE;',
    'DROP TABLE IF EXISTS merge_requests CASCADE;',
    'DROP TABLE IF EXISTS developers CASCADE;',
    'DROP TABLE IF EXISTS projects CASCADE;'
  ];

  for (const sql of dropTables) {
    try {
      // In SQLite, CASCADE is ignored, but valid
      await db.exec(sql.replace('CASCADE', ''));
    } catch (err) {
      console.warn(`Warning dropping table: ${err.message}`);
    }
  }

  console.log('Recreating all tables and indexes...');
  if (db.isPostgres) {
    await db.exec(POSTGRES_SCHEMA);
  } else {
    await db.exec(SQLITE_SCHEMA);
  }

  console.log('Done recreating database!');
  await db.close();
}

recreateDb().catch(err => {
  console.error('Failed to recreate database:', err);
  process.exit(1);
});
