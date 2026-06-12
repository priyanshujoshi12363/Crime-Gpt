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