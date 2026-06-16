import { getDatabase } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { app, BrowserWindow } from 'electron';
import { logAudit } from './case-manager.js';
const DOCUMENT_RULES = {
  Theft:            ['FIR', 'CHARGESHEET', 'SEIZURE_RECEIPT', 'PANCHNAMA', 'FACE_ID'],
  Murder:           ['FIR', 'CHARGESHEET', 'MEDICAL_LETTER', 'REMAND_LETTER', 'SEIZURE_RECEIPT', 'COURT_CUSTODY', 'PANCHNAMA', 'FACE_ID'],
  Assault:          ['FIR', 'CHARGESHEET', 'MEDICAL_LETTER', 'PANCHNAMA', 'FACE_ID'],
  Robbery:          ['FIR', 'CHARGESHEET', 'SEIZURE_RECEIPT', 'PANCHNAMA', 'FACE_ID', 'REMAND_LETTER', 'COURT_CUSTODY'],
  Rape:             ['FIR', 'CHARGESHEET', 'MEDICAL_LETTER', 'REMAND_LETTER', 'COURT_CUSTODY', 'PANCHNAMA', 'FACE_ID'],
  Fraud:            ['FIR', 'CHARGESHEET', 'SEIZURE_RECEIPT', 'PANCHNAMA'],
  Kidnapping:       ['FIR', 'CHARGESHEET', 'REMAND_LETTER', 'COURT_CUSTODY', 'PANCHNAMA', 'FACE_ID'],
  'Domestic Violence': ['FIR', 'CHARGESHEET', 'MEDICAL_LETTER', 'PANCHNAMA'],
  'Cyber Crime':    ['FIR', 'CHARGESHEET', 'SEIZURE_RECEIPT', 'PANCHNAMA'],
  Dowry:            ['FIR', 'CHARGESHEET', 'MEDICAL_LETTER', 'REMAND_LETTER', 'COURT_CUSTODY', 'PANCHNAMA'],
  Other:            ['FIR', 'CHARGESHEET', 'PANCHNAMA', 'FACE_ID'],
};

const DOCUMENT_NAMES = {
  FIR:            'First Information Report',
  CHARGESHEET:    'Purvani Chargesheet',
  MEDICAL_LETTER: 'Medical Treatment Letter',
  REMAND_LETTER:  'Remand Request Letter',
  SEIZURE_RECEIPT:'Seizure Receipt',
  COURT_CUSTODY:  'Court Custody Letter',
  PANCHNAMA:      'Accused Panchanama',
  FACE_ID:        'Face Identification Form',
};

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

const today     = () => new Date().toLocaleDateString('en-IN');
const nowTime   = () => new Date().toLocaleTimeString('en-IN');
const thisYear  = () => new Date().getFullYear().toString();
const STATION   = 'CrimeGPT Police Station, Ahmedabad';
const COURT     = 'The Honourable Judicial Magistrate First Class, Ahmedabad';
const JAIL      = 'Sabarmati Central Jail, Ahmedabad';
const HOSPITAL  = 'Civil Hospital, Ahmedabad';
const DOCTOR    = 'The Medical Officer, Civil Hospital, Ahmedabad';

// ─────────────────────────────────────────────────────────────
//  DATA MAPPER
//  Input:  caseData from getFullCase() — all JSON fields already parsed
//  Output: a single flat+nested object that satisfies ALL 7 template renderers
// ─────────────────────────────────────────────────────────────

function mapCaseDataToTemplate(caseData) {
  // ── Raw arrays from DB ──
  const complainant  = caseData.complainant   || {};
  const accusedList  = Array.isArray(caseData.accused)      ? caseData.accused      : [];
  const witnessList  = Array.isArray(caseData.witnesses)    ? caseData.witnesses    : [];
  const seizedList   = Array.isArray(caseData.seized_items) ? caseData.seized_items : [];
  const sectionsList = Array.isArray(caseData.applied_sections) ? caseData.applied_sections : [];
  const firstAccused = accusedList[0] || {};

  // ── Sections string (used by remand, custody, panchnama, face_id, seizure) ──
  const sectionsText = sectionsList.map(s => {
    if (typeof s === 'string') return s;
    const law = s.law || s.law_code || 'BNS';
    const sec = s.section || s.section_number || '';
    const ttl = s.title || s.section_title || '';
    return `${law} Section ${sec}${ttl ? ' - ' + ttl : ''}`;
  }).join(', ');

  // ── Normalise accused list (FIR uses full_name, chargesheet uses name — provide both) ──
  const accusedMapped = accusedList.map(a => ({
    full_name:            a.full_name || a.name || '',
    name:                 a.full_name || a.name || '',
    alias:                a.alias || '',
    father_name:          a.father_name || a.fatherName || '',
    age:                  a.age || '',
    gender:               a.gender || '',
    address:              a.address || '',
    physical_description: a.physical_description || a.physicalDescription || '',
    occupation:           a.occupation || '',
    mobile_number:        a.phone || a.mobile_number || '',
    phone:                a.phone || a.mobile_number || '',
    custody_status:       a.custody_status || 'In Police Custody',
    bail_status:          a.bail_status || 'Not Applied',
    arrest_date:          today(),
  }));

  // ── Single-accused object for docs that need a flat accused (remand, custody, panchnama, face_id) ──
  const accusedSingle = {
    name:                 firstAccused.full_name || firstAccused.name || '',
    full_name:            firstAccused.full_name || firstAccused.name || '',
    alias:                firstAccused.alias || '',
    father_name:          firstAccused.father_name || firstAccused.fatherName || '',
    age:                  firstAccused.age || '',
    gender:               firstAccused.gender || '',
    address:              firstAccused.address || '',
    physical_description: firstAccused.physical_description || firstAccused.physicalDescription || '',
    occupation:           firstAccused.occupation || '',
    mobile_number:        firstAccused.phone || firstAccused.mobile_number || '',
    phone:                firstAccused.phone || firstAccused.mobile_number || '',
    arrest_date:          today(),
    custody_status:       firstAccused.custody_status || 'In Police Custody',
    bail_status:          firstAccused.bail_status || 'Not Applied',
  };

  // ── Witnesses ──
  const witnessesMapped = witnessList.map(w => ({
    full_name: w.full_name || w.name || '',
    name:      w.full_name || w.name || '',
    phone:     w.phone || '',
    statement: w.statement || '',
    address:   w.address || '',
  }));

  // ── Seized items ──
  const seizedMapped = seizedList.map(item => ({
    item_name:   item.item_name || item.item || item.name || '',
    item:        item.item_name || item.item || item.name || '',
    name:        item.item_name || item.item || item.name || '',
    description: item.description || '',
    quantity:    item.quantity || item.qty || '1',
    qty:         item.quantity || item.qty || '1',
    seized_from: item.seized_from || item.seizedFrom || '',
    seizedFrom:  item.seized_from || item.seizedFrom || '',
  }));

  // ── Officer ──
  const officerName  = caseData.officer_name  || '';
  const officerRank  = caseData.officer_rank  || 'Investigating Officer';
  const officerBadge = caseData.officer_badge || '';

  return {
    // ── Core case fields (FIR template reads these at top level) ──
    fir_number:        caseData.fir_number || '',
    fir_year:          thisYear(),
    fir_date:          caseData.incident_date || '',
    case_type:         caseData.case_type || 'Other',
    incident_date:     caseData.incident_date || '',
    incident_time:     caseData.incident_time || '',
    incident_location: caseData.incident_location || '',
    incident_district: caseData.incident_district || 'Ahmedabad',
    incident_state:    caseData.incident_state || 'Gujarat',
    description:       caseData.description || '',
    description_lang:  caseData.description_lang || 'en',
    status:            caseData.status || 'ACTIVE',

    // Officer (flat — for FIR)
    officer_name:  officerName,
    officer_rank:  officerRank,
    officer_badge: officerBadge,

    // Station (flat — for FIR)
    police_station: STATION,
    district:       caseData.incident_district || 'Ahmedabad',
    state:          caseData.incident_state || 'Gujarat',

    // Registration timestamps
    registration_date: today(),
    registration_time: nowTime(),

    // Sections (array — for FIR / chargesheet)
    sections_applied: sectionsList,

    // ── Complainant ──
    // FIR renderer reads complainant.full_name, complainant.phone, etc.
    complainant: {
      full_name:      complainant.full_name || '',
      name:           complainant.full_name || '',
      father_name:    complainant.father_name || complainant.fatherName || '',
      address:        complainant.address || '',
      phone:          complainant.phone || '',
      id_proof_type:  complainant.id_proof_type  || complainant.idProofType  || '',
      id_proof_number:complainant.id_proof_number|| complainant.idProofNumber|| '',
      age:            complainant.age || '',
      gender:         complainant.gender || '',
    },

    // ── Accused ──
    // FIR + chargesheet iterate this as an ARRAY
    // remand / custody / panchnama / face_id receive accusedSingle instead (see generateDocumentForCase)
    accused: accusedMapped.length > 0 ? accusedMapped : [{
      full_name: '', name: '', alias: '', father_name: '',
      age: '', gender: '', address: '', physical_description: '',
      occupation: '', mobile_number: '', phone: '',
      custody_status: 'In Police Custody', bail_status: 'Not Applied',
      arrest_date: today(),
    }],

    // Single accused object (used internally by generateDocumentForCase for 4 doc types)
    _accusedSingle: accusedSingle,

    // ── Witnesses ──
    witnesses: witnessesMapped,

    // ── Seized items ──
    seized_items: seizedMapped,

    // ── FIR nested block (remand / custody / seizure / panchnama / face_id use data.fir) ──
    fir: {
      fir_number:    caseData.fir_number || '',
      fir_year:      thisYear(),
      sections:      sectionsText,
      police_station:STATION,
      fir_date:      caseData.incident_date || '',
      date:          caseData.incident_date || '',
    },

    // ── Panchnama date/time/place ──
    panchnama: {
      date:  today(),
      time:  nowTime(),
      place: caseData.incident_location || '',
    },

    // ── Identification marks (from first accused, used by panchnama & face_id) ──
    identification_marks: {
      mark_1: firstAccused.identification_mark_1 || firstAccused.mark1 || '',
      mark_2: firstAccused.identification_mark_2 || firstAccused.mark2 || '',
      mark_3: firstAccused.identification_mark_3 || firstAccused.mark3 || '',
    },

    // ── Clothes worn (panchnama) ──
    clothes_worn: {
      upper_wear: firstAccused.clothes_upper || firstAccused.upperWear || '',
      lower_wear: firstAccused.clothes_lower || firstAccused.lowerWear || '',
      footwear:   firstAccused.footwear || '',
    },

    // ── Articles found on personal search (panchnama) ──
    articles_found: {
      article_1: firstAccused.article_1 || firstAccused.article1 || '',
      article_2: firstAccused.article_2 || firstAccused.article2 || '',
      article_3: firstAccused.article_3 || firstAccused.article3 || '',
      article_4: firstAccused.article_4 || firstAccused.article4 || '',
    },

    // ── Panch witnesses — first 2 case witnesses fill these slots ──
    panch_witnesses: [
      { name: witnessesMapped[0]?.name || '', address: witnessesMapped[0]?.address || '' },
      { name: witnessesMapped[1]?.name || '', address: witnessesMapped[1]?.address || '' },
    ],

    // ── Investigating officer (nested — used by all 7 renderers) ──
    investigating_officer: {
      name:          officerName,
      rank:          officerRank,
      badge_number:  officerBadge,
      police_station:STATION,
    },

    // ── Court (chargesheet) ──
    court_details: {
      court_name:      COURT,
      district:        caseData.incident_district || 'Ahmedabad',
      case_number:     caseData.fir_number || '',
      submission_date: today(),
      place:           'Ahmedabad',
      court_order_date:today(),
    },

    // ── Court (remand letter reads data.court) ──
    court: {
      court_name: COURT,
      district:   caseData.incident_district || 'Ahmedabad',
    },

    // ── Police station block (chargesheet) ──
    police_station_details: {
      police_station: STATION,
      fir_number:     caseData.fir_number || '',
      fir_year:       thisYear(),
    },

    // ── Offence block (chargesheet) ──
    offence_details: {
      sections_applied:   sectionsList,
      crime_type:         caseData.case_type || 'Other',
      date_of_occurrence: caseData.incident_date || '',
      place_of_occurrence:caseData.incident_location || '',
      brief_facts:        caseData.description || '',
    },

    // ── Investigation block (chargesheet + remand) ──
    investigation_details: {
      investigating_officer:           `${officerRank} ${officerName}`.trim(),
      date_of_arrest:                  today(),
      date_of_charge_sheet:            today(),
      case_diary_reference:            '',
      final_opinion:                   'Sufficient evidence found to prosecute the accused. Charge sheet is being filed for judicial determination.',
      pending_recovery:                '',
      pending_weapon_recovery:         '',
      pending_co_accused_identification:'',
      pending_digital_evidence:        '',
      additional_interrogation_reason: '',
    },

    // ── Remand block ──
    remand: {
      requested_days: '14',
      grounds:        '',
    },

    // ── Custody block (custody letter) ──
    custody: {
      custody_type:   'Judicial Custody',
      custody_period: '14 Days',
      jail_name:      JAIL,
    },

    // ── Escort officer (custody letter) ──
    escort_officer: {
      name: officerName,
      rank: officerRank,
    },

    // ── FIR details block (custody letter reads data.fir_details) ──
    fir_details: {
      fir_number:    caseData.fir_number || '',
      fir_year:      thisYear(),
      police_station:STATION,
      sections:      sectionsText,
    },

    // ── Seizure block (seizure receipt) ──
    seizure: {
      date:     today(),
      time:     nowTime(),
      location: caseData.incident_location || '',
    },

    // ── Seal & muddamal (seizure receipt) ──
    seal: {
      number:      `SEAL-${caseData.fir_number || '001'}`,
      description: `Official seal of Investigating Officer, ${STATION}`,
    },
    muddamal: {
      entry_number: `MD-${caseData.fir_number || '001'}`,
    },

    // ── Property (seizure receipt) ──
    property: {
      recovered_from:   accusedSingle.name || 'Unknown',
      recovery_location:caseData.incident_location || '',
      property_seized:  seizedMapped.map(i => i.item_name),
      property_value:   '',
      property_status:  'In Police Custody',
    },

    // ── Victim (medical letter — treated as complainant) ──
    victim: {
      name:   complainant.full_name || '',
      age:    complainant.age    || '',
      gender: complainant.gender || '',
      address:complainant.address|| '',
    },

    // ── Incident (medical letter) ──
    incident: {
      date:              caseData.incident_date     || '',
      time:              caseData.incident_time     || '',
      place:             caseData.incident_location || '',
      brief_description: caseData.description       || '',
    },

    // ── Injuries (medical letter — blank, officer fills manually) ──
    injuries: {
      visible_injuries:    '',
      weapon_used:         '',
      condition_of_victim: '',
    },

    // ── Hospital (medical letter) ──
    hospital: {
      hospital_name: HOSPITAL,
      doctor_name:   DOCTOR,
    },

    // ── Medical request flags ──
    request: {
      medical_examination: true,
      injury_certificate:  true,
      mlc_report:          true,
    },

    // ── Physical description (face_id) ──
    physical: {
      height:           firstAccused.height           || '',
      build:            firstAccused.build            || '',
      complexion:       firstAccused.complexion       || '',
      hair_description: firstAccused.hair_description || '',
      eye_description:  firstAccused.eye_description  || '',
      beard_moustache:  firstAccused.beard_moustache  || '',
    },

    // ── Arrest block (face_id) ──
    arrest: {
      date:     today(),
      time:     nowTime(),
      location: caseData.incident_location || '',
    },

    // ── Certification (chargesheet footer) ──
    certification: {
      officer_name:  officerName,
      rank:          officerRank,
      police_station:STATION,
      signature:     '',
      seal:          STATION,
    },

    // ── Evidence placeholder (chargesheet) ──
    evidence: {
      documents:       [],
      images:          [],
      forensic_reports:[],
      medical_reports: [],
    },

    // ── Court status (chargesheet) ──
    court_status: {
      accused_in_custody:   true,
      released_on_bail:     false,
      bail_bond_details:    '',
      inquest_report_number:'',
    },

    // ── Misc ──
    appendices:    [],
    subject:       'Application for Police Custody Remand',
    document_type: '',
  };
}

