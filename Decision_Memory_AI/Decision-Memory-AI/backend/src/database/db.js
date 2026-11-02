import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { DATABASE_URL, PROJECT_ROOT } from '../config.js';
import { SQLITE_SCHEMA, POSTGRES_SCHEMA } from './schema.js';

class DatabaseManager {
  constructor() {
    this.isPostgres = DATABASE_URL.startsWith('postgres') || DATABASE_URL.startsWith('postgresql');
    this.sqliteDb = null;
    this.pgPool = null;
    this._initialized = false;
  }

  async connect() {
    if (this._initialized) return;

    if (this.isPostgres) {
      // Clean connection string (e.g. remove +psycopg if present)
      const cleanUrl = DATABASE_URL.replace(/^postgresql\+[a-zA-Z0-9_-]+:\/\//, 'postgresql://');
      this.pgPool = new pg.Pool({
        connectionString: cleanUrl
      });
      // Test connection
      const client = await this.pgPool.connect();
      try {
        await client.query('SELECT 1');
      } finally {
        client.release();
      }
      console.log('Connected to PostgreSQL database');
    } else {
      // SQLite path resolution
      let sqliteFilePath = 'decision_memory.db';
      if (DATABASE_URL.startsWith('sqlite:///')) {
        sqliteFilePath = DATABASE_URL.replace('sqlite:///', '');
      } else if (DATABASE_URL.startsWith('sqlite://')) {
        sqliteFilePath = DATABASE_URL.replace('sqlite://', '');
      }

      if (!path.isAbsolute(sqliteFilePath)) {
        // Prefer root directory decision_memory.db if it exists, otherwise current working dir
        const rootPath = path.resolve(PROJECT_ROOT, sqliteFilePath);
        sqliteFilePath = rootPath;
      }

      const dir = path.dirname(sqliteFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.sqliteDb = new DatabaseSync(sqliteFilePath);
      console.log(`Connected to SQLite database at ${sqliteFilePath}`);
    }

    await this.initSchema();
    this._initialized = true;
  }

  async initSchema() {
    if (this.isPostgres) {
      await this.pgPool.query(POSTGRES_SCHEMA);
    } else {
      this.sqliteDb.exec(SQLITE_SCHEMA);
    }
  }

  /**
   * Helper to convert positional '?' to '$1, $2, ...' for Postgres
   */
  _formatQueryForPostgres(sql) {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  /**
   * Run query that returns multiple rows
   */
  async all(sql, params = []) {
    await this.connect();
    if (this.isPostgres) {
      const pgSql = this._formatQueryForPostgres(sql);
      const res = await this.pgPool.query(pgSql, params);
      return res.rows;
    } else {
      const stmt = this.sqliteDb.prepare(sql);
      return stmt.all(...params);
    }
  }

  /**
   * Run query that returns a single row (or null)
   */
  async get(sql, params = []) {
    await this.connect();
    if (this.isPostgres) {
      const pgSql = this._formatQueryForPostgres(sql);
      const res = await this.pgPool.query(pgSql, params);
      return res.rows[0] || null;
    } else {
      const stmt = this.sqliteDb.prepare(sql);
      const row = stmt.get(...params);
      return row || null;
    }
  }

  /**
   * Run INSERT/UPDATE/DELETE query
   */
  async run(sql, params = []) {
    await this.connect();
    if (this.isPostgres) {
      let pgSql = this._formatQueryForPostgres(sql);
      // If INSERT and doesn't have RETURNING, append RETURNING id
      const isInsert = /^\s*INSERT\s+INTO/i.test(sql);
      if (isInsert && !/RETURNING/i.test(pgSql)) {
        pgSql += ' RETURNING id';
      }
      const res = await this.pgPool.query(pgSql, params);
      const lastInsertRowid = res.rows && res.rows[0]?.id ? res.rows[0].id : null;
      return {
        lastInsertRowid,
        changes: res.rowCount
      };
    } else {
      const stmt = this.sqliteDb.prepare(sql);
      const info = stmt.run(...params);
      return {
        lastInsertRowid: Number(info.lastInsertRowid),
        changes: Number(info.changes)
      };
    }
  }

  /**
   * Execute raw SQL statements (e.g. for migrations or recreation)
   */
  async exec(sql) {
    await this.connect();
    if (this.isPostgres) {
      await this.pgPool.query(sql);
    } else {
      this.sqliteDb.exec(sql);
    }
  }

  async close() {
    if (this.pgPool) {
      await this.pgPool.end();
    }
    if (this.sqliteDb) {
      this.sqliteDb.close();
    }
    this._initialized = false;
  }
}

const db = new DatabaseManager();
export default db;
