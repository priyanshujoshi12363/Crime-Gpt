import crypto from 'crypto';
import { getDatabase, saveToFile } from './database/connection.js';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

export function hasUsers() {
  const db = getDatabase();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
  stmt.step();
  const result = stmt.getAsObject().count;
  stmt.free();
  return result > 0;
}

export function setupAdmin(username, password) {
  const db = getDatabase();
  
  if (hasUsers()) {
    return { success: false, error: 'Admin already set up' };
  }
  
  const hash = hashPassword(password);
  
  db.run(`INSERT INTO users (username, password_hash, full_name, role, badge_number) VALUES (?, ?, ?, ?, ?)`, [username, hash, username, 'ADMIN', 'ADMIN-001']);
  
  saveToFile();
  
  return { success: true };
}

export function authenticateUser(username, password) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1');
  stmt.bind([username]);
  
  if (!stmt.step()) {
    stmt.free();
    return { success: false, error: 'Invalid username or password' };
  }
  
  const user = stmt.getAsObject();
  stmt.free();
  
  if (!verifyPassword(password, user.password_hash)) {
    return { success: false, error: 'Invalid username or password' };
  }
  
  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      badgeNumber: user.badge_number
    }
  };
}