import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, getDatabase, closeDatabase } from './database/connection.js';
import { hasUsers, setupAdmin, authenticateUser } from './auth.js';
import { v4 as uuidv4 } from 'uuid';
import { 
  isOllamaInstalled,
  isOllamaRunning,
  getInstalledModels,
  hasQwenModel,
  hasEmbedModel,
  startOllamaProcess,
  getDeviceSpecs,
  getQwenModel,
  checkDiskSpace,
  downloadOllamaInstaller,
  downloadQwenModel,
  downloadEmbedModel,
  askOllama,
  getEmbedding,
  getLegalSuggestion
} from './service/ai-setup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'CrimeGPT',
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../public/logo1.png')
  });

  mainWindow.setMenuBarVisibility(false);
  Menu.setApplicationMenu(null);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.webContents.openDevTools();
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  await initDatabase();
  createWindow();
});

ipcMain.handle('auth:check-setup', () => {
  return { needsSetup: !hasUsers() };
});

ipcMain.handle('auth:setup-admin', (_, username, password) => {
  return setupAdmin(username, password);
});

ipcMain.handle('auth:login', (_, username, password) => {
  return authenticateUser(username, password);
});

ipcMain.handle('ai:check-setup', async () => {
  const device = getDeviceSpecs();
  const qwenModel = getQwenModel();
  const ollama = isOllamaInstalled();
  const running = ollama.installed ? await isOllamaRunning() : false;
  const models = ollama.installed && running ? getInstalledModels() : [];
  const qwenReady = models.some(m => m.name.toLowerCase().includes('qwen'));
  const embedReady = models.some(m => m.name.toLowerCase().includes('nomic-embed'));
  const diskSpace = checkDiskSpace();

  return {
    ready: ollama.installed && running && qwenReady && embedReady,
    installed: ollama.installed,
    running,
    qwenReady,
    embedReady,
    modelReady: qwenReady && embedReady,
    device,
    qwenModel,
    models,
    diskSpace
  };
});

ipcMain.handle('ai:install-ollama', async () => {
  return await downloadOllamaInstaller(mainWindow);
});

ipcMain.handle('ai:download-model', async () => {
  return await downloadQwenModel(mainWindow);
});

ipcMain.handle('ai:download-embed-model', async () => {
  return await downloadEmbedModel(mainWindow);
});

ipcMain.handle('ai:start-ollama', async () => {
  return await startOllamaProcess();
});

ipcMain.handle('ai:chat', async (_, message) => {
  return await askOllama(message);
});

ipcMain.handle('ai:legal-suggestion', async (_, firDescription) => {
  return await getLegalSuggestion(firDescription);
});

ipcMain.handle('ai:embedding', async (_, text) => {
  return await getEmbedding(text);
});

ipcMain.handle('case:create', (_, data) => {
  const db = getDatabase();
  const id = uuidv4();
  
  db.run(`INSERT INTO cases (id, fir_number, incident_date, incident_time, incident_location, description, description_lang, complainant_name, complainant_address, complainant_phone, complainant_id_type, complainant_id_number, officer_name, officer_badge) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    id, data.fir_number, data.incident_date, data.incident_time || null,
    data.incident_location, data.description, data.description_lang || 'en',
    data.complainant_name, data.complainant_address || null,
    data.complainant_phone || null, data.complainant_id_type || null,
    data.complainant_id_number || null, data.officer_name || null,
    data.officer_badge || null
  ]);
  
  return { success: true, caseId: id };
});

ipcMain.handle('case:get-all', () => {
  const db = getDatabase();
  const results = [];
  const stmt = db.prepare('SELECT * FROM cases ORDER BY created_at DESC');
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
});

ipcMain.handle('case:get', (_, id) => {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM cases WHERE id = ?');
  stmt.bind([id]);
  if (stmt.step()) {
    const result = stmt.getAsObject();
    stmt.free();
    return result;
  }
  stmt.free();
  return null;
});

ipcMain.handle('case:search', (_, query) => {
  const db = getDatabase();
  const results = [];
  const stmt = db.prepare(`SELECT * FROM cases WHERE fir_number LIKE ? OR description LIKE ? OR complainant_name LIKE ? OR incident_location LIKE ? ORDER BY created_at DESC`);
  stmt.bind([`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]);
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
});

ipcMain.handle('case:update-field', (_, id, field, value) => {
  const db = getDatabase();
  db.run(`UPDATE cases SET ${field} = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`, [value, id]);
  return { success: true };
});

ipcMain.handle('dashboard:stats', () => {
  const db = getDatabase();
  
  let activeCount = 0;
  const s1 = db.prepare('SELECT COUNT(*) as count FROM cases WHERE status = ?');
  s1.bind(['ACTIVE']);
  if (s1.step()) activeCount = s1.getAsObject().count;
  s1.free();
  
  let totalCount = 0;
  const s2 = db.prepare('SELECT COUNT(*) as count FROM cases');
  if (s2.step()) totalCount = s2.getAsObject().count;
  s2.free();
  
  let docsCount = 0;
  const s3 = db.prepare('SELECT COUNT(*) as count FROM documents');
  if (s3.step()) docsCount = s3.getAsObject().count;
  s3.free();
  
  return { activeCases: activeCount, totalCases: totalCount, documentsGenerated: docsCount };
});

ipcMain.handle('diary:add', (_, data) => {
  const db = getDatabase();
  const id = uuidv4();
  db.run(`INSERT INTO case_diary (id, case_id, entry_date, entry_time, event_type, title, description, officer_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [id, data.case_id, data.entry_date, data.entry_time || null, data.event_type, data.title, data.description || null, data.officer_name || null]);
  return { success: true, id };
});

ipcMain.handle('diary:get', (_, caseId) => {
  const db = getDatabase();
  const results = [];
  const stmt = db.prepare('SELECT * FROM case_diary WHERE case_id = ? ORDER BY entry_date DESC, entry_time DESC');
  stmt.bind([caseId]);
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
});

app.on('window-all-closed', () => {
  closeDatabase();
  if (process.platform !== 'darwin') app.quit();
});