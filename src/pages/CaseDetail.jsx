// src/pages/CaseDetail.jsx
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, FileText, Download, Eye, Calendar, Camera, Upload, MapPin, User, Shield, Check, Loader2, Plus, X, Clock, Printer, Image, Trash2, Send, Phone } from 'lucide-react';import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import AuditTrail from './AuditTrail.jsx';
const EVENT_TYPES = [
  { value: 'FIR_REGISTERED', label: 'FIR Registered' },
  { value: 'INVESTIGATION_STARTED', label: 'Investigation Started' },
  { value: 'WITNESS_INTERVIEW', label: 'Witness Interview' },
  { value: 'EVIDENCE_SEIZED', label: 'Evidence Seized' },
  { value: 'ARREST_MADE', label: 'Arrest Made' },
  { value: 'REMAND_REQUESTED', label: 'Remand Requested' },
  { value: 'CHARGE_SHEET_FILED', label: 'Charge Sheet Filed' },
  { value: 'COURT_HEARING', label: 'Court Hearing' },
  { value: 'CASE_CLOSED', label: 'Case Closed' },
  { value: 'GENERAL_NOTE', label: 'General Note' },
];

const EVENT_COLORS = {
  FIR_REGISTERED: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400', border: 'border-red-200' },
  ARREST_MADE: { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500', border: 'border-orange-200' },
  CHARGE_SHEET_FILED: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', border: 'border-blue-200' },
  CASE_CLOSED: { bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500', border: 'border-green-200' },
  EVIDENCE_SEIZED: { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500', border: 'border-purple-200' },
  WITNESS_INTERVIEW: { bg: 'bg-cyan-50', text: 'text-cyan-600', dot: 'bg-cyan-500', border: 'border-cyan-200' },
  COURT_HEARING: { bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-500', border: 'border-indigo-200' },
  INVESTIGATION_STARTED: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', border: 'border-amber-200' },
  REMAND_REQUESTED: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500', border: 'border-rose-200' },
  GENERAL_NOTE: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400', border: 'border-gray-200' },
};

export default function CaseDetail({ onNavigate, caseId }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [caseData, setCaseData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showDiaryForm, setShowDiaryForm] = useState(false);
  const [savingDiary, setSavingDiary] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const [diaryImages, setDiaryImages] = useState([]); 
  const [lersPlatform, setLersPlatform] = useState('WhatsApp');
const [lersTarget, setLersTarget] = useState('');
const [lersSending, setLersSending] = useState(false);
  const [newDiaryEntry, setNewDiaryEntry] = useState({
    event_type: 'INVESTIGATION_STARTED',
    title: '',
    description: '',
    entry_date: new Date().toISOString().split('T')[0],
    entry_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    location: '',
  });
const [showFaceIDModal, setShowFaceIDModal] = useState(false);
const [faceIDDocKey, setFaceIDDocKey] = useState(null);
const [accusedPhoto, setAccusedPhoto] = useState(null);
const [cameraStream, setCameraStream] = useState(null);
const videoRef = useRef(null);
const canvasRef = useRef(null);
const [faceIDForm, setFaceIDForm] = useState({
  name: '', fatherName: '', age: '', gender: '', occupation: '',
  address: '', phone: '', height: '', build: '', complexion: '',
  hair: '', eyes: '', beard: '', mark1: '', mark2: '', mark3: '',
});
  useEffect(() => { loadCaseData(); }, [caseId]);

  useEffect(() => {
    const cleanup = window.crimeGPT?.onDownloadComplete?.((data) => {
      addNotification('success', 'Download Complete', `${data.filename} saved to Downloads`);
    });
    return () => { if (typeof cleanup === 'function') cleanup(); };
  }, []);

  const addNotification = (type, title, message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  const loadCaseData = async () => {
    setLoading(true);
    try {
      const data = await window.crimeGPT.getFullCase(caseId);
      setCaseData(data);
      const docs = await window.crimeGPT.getDocsForCase(caseId);
      setDocuments(docs || []);
    } catch (err) { console.error('Load failed:', err); }
    setLoading(false);
  };

  const handleDiaryImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newImages = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file),
    }));

    setDiaryImages(prev => [...prev, ...newImages]);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeDiaryImage = (id) => {
    setDiaryImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img?.preview) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  };

  // ─── READ FILES AS BASE64 ───
  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Strip the data URL prefix to get pure base64
        const base64 = reader.result.split(',')[1];
        resolve({
          originalName: file.name,
          size: file.size,
          base64: base64,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAddDiaryEntry = async () => {
    if (!newDiaryEntry.title.trim()) return;
    setSavingDiary(true);
    try {
      // Convert images to base64
      const imageData = await Promise.all(
        diaryImages.map(img => readFileAsBase64(img.file))
      );

      await window.crimeGPT.addDiaryEntry({
        case_id: caseId,
        ...newDiaryEntry,
        officer_name: user?.fullName || 'Unknown',
        images: imageData,
      });

      // Clean up previews
      diaryImages.forEach(img => { if (img.preview) URL.revokeObjectURL(img.preview); });
      
      setShowDiaryForm(false);
      setDiaryImages([]);
      setNewDiaryEntry({
        event_type: 'INVESTIGATION_STARTED', title: '', description: '',
        entry_date: new Date().toISOString().split('T')[0],
        entry_time: new Date().toTimeString().split(' ')[0].substring(0, 5), location: '',
      });
      addNotification('success', 'Diary Updated', 'New entry added to case timeline');
      await loadCaseData();
    } catch (err) { 
      addNotification('error', 'Failed', 'Could not add diary entry'); 
      console.error(err);
    }
    setSavingDiary(false);
  };

  // ─── OPEN DIARY FORM ───
  const openDiaryForm = () => {
    setDiaryImages([]);
    setNewDiaryEntry({
      event_type: 'INVESTIGATION_STARTED',
      title: '',
      description: '',
      entry_date: new Date().toISOString().split('T')[0],
      entry_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      location: '',
    });
    setShowDiaryForm(true);
  };
const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400, facingMode: 'user' } });
    setCameraStream(stream);
    if (videoRef.current) videoRef.current.srcObject = stream;
  } catch (err) { addNotification('error', 'Camera Error', 'Could not access camera'); }
};

const stopCamera = () => {
  if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); setCameraStream(null); }
};

const capturePhoto = () => {
  if (videoRef.current && canvasRef.current) {
    const c = canvasRef.current;
    c.width = videoRef.current.videoWidth || 400;
    c.height = videoRef.current.videoHeight || 400;
    c.getContext('2d').drawImage(videoRef.current, 0, 0, c.width, c.height);
    setAccusedPhoto(c.toDataURL('image/jpeg', 0.9));
    stopCamera();
  }
};

const handlePhotoUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => setAccusedPhoto(reader.result);
  reader.readAsDataURL(file);
};

const handleGenerateFaceID = (docKey) => {
  const firstAccused = caseData.accused?.[0] || {};
  setFaceIDDocKey(docKey);
  // setAccusedPhoto(null);
  stopCamera();
  setFaceIDForm({
    name: firstAccused.full_name || firstAccused.name || '',
    fatherName: firstAccused.father_name || '',
    age: firstAccused.age || '',
    gender: firstAccused.gender || '',
    occupation: firstAccused.occupation || '',
    address: firstAccused.address || '',
    phone: firstAccused.phone || '',
    height: firstAccused.height || '',
    build: firstAccused.build || '',
    complexion: firstAccused.complexion || '',
    hair: firstAccused.hair || '',
    eyes: firstAccused.eyes || '',
    beard: firstAccused.beard || '',
    mark1: firstAccused.mark1 || '',
    mark2: firstAccused.mark2 || '',
    mark3: firstAccused.mark3 || '',
  });
  setShowFaceIDModal(true);
};

const handleGenerateFaceIDDoc = async () => {
  if (!faceIDForm.name.trim()) { addNotification('error', 'Missing', 'Accused name is required'); return; }
  setShowFaceIDModal(false);
  setGenerating(faceIDDocKey);
  try {
    // Update accused in database
    const updatedAccused = [{
      ...caseData.accused?.[0] || {},
      full_name: faceIDForm.name,
      name: faceIDForm.name,
      father_name: faceIDForm.fatherName,
      age: faceIDForm.age,
      gender: faceIDForm.gender,
      occupation: faceIDForm.occupation,
      address: faceIDForm.address,
      phone: faceIDForm.phone,
      height: faceIDForm.height,
      build: faceIDForm.build,
      complexion: faceIDForm.complexion,
      hair_description: faceIDForm.hair,
      eye_description: faceIDForm.eyes,
      beard_moustache: faceIDForm.beard,
      identification_mark_1: faceIDForm.mark1,
      identification_mark_2: faceIDForm.mark2,
      identification_mark_3: faceIDForm.mark3,
    }];

    // Update caseData with new accused info
    const enrichedCaseData = {
      ...caseData,
      _accusedPhoto: accusedPhoto,
      accused: updatedAccused,
    };

    // Generate document with enriched data
    await window.crimeGPT.generateDocument(caseId, faceIDDocKey, enrichedCaseData);
    console.log('📸 Sending to backend - Photo:', accusedPhoto ? 'YES - ' + accusedPhoto.substring(0, 50) : 'NO');
console.log('📸 enrichedCaseData._accusedPhoto:', enrichedCaseData._accusedPhoto ? 'YES' : 'NO');
    // Update accused in database
    await window.crimeGPT.updateCaseAccused(caseId, updatedAccused);
    
    addNotification('success', 'Face ID Generated', 'Document ready & accused details updated');
    await loadCaseData();
  } catch (err) { addNotification('error', 'Failed', 'Please try again'); }
  setGenerating(null);
  stopCamera();
};
const handleGenerate = async (docKey) => {
  if (docKey === 'FACE_ID') { handleGenerateFaceID(docKey); return; }
  setGenerating(docKey);
  try {
    await window.crimeGPT.generateDocument(caseId, docKey, caseData);
    addNotification('success', 'Document Generated', 'Ready');
    await loadCaseData();
  } catch (err) { addNotification('error', 'Generation Failed', 'Please try again'); }
  setGenerating(null);
};
  const handleDownload = (docPath) => {
    if (docPath) {
      window.open(`file://${docPath}`);
      addNotification('success', 'Opening Document', 'Opening in default PDF viewer');
    }
  };
  // Add this right after the EVENT_COLORS object, before export default function
function mapCaseDataForPreview(caseData, user) {
  const complainant = caseData.complainant || {};
  const accused = caseData.accused || [];
  const witnesses = caseData.witnesses || [];
  const seizedItems = caseData.seized_items || [];
  const sections = caseData.applied_sections || [];
  const firstAccused = accused[0] || {};

  const sectionsText = sections.map(s => 
    typeof s === 'object' ? `${s.law || s.law_code || 'BNS'} Section ${s.section || s.section_number}` : s
  ).join(', ');

  // ✅ USE LOGGED-IN USER for officer name
  const officerName = user?.fullName || caseData.officer_name || '';
  const officerRank = caseData.officer_rank || 'Investigating Officer';
  const officerBadge = caseData.officer_badge || '';

  return {
    fir_number: caseData.fir_number || '',
    fir_year: new Date(caseData.incident_date || Date.now()).getFullYear().toString(),
    incident_date: caseData.incident_date || '',
    incident_time: caseData.incident_time || '',
    incident_location: caseData.incident_location || '',
    incident_district: caseData.incident_district || 'Ahmedabad',
    incident_state: caseData.incident_state || 'Gujarat',
    description: caseData.description || '',
    description_lang: caseData.description_lang || 'en',
    case_type: caseData.case_type || 'Other',
    status: caseData.status || 'ACTIVE',
    sections_applied: sections,
    sections_text: sectionsText,
    
    // ✅ OFFICER FROM LOGGED-IN USER
    officer_name: officerName,
    officer_rank: officerRank,
    officer_badge: officerBadge,
    police_station: 'CrimeGPT Police Station, Ahmedabad',
    district: caseData.incident_district || 'Ahmedabad',
    state: caseData.incident_state || 'Gujarat',
    registration_date: new Date().toLocaleDateString('en-IN'),
    registration_time: new Date().toLocaleTimeString('en-IN'),

    complainant: {
      full_name: complainant.full_name || '',
      father_name: complainant.father_name || complainant.fatherName || '',
      address: complainant.address || '',
      phone: complainant.phone || '',
      id_proof_type: complainant.id_proof_type || '',
      id_proof_number: complainant.id_proof_number || '',
      name: complainant.full_name || '',
    },

    accused: accused.map(a => ({
      name: a.full_name || a.name || '',
      full_name: a.full_name || a.name || '',
      alias: a.alias || '',
      father_name: a.father_name || '',
      age: a.age || '',
      gender: a.gender || '',
      address: a.address || '',
      physical_description: a.physical_description || '',
      occupation: a.occupation || '',
      mobile_number: a.phone || a.mobile_number || '',
      custody_status: a.custody_status || 'In Police Custody',
      bail_status: a.bail_status || 'Not Applied',
    })),

    witnesses: witnesses.map(w => ({
      name: w.full_name || w.name || '',
      full_name: w.full_name || w.name || '',
      phone: w.phone || '',
      statement: w.statement || '',
      address: w.address || '',
    })),

    seized_items: seizedItems.map(item => ({
      item: item.item_name || item.item || '',
      item_name: item.item_name || item.item || '',
      description: item.description || '',
      quantity: item.quantity || item.qty || '1',
      qty: item.quantity || item.qty || '1',
      seized_from: item.seized_from || firstAccused.full_name || firstAccused.name || 'Unknown',
      seizedFrom: item.seized_from || firstAccused.full_name || firstAccused.name || 'Unknown',
    })),

    fir: {
      fir_number: caseData.fir_number || '',
      fir_year: new Date(caseData.incident_date || Date.now()).getFullYear().toString(),
      sections: sectionsText,
      police_station: 'CrimeGPT Police Station, Ahmedabad',
    },

    panchnama: {
      date: new Date().toLocaleDateString('en-IN'),
      time: new Date().toLocaleTimeString('en-IN'),
      place: caseData.incident_location || '',
    },

    accused_data: {
      name: firstAccused.full_name || firstAccused.name || '',
      father_name: firstAccused.father_name || '',
      age: firstAccused.age || '',
      occupation: firstAccused.occupation || '',
      address: firstAccused.address || '',
      mobile_number: firstAccused.phone || firstAccused.mobile_number || '',
    },

    identification_marks: {
      mark_1: firstAccused.mark1 || '',
      mark_2: firstAccused.mark2 || '',
    },

    clothes_worn: {
      upper_wear: firstAccused.upperWear || '',
      lower_wear: firstAccused.lowerWear || '',
      footwear: firstAccused.footwear || '',
    },

    articles_found: {
      article_1: firstAccused.article1 || '',
      article_2: firstAccused.article2 || '',
      article_3: firstAccused.article3 || '',
      article_4: firstAccused.article4 || '',
    },

    panch_witnesses: witnesses.slice(0, 2).map(w => ({
      name: w.full_name || w.name || '',
      address: w.address || '',
    })),

    // ✅ OFFICER FROM LOGGED-IN USER
    investigating_officer: {
      name: officerName,
      rank: officerRank,
      badge_number: officerBadge,
      police_station: 'CrimeGPT Police Station, Ahmedabad',
    },

    court_details: {
      court_name: 'The Honourable Judicial Magistrate First Class, Ahmedabad',
      district: caseData.incident_district || 'Ahmedabad',
      case_number: caseData.fir_number || '',
      submission_date: new Date().toLocaleDateString('en-IN'),
      place: 'Ahmedabad',
      court_order_date: new Date().toLocaleDateString('en-IN'),
    },

    court: {
      court_name: 'The Honourable Judicial Magistrate First Class, Ahmedabad',
      district: caseData.incident_district || 'Ahmedabad',
    },

    police_station_details: {
      police_station: 'CrimeGPT Police Station, Ahmedabad',
      fir_number: caseData.fir_number || '',
      fir_year: new Date(caseData.incident_date || Date.now()).getFullYear().toString(),
    },

    // ✅ THESE ARE THE CHARGESHEET FIELDS THAT WERE EMPTY
    offence_details: {
      sections_applied: sections,
      crime_type: caseData.case_type || 'Other',
      date_of_occurrence: caseData.incident_date || '',
      place_of_occurrence: caseData.incident_location || '',
      brief_facts: caseData.description || '',
    },

    investigation_details: {
      investigating_officer: `${officerRank} ${officerName}`,
      date_of_arrest: new Date().toLocaleDateString('en-IN'),
      date_of_charge_sheet: new Date().toLocaleDateString('en-IN'),
      case_diary_reference: '',
      final_opinion: 'Sufficient evidence found to prosecute the accused.',
    },

    custody: {
      custody_type: 'Judicial Custody',
      custody_period: '14 Days',
      jail_name: 'Sabarmati Central Jail, Ahmedabad',
    },

    escort_officer: {
      name: officerName,
      rank: officerRank,
    },

    remand: { requested_days: '14', grounds: '' },

    seizure: {
      date: new Date().toLocaleDateString('en-IN'),
      time: new Date().toLocaleTimeString('en-IN'),
      location: caseData.incident_location || '',
    },

    seal: {
      number: `SEAL-${caseData.fir_number || '001'}`,
      description: 'Official seal of Investigating Officer',
    },

    muddamal: { entry_number: `MD-${caseData.fir_number || '001'}` },

    property: {
      recovered_from: firstAccused.full_name || firstAccused.name || 'Unknown',
      recovery_location: caseData.incident_location || '',
      property_seized: seizedItems.map(i => i.item_name || i.item || ''),
      property_value: '',
      property_status: 'In Police Custody',
    },

    victim: {
      name: complainant.full_name || '',
      age: complainant.age || '',
      gender: complainant.gender || '',
      address: complainant.address || '',
    },

    incident: {
      date: caseData.incident_date || '',
      time: caseData.incident_time || '',
      place: caseData.incident_location || '',
      brief_description: caseData.description || '',
    },

    injuries: { visible_injuries: '', weapon_used: '', condition_of_victim: '' },

    hospital: {
      hospital_name: 'Civil Hospital, Ahmedabad',
      doctor_name: 'The Medical Officer, Civil Hospital, Ahmedabad',
    },

    request: { medical_examination: true, injury_certificate: true, mlc_report: true },

    // ✅ OFFICER FROM LOGGED-IN USER
    certification: {
      officer_name: officerName,
      rank: officerRank,
      police_station: 'CrimeGPT Police Station, Ahmedabad',
      signature: '',
      seal: 'CrimeGPT Police Station, Ahmedabad',
    },

    evidence: { documents: [], images: [], forensic_reports: [], medical_reports: [] },
    court_status: { accused_in_custody: true, released_on_bail: false, bail_bond_details: '', inquest_report_number: '' },
    appendices: [],
    subject: 'Application for Police Custody Remand',
    document_type: '',
  };
}
  const handlePreview = async (docKey, docName) => {
    setPreviewTitle(docName || 'Document');
    const templateData = mapCaseDataForPreview(caseData, user);
    try {
      const { renderFIR } = await import('../../electron/doc/FIR.js');
      const { renderChargesheet } = await import('../../electron/doc/chargeSheet.js');
      const { renderMedicalLetter } = await import('../../electron/doc/medicalLetter.js');
      const { renderRemandLetter } = await import('../../electron/doc/remandLetter.js');
      const { renderSeizurePanchanama } = await import('../../electron/doc/seizureLetter.js');
      const { renderCustodyLetter } = await import('../../electron/doc/custodyLetter.js');
      const { renderAccusedPanchanama } = await import('../../electron/doc/accusedPunchnama.js');
      const { renderFaceIDForm } = await import('../../electron/doc/face_id.js');

      let html = '';
      if (docKey === 'FIR') html = renderFIR(caseData);
      else if (docKey === 'CHARGESHEET') html = renderChargesheet(caseData);
      else if (docKey === 'MEDICAL_LETTER') html = renderMedicalLetter(caseData);
      else if (docKey === 'REMAND_LETTER') html = renderRemandLetter(caseData);
      else if (docKey === 'SEIZURE_RECEIPT') html = renderSeizurePanchanama(caseData);
      else if (docKey === 'COURT_CUSTODY') html = renderCustodyLetter(caseData);
      else if (docKey === 'PANCHNAMA') html = renderAccusedPanchanama(caseData);
      else if (docKey === 'FACE_ID') html = renderFaceIDForm(caseData);
      if (html) setPreviewDoc(html);
    } catch (err) { console.error('Preview failed:', err); }
  };

  const handleDownloadPreview = async () => {
    if (previewDoc && caseData) {
      const filename = `${previewTitle.replace(/\s/g, '_')}_${caseData.fir_number || 'Doc'}.pdf`;
      const result = await window.crimeGPT.saveAsPDF(previewDoc, filename);
      if (result.success) addNotification('success', 'Download Complete', `${filename} saved to Downloads`);
    }
  };

  const handlePrintPreview = () => {
    if (previewDoc) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(previewDoc);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 300);
    }
  };
  // ─── LERS ───