// ─────────────────────────────────────────────────────────────
//  PUBLIC API — QUERIES
// ─────────────────────────────────────────────────────────────

export function getRequiredDocuments(caseType) {
  const docs = DOCUMENT_RULES[caseType] || DOCUMENT_RULES['Other'];
  return docs.map(key => ({ key, name: DOCUMENT_NAMES[key], required: true }));
}

export function getGeneratedDocuments(caseId) {
  const db   = getDatabase();
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
  db.run(
    'INSERT INTO documents (id, case_id, doc_type, doc_name, doc_path, doc_format) VALUES (?, ?, ?, ?, ?, ?)',
    [id, caseId, docType, docName, docPath, 'pdf']
  );
  return { success: true, docId: id };
}

export function getDocumentsForCase(caseId) {
  const db   = getDatabase();
  const stmt = db.prepare('SELECT case_type FROM cases WHERE id = ?');
  stmt.bind([caseId]);
  const caseRow = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();

  if (!caseRow) return [];

  const requiredDocs  = getRequiredDocuments(caseRow.case_type);
  const generatedDocs = getGeneratedDocuments(caseId);
   
  return requiredDocs.map(doc => {
    const generated = generatedDocs.find(g => g.doc_type === doc.key);
    return { ...doc, generated: !!generated, path: generated?.doc_path || null, date: generated?.created_at || null };
  });
 
}

