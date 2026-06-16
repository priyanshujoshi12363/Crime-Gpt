import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

export function getDbPath() {
  const userDataPath = app?.getPath?.('userData') || path.join(process.cwd(), 'data');
  const dbDir = path.join(userDataPath, 'data');
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  return path.join(dbDir, 'crimegpt.db');
}

export function saveToFile() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(getDbPath(), buffer);
  }
}

export async function initDatabase() {
  const SQL = await initSqlJs();
  const dbPath = getDbPath();
  
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  db.run('PRAGMA foreign_keys = ON');
  
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.run(schema);
  
  // ✅ ADD THESE 4 LINES
  db.run(`CREATE TABLE IF NOT EXISTS diary_images (id TEXT PRIMARY KEY, diary_entry_id TEXT NOT NULL, file_path TEXT NOT NULL, file_name TEXT NOT NULL, file_size INTEGER, created_at TEXT DEFAULT (datetime('now', 'localtime')))`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_diary_images_entry ON diary_images(diary_entry_id)`);
  console.log('[Database] diary_images table ready');
  // In initDatabase(), after diary_images table
db.run(`CREATE TABLE IF NOT EXISTS lers_requests (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  target_identifier TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  request_data TEXT,
  response_data TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
)`);
db.run(`CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  case_id TEXT,
  action TEXT NOT NULL,
  details TEXT,
  officer_name TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
)`);
console.log('[Database] audit_log table ready');
  saveToFile();
  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized.');
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    saveToFile();
    db.close();
    db = null;
  }
}