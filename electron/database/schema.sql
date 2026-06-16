PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'IO',
  badge_number TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  fir_number TEXT UNIQUE NOT NULL,
  case_type TEXT DEFAULT 'Other',
  incident_date TEXT NOT NULL,
  incident_time TEXT,
  incident_location TEXT NOT NULL,
  incident_district TEXT DEFAULT 'Ahmedabad',
  incident_state TEXT DEFAULT 'Gujarat',
  description TEXT NOT NULL,
  description_lang TEXT DEFAULT 'en',
  status TEXT DEFAULT 'ACTIVE',
  officer_name TEXT,
  officer_badge TEXT,
  officer_rank TEXT DEFAULT 'Investigating Officer',
  complainant TEXT DEFAULT '{}',
  accused TEXT DEFAULT '[]',
  witnesses TEXT DEFAULT '[]',
  seized_items TEXT DEFAULT '[]',
  applied_sections TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS evidence_files (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id),
  file_type TEXT DEFAULT 'IMAGE',
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id),
  doc_type TEXT NOT NULL,
  doc_name TEXT,
  doc_path TEXT,
  doc_format TEXT DEFAULT 'pdf',
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS case_diary (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id),
  entry_date TEXT NOT NULL,
  entry_time TEXT,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  officer_name TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);
CREATE TABLE IF NOT EXISTS diary_images (
  id TEXT PRIMARY KEY,
  diary_entry_id TEXT NOT NULL REFERENCES case_diary(id),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_diary_images_entry ON diary_images(diary_entry_id);
CREATE INDEX IF NOT EXISTS idx_cases_fir ON cases(fir_number);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_evidence_case ON evidence_files(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_case ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_diary_case ON case_diary(case_id);