const handleLersSend = async () => {
  const target = lersTarget.trim();
  if (!target) { addNotification('error', 'Missing Info', 'Enter target phone/username'); return; }
  setLersSending(true);
  try {
    const result = await window.crimeGPT.sendLERS({
      caseId, firNumber: caseData.fir_number, platform: lersPlatform,
      targetIdentifier: target, caseType: caseData.case_type,
      officerName: user?.fullName, sections: sections.map(s => `${s.law || 'BNS'} ${s.section}`).join(', '),
    });
    if (result.success) {
      addNotification('success', 'LERS Sent', `Request sent to ${lersPlatform}. ID: ${result.requestId?.slice(0, 8) || 'N/A'}`);
      setLersTarget('');
      await loadCaseData();
    }
  } catch (err) { addNotification('error', 'Failed', 'Could not send LERS request'); }
  setLersSending(false);
};

  if (loading) {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar user={user} activeView="cases" onNavigate={onNavigate} />
        <main className="flex-1 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 40%, #F0FFF4 100%)' }}>
          <div className="text-center"><Loader2 size={40} className="animate-spin text-orange-400 mx-auto mb-4" /><p className="text-gray-500 text-sm">Loading case details...</p></div>
        </main>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar user={user} activeView="cases" onNavigate={onNavigate} />
        <main className="flex-1 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 40%, #F0FFF4 100%)' }}>
          <div className="text-center"><FileText size={48} className="text-gray-200 mx-auto mb-4" /><p className="text-gray-500 font-medium">Case not found</p></div>
        </main>
      </div>
    );
  }

  const complainant = caseData.complainant || {};
  const accused = caseData.accused || [];
  const witnesses = caseData.witnesses || [];
  const evidence = caseData.evidence || [];
  const seizedItems = caseData.seized_items || [];
  const sections = caseData.applied_sections || [];
  const diary = caseData.diary || [];

  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={user} activeView="cases" onNavigate={onNavigate} />
      <main className="flex-1 overflow-auto" style={{ background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 40%, #F0FFF4 100%)' }}>
        
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate('dashboard')} className="p-2 hover:bg-gray-50 rounded-xl transition text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></button>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-800">{caseData.fir_number}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${caseData.status === 'ACTIVE' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-green-50 text-green-600 border-green-200'}`}>{caseData.status}</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">{caseData.case_type}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={12} /> {caseData.incident_date}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={12} /> {caseData.incident_location}</span>
                  <span className="text-xs text-gray-400">Officer: {caseData.officer_name || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
              {['overview','parties','sections','documents','diary','lers', 'audit'].map(tab => (
                <button key={tab} onClick={() => setActiveSection(tab)} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all capitalize ${activeSection === tab ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{tab === 'diary' ? 'Diary & Evidence' : tab === 'lers' ? 'LERS' : tab}</button>
              ))}
            </div>

            {/* OVERVIEW */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Case Information</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div><p className="text-xs text-gray-400">FIR Number</p><p className="text-sm font-semibold text-gray-800">{caseData.fir_number}</p></div>
                    <div><p className="text-xs text-gray-400">Case Type</p><p className="text-sm font-semibold text-gray-800">{caseData.case_type || 'N/A'}</p></div>
                    <div><p className="text-xs text-gray-400">Status</p><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${caseData.status === 'ACTIVE' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>{caseData.status}</span></div>
                    <div><p className="text-xs text-gray-400">Incident Date</p><p className="text-sm text-gray-700">{caseData.incident_date || 'N/A'}</p></div>
                    <div><p className="text-xs text-gray-400">Incident Time</p><p className="text-sm text-gray-700">{caseData.incident_time || 'N/A'}</p></div>
                    <div><p className="text-xs text-gray-400">Language</p><p className="text-sm text-gray-700">{caseData.description_lang === 'hi' ? 'हिन्दी' : caseData.description_lang === 'gu' ? 'ગુજરાતી' : 'English'}</p></div>
                    <div className="col-span-3"><p className="text-xs text-gray-400">Location</p><p className="text-sm text-gray-700">{caseData.incident_location || 'N/A'}</p></div>
                    <div className="col-span-3"><p className="text-xs text-gray-400">Investigating Officer</p><p className="text-sm text-gray-700">{caseData.officer_rank || 'IO'} {caseData.officer_name || 'N/A'} {caseData.officer_badge ? `(${caseData.officer_badge})` : ''}</p></div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Incident Description</h3>
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100"><p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{caseData.description || 'No description provided'}</p></div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <StatBox icon={<User size={18} />} color="orange" value={complainant.full_name ? 1 : 0} label="Complainant" />
                  <StatBox icon={<Shield size={18} />} color="red" value={accused.length} label="Accused" />
                  <StatBox icon={<User size={18} />} color="green" value={witnesses.length} label="Witnesses" />
                  <StatBox icon={<FileText size={18} />} color="purple" value={documents.filter(d => d.generated).length} label="Documents" />
                </div>
              </div>
            )}

            {/* PARTIES */}
            {activeSection === 'parties' && (
              <div className="space-y-4">
                {complainant.full_name ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><User size={18} className="text-orange-500" /> Complainant</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className="text-xs text-gray-400">Full Name</p><p className="text-gray-700 font-medium">{complainant.full_name}</p></div>
                      <div><p className="text-xs text-gray-400">Phone</p><p className="text-gray-700">{complainant.phone || 'N/A'}</p></div>
                      <div className="col-span-2"><p className="text-xs text-gray-400">Address</p><p className="text-gray-700">{complainant.address || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-400">ID Type</p><p className="text-gray-700">{complainant.id_proof_type || 'N/A'}</p></div>
                      <div><p className="text-xs text-gray-400">ID Number</p><p className="text-gray-700">{complainant.id_proof_number || 'N/A'}</p></div>
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={<User size={32} />} text="No complainant details" />
                )}
                {accused.length > 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><Shield size={18} className="text-red-500" /> Accused ({accused.length})</h3>
                    {accused.map((a, i) => (
                      <div key={i} className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-xl p-4 mb-3">
                        <div><p className="text-xs text-gray-400">Name</p><p className="text-gray-700 font-medium">{a.full_name || a.name || 'Unknown'}</p></div>
                        <div><p className="text-xs text-gray-400">Alias</p><p className="text-gray-700">{a.alias || 'N/A'}</p></div>
                        <div><p className="text-xs text-gray-400">Father's Name</p><p className="text-gray-700">{a.father_name || 'N/A'}</p></div>
                        <div><p className="text-xs text-gray-400">Age</p><p className="text-gray-700">{a.age || 'N/A'}</p></div>
                        <div className="col-span-2"><p className="text-xs text-gray-400">Physical Description</p><p className="text-gray-700">{a.physical_description || 'N/A'}</p></div>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState icon={<Shield size={32} />} text="No accused details" />}
                {witnesses.length > 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2"><User size={18} className="text-green-500" /> Witnesses ({witnesses.length})</h3>
                    {witnesses.map((w, i) => (
                      <div key={i} className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-xl p-4 mb-3">
                        <div><p className="text-xs text-gray-400">Name</p><p className="text-gray-700 font-medium">{w.full_name || w.name}</p></div>
                        <div><p className="text-xs text-gray-400">Phone</p><p className="text-gray-700">{w.phone || 'N/A'}</p></div>
                        <div className="col-span-2"><p className="text-xs text-gray-400">Statement</p><p className="text-gray-700">{w.statement || 'N/A'}</p></div>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState icon={<User size={32} />} text="No witnesses recorded" />}
              </div>
            )}

            {/* SECTIONS */}
            {activeSection === 'sections' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Applied Legal Sections ({sections.length})</h3>
                {sections.length > 0 ? (
                  <div className="space-y-3">
                    {sections.map((s, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${(s.law || s.law_code) === 'BNS' ? 'bg-orange-100' : (s.law || s.law_code) === 'BNSS' ? 'bg-blue-100' : 'bg-green-100'}`}>
                            <Shield size={18} className={(s.law || s.law_code) === 'BNS' ? 'text-orange-500' : (s.law || s.law_code) === 'BNSS' ? 'text-blue-500' : 'text-green-500'} />
                          </div>
                          <div><p className="text-sm font-semibold text-gray-800">{s.law || s.law_code} Section {s.section || s.section_number}</p><p className="text-xs text-gray-500">{s.title || s.section_title}</p></div>
                        </div>
                        {(s.confidence || s.confidence_score) && <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">{s.confidence || s.confidence_score}% match</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8"><Shield size={32} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-400 text-sm">No legal sections applied</p></div>
                )}
              </div>
            )}

            {/* DOCUMENTS */}
            {activeSection === 'documents' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Case Documents</h3>
                {documents.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {documents.map((doc, i) => (
                      <div key={i} className={`flex items-center justify-between rounded-xl p-4 border ${doc.generated ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-3">
                          {doc.generated ? <Check size={18} className="text-green-500" /> : <FileText size={18} className="text-gray-300" />}
                          <div><p className="text-sm font-medium text-gray-700">{doc.name}</p><p className="text-xs text-gray-400">{doc.generated ? 'Generated' : 'Ready to generate'}</p></div>
                        </div>
                        <div className="flex items-center gap-1">
                          {doc.generated ? (
                            <><button onClick={() => handleDownload(doc.path)} className="p-2 hover:bg-green-100 rounded-lg transition" title="Download"><Download size={16} className="text-green-500" /></button></>
                          ) : (
                            <button onClick={() => handleGenerate(doc.key)} disabled={generating === doc.key} className="px-3 py-1.5 bg-gradient-to-r from-orange-400 to-green-500 text-white rounded-lg text-xs font-medium hover:from-orange-500 hover:to-green-600 transition disabled:opacity-50 flex items-center gap-1">{generating === doc.key ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}{generating === doc.key ? '...' : 'Generate'}</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8"><FileText size={32} className="text-gray-200 mx-auto mb-3" /><p className="text-gray-400 text-sm">No documents available for this case type</p></div>
                )}
              </div>
            )}

            {/* ============================================ */}
            {/* DIARY & EVIDENCE — COMBINED TIMELINE          */}
            {/* ============================================ */}
            {activeSection === 'diary' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">Case Diary & Evidence Timeline</h3>
                      <p className="text-xs text-gray-400 mt-1">{diary.length} entries • {evidence.length} evidence files • {seizedItems.length} seized items</p>
                    </div>
                    <button onClick={openDiaryForm} className="px-4 py-2 bg-gradient-to-r from-orange-400 to-green-500 text-white rounded-xl text-sm font-medium hover:from-orange-500 hover:to-green-600 transition flex items-center gap-2 shadow-lg shadow-orange-200">
                      <Plus size={16} /> Add Entry
                    </button>
                  </div>

                  {diary.length > 0 || evidence.length > 0 ? (
                    <div className="relative">
                      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-400 via-orange-300 to-green-500 rounded-full" />
                      <div className="space-y-8">
                        
                        {/* === EVIDENCE BLOCK === */}
                        {evidence.length > 0 && (
                          <div className="relative pl-16">
                            <div className="absolute left-6 w-5 h-5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                              <Image size={10} className="text-white" />
                            </div>
                            <div className="bg-gradient-to-br from-purple-50/80 to-white border border-purple-100 rounded-2xl p-5 shadow-sm">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                  <Image size={20} className="text-purple-500" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-800">Evidence Files</h4>
                                  <p className="text-xs text-gray-400">{evidence.length} files attached to this case</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                {evidence.map((img, i) => (
                                  <div key={i} className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer" onClick={() => setViewingImage({ file_path: img.file_path, file_name: img.file_name, file_size: img.file_size })}>
                                    <div className="aspect-video bg-gray-100 overflow-hidden">
                                      <img src={`file://${img.file_path}`} alt={img.file_name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                      <div className="hidden w-full h-full items-center justify-center bg-gray-100"><FileText size={32} className="text-gray-300" /></div>
                                    </div>
                                    <div className="p-3">
                                      <p className="text-xs font-medium text-gray-700 truncate">{img.file_name}</p>
                                      <p className="text-[10px] text-gray-400 mt-0.5">{img.file_size ? `${(img.file_size / 1024).toFixed(1)} KB` : 'Unknown'}</p>
                                    </div>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg"><Eye size={18} className="text-gray-700" /></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {seizedItems.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-purple-100">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center"><Shield size={12} className="text-amber-600" /></div>
                                    <p className="text-xs font-semibold text-gray-700">Seized Items ({seizedItems.length})</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    {seizedItems.map((item, i) => (
                                      <div key={i} className="flex items-center gap-2 bg-amber-50/60 rounded-lg px-3 py-2 border border-amber-100">
                                        <div className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0" />
                                        <div className="min-w-0">
                                          <p className="text-xs font-medium text-gray-700 truncate">{item.item_name || item.item || 'Item'}</p>
                                          <p className="text-[10px] text-gray-400">Qty: {item.quantity || item.qty || '1'} • {item.seized_from || 'Unknown'}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* === DIARY ENTRIES === */}
                        {diary.map((entry, i) => {
                          const colors = EVENT_COLORS[entry.event_type] || EVENT_COLORS.GENERAL_NOTE;
                          const entryImages = entry.images || [];
                          return (
                            <div key={i} className="relative pl-16">
                              <div className={`absolute left-6 w-5 h-5 ${colors.dot} rounded-full border-2 border-white shadow-md flex items-center justify-center`}>
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wide uppercase ${colors.bg} ${colors.text} ${colors.border} border`}>
                                      {(entry.event_type || 'GENERAL_NOTE').replace(/_/g, ' ')}
                                    </span>
                                    {entry.location && (
                                      <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg"><MapPin size={10} /> {entry.location}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <Calendar size={12} /><span>{entry.entry_date}</span>
                                    {entry.entry_time && (<><span className="text-gray-300">•</span><Clock size={12} /><span>{entry.entry_time}</span></>)}
                                  </div>
                                </div>

                                {/* Content */}
                                <h4 className="text-sm font-semibold text-gray-800 mb-1.5">{entry.title}</h4>
                                {entry.description && (
                                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{entry.description}</p>
                                )}

                                {/* DIARY ENTRY IMAGES */}
                                {entryImages.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-gray-100">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Image size={14} className="text-gray-400" />
                                      <span className="text-xs font-medium text-gray-500">{entryImages.length} photo{entryImages.length > 1 ? 's' : ''} attached</span>
                                    </div>
                                    <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
                                      {entryImages.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group cursor-pointer border border-gray-200"
                                          onClick={() => setViewingImage({ file_path: img.file_path, file_name: img.file_name, file_size: img.file_size })}>
                                          <img src={`file://${img.file_path}`} alt={img.file_name} className="w-full h-full object-cover group-hover:scale-105 transition"
                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                          <div className="hidden w-full h-full items-center justify-center bg-gray-200"><Image size={20} className="text-gray-400" /></div>
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <Eye size={16} className="text-white" />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-green-500 rounded-full flex items-center justify-center">
                                      <User size={10} className="text-white" />
                                    </div>
                                    <p className="text-xs text-gray-500">{entry.officer_name || 'Unknown Officer'}</p>
                                  </div>
                                  <span className="text-[10px] text-gray-300">Entry #{diary.length - i}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Empty diary fallback */}
                        {diary.length === 0 && (
                          <div className="relative pl-16">
                            <div className="absolute left-6 w-5 h-5 bg-gray-200 rounded-full border-2 border-white" />
                            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center">
                              <Clock size={32} className="text-gray-300 mx-auto mb-3" />
                              <p className="text-gray-400 text-sm font-medium">No diary entries yet</p>
                              <p className="text-xs text-gray-400 mt-1">Click "Add Entry" to start logging investigation progress</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Clock size={32} className="text-gray-300" /></div>
                      <p className="text-gray-500 font-medium">No diary entries or evidence yet</p>
                      <p className="text-sm text-gray-400 mt-1">Start building the case timeline</p>
                      <button onClick={openDiaryForm} className="mt-4 px-5 py-2.5 bg-gradient-to-r from-orange-400 to-green-500 text-white rounded-xl text-sm font-medium hover:from-orange-500 hover:to-green-600 transition inline-flex items-center gap-2">
                        <Plus size={16} /> Add First Entry
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick stat cards */}
                <div className="grid grid-cols-4 gap-4">
                  <MiniStatCard icon={<Image size={16} />} color="purple" label="Evidence Files" value={evidence.length} subtext={evidence.length > 0 ? `${evidence.filter(e => e.file_type === 'IMAGE').length} images` : 'None'} />
                  <MiniStatCard icon={<Clock size={16} />} color="orange" label="Diary Entries" value={diary.length} subtext={diary.length > 0 ? `Last: ${diary[0]?.entry_date || 'N/A'}` : 'No entries'} />
                  <MiniStatCard icon={<Shield size={16} />} color="amber" label="Seized Items" value={seizedItems.length} subtext="Physical evidence" />
                  <MiniStatCard icon={<User size={16} />} color="green" label="Witnesses" value={witnesses.length} subtext={witnesses.length > 0 ? 'Statements recorded' : 'None yet'} />
                </div>
              </div>
            )}
          </div>
        </div>

      {/* ============================================ */}
{/* DIARY ENTRY MODAL — WITH IMAGE UPLOAD        */}
{/* ============================================ */}
{showDiaryForm && (
  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-2">
        <h3 className="text-lg font-semibold text-gray-800">Add Diary Entry</h3>
        <button onClick={() => { setShowDiaryForm(false); diaryImages.forEach(img => { if (img.preview) URL.revokeObjectURL(img.preview); }); setDiaryImages([]); }} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
      </div>

      <div className="space-y-4">
        {/* Event Type */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Event Type</label>
          <select 
            value={newDiaryEntry.event_type} 
            onChange={(e) => setNewDiaryEntry(p => ({ ...p, event_type: e.target.value }))}
            className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition font-medium"
            style={{ color: '#111827' }}
          >
            {EVENT_TYPES.map(et => <option key={et.value} value={et.value} style={{color: '#111827'}}>{et.label}</option>)}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Title *</label>
          <input 
            type="text" 
            value={newDiaryEntry.title} 
            onChange={(e) => setNewDiaryEntry(p => ({ ...p, title: e.target.value }))}
            placeholder="Brief title for this entry" 
            className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition font-medium"
            style={{ color: '#111827', caretColor: '#f97316' }}
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Date</label>
            <input 
              type="date" 
              value={newDiaryEntry.entry_date} 
              onChange={(e) => setNewDiaryEntry(p => ({ ...p, entry_date: e.target.value }))} 
              className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition font-medium"
              style={{ color: '#111827' }}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Time</label>
            <input 
              type="time" 
              value={newDiaryEntry.entry_time} 
              onChange={(e) => setNewDiaryEntry(p => ({ ...p, entry_time: e.target.value }))} 
              className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition font-medium"
              style={{ color: '#111827' }}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Location</label>
          <input 
            type="text" 
            value={newDiaryEntry.location} 
            onChange={(e) => setNewDiaryEntry(p => ({ ...p, location: e.target.value }))}
            placeholder="Where this took place (optional)" 
            className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition font-medium"
            style={{ color: '#111827', caretColor: '#f97316' }}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
          <textarea 
            rows={3} 
            value={newDiaryEntry.description} 
            onChange={(e) => setNewDiaryEntry(p => ({ ...p, description: e.target.value }))}
            placeholder="Details of what happened..." 
            className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 resize-none transition font-medium"
            style={{ color: '#111827', caretColor: '#f97316' }}
          />
        </div>

        {/* IMAGE UPLOAD SECTION — no changes needed, already visible */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-2 block">Attach Photos</label>
          
          {diaryImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {diaryImages.map((img) => (
                <div key={img.id} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                  <button onClick={() => removeDiaryImage(img.id)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg">
                    <X size={12} />
                  </button>
                  <p className="absolute bottom-0 left-0 right-0 text-[9px] text-white bg-black/50 px-1.5 py-0.5 truncate">{img.name}</p>
                </div>
              ))}
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleDiaryImageSelect} className="hidden" id="diary-image-upload" />
          <label htmlFor="diary-image-upload" className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50/30 transition cursor-pointer">
            <Upload size={16} />
            {diaryImages.length > 0 ? `Add More Photos (${diaryImages.length} selected)` : 'Click to Upload Photos'}
          </label>
          <p className="text-[10px] text-gray-400 mt-1">Supports JPG, PNG — max 10MB each</p>
        </div>

        {/* Submit */}
        <button onClick={handleAddDiaryEntry} disabled={savingDiary || !newDiaryEntry.title.trim()}
          className="w-full py-3 bg-gradient-to-r from-orange-400 to-green-500 text-white rounded-xl font-medium hover:from-orange-500 hover:to-green-600 transition shadow-lg shadow-orange-200 disabled:opacity-50 flex items-center justify-center gap-2">
          {savingDiary ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {savingDiary ? 'Saving...' : 'Add Entry'}
        </button>
      </div>
    </div>
  </div>

)}
{/* LERS REQUESTS TAB */}
{activeSection === 'lers' && (
  <div className="space-y-6">
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-gray-800">LERS Requests</h3>
          <p className="text-xs text-gray-400 mt-1">Legal Emergency Request to Meta / WhatsApp / Instagram</p>
        </div>
      </div>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 mb-6">
        <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2"><Send size={14} className="text-blue-500" /> Send New LERS Request</h4>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Platform</label>
            <select value={lersPlatform} onChange={(e) => setLersPlatform(e.target.value)}
              className="w-full bg-white border-2 border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition" style={{ color: '#111827' }}>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Target Phone/Username</label>
            <input type="text" value={lersTarget} onChange={(e) => setLersTarget(e.target.value)}
              placeholder={complainant?.phone || accused[0]?.phone || 'Phone or username'}
              className="w-full bg-white border-2 border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 placeholder-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition" style={{ color: '#111827', caretColor: '#3b82f6' }} />
          </div>
          <div className="flex items-end">
            <button onClick={handleLersSend} disabled={lersSending || !lersTarget.trim()}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {lersSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {lersSending ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-2">Requests account details, IP logs, and activity data under BNSS Section 94</p>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Request History</h4>
        {(caseData.lers_requests && caseData.lers_requests.length > 0) ? (
          <div className="space-y-3">
            {caseData.lers_requests.map((req, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Send size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{req.platform}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10} /> {req.target_identifier}</p>
                    <p className="text-[10px] text-gray-400">{new Date(req.created_at).toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${req.status === 'SENT' ? 'bg-blue-50 text-blue-600 border-blue-200' : req.status === 'RESPONDED' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>{req.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Send size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">No LERS requests sent yet</p>
            <p className="text-xs text-gray-400 mt-1">Send a legal emergency request to Meta platforms</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}
{activeSection === 'audit' && (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
    <h3 className="text-base font-semibold text-gray-800 mb-4">Audit Trail</h3>
    <AuditTrail caseId={caseId} />
  </div>
)}
{/* FACE ID MODAL */}
{showFaceIDModal && (
  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-2">
        <h3 className="text-lg font-semibold text-gray-800">Face Identification Form</h3>
        <button onClick={() => { setShowFaceIDModal(false); stopCamera(); }} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-2 block">Accused Photo</label>
          <div className="relative w-full aspect-square bg-gray-900 rounded-xl overflow-hidden mb-2">
            {!accusedPhoto ? (
              <>
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" style={{ display: cameraStream ? 'block' : 'none' }} />
                {!cameraStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <Camera size={40} className="text-gray-600 mb-2" />
                    <p className="text-gray-400 text-sm">Photo preview</p>
                  </div>
                )}
              </>
            ) : (
              <img src={accusedPhoto} alt="Accused" className="w-full h-full object-cover" />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
          {!accusedPhoto ? (
            <div className="space-y-2">
              {!cameraStream ? (
                <button onClick={startCamera} className="w-full py-2 bg-gray-900 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2">
                  <Camera size={14} /> Open Camera
                </button>
              ) : (
                <button onClick={capturePhoto} className="w-full py-2 bg-green-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2">
                  <Camera size={14} /> Capture Photo
                </button>
              )}
              <label className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-500 text-center cursor-pointer hover:border-orange-400 flex items-center justify-center gap-2">
                <Upload size={14} /> Upload Photo
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
          ) : (
            <button onClick={() => setAccusedPhoto(null)} className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg text-xs flex items-center justify-center gap-2">
              <X size={14} /> Retake
            </button>
          )}
        </div>

        <div className="space-y-2">
          <Input label="Full Name *" value={faceIDForm.name} onChange={v => setFaceIDForm(p => ({...p, name: v}))} />
          <Input label="Father's Name" value={faceIDForm.fatherName} onChange={v => setFaceIDForm(p => ({...p, fatherName: v}))} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Age" value={faceIDForm.age} onChange={v => setFaceIDForm(p => ({...p, age: v}))} />
            <Input label="Gender" value={faceIDForm.gender} onChange={v => setFaceIDForm(p => ({...p, gender: v}))} />
          </div>
          <Input label="Occupation" value={faceIDForm.occupation} onChange={v => setFaceIDForm(p => ({...p, occupation: v}))} />
          <Input label="Address" value={faceIDForm.address} onChange={v => setFaceIDForm(p => ({...p, address: v}))} />
          <Input label="Phone" value={faceIDForm.phone} onChange={v => setFaceIDForm(p => ({...p, phone: v}))} />
          <div className="grid grid-cols-3 gap-2">
            <Input label="Height" value={faceIDForm.height} onChange={v => setFaceIDForm(p => ({...p, height: v}))} />
            <Input label="Build" value={faceIDForm.build} onChange={v => setFaceIDForm(p => ({...p, build: v}))} />
            <Input label="Complexion" value={faceIDForm.complexion} onChange={v => setFaceIDForm(p => ({...p, complexion: v}))} />
          </div>
          <Input label="Hair" value={faceIDForm.hair} onChange={v => setFaceIDForm(p => ({...p, hair: v}))} />
          <Input label="Eyes" value={faceIDForm.eyes} onChange={v => setFaceIDForm(p => ({...p, eyes: v}))} />
          <Input label="Beard/Moustache" value={faceIDForm.beard} onChange={v => setFaceIDForm(p => ({...p, beard: v}))} />
          <div className="grid grid-cols-3 gap-2">
            <Input label="Mark 1" value={faceIDForm.mark1} onChange={v => setFaceIDForm(p => ({...p, mark1: v}))} />
            <Input label="Mark 2" value={faceIDForm.mark2} onChange={v => setFaceIDForm(p => ({...p, mark2: v}))} />
            <Input label="Mark 3" value={faceIDForm.mark3} onChange={v => setFaceIDForm(p => ({...p, mark3: v}))} />
          </div>
        </div>
      </div>

      <button onClick={handleGenerateFaceIDDoc}
        className="w-full mt-4 py-3 bg-gradient-to-r from-orange-400 to-green-500 text-white rounded-xl font-medium hover:from-orange-500 hover:to-green-600 transition flex items-center justify-center gap-2">
        <FileText size={16} /> Generate Face ID Document
      </button>
    </div>
  </div>
)}

        {/* IMAGE VIEWER MODAL */}
        {viewingImage && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewingImage(null)}>
            <div className="relative max-w-5xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <button onClick={() => setViewingImage(null)} className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-white"><X size={24} /></button>
              <img src={`file://${viewingImage.file_path}`} alt={viewingImage.file_name} className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain" />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm rounded-b-2xl px-4 py-3">
                <p className="text-white text-sm font-medium">{viewingImage.file_name}</p>
                <p className="text-white/60 text-xs">{viewingImage.file_size ? `${(viewingImage.file_size / 1024).toFixed(1)} KB` : ''}</p>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
          {notifications.map((n) => (
            <div key={n.id} className={`px-5 py-3 rounded-2xl shadow-2xl flex items-start gap-3 min-w-[300px] animate-slide-in border ${n.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : n.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'success' ? 'bg-green-100' : n.type === 'error' ? 'bg-red-100' : 'bg-blue-100'}`}>
                {n.type === 'success' ? <Check size={16} /> : n.type === 'error' ? <X size={16} /> : <Loader2 size={16} className="animate-spin" />}
              </div>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold">{n.title}</p><p className="text-xs opacity-80 mt-0.5">{n.message}</p></div>
              <button onClick={() => setNotifications(prev => prev.filter(not => not.id !== n.id))} className="opacity-50 hover:opacity-100 flex-shrink-0"><X size={14} /></button>
            </div>
          ))}
        </div>

        {/* PDF PREVIEW MODAL */}
        {previewDoc && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div><h3 className="text-lg font-semibold text-gray-800">Document Preview</h3><p className="text-xs text-gray-400">{previewTitle} • {caseData.fir_number}</p></div>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrintPreview} className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition"><Printer size={16} /> Print</button>
                  <button onClick={handleDownloadPreview} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-400 to-green-500 text-white rounded-xl text-sm font-medium hover:from-orange-500 hover:to-green-600 transition shadow-sm"><Download size={16} /> Download PDF</button>
                  <button onClick={() => setPreviewDoc(null)} className="p-2 hover:bg-gray-100 rounded-xl transition ml-2"><X size={20} className="text-gray-500" /></button>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-gray-50 p-4">
                <div className="bg-white shadow-lg mx-auto" style={{ maxWidth: '210mm' }}><iframe srcDoc={previewDoc} className="w-full border-0" style={{ height: '80vh' }} title="Document Preview" /></div>
              </div>
            </div>
          </div>
        )}
       
    

        <style>{`
          @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .animate-slide-in { animation: slideIn 0.3s ease-out; }
          .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        `}</style>
      </main>
    </div>
 
    
  );
}
 
{/* Helper Input Component — add at bottom of file */}
function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="text-[10px] font-medium text-gray-500 mb-0.5 block">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-white border-2 border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition"
        style={{ color: '#111827' }} />
    </div>
  );
}
// ─── Helper Components ───

function StatBox({ icon, color, value, label }) {
  const bgMap = { orange: 'bg-orange-50', red: 'bg-red-50', green: 'bg-green-50', purple: 'bg-purple-50' };
  const textMap = { orange: 'text-orange-500', red: 'text-red-500', green: 'text-green-500', purple: 'text-purple-500' };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
      <div className={`w-10 h-10 ${bgMap[color]} rounded-xl flex items-center justify-center mx-auto mb-3`}>
        <div className={textMap[color]}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center py-8">
      <div className="text-gray-200 mx-auto mb-3">{icon}</div>
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}

function MiniStatCard({ icon, color, label, value, subtext }) {
  const bgMap = { orange: 'bg-orange-50', red: 'bg-red-50', green: 'bg-green-50', purple: 'bg-purple-50', amber: 'bg-amber-50', blue: 'bg-blue-50' };
  const textMap = { orange: 'text-orange-500', red: 'text-red-500', green: 'text-green-500', purple: 'text-purple-500', amber: 'text-amber-500', blue: 'text-blue-500' };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 ${bgMap[color]} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <div className={textMap[color]}>{icon}</div>
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-gray-800">{value}</p>
          <p className="text-[11px] text-gray-400 font-medium">{label}</p>
          <p className="text-[10px] text-gray-400 truncate">{subtext}</p>
        </div>
      </div>
    </div>
  );
}