import { app, BrowserWindow, ipcMain, Menu, net } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { initDatabase, getDatabase, closeDatabase, saveToFile } from './database/connection.js';
import { hasUsers, setupAdmin, authenticateUser } from './auth.js';
import {
  isOllamaInstalled, isOllamaRunning, getInstalledModels, startOllamaProcess,
  getDeviceSpecs, getQwenModel, checkDiskSpace, downloadOllamaInstaller,
  downloadQwenModel, downloadEmbedModel, askOllama, getEmbedding, getLegalSuggestion
} from './service/ai-setup.js';
import {
  initVectorStore, indexLawFile, searchLaws, getLegalOpinion,
  rebuildCache, indexCaseData, searchSimilarCases, suggestSections
} from './service/vector-db.js';
import { registerCase, getFullCase, addDiaryEntry, generateFIRNumber } from './service/case-manager.js';
import { getDocumentsForCase, getRequiredDocuments, saveDocumentRecord, generateDocumentForCase, generateAndSavePDF } from './service/document-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BHARATPOL_API = 'https://mock-api-7969.onrender.com';

let mainWindow = null;
let dataIndexed = false;
let logToFile = () => {}; 
function createWindow() {
  try {
    mainWindow = new BrowserWindow({
      width: 1400, height: 900, minWidth: 1024, minHeight: 768,
      webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, webSecurity: false },
      title: 'CrimeGPT', show: false, autoHideMenuBar: true
    });
    mainWindow.webContents.on('did-fail-load', (e, code, desc) => logToFile(`did-fail-load: ${desc}`));
    mainWindow.webContents.on('preload-error', (e, p, error) => logToFile(`preload-error: ${error}`));
    mainWindow.webContents.on('render-process-gone', (e, details) => logToFile(`render-gone: ${JSON.stringify(details)}`));
    mainWindow.setMenuBarVisibility(false);
    Menu.setApplicationMenu(null);
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      logToFile('Window shown');
    });
    if (process.env.VITE_DEV_SERVER_URL) mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    else mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    logToFile('createWindow success');
  } catch (err) {
    logToFile(`createWindow ERROR: ${err.stack}`);
  }
}
async function indexAllLegalData() {
  const isPackaged = app.isPackaged;
  
  if (isPackaged) {
    const userDbDir = path.join(app.getPath('userData'), 'database');
    if (!fs.existsSync(userDbDir)) fs.mkdirSync(userDbDir, { recursive: true });
    
    const sectionsSrc = path.join(process.resourcesPath, 'database', 'sections.json');
    const sectionsDest = path.join(userDbDir, 'sections.json');
    
    if (fs.existsSync(sectionsSrc) && !fs.existsSync(sectionsDest)) {
      fs.copyFileSync(sectionsSrc, sectionsDest);
      logToFile('sections.json copied to userData');
    }
    
    const userDataDir = path.join(app.getPath('userData'), 'data');
    if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });
    
    const resourcesData = path.join(process.resourcesPath, 'data');
    if (fs.existsSync(resourcesData)) {
      const files = fs.readdirSync(resourcesData);
      for (const f of files) {
        const src = path.join(resourcesData, f);
        const dest = path.join(userDataDir, f);
        if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
      }
    }
  }
  
  await rebuildCache();
  dataIndexed = true;
}
function queryAll(stmt, params = []) {
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

function queryCount(sql, params = []) {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const count = stmt.step() ? stmt.getAsObject().count : 0;
  stmt.free();
  return count;
}

// ─── HTTP Helper (uses Electron's net module) ───
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = net.request(url);
    let data = '';
    req.on('response', (res) => {
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ success: false, data: [] }); }
      });
    });
    req.on('error', (err) => reject(err));
    req.end();
  });
}

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const req = net.request({ method: 'POST', url, headers: { 'Content-Type': 'application/json' } });
    let data = '';
    req.on('response', (res) => {
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ success: false }); }
      });
    });
    req.on('error', (err) => reject(err));
    req.write(JSON.stringify(body));
    req.end();
  });
}app.whenReady().then(async () => {
  const logPath = path.join(app.getPath('userData'), 'crimegpt.log');
  logToFile = (msg) => {
    try { fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`); } catch (e) {}
  };
  process.on('uncaughtException', (err) => logToFile(`UNCAUGHT: ${err.stack}`));
  process.on('unhandledRejection', (err) => logToFile(`REJECTION: ${err}`));
  logToFile('=== App starting ===');

  await initDatabase();
  logToFile('DB OK');

  createWindow();
  logToFile('Window created');

  setTimeout(async () => {
    try {
      await initVectorStore();
      logToFile('Vector OK');
      await indexAllLegalData();
      logToFile('Index OK');
      const ollama = isOllamaInstalled();
      if (ollama.installed && !(await isOllamaRunning())) startOllamaProcess();
      logToFile('Startup complete');
    } catch (err) {
      logToFile(`Data error: ${err.stack}`);
    }
  }, 500);
});
// ─── AUTH ───
ipcMain.handle('auth:check-setup', () => ({ needsSetup: !hasUsers() }));
ipcMain.handle('auth:setup-admin', (_, u, p) => setupAdmin(u, p));
ipcMain.handle('auth:login', (_, u, p) => authenticateUser(u, p));

// ─── AI ───
ipcMain.handle('ai:check-setup', async () => {
  const device = getDeviceSpecs(), qwenModel = getQwenModel(), ollama = isOllamaInstalled();
  const running = ollama.installed ? await isOllamaRunning() : false;
  const models = ollama.installed && running ? getInstalledModels() : [];
  return { ready: ollama.installed && running && models.some(m => m.name.includes('qwen')) && models.some(m => m.name.includes('nomic-embed')), installed: ollama.installed, running, device, qwenModel, models, qwenReady: models.some(m => m.name.includes('qwen')), embedReady: models.some(m => m.name.includes('nomic-embed')), diskSpace: checkDiskSpace() };
});
ipcMain.handle('ai:install-ollama', async () => await downloadOllamaInstaller(mainWindow));
ipcMain.handle('ai:download-model', async () => await downloadQwenModel(mainWindow));
ipcMain.handle('ai:download-embed-model', async () => await downloadEmbedModel(mainWindow));
ipcMain.handle('ai:start-ollama', async () => await startOllamaProcess());
ipcMain.handle('ai:chat', async (_, m) => await askOllama(m));
ipcMain.handle('ai:legal-suggestion', async (_, d) => await getLegalSuggestion(d));
ipcMain.handle('ai:embedding', async (_, t) => await getEmbedding(t));
ipcMain.handle('ai:suggest-sections', async (_, q) => await suggestSections(q));

// ─── RAG ───
ipcMain.handle('rag:search-laws', async (_, q) => dataIndexed ? await searchLaws(q) : []);
ipcMain.handle('rag:legal-suggestion', async (_, q) => dataIndexed ? await getLegalOpinion(q) : 'Legal database loading...');
ipcMain.handle('rag:search-similar-cases', async (_, q) => await searchSimilarCases(q));
ipcMain.handle('rag:index-status', () => ({ ready: dataIndexed }));

// ─── CASES ───
ipcMain.handle('case:register', async (_, data) => {
  const result = await registerCase(data);
  if (result.success) {
    await indexCaseData({ id: result.caseId, fir_number: result.fir_number, description: data.description, incident_location: data.incident_location, incident_date: data.incident_date, case_type: data.case_type, sections_applied: (data.sections || []).map(s => `${s.law || 'BNS'} ${s.section}`) });
  }
  return result;
});
ipcMain.handle('case:get-full', async (_, id) => await getFullCase(id));
ipcMain.handle('case:generate-fir-number', () => ({ fir_number: generateFIRNumber() }));
ipcMain.handle('case:get-all', () => queryAll(getDatabase().prepare('SELECT * FROM cases ORDER BY created_at DESC')));
ipcMain.handle('case:search', (_, q) => queryAll(getDatabase().prepare('SELECT * FROM cases WHERE fir_number LIKE ? OR description LIKE ? OR incident_location LIKE ? ORDER BY created_at DESC'), [`%${q}%`, `%${q}%`, `%${q}%`]));

// ─── DIARY ───
ipcMain.handle('diary:add', async (_, data) => {
  const result = await addDiaryEntry(data.case_id, data);
  if (result.success) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM cases WHERE id = ?');
    stmt.bind([data.case_id]);
    const cd = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    if (cd) {
      await indexCaseData({ id: result.entryId, fir_number: cd?.fir_number, description: data.description, incident_location: cd?.incident_location, incident_date: data.entry_date, case_type: 'DIARY_ENTRY', sections_applied: [] });
    }
  }
  return result;
});
ipcMain.handle('diary:get', (_, cid) => queryAll(getDatabase().prepare('SELECT * FROM case_diary WHERE case_id = ? ORDER BY entry_date DESC, entry_time DESC'), [cid]));

// ─── DASHBOARD ───
ipcMain.handle('dashboard:stats', () => ({
  activeCases: queryCount('SELECT COUNT(*) as count FROM cases WHERE status = ?', ['ACTIVE']),
  totalCases: queryCount('SELECT COUNT(*) as count FROM cases'),
  documentsGenerated: queryCount('SELECT COUNT(*) as count FROM documents'),
}));

// ─── DOCUMENTS ───
ipcMain.handle('doc:get-for-case', (_, cid) => getDocumentsForCase(cid));
ipcMain.handle('doc:get-required', (_, ct) => getRequiredDocuments(ct));
ipcMain.handle('doc:save-record', (_, cid, dt, dn, dp) => saveDocumentRecord(cid, dt, dn, dp));
ipcMain.handle('doc:generate', async (_, cid, dk, cd) => await generateDocumentForCase(cid, dk, cd));
ipcMain.handle('doc:save-as-pdf', async (_, html, fn) => {
  const result = await generateAndSavePDF(html, fn);
  if (result.success && mainWindow) {
    mainWindow.webContents.send('download-complete', { filename: fn, path: result.path });
  }
  return result;
});

// ─── BHARATPOL ───
ipcMain.handle('bharatpol:get-criminals', async (_, params) => {
  const query = new URLSearchParams(params).toString();
  return await httpGet(`${BHARATPOL_API}/api/criminals?${query}`);
});

ipcMain.handle('bharatpol:sync-case', async (_, data) => {
  return await httpPost(`${BHARATPOL_API}/api/cases/sync`, data);
});

ipcMain.handle('bharatpol:share-case', async (_, data) => {
  console.log('[BharatPol] Sharing case:', data.firNumber);
  const result = await httpPost(`${BHARATPOL_API}/api/cases/share`, data);
  console.log('[BharatPol] Share result:', result.success);
  return result;
});

// ─── LERS ───
ipcMain.handle('lers:send', async (_, data) => {
  const db = getDatabase();
  const id = uuidv4();
  db.run('INSERT INTO lers_requests (id, case_id, platform, target_identifier, status, request_data) VALUES (?, ?, ?, ?, ?, ?)', [
    id, data.caseId, data.platform, data.targetIdentifier, 'SENT', JSON.stringify(data)
  ]);
  saveToFile();
  return { success: true, requestId: id, status: 'SENT', message: `LERS request sent to ${data.platform}. ID: ${id.slice(0, 8)}` };
});

ipcMain.handle('lers:get-for-case', (_, caseId) => {
  return queryAll(getDatabase().prepare('SELECT * FROM lers_requests WHERE case_id = ? ORDER BY created_at DESC'), [caseId]);
});
ipcMain.handle('audit:get-for-case', (_, caseId) => {
  return queryAll(getDatabase().prepare('SELECT * FROM audit_log WHERE case_id = ? ORDER BY created_at DESC'), [caseId]);
});
ipcMain.handle('case:update-accused', async (_, caseId, accused) => {
  const db = getDatabase();
  db.run('UPDATE cases SET accused = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?', [
    JSON.stringify(accused), caseId
  ]);
  saveToFile();
  return { success: true };
});
app.on('window-all-closed', () => { closeDatabase(); if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });