import { getDatabase , saveToFile} from '../database/connection.js';
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

function getDiaryImagesDir(caseId, entryId) {
  const userDataPath = app?.getPath?.('userData') || path.join(process.cwd(), 'data');
  const dir = path.join(userDataPath, 'diary_images', caseId, entryId);
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

  const complainantJSON = JSON.stringify(caseData.complainant || {});
  const accusedJSON = JSON.stringify(caseData.accused || []);
  const witnessesJSON = JSON.stringify(caseData.witnesses || []);
  const seizedJSON = JSON.stringify(caseData.seized_items || []);
  const sectionsJSON = JSON.stringify(caseData.sections || []);

  console.log('Saving complainant:', complainantJSON);
  console.log('Saving accused:', accusedJSON);

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
  logAudit(caseId, 'CASE_CREATED', `FIR ${firNumber} registered for ${caseData.case_type}`, caseData.officer_name);
  saveToFile();
  return { success: true, caseId, fir_number: firNumber };
}

export async function getFullCase(caseId) {
  const db = getDatabase();
  
  const stmt = db.prepare('SELECT * FROM cases WHERE id = ?');
  stmt.bind([caseId]);
  const caseData = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  
  if (!caseData) return null;

  caseData.complainant = JSON.parse(caseData.complainant || '{}');
  caseData.accused = JSON.parse(caseData.accused || '[]');
  caseData.witnesses = JSON.parse(caseData.witnesses || '[]');
  caseData.seized_items = JSON.parse(caseData.seized_items || '[]');
  caseData.applied_sections = JSON.parse(caseData.applied_sections || '[]');
  const evStmt = db.prepare('SELECT * FROM evidence_files WHERE case_id = ?');
  evStmt.bind([caseId]);
  caseData.evidence = [];
  while (evStmt.step()) caseData.evidence.push(evStmt.getAsObject());
  evStmt.free();

  const docStmt = db.prepare('SELECT * FROM documents WHERE case_id = ?');
  docStmt.bind([caseId]);
  caseData.documents = [];
  while (docStmt.step()) caseData.documents.push(docStmt.getAsObject());
  docStmt.free();

  const diaryStmt = db.prepare('SELECT * FROM case_diary WHERE case_id = ? ORDER BY entry_date DESC, entry_time DESC');
  diaryStmt.bind([caseId]);
  caseData.diary = [];
  while (diaryStmt.step()) {
    const entry = diaryStmt.getAsObject();
  
    const imgStmt = db.prepare('SELECT * FROM diary_images WHERE diary_entry_id = ?');
    imgStmt.bind([entry.id]);
    entry.images = [];
    while (imgStmt.step()) entry.images.push(imgStmt.getAsObject());
    imgStmt.free();
    
    caseData.diary.push(entry);
  }
  diaryStmt.free();

  return caseData;
}
export function logAudit(caseId, action, details, officerName) {
  const db = getDatabase();
  db.run('INSERT INTO audit_log (id, case_id, action, details, officer_name) VALUES (?, ?, ?, ?, ?)', [
    uuidv4(), caseId, action, details, officerName || 'System'
  ]);
  saveToFile();
}
export async function addDiaryEntry(caseId, entryData) {
  const db = getDatabase();
  const id = uuidv4();
  
  console.log('[Diary] Creating entry:', { caseId, entryId: id, title: entryData.title });
  console.log('[Diary] Images received:', entryData.images?.length || 0);
  saveToFile();
  logAudit(caseId, 'DIARY_ENTRY', entryData.title, entryData.officer_name); // ✅ Here
  
  db.run('INSERT INTO case_diary (id, case_id, entry_date, entry_time, event_type, title, description, location, officer_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
    id, caseId, entryData.entry_date, entryData.entry_time || null,
    entryData.event_type, entryData.title, entryData.description || null,
    entryData.location || null, entryData.officer_name || null
  ]);

  if (entryData.images && Array.isArray(entryData.images)) {
    const diaryDir = getDiaryImagesDir(caseId, id);
    console.log('[Diary] Saving images to:', diaryDir);
    
    for (let i = 0; i < entryData.images.length; i++) {
      const img = entryData.images[i];
      const ext = path.extname(img.originalName || img.name || 'image.jpg') || '.jpg';
      const filename = `${uuidv4()}${ext}`;
      const filePath = path.join(diaryDir, filename);
      
      console.log(`[Diary] Processing image ${i + 1}:`, {
        name: img.originalName || img.name,
        hasBuffer: !!img.buffer,
        hasBase64: !!img.base64,
        base64Length: img.base64?.length || 0,
        size: img.size || 0
      });
      
      let buffer = null;
      if (img.buffer) {
        buffer = Buffer.from(img.buffer);
      } else if (img.base64 && img.base64.length > 0) {
        buffer = Buffer.from(img.base64, 'base64');
      }
      
      if (!buffer || buffer.length === 0) {
        console.error(`[Diary] No valid image data for image ${i + 1}, skipping`);
        continue;
      }
      
      fs.writeFileSync(filePath, buffer);
      console.log(` [Diary] Image saved: ${filePath} (${buffer.length} bytes)`);
   
      db.run('INSERT INTO diary_images (id, diary_entry_id, file_path, file_name, file_size) VALUES (?, ?, ?, ?, ?)', [
        uuidv4(), id, filePath, img.originalName || img.name || filename,
        img.size || buffer.length
      ]);
    }
  }

  const imgCountStmt = db.prepare('SELECT COUNT(*) as count FROM diary_images WHERE diary_entry_id = ?');
  imgCountStmt.bind([id]);
  const imgCount = imgCountStmt.step() ? imgCountStmt.getAsObject().count : 0;
  imgCountStmt.free();
  
  console.log(`[Diary] Entry saved successfully. ID: ${id}, Images saved: ${imgCount}`);

  return { success: true, entryId: id };
}
