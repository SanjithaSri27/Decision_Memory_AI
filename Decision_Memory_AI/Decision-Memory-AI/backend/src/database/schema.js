export const SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gitlab_project_id INTEGER UNIQUE,
  name VARCHAR,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_projects_gitlab_project_id ON projects (gitlab_project_id);
CREATE INDEX IF NOT EXISTS ix_projects_id ON projects (id);
CREATE INDEX IF NOT EXISTS ix_projects_name ON projects (name);

CREATE TABLE IF NOT EXISTS developers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gitlab_username VARCHAR UNIQUE,
  name VARCHAR,
  email VARCHAR UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_developers_id ON developers (id);
CREATE UNIQUE INDEX IF NOT EXISTS ix_developers_email ON developers (email);
CREATE UNIQUE INDEX IF NOT EXISTS ix_developers_gitlab_username ON developers (gitlab_username);

CREATE TABLE IF NOT EXISTS merge_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gitlab_mr_id INTEGER,
  mr_iid INTEGER,
  project_id INTEGER REFERENCES projects(id),
  author_id INTEGER REFERENCES developers(id),
  title VARCHAR,
  description TEXT,
  status VARCHAR,
  changed_files JSON,
  commits JSON,
  linked_issues JSON,
  diff_stats JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  CONSTRAINT _project_mr_uc UNIQUE (project_id, mr_iid)
);
CREATE INDEX IF NOT EXISTS ix_merge_requests_title ON merge_requests (title);
CREATE INDEX IF NOT EXISTS ix_merge_requests_gitlab_mr_id ON merge_requests (gitlab_mr_id);
CREATE INDEX IF NOT EXISTS ix_merge_requests_mr_iid ON merge_requests (mr_iid);
CREATE INDEX IF NOT EXISTS ix_merge_requests_id ON merge_requests (id);

CREATE TABLE IF NOT EXISTS decision_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mr_id INTEGER UNIQUE REFERENCES merge_requests(id),
  project_id INTEGER REFERENCES projects(id),
  decision_summary TEXT,
  reasoning TEXT,
  impact_level VARCHAR,
  confidence_score INTEGER,
  related_files JSON,
  related_commits JSON,
  embedding JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);
CREATE INDEX IF NOT EXISTS ix_decision_records_id ON decision_records (id);

CREATE TABLE IF NOT EXISTS decision_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  decision_record_id INTEGER REFERENCES decision_records(id),
  changed_by INTEGER REFERENCES developers(id),
  previous_content JSON,
  updated_content JSON,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_decision_history_id ON decision_history (id);
`;

export const POSTGRES_SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  gitlab_project_id INTEGER UNIQUE,
  name VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_projects_gitlab_project_id ON projects (gitlab_project_id);
CREATE INDEX IF NOT EXISTS ix_projects_id ON projects (id);
CREATE INDEX IF NOT EXISTS ix_projects_name ON projects (name);

CREATE TABLE IF NOT EXISTS developers (
  id SERIAL PRIMARY KEY,
  gitlab_username VARCHAR UNIQUE,
  name VARCHAR,
  email VARCHAR UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_developers_id ON developers (id);
CREATE UNIQUE INDEX IF NOT EXISTS ix_developers_email ON developers (email);
CREATE UNIQUE INDEX IF NOT EXISTS ix_developers_gitlab_username ON developers (gitlab_username);

CREATE TABLE IF NOT EXISTS merge_requests (
  id SERIAL PRIMARY KEY,
  gitlab_mr_id INTEGER,
  mr_iid INTEGER,
  project_id INTEGER REFERENCES projects(id),
  author_id INTEGER REFERENCES developers(id),
  title VARCHAR,
  description TEXT,
  status VARCHAR,
  changed_files JSONB DEFAULT '[]',
  commits JSONB DEFAULT '[]',
  linked_issues JSONB DEFAULT '[]',
  diff_stats JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT _project_mr_uc UNIQUE (project_id, mr_iid)
);
CREATE INDEX IF NOT EXISTS ix_merge_requests_title ON merge_requests (title);
CREATE INDEX IF NOT EXISTS ix_merge_requests_gitlab_mr_id ON merge_requests (gitlab_mr_id);
CREATE INDEX IF NOT EXISTS ix_merge_requests_mr_iid ON merge_requests (mr_iid);
CREATE INDEX IF NOT EXISTS ix_merge_requests_id ON merge_requests (id);

CREATE TABLE IF NOT EXISTS decision_records (
  id SERIAL PRIMARY KEY,
  mr_id INTEGER UNIQUE REFERENCES merge_requests(id),
  project_id INTEGER REFERENCES projects(id),
  decision_summary TEXT,
  reasoning TEXT,
  impact_level VARCHAR,
  confidence_score INTEGER,
  related_files JSONB DEFAULT '[]',
  related_commits JSONB DEFAULT '[]',
  embedding JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_decision_records_id ON decision_records (id);

CREATE TABLE IF NOT EXISTS decision_history (
  id SERIAL PRIMARY KEY,
  decision_record_id INTEGER REFERENCES decision_records(id),
  changed_by INTEGER REFERENCES developers(id),
  previous_content JSONB,
  updated_content JSONB,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_decision_history_id ON decision_history (id);
`;
