import { getDatabase } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

function getEvidenceDir(caseId) {
  const userDataPath = app?.getPath?.('userData') || path.join(process.cwd(), 'data');
  const dir = path.join(userDataPath, 'evidence', caseId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function generateFIRNumber() {
  const year = new Date().getFullYear();
  const random = String(Math.floor(Math.random() * 10000)).padStart(5, '0');
  return `CR-${year}-${random}`;
}

export async function registerCase(caseData) {
  const db = getDatabase();
  const caseId = uuidv4();
  const firNumber = caseData.fir_number || generateFIRNumber();

  const complainantJSON = caseData.complainant ? JSON.stringify(caseData.complainant) : '{}';
  const accusedJSON = caseData.accused ? JSON.stringify(caseData.accused) : '[]';
  const witnessesJSON = caseData.witnesses ? JSON.stringify(caseData.witnesses) : '[]';
  const seizedJSON = caseData.seized_items ? JSON.stringify(caseData.seized_items) : '[]';
  const sectionsJSON = caseData.sections ? JSON.stringify(caseData.sections) : '[]';

  db.run(`
    INSERT INTO cases (id, fir_number, case_type, incident_date, incident_time, incident_location, incident_district, description, description_lang, status, officer_name, officer_badge, officer_rank, complainant, accused, witnesses, seized_items, applied_sections)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    caseId, firNumber, caseData.case_type || 'Other', caseData.incident_date,
    caseData.incident_time || null, caseData.incident_location,
    caseData.incident_district || 'Ahmedabad', caseData.description,
    caseData.description_lang || 'en', caseData.officer_name || null,
    caseData.officer_badge || null, caseData.officer_rank || 'IO',
    complainantJSON, accusedJSON, witnessesJSON, seizedJSON, sectionsJSON
  ]);

  if (caseData.evidence_images && Array.isArray(caseData.evidence_images)) {
    const evidenceDir = getEvidenceDir(caseId);
    for (const img of caseData.evidence_images) {
      const ext = path.extname(img.originalName || img.name || 'image.jpg') || '.jpg';
      const filename = `${uuidv4()}${ext}`;
      const filePath = path.join(evidenceDir, filename);
      const buffer = Buffer.from(img.buffer || img.base64 || '', 'base64');
      fs.writeFileSync(filePath, buffer);
      db.run('INSERT INTO evidence_files (id, case_id, file_type, file_path, file_name, file_size, description) VALUES (?, ?, ?, ?, ?, ?, ?)', [
        uuidv4(), caseId, 'IMAGE', filePath, img.originalName || img.name || filename,
        img.size || fs.statSync(filePath).size, img.description || null
      ]);
    }
  }

  db.run('INSERT INTO case_diary (id, case_id, entry_date, entry_time, event_type, title, description, officer_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
    uuidv4(), caseId, new Date().toISOString().split('T')[0],
    new Date().toTimeString().split(' ')[0], 'FIR_REGISTERED', 'FIR Registered',
    `FIR ${firNumber} registered for ${caseData.case_type || 'case'} at ${caseData.incident_location}. ${caseData.description}`,
    caseData.officer_name || 'Unknown'
  ]);

  return { success: true, caseId, fir_number: firNumber };
}

export async function getFullCase(caseId) {
  const db = getDatabase();
  const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(caseId);
  if (!caseData) return null;

  try { caseData.complainant = JSON.parse(caseData.complainant || '{}'); } catch { caseData.complainant = {}; }
  try { caseData.accused = JSON.parse(caseData.accused || '[]'); } catch { caseData.accused = []; }
  try { caseData.witnesses = JSON.parse(caseData.witnesses || '[]'); } catch { caseData.witnesses = []; }
  try { caseData.seized_items = JSON.parse(caseData.seized_items || '[]'); } catch { caseData.seized_items = []; }
  try { caseData.applied_sections = JSON.parse(caseData.applied_sections || '[]'); } catch { caseData.applied_sections = []; }

  const evidenceStmt = db.prepare('SELECT * FROM evidence_files WHERE case_id = ?');
  evidenceStmt.bind([caseId]);
  const evidence = [];
  while (evidenceStmt.step()) evidence.push(evidenceStmt.getAsObject());
  evidenceStmt.free();

  const docsStmt = db.prepare('SELECT * FROM documents WHERE case_id = ?');
  docsStmt.bind([caseId]);
  const documents = [];
  while (docsStmt.step()) documents.push(docsStmt.getAsObject());
  docsStmt.free();

  const diaryStmt = db.prepare('SELECT * FROM case_diary WHERE case_id = ? ORDER BY entry_date DESC, entry_time DESC');
  diaryStmt.bind([caseId]);
  const diary = [];
  while (diaryStmt.step()) diary.push(diaryStmt.getAsObject());
  diaryStmt.free();

  return { ...caseData, evidence, documents, diary };
}

export async function addDiaryEntry(caseId, entryData) {
  const db = getDatabase();
  const id = uuidv4();
  db.run('INSERT INTO case_diary (id, case_id, entry_date, entry_time, event_type, title, description, location, officer_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
    id, caseId, entryData.entry_date, entryData.entry_time || null,
    entryData.event_type, entryData.title, entryData.description || null,
    entryData.location || null, entryData.officer_name || null
  ]);
  return { success: true, entryId: id };
}