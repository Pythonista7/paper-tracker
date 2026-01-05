PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS papers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT DEFAULT '',
  abstract TEXT DEFAULT '',
  source_url TEXT NOT NULL,
  canonical_id TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'to-read',
  tags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_papers_status ON papers(status);
CREATE INDEX IF NOT EXISTS idx_papers_title ON papers(title);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  paper_id TEXT NOT NULL,
  body TEXT NOT NULL,
  page_ref TEXT DEFAULT '',
  section_ref TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notes_paper ON notes(paper_id);

CREATE TABLE IF NOT EXISTS reading_sessions (
  id TEXT PRIMARY KEY,
  paper_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  progress REAL DEFAULT 0,
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  source_paper_id TEXT NOT NULL,
  target_paper_id TEXT NOT NULL,
  relation TEXT NOT NULL,
  FOREIGN KEY (source_paper_id) REFERENCES papers(id) ON DELETE CASCADE,
  FOREIGN KEY (target_paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS share_tokens (
  paper_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  is_public INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (paper_id, token),
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);