// ─────────────────────────────────────────────────────────────
//  PDF GENERATION
// ─────────────────────────────────────────────────────────────

export async function generateAndSavePDF(html, filename) {
  return new Promise((resolve) => {
    const win = new BrowserWindow({
      width: 800, height: 1000, show: false,
      webPreferences: { nodeIntegration: false },
    });

    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    win.webContents.on('did-finish-load', async () => {
      try {
        const downloadsPath = app.getPath('downloads');
        const pdfPath       = path.join(downloadsPath, filename);
        const data          = await win.webContents.printToPDF({ printBackground: true, preferCSSPageSize: true });
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
  const templateData = mapCaseDataToTemplate(caseData);
  const docName      = DOCUMENT_NAMES[docKey] || docKey;
  let   html         = '';

  // Spread that passes _accusedSingle as `accused` for single-accused renderers
  const singleAccusedData = { ...templateData, accused: templateData._accusedSingle };

  try {
    switch (docKey) {

      case 'FIR': {
        const { renderFIR } = await import('../../electron/doc/FIR.js');
        // FIR renderer iterates accused array — pass templateData as-is
        html = renderFIR(templateData);
        break;
      }

      case 'CHARGESHEET': {
        const { renderChargesheet } = await import('../../electron/doc/chargeSheet.js');
        // Chargesheet iterates accused array — pass templateData as-is
        html = renderChargesheet(templateData);
        break;
      }

      case 'MEDICAL_LETTER': {
        const { renderMedicalLetter } = await import('../../electron/doc/medicalLetter.js');
        html = renderMedicalLetter(templateData);
        break;
      }

      case 'REMAND_LETTER': {
        const { renderRemandLetter } = await import('../../electron/doc/remandLetter.js');
        // renderRemandLetter does Object.assign(d.accused, data.accused) — needs plain object
        html = renderRemandLetter(singleAccusedData);
        break;
      }

      case 'SEIZURE_RECEIPT': {
        const { renderSeizurePanchanama } = await import('../../electron/doc/seizureLetter.js');
        // Seizure renderer iterates seized_items array — templateData is fine
        html = renderSeizurePanchanama(templateData);
        break;
      }

      case 'COURT_CUSTODY': {
        const { renderCustodyLetter } = await import('../../electron/doc/custodyLetter.js');
        // renderCustodyLetter does Object.assign(d.accused, data.accused) — needs plain object
        html = renderCustodyLetter(singleAccusedData);
        break;
      }

      case 'PANCHNAMA': {
        const { renderAccusedPanchanama } = await import('../../electron/doc/accusedPunchnama.js');
        // renderAccusedPanchanama does Object.assign(d.accused, data.accused) — needs plain object
        html = renderAccusedPanchanama(singleAccusedData);
        break;
      }

       case 'FACE_ID': {
  const { renderFaceIDForm } = await import('../../electron/doc/face_id.js');
  console.log('[FaceID] caseData._accusedPhoto exists?', !!caseData._accusedPhoto);
  console.log('[FaceID] caseData._accusedPhoto length:', caseData._accusedPhoto?.length || 0);
  
  const dataWithPhoto = { 
    ...singleAccusedData, 
    photo_path: caseData._accusedPhoto || '' 
  };
  
  console.log('[FaceID] dataWithPhoto.photo_path length:', dataWithPhoto.photo_path?.length || 0);
  
  html = renderFaceIDForm(dataWithPhoto);
  break;
}

      default:
        return { success: false, error: `Unknown document type: ${docKey}` };
    }

    if (!html) return { success: false, error: 'Renderer returned empty HTML' };

    const filename = `${docName.replace(/\s/g, '_')}_${caseData.fir_number || 'Doc'}.pdf`;
    const result   = await generateAndSavePDF(html, filename);

     if (result.success) {
      saveDocumentRecord(caseId, docKey, docName, result.path);
      logAudit(caseId, 'DOCUMENT_GENERATED', docName, caseData.officer_name);
    }
    return result;

  } catch (err) {
    console.error(`[DocGen] Error generating ${docKey}:`, err);
    return { success: false, error: err.message };
  }
}