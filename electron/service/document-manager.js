import { getDatabase } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { app, BrowserWindow } from 'electron';

const DOCUMENT_RULES = {
  Theft: ['FIR', 'CHARGESHEET', 'SEIZURE_RECEIPT', 'PANCHNAMA', 'FACE_ID'],
  Murder: ['FIR', 'CHARGESHEET', 'MEDICAL_LETTER', 'REMAND_LETTER', 'SEIZURE_RECEIPT', 'COURT_CUSTODY', 'PANCHNAMA', 'FACE_ID'],
  Assault: ['FIR', 'CHARGESHEET', 'MEDICAL_LETTER', 'PANCHNAMA', 'FACE_ID'],
  Robbery: ['FIR', 'CHARGESHEET', 'SEIZURE_RECEIPT', 'PANCHNAMA', 'FACE_ID', 'REMAND_LETTER', 'COURT_CUSTODY'],
  Rape: ['FIR', 'CHARGESHEET', 'MEDICAL_LETTER', 'REMAND_LETTER', 'COURT_CUSTODY', 'PANCHNAMA', 'FACE_ID'],
  Fraud: ['FIR', 'CHARGESHEET', 'SEIZURE_RECEIPT', 'PANCHNAMA'],
  Kidnapping: ['FIR', 'CHARGESHEET', 'REMAND_LETTER', 'COURT_CUSTODY', 'PANCHNAMA', 'FACE_ID'],
  'Domestic Violence': ['FIR', 'CHARGESHEET', 'MEDICAL_LETTER', 'PANCHNAMA'],
  'Cyber Crime': ['FIR', 'CHARGESHEET', 'SEIZURE_RECEIPT', 'PANCHNAMA'],
  Dowry: ['FIR', 'CHARGESHEET', 'MEDICAL_LETTER', 'REMAND_LETTER', 'COURT_CUSTODY', 'PANCHNAMA'],
  Other: ['FIR', 'CHARGESHEET', 'PANCHNAMA', 'FACE_ID'],
};

const DOCUMENT_NAMES = {
  FIR: 'First Information Report',
  CHARGESHEET: 'Purvani Chargesheet',
  MEDICAL_LETTER: 'Medical Treatment Letter',
  REMAND_LETTER: 'Remand Request Letter',
  SEIZURE_RECEIPT: 'Seizure Receipt',
  COURT_CUSTODY: 'Court Custody Letter',
  PANCHNAMA: 'Accused Panchanama',
  FACE_ID: 'Face Identification Form',
};

export function getRequiredDocuments(caseType) {
  const docs = DOCUMENT_RULES[caseType] || DOCUMENT_RULES['Other'];
  return docs.map(key => ({ key, name: DOCUMENT_NAMES[key], required: true }));
}

export function getGeneratedDocuments(caseId) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM documents WHERE case_id = ? ORDER BY created_at DESC');
  stmt.bind([caseId]);
  const docs = [];
  while (stmt.step()) docs.push(stmt.getAsObject());
  stmt.free();
  return docs;
}

export function saveDocumentRecord(caseId, docType, docName, docPath) {
  const db = getDatabase();
  const id = uuidv4();
  db.run('INSERT INTO documents (id, case_id, doc_type, doc_name, doc_path, doc_format) VALUES (?, ?, ?, ?, ?, ?)', [
    id, caseId, docType, docName, docPath, 'pdf'
  ]);
  return { success: true, docId: id };
}

export function getDocumentsForCase(caseId) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT case_type FROM cases WHERE id = ?');
  stmt.bind([caseId]);
  const caseData = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  
  if (!caseData) return [];

  const requiredDocs = getRequiredDocuments(caseData.case_type);
  const generatedDocs = getGeneratedDocuments(caseId);

  return requiredDocs.map(doc => {
    const generated = generatedDocs.find(g => g.doc_type === doc.key);
    return { ...doc, generated: !!generated, path: generated?.doc_path || null, date: generated?.created_at || null };
  });
}

export async function generateAndSavePDF(html, filename) {
  return new Promise((resolve) => {
    const win = new BrowserWindow({ width: 800, height: 1000, show: false, webPreferences: { nodeIntegration: false } });
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    
    win.webContents.on('did-finish-load', async () => {
      try {
        const downloadsPath = app.getPath('downloads');
        const pdfPath = path.join(downloadsPath, filename);
        const data = await win.webContents.printToPDF({ printBackground: true, preferCSSPageSize: true });
        fs.writeFileSync(pdfPath, data);
        win.close();
        resolve({ success: true, path: pdfPath });
      } catch (err) {
        win.close();
        resolve({ success: false, error: err.message });
      }
    });
  });
}

export async function generateDocumentForCase(caseId, docKey, caseData) {
  let html = '';
  const docName = DOCUMENT_NAMES[docKey] || docKey;

  try {
    if (docKey === 'FIR') {
      const { renderFIR } = await import('../../electron/doc/FIR.js');
      html = renderFIR(caseData);
    } else if (docKey === 'CHARGESHEET') {
      const { renderChargesheet } = await import('../../electron/doc/chargeSheet.js');
      html = renderChargesheet(caseData);
    } else if (docKey === 'MEDICAL_LETTER') {
      const { renderMedicalLetter } = await import('../../electron/doc/medicalLetter.js');
      html = renderMedicalLetter(caseData);
    } else if (docKey === 'REMAND_LETTER') {
      const { renderRemandLetter } = await import('../../electron/doc/remandLetter.js');
      html = renderRemandLetter(caseData);
    } else if (docKey === 'SEIZURE_RECEIPT') {
      const { renderSeizurePanchanama } = await import('../../electron/doc/seizureLetter.js');
      html = renderSeizurePanchanama(caseData);
    } else if (docKey === 'COURT_CUSTODY') {
      const { renderCustodyLetter } = await import('../../electron/doc/custodyLetter.js');
      html = renderCustodyLetter(caseData);
    } else if (docKey === 'PANCHNAMA') {
      const { renderAccusedPanchanama } = await import('../../electron/doc/accusedPunchnama.js');
      html = renderAccusedPanchanama(caseData);
    } else if (docKey === 'FACE_ID') {
      const { renderFaceIDForm } = await import('../../electron/doc/face_id.js');
      html = renderFaceIDForm(caseData);
    }

    if (!html) return { success: false, error: 'Unknown document type' };

    const filename = `${docName.replace(/\s/g, '_')}_${caseData.fir_number}.pdf`;
    const result = await generateAndSavePDF(html, filename);

    if (result.success) {
      saveDocumentRecord(caseId, docKey, docName, result.path);
    }

    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
}