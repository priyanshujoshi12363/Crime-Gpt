import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase, getDatabase, closeDatabase } from './database/connection.js';
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

let mainWindow = null;
let dataIndexed = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1024, minHeight: 768,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false },
    title: 'CrimeGPT', show: false, autoHideMenuBar: true,
    icon: path.join(__dirname, '../public/logo1.png')
  });
  mainWindow.setMenuBarVisibility(false);
  Menu.setApplicationMenu(null);
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (process.env.VITE_DEV_SERVER_URL) mainWindow.webContents.openDevTools();
  });
  if (process.env.VITE_DEV_SERVER_URL) mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  else mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
}

async function indexAllLegalData() {
  const storePath = path.join(__dirname, '..', 'database', 'sections.json');
  if (fs.existsSync(storePath) && (fs.statSync(storePath).size / 1024) > 100) {
    console.log('[Index] Store already populated — skipping');
    await rebuildCache();
    dataIndexed = true;
    return;
  }
  console.log('[Index] Starting fresh indexing...');
  const dataPath = path.join(__dirname, '..', 'data');
  for (const file of [
    { path: path.join(dataPath, 'BNS1.txt'), name: 'BNS' },
    { path: path.join(dataPath, 'BNSS.txt'), name: 'BNSS' },
    { path: path.join(dataPath, 'BSA.txt'), name: 'BSA' },
    { path: path.join(dataPath, 'special.txt'), name: 'SPECIAL' },
  ]) {
    if (fs.existsSync(file.path)) {
      try { await indexLawFile(file.path, file.name); }
      catch (err) { console.error(`[Index] Failed ${file.name}:`, err.message); }
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

function queryOne(stmt, params = []) {
  if (params.length) stmt.bind(params);
  const result = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return result;
}

function queryCount(sql, params = []) {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const count = stmt.step() ? stmt.getAsObject().count : 0;
  stmt.free();
  return count;
}

app.whenReady().then(async () => {
  try {
    await initDatabase();
    await initVectorStore();
    await indexAllLegalData();
    const ollama = isOllamaInstalled();
    if (ollama.installed && !(await isOllamaRunning())) startOllamaProcess();
    createWindow();
    console.log('[Startup] CrimeGPT ready');
  } catch (err) { console.error('[Startup] Fatal error:', err); }
});

ipcMain.handle('auth:check-setup', () => ({ needsSetup: !hasUsers() }));
ipcMain.handle('auth:setup-admin', (_, u, p) => setupAdmin(u, p));
ipcMain.handle('auth:login', (_, u, p) => authenticateUser(u, p));

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

ipcMain.handle('rag:search-laws', async (_, q) => dataIndexed ? await searchLaws(q) : []);
ipcMain.handle('rag:legal-suggestion', async (_, q) => dataIndexed ? await getLegalOpinion(q) : 'Legal database loading...');
ipcMain.handle('rag:search-similar-cases', async (_, q) => await searchSimilarCases(q));
ipcMain.handle('rag:index-status', () => ({ ready: dataIndexed }));

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

ipcMain.handle('diary:add', async (_, data) => {
  const result = await addDiaryEntry(data.case_id, data);
  if (result.success) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM cases WHERE id = ?');
    stmt.bind([data.case_id]);
    const cd = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    await indexCaseData({ id: result.entryId, fir_number: cd?.fir_number, description: data.description, incident_location: cd?.incident_location, incident_date: data.entry_date, case_type: 'DIARY_ENTRY', sections_applied: [] });
  }
  return result;
});
ipcMain.handle('diary:get', (_, cid) => queryAll(getDatabase().prepare('SELECT * FROM case_diary WHERE case_id = ? ORDER BY entry_date DESC, entry_time DESC'), [cid]));

ipcMain.handle('dashboard:stats', () => ({
  activeCases: queryCount('SELECT COUNT(*) as count FROM cases WHERE status = ?', ['ACTIVE']),
  totalCases: queryCount('SELECT COUNT(*) as count FROM cases'),
  documentsGenerated: queryCount('SELECT COUNT(*) as count FROM documents'),
}));

ipcMain.handle('doc:get-for-case', (_, cid) => getDocumentsForCase(cid));
ipcMain.handle('doc:get-required', (_, ct) => getRequiredDocuments(ct));
ipcMain.handle('doc:save-record', (_, cid, dt, dn, dp) => saveDocumentRecord(cid, dt, dn, dp));
ipcMain.handle('doc:generate', async (_, cid, dk, cd) => await generateDocumentForCase(cid, dk, cd));
ipcMain.handle('doc:save-as-pdf', async (_, html, fn) => await generateAndSavePDF(html, fn));

app.on('window-all-closed', () => { closeDatabase(); if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });