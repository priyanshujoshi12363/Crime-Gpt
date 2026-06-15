import { useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, Save, FileText, Upload, X, Sparkles, Check, Shield, User, Phone, Plus, Trash2, AlertCircle, Loader2, Eye, ChevronDown, MapPin, Clock, Calendar, Camera, Scale } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const GRADIENT = 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #22C55E 100%)';
const ORANGE = '#FF6B35';
const GREEN = '#22C55E';

function Field({ label, required, error, children, className = '' }) {
  return (
    <div className={className}>
      <label className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
        {required && <span className="text-orange-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 mt-1 text-[11px] text-red-500">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

const inputCls = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-transparent transition-all duration-150';

function StepPill({ n, label, active, done }) {
  return (
    <div className="flex flex-col items-center gap-1.5" style={{ minWidth: 72 }}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
        done ? 'bg-green-500 text-white shadow-lg shadow-green-200' :
        active ? 'bg-gradient-to-r from-orange-400 to-green-500 text-white shadow-lg shadow-orange-200' :
        'bg-gray-100 text-gray-400'
      }`}>
        {done ? <Check size={16} strokeWidth={2.5} /> : n}
      </div>
      <span className={`text-[11px] font-medium whitespace-nowrap transition-colors ${
        active ? 'text-orange-500' : done ? 'text-green-500' : 'text-gray-400'
      }`}>{label}</span>
    </div>
  );
}

const DOCS = [
  'Purvani Chargesheet', 'Medical Treatment Letter', 'Remand Request Letter',
  'Seizure Receipt', 'Court Custody Letter', 'Accused Panchanama', 'Face Identification Form'
];

export default function NewCase({ onNavigate }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSections, setAiSections] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const [form, setForm] = useState({
    caseType: '', language: 'English', incidentDate: '', incidentTime: '',
    incidentLocation: '', description: '',
    complainantName: '', complainantPhone: '', complainantAddress: '',
    complainantIdType: 'Aadhaar', complainantIdNumber: '',
    accusedName: '', accusedAlias: '', accusedFatherName: '', accusedAge: '', accusedDescription: '',
    witnessName: '', witnessPhone: '', witnessStatement: '',
    seizedItems: [{ item: '', qty: '', seizedFrom: '' }],
    evidenceFiles: [],
  });

  const set = (field, val) => {
    setForm(p => ({ ...p, [field]: val }));
    if (errors[field]) setErrors(p => { const e = { ...p }; delete e[field]; return e; });
  };

  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.caseType) e.caseType = 'Select case type';
      if (!form.incidentDate) e.incidentDate = 'Required';
      if (!form.incidentLocation.trim()) e.incidentLocation = 'Required';
      if (form.description.trim().length < 20) e.description = 'Minimum 20 characters required';
    }
    if (s === 2) {
      if (!form.complainantName.trim()) e.complainantName = 'Required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate(step)) setStep(s => s + 1); };
  const back = () => { setStep(s => s - 1); setErrors({}); };

  const analyzeWithAI = async () => {
    if (!form.description.trim()) {
      setErrors(p => ({ ...p, description: 'Write a description first' }));
      return;
    }
    setAiLoading(true);
    try {
      const response = await window.crimeGPT.getLegalSuggestionRAG(form.description);
      if (!response.error) {
        setAiSections(typeof response === 'string' ? { summary: response, sections: [], severity: 'Medium' } : response);
      } else {
        setAiSections({ error: true });
      }
    } catch {
      setAiSections({ error: true });
    }
    setAiLoading(false);
  };

  const addSeized = () => setForm(p => ({ ...p, seizedItems: [...p.seizedItems, { item: '', qty: '', seizedFrom: '' }] }));
  const removeSeized = (i) => setForm(p => ({ ...p, seizedItems: p.seizedItems.filter((_, idx) => idx !== i) }));
  const updateSeized = (i, field, val) => setForm(p => ({ ...p, seizedItems: p.seizedItems.map((s, idx) => idx === i ? { ...s, [field]: val } : s) }));

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const previews = files.filter(f => f.size <= 10 * 1024 * 1024).map(f => ({
      name: f.name, size: f.size, url: URL.createObjectURL(f), file: f
    }));
    setForm(p => ({ ...p, evidenceFiles: [...p.evidenceFiles, ...previews] }));
  };
  const removeFile = (i) => setForm(p => ({ ...p, evidenceFiles: p.evidenceFiles.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await window.crimeGPT.createCase({
        fir_number: `CR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
        incident_date: form.incidentDate,
        incident_time: form.incidentTime,
        incident_location: form.incidentLocation,
        description: form.description,
        description_lang: form.language === 'English' ? 'en' : form.language === 'हिन्दी' ? 'hi' : 'gu',
        complainant_name: form.complainantName,
        complainant_address: form.complainantAddress,
        complainant_phone: form.complainantPhone,
        complainant_id_type: form.complainantIdType,
        complainant_id_number: form.complainantIdNumber,
        officer_name: user?.fullName || 'Unknown',
        officer_badge: user?.badgeNumber || '',
      });
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
    onNavigate('dashboard');
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={user} activeView="new-case" onNavigate={onNavigate} />

      <main className="flex-1 overflow-auto" style={{ background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 40%, #F0FFF4 100%)' }}>

        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-4 sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('dashboard')} className="p-2 hover:bg-gray-50 rounded-xl transition text-gray-400 hover:text-gray-600">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">New FIR Entry</h2>
              <p className="text-xs text-gray-400">Step {step} of 3</p>
            </div>
          </div>
        </header>

        <div className="px-8 pt-6 pb-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between relative mb-6">
              <div className="absolute top-4 left-[15%] right-[15%] h-0.5 bg-gray-100">
                <div className="h-full bg-gradient-to-r from-orange-400 to-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${((step - 1) / 2) * 100}%` }} />
              </div>
              <StepPill n={1} label="FIR Details" active={step === 1} done={step > 1} />
              <StepPill n={2} label="Parties & Evidence" active={step === 2} done={step > 2} />
              <StepPill n={3} label="Review & Save" active={step === 3} done={step > 3} />
            </div>
          </div>
        </div>

        <div className="px-8 pb-24">
          <div className="max-w-3xl mx-auto space-y-4">

            {step === 1 && (
              <>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-5">Incident Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Case Type" required error={errors.caseType}>
                      <select value={form.caseType} onChange={e => set('caseType', e.target.value)}
                        className={`${inputCls} appearance-none`}>
                        <option value="">Select case type...</option>
                        {['Theft','Murder','Assault','Robbery','Fraud','Kidnapping','Domestic Violence','Cyber Crime','Rape','Dowry','Other'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </Field>

                    <Field label="Language">
                      <div className="flex gap-2">
                        {['English', 'हिन्दी', 'ગુજરાતી'].map(lang => (
                          <button key={lang} onClick={() => set('language', lang)}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition border ${
                              form.language === lang ? 'bg-orange-50 border-orange-300 text-orange-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}>{lang}</button>
                        ))}
                      </div>
                    </Field>

                    <Field label="Incident Date" required error={errors.incidentDate}>
                      <input type="date" value={form.incidentDate} onChange={e => set('incidentDate', e.target.value)}
                        className={inputCls} />
                    </Field>

                    <Field label="Incident Time">
                      <input type="time" value={form.incidentTime} onChange={e => set('incidentTime', e.target.value)}
                        className={inputCls} />
                    </Field>

                    <div className="col-span-2">
                      <Field label="Incident Location" required error={errors.incidentLocation}>
                        <input type="text" value={form.incidentLocation} onChange={e => set('incidentLocation', e.target.value)}
                          placeholder="Full address of incident location" className={inputCls} />
                      </Field>
                    </div>

                    <div className="col-span-2">
                      <Field label="Incident Description" required error={errors.description}>
                        <textarea rows={5} value={form.description} onChange={e => set('description', e.target.value)}
                          placeholder="Describe the incident in detail — what happened, when, where, who was involved..."
                          className={`${inputCls} resize-none`} />
                      </Field>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sparkles size={18} className="text-orange-500" />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">AI Legal Section Analysis</h3>
                        <p className="text-xs text-gray-400">Get BNS/BNSS/BSA suggestions from your description</p>
                      </div>
                    </div>
                    <button onClick={analyzeWithAI} disabled={aiLoading}
                      className="px-4 py-2 bg-gradient-to-r from-orange-400 to-green-500 text-white rounded-xl text-sm font-medium hover:from-orange-500 hover:to-green-600 transition flex items-center gap-2 disabled:opacity-60 shadow-lg shadow-orange-200">
                      {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {aiLoading ? 'Analyzing...' : 'Analyze Now'}
                    </button>
                  </div>

                  {aiSections && !aiSections.error && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-green-50 rounded-xl border border-orange-100">
                      <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{aiSections.summary || JSON.stringify(aiSections)}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button onClick={next}
                    className="px-6 py-3 bg-gradient-to-r from-orange-400 to-green-500 text-white rounded-xl font-medium hover:from-orange-500 hover:to-green-600 transition flex items-center gap-2 shadow-lg shadow-orange-200">
                    Parties & Evidence <ArrowRight size={18} />
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-5">Complainant Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Full Name" required error={errors.complainantName}>
                      <input type="text" value={form.complainantName} onChange={e => set('complainantName', e.target.value)}
                        placeholder="As per ID proof" className={inputCls} />
                    </Field>
                    <Field label="Phone Number">
                      <input type="text" value={form.complainantPhone} onChange={e => set('complainantPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10 digit number" className={inputCls} />
                    </Field>
                    <div className="col-span-2">
                      <Field label="Address">
                        <input type="text" value={form.complainantAddress} onChange={e => set('complainantAddress', e.target.value)}
                          placeholder="Full residential address" className={inputCls} />
                      </Field>
                    </div>
                    <Field label="ID Type">
                      <select value={form.complainantIdType} onChange={e => set('complainantIdType', e.target.value)}
                        className={inputCls}>
                        <option>Aadhaar</option><option>Voter ID</option><option>Passport</option><option>Driving License</option>
                      </select>
                    </Field>
                    <Field label="ID Number">
                      <input type="text" value={form.complainantIdNumber} onChange={e => set('complainantIdNumber', e.target.value)}
                        placeholder="ID number" className={inputCls} />
                    </Field>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-5">Accused Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Full Name"><input type="text" value={form.accusedName} onChange={e => set('accusedName', e.target.value)} placeholder="Name or Unknown" className={inputCls} /></Field>
                    <Field label="Alias"><input type="text" value={form.accusedAlias} onChange={e => set('accusedAlias', e.target.value)} placeholder="Nickname" className={inputCls} /></Field>
                    <Field label="Father's Name"><input type="text" value={form.accusedFatherName} onChange={e => set('accusedFatherName', e.target.value)} placeholder="Father name" className={inputCls} /></Field>
                    <Field label="Age"><input type="number" value={form.accusedAge} onChange={e => set('accusedAge', e.target.value)} placeholder="Approximate age" className={inputCls} /></Field>
                    <div className="col-span-2">
                      <Field label="Physical Description">
                        <textarea rows={2} value={form.accusedDescription} onChange={e => set('accusedDescription', e.target.value)}
                          placeholder="Height, build, complexion, clothing, marks..." className={`${inputCls} resize-none`} />
                      </Field>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-5">Witness Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Name"><input type="text" value={form.witnessName} onChange={e => set('witnessName', e.target.value)} placeholder="Witness name" className={inputCls} /></Field>
                    <Field label="Phone"><input type="text" value={form.witnessPhone} onChange={e => set('witnessPhone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Phone" className={inputCls} /></Field>
                    <div className="col-span-2">
                      <Field label="Statement">
                        <textarea rows={3} value={form.witnessStatement} onChange={e => set('witnessStatement', e.target.value)}
                          placeholder="What did the witness see or hear?" className={`${inputCls} resize-none`} />
                      </Field>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-semibold text-gray-800">Evidence Photos</h3>
                  </div>
                  <input ref={fileRef} type="file" multiple accept="image/*" onChange={handleFiles} className="hidden" />
                  <div onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-orange-300 transition">
                    <Upload size={32} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-500">Click to upload evidence images</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 10MB</p>
                  </div>
                  {form.evidenceFiles.length > 0 && (
                    <div className="grid grid-cols-4 gap-3 mt-4">
                      {form.evidenceFiles.map((f, i) => (
                        <div key={i} className="relative bg-gray-50 rounded-xl aspect-square flex items-center justify-center border border-gray-200">
                          <img src={f.url} alt={f.name} className="w-full h-full object-cover rounded-xl" />
                          <button onClick={() => removeFile(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <X size={12} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <button onClick={back} className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition flex items-center gap-2">
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button onClick={next} className="px-6 py-3 bg-gradient-to-r from-orange-400 to-green-500 text-white rounded-xl font-medium hover:from-orange-500 hover:to-green-600 transition flex items-center gap-2 shadow-lg shadow-orange-200">
                    Review & Save <ArrowRight size={18} />
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-5">Case Summary</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      ['Case Type', form.caseType],
                      ['Date & Time', `${form.incidentDate} ${form.incidentTime}`],
                      ['Location', form.incidentLocation],
                      ['Complainant', form.complainantName],
                      ['Accused', form.accusedName || 'Unknown'],
                    ].map(([label, val]) => (
                      <div key={label} className="flex gap-4">
                        <span className="text-gray-400 w-28">{label}</span>
                        <span className="text-gray-700 font-medium">{val || '—'}</span>
                      </div>
                    ))}
                    <div className="pt-2">
                      <p className="text-gray-400 mb-1">Description</p>
                      <p className="text-gray-600 text-xs leading-relaxed">{form.description}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Documents to Generate</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {DOCS.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 py-2 px-3 bg-green-50 rounded-lg border border-green-100">
                        <Check size={14} className="text-green-500" />
                        <span className="text-xs text-green-700 font-medium">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <button onClick={back} className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition flex items-center gap-2">
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-orange-400 to-green-500 text-white rounded-xl font-medium hover:from-orange-500 hover:to-green-600 transition flex items-center gap-2 shadow-lg shadow-orange-200 disabled:opacity-60">
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                    {saving ? 'Saving...' : `Generate ${DOCS.length} Documents & Save`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}