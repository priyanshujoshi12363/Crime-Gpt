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
  incident_date TEXT NOT NULL,
  incident_time TEXT,
  incident_location TEXT NOT NULL,
  description TEXT NOT NULL,
  description_lang TEXT DEFAULT 'en',
  status TEXT DEFAULT 'ACTIVE',
  complainant_name TEXT,
  complainant_address TEXT,
  complainant_phone TEXT,
  complainant_id_type TEXT,
  complainant_id_number TEXT,
  accused_list TEXT DEFAULT '[]',
  witness_list TEXT DEFAULT '[]',
  seized_items TEXT DEFAULT '[]',
  officer_name TEXT,
  officer_badge TEXT,
  applied_sections TEXT DEFAULT '[]',
  suggested_judgments TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id),
  doc_type TEXT NOT NULL,
  doc_path TEXT NOT NULL,
  version INTEGER DEFAULT 1,
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
  officer_name TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);