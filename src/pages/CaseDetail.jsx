// src/pages/CaseDetail.jsx
import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Download, Calendar, MapPin, User, Shield, Check, Clock, Loader2, Plus } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

export default function CaseDetail({ onNavigate, caseId }) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [caseData, setCaseData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);

  useEffect(() => { loadCaseData(); }, [caseId]);

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

  const handleGenerate = async (docKey) => {
    setGenerating(docKey);
    try {
      await window.crimeGPT.generateDocument(caseId, docKey, caseData);
      await loadCaseData();
    } catch (err) { console.error('Generate failed:', err); }
    setGenerating(null);
  };

  const handleDownload = (docPath) => {
    if (docPath) window.open(`file://${docPath}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar user={user} activeView="cases" onNavigate={onNavigate} />
        <main className="flex-1 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 40%, #F0FFF4 100%)' }}>
          <Loader2 size={32} className="animate-spin text-orange-400" />
        </main>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar user={user} activeView="cases" onNavigate={onNavigate} />
        <main className="flex-1 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 40%, #F0FFF4 100%)' }}>
          <p className="text-gray-500">Case not found</p>
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
                  <h2 className="text-xl font-semibold text-gray-800">{caseData.fir_number}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${caseData.status === 'ACTIVE' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>{caseData.status}</span>
                </div>
                <p className="text-sm text-gray-400">{caseData.case_type} • {caseData.incident_date}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
              {['overview', 'parties', 'evidence', 'sections', 'documents', 'diary'].map(tab => (
                <button key={tab} onClick={() => setActiveSection(tab)} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all capitalize ${activeSection === tab ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{tab}</button>
              ))}
            </div>

            {activeSection === 'overview' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Incident Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3"><Calendar size={16} className="text-gray-300 mt-0.5" /><div><p className="text-xs text-gray-400">Date & Time</p><p className="text-sm text-gray-700">{caseData.incident_date} at {caseData.incident_time || 'N/A'}</p></div></div>
                  <div className="flex items-start gap-3"><MapPin size={16} className="text-gray-300 mt-0.5" /><div><p className="text-xs text-gray-400">Location</p><p className="text-sm text-gray-700">{caseData.incident_location}</p></div></div>
                  <div className="col-span-2"><p className="text-xs text-gray-400 mb-1">Description</p><p className="text-sm text-gray-700 leading-relaxed">{caseData.description}</p></div>
                </div>
              </div>
            )}

            {activeSection === 'parties' && (
              <div className="space-y-4">
                {complainant.full_name && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-800 mb-4">Complainant</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className="text-xs text-gray-400">Name</p><p className="text-gray-700">{complainant.full_name}</p></div>
                      <div><p className="text-xs text-gray-400">Phone</p><p className="text-gray-700">{complainant.phone || 'N/A'}</p></div>
                      <div className="col-span-2"><p className="text-xs text-gray-400">Address</p><p className="text-gray-700">{complainant.address || 'N/A'}</p></div>
                    </div>
                  </div>
                )}
                {accused.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-800 mb-4">Accused</h3>
                    {accused.map((a, i) => (
                      <div key={i} className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-xl p-4 mb-3">
                        <div><p className="text-xs text-gray-400">Name</p><p className="text-gray-700">{a.full_name || a.name || 'Unknown'}</p></div>
                        <div><p className="text-xs text-gray-400">Age</p><p className="text-gray-700">{a.age || 'N/A'}</p></div>
                        <div className="col-span-2"><p className="text-xs text-gray-400">Description</p><p className="text-gray-700">{a.physical_description || 'N/A'}</p></div>
                      </div>
                    ))}
                  </div>
                )}
                {witnesses.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-800 mb-4">Witnesses</h3>
                    {witnesses.map((w, i) => (
                      <div key={i} className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-xl p-4 mb-3">
                        <div><p className="text-xs text-gray-400">Name</p><p className="text-gray-700">{w.full_name || w.name}</p></div>
                        <div><p className="text-xs text-gray-400">Phone</p><p className="text-gray-700">{w.phone || 'N/A'}</p></div>
                        <div className="col-span-2"><p className="text-xs text-gray-400">Statement</p><p className="text-gray-700">{w.statement || 'N/A'}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'evidence' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Evidence Images</h3>
                  {evidence.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                      {evidence.map((img, i) => (
                        <div key={i} className="relative bg-gray-50 rounded-xl aspect-square border border-gray-200">
                          <img src={`file://${img.file_path}`} alt={img.file_name} className="w-full h-full object-cover rounded-xl" />
                          <p className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-0.5 rounded">{img.file_name}</p>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-gray-400 text-center py-8">No evidence uploaded</p>}
                </div>
                {seizedItems.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-800 mb-4">Seized Items</h3>
                    <div className="space-y-2">
                      {seizedItems.map((item, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center gap-3"><FileText size={16} className="text-gray-400" /><div><p className="text-sm font-medium text-gray-700">{item.item_name || item.item}</p><p className="text-xs text-gray-400">Qty: {item.quantity || item.qty || '1'}</p></div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'sections' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Applied Legal Sections</h3>
                {sections.length > 0 ? (
                  <div className="space-y-3">
                    {sections.map((s, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${(s.law_code || s.law) === 'BNS' ? 'bg-orange-100' : 'bg-green-100'}`}>
                            <Shield size={18} className={(s.law_code || s.law) === 'BNS' ? 'text-orange-500' : 'text-green-500'} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{s.law_code || s.law} Section {s.section_number || s.section}</p>
                            <p className="text-xs text-gray-500">{s.section_title || s.title}</p>
                          </div>
                        </div>
                        {s.confidence_score && <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">{s.confidence_score}% match</span>}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400 text-center py-8">No sections applied</p>}
              </div>
            )}

            {activeSection === 'documents' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Case Documents</h3>
                <div className="grid grid-cols-2 gap-3">
                  {documents.map((doc, i) => (
                    <div key={i} className={`flex items-center justify-between rounded-xl p-4 border ${doc.generated ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center gap-3">
                        {doc.generated ? <Check size={18} className="text-green-500" /> : <FileText size={18} className="text-gray-300" />}
                        <div>
                          <p className="text-sm font-medium text-gray-700">{doc.name}</p>
                          <p className="text-xs text-gray-400">{doc.generated ? `Generated ${doc.date || ''}` : 'Ready to generate'}</p>
                        </div>
                      </div>
                      {doc.generated ? (
                        <button onClick={() => handleDownload(doc.path)} className="p-2 hover:bg-green-100 rounded-lg transition"><Download size={16} className="text-green-500" /></button>
                      ) : (
                        <button onClick={() => handleGenerate(doc.key)} disabled={generating === doc.key} className="px-3 py-1.5 bg-gradient-to-r from-orange-400 to-green-500 text-white rounded-lg text-xs font-medium hover:from-orange-500 hover:to-green-600 transition disabled:opacity-50 flex items-center gap-1">
                          {generating === doc.key ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                          {generating === doc.key ? '...' : 'Generate'}
                        </button>
                      )}
                    </div>
                  ))}
                  {documents.length === 0 && <div className="col-span-2 text-center py-8 text-sm text-gray-400">No documents available for this case type</div>}
                </div>
              </div>
            )}

            {activeSection === 'diary' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-semibold text-gray-800">Case Diary Timeline</h3>
                  <button className="px-4 py-2 bg-gradient-to-r from-orange-400 to-green-500 text-white rounded-xl text-sm font-medium hover:from-orange-500 hover:to-green-600 transition flex items-center gap-2"><Plus size={16} /> Add Entry</button>
                </div>
                {diary.length > 0 ? (
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-400 to-green-500" />
                    <div className="space-y-6">
                      {diary.map((entry, i) => (
                        <div key={i} className="relative flex gap-4 pl-12">
                          <div className="absolute left-3.5 w-3.5 h-3.5 bg-white border-2 border-orange-400 rounded-full" />
                          <div className="flex-1 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-medium">{(entry.event_type || '').replace(/_/g, ' ')}</span>
                              <span className="text-xs text-gray-400">{entry.entry_date} at {entry.entry_time}</span>
                            </div>
                            <h4 className="text-sm font-semibold text-gray-800">{entry.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">{entry.description}</p>
                            <p className="text-xs text-gray-400 mt-2">— {entry.officer_name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <p className="text-sm text-gray-400 text-center py-8">No diary entries yet</p>}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}