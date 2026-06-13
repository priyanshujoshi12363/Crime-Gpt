// src/pages/CaseDetail.jsx
import { useState } from 'react';
import { ArrowLeft, FileText, Download, Eye, Calendar, MapPin, User, Clock, Shield, AlertCircle, Image, Plus, Edit, Check, X, ChevronDown } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

export default function CaseDetail({ onNavigate, caseId }) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');

  const caseData = {
    fir: 'CR-2026-0145',
    type: 'Theft',
    status: 'ACTIVE',
    date: '2026-06-10',
    time: '22:30',
    location: '12, Old City Road, Ahmedabad, Gujarat',
    description: 'On 15th January at 10:30 PM, an unknown person entered the complainant\'s house by breaking the back door lock. The accused stole gold jewelry worth Rs. 50,000 and cash Rs. 10,000 from the almirah. A neighbor witnessed a suspicious person running away from the scene.',
    complainant: { name: 'Rajesh Patel', phone: '9876543210', address: '12, Old City Road, Ahmedabad', idType: 'Aadhaar', idNumber: '1234-5678-9012' },
    accused: [{ name: 'Unknown', alias: '-', fatherName: '-', age: '~30', description: 'Tall, dark complexion, wearing black shirt and jeans' }],
    witnesses: [{ name: 'Sita Devi', phone: '9123456780', statement: 'I saw a suspicious person running from Mr. Patel\'s house around 10:45 PM. He was tall and wearing dark clothes.' }],
    seizedItems: [{ item: 'Broken Lock', qty: '1', seizedFrom: 'Crime Scene' }, { item: 'Footprint Cast', qty: '1', seizedFrom: 'Back Door Area' }],
    evidence: ['crime_scene_1.jpg', 'broken_lock.jpg', 'footprint.jpg'],
    sections: [{ law: 'BNS', section: '303', title: 'Theft', confidence: 95 }, { law: 'BNS', section: '331', title: 'House Breaking', confidence: 88 }, { law: 'BNSS', section: '154', title: 'FIR Registration', confidence: 100 }],
    documents: [
      { name: 'Purvani Chargesheet', type: 'chargesheet', generated: true, date: '2026-06-10' },
      { name: 'Medical Treatment Letter', type: 'medical', generated: true, date: '2026-06-10' },
      { name: 'Remand Request Letter', type: 'remand', generated: false },
      { name: 'Seizure Receipt', type: 'seizure', generated: true, date: '2026-06-11' },
      { name: 'Court Custody Letter', type: 'court', generated: false },
      { name: 'Accused Panchanama', type: 'panchnama', generated: true, date: '2026-06-11' },
      { name: 'Face Identification Form', type: 'faceid', generated: false }
    ],
    diary: [
      { date: '2026-06-10', time: '22:45', event: 'FIR_REGISTERED', title: 'FIR Registered', description: 'Complainant Rajesh Patel filed complaint regarding theft at residence', officer: 'IO Rajesh Kumar' },
      { date: '2026-06-10', time: '23:30', event: 'INVESTIGATION_STARTED', title: 'Scene Investigation', description: 'Visited crime scene. Found broken back door lock. Collected evidence including fingerprints and footprints.', officer: 'IO Rajesh Kumar' },
      { date: '2026-06-11', time: '09:00', event: 'WITNESS_INTERVIEW', title: 'Witness Statement Recorded', description: 'Recorded statement of neighbor Sita Devi who saw suspicious person running from the scene.', officer: 'IO Rajesh Kumar' },
      { date: '2026-06-11', time: '14:00', event: 'EVIDENCE_SEIZED', title: 'Evidence Collected', description: 'Seized broken lock and footprint cast from crime scene.', officer: 'IO Rajesh Kumar' }
    ]
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={user} activeView="cases" onNavigate={onNavigate} />
      
      <main className="flex-1 overflow-auto" style={{ background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 40%, #F0FFF4 100%)' }}>
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate('search')} className="p-2 hover:bg-gray-50 rounded-xl transition text-gray-400 hover:text-gray-600">
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-800">{caseData.fir}</h2>
                  <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-medium border border-orange-100">{caseData.status}</span>
                </div>
                <p className="text-sm text-gray-400">{caseData.type} • {caseData.date}</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-orange-400 to-green-500 text-white rounded-xl text-sm font-medium hover:from-orange-500 hover:to-green-600 transition flex items-center gap-2">
              <Edit size={16} /> Update Case Status
            </button>
          </div>
        </header>

        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Section Nav */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'parties', label: 'Parties' },
                { id: 'evidence', label: 'Evidence' },
                { id: 'sections', label: 'Legal Sections' },
                { id: 'documents', label: 'Documents' },
                { id: 'diary', label: 'Case Diary' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeSection === tab.id 
                      ? 'bg-white text-gray-800 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Incident Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Calendar size={16} className="text-gray-300 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-400">Date & Time</p>
                        <p className="text-sm text-gray-700">{caseData.date} at {caseData.time}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-gray-300 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-400">Location</p>
                        <p className="text-sm text-gray-700">{caseData.location}</p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-1">Description</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{caseData.description}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <AlertCircle size={18} className="text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">1</p>
                    <p className="text-xs text-gray-400 mt-1">Accused</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <User size={18} className="text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">1</p>
                    <p className="text-xs text-gray-400 mt-1">Witness</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <FileText size={18} className="text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">4</p>
                    <p className="text-xs text-gray-400 mt-1">Documents Generated</p>
                  </div>
                </div>
              </div>
            )}

            {/* Parties */}
            {activeSection === 'parties' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Complainant</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-xs text-gray-400">Name</p><p className="text-gray-700">{caseData.complainant.name}</p></div>
                    <div><p className="text-xs text-gray-400">Phone</p><p className="text-gray-700">{caseData.complainant.phone}</p></div>
                    <div className="col-span-2"><p className="text-xs text-gray-400">Address</p><p className="text-gray-700">{caseData.complainant.address}</p></div>
                    <div><p className="text-xs text-gray-400">ID Type</p><p className="text-gray-700">{caseData.complainant.idType}</p></div>
                    <div><p className="text-xs text-gray-400">ID Number</p><p className="text-gray-700">{caseData.complainant.idNumber}</p></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Accused</h3>
                  {caseData.accused.map((a, i) => (
                    <div key={i} className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-xl p-4">
                      <div><p className="text-xs text-gray-400">Name</p><p className="text-gray-700">{a.name}</p></div>
                      <div><p className="text-xs text-gray-400">Alias</p><p className="text-gray-700">{a.alias}</p></div>
                      <div><p className="text-xs text-gray-400">Father's Name</p><p className="text-gray-700">{a.fatherName}</p></div>
                      <div><p className="text-xs text-gray-400">Age</p><p className="text-gray-700">{a.age}</p></div>
                      <div className="col-span-2"><p className="text-xs text-gray-400">Description</p><p className="text-gray-700">{a.description}</p></div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Witnesses</h3>
                  {caseData.witnesses.map((w, i) => (
                    <div key={i} className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-xl p-4">
                      <div><p className="text-xs text-gray-400">Name</p><p className="text-gray-700">{w.name}</p></div>
                      <div><p className="text-xs text-gray-400">Phone</p><p className="text-gray-700">{w.phone}</p></div>
                      <div className="col-span-2"><p className="text-xs text-gray-400">Statement</p><p className="text-gray-700">{w.statement}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence */}
            {activeSection === 'evidence' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Evidence Images</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {caseData.evidence.map((img, i) => (
                      <div key={i} className="relative bg-gray-50 rounded-xl aspect-square flex flex-col items-center justify-center border border-gray-200 hover:border-orange-300 transition cursor-pointer group">
                        <Image size={32} className="text-gray-300 group-hover:text-orange-400 mb-2" />
                        <p className="text-xs text-gray-400">{img}</p>
                        <button className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition">
                          <Eye size={14} className="text-gray-500" />
                        </button>
                      </div>
                    ))}
                    <div className="bg-gray-50 rounded-xl aspect-square flex items-center justify-center border-2 border-dashed border-gray-200 cursor-pointer hover:border-orange-300 transition">
                      <Plus size={24} className="text-gray-300" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Seized Items</h3>
                  <div className="space-y-2">
                    {caseData.seizedItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-3">
                          <FileText size={16} className="text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">{item.item}</p>
                            <p className="text-xs text-gray-400">Qty: {item.qty} • Seized from: {item.seizedFrom}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Legal Sections */}
            {activeSection === 'sections' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">AI Suggested Legal Sections</h3>
                  <div className="space-y-3">
                    {caseData.sections.map((s, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.law === 'BNS' ? 'bg-orange-100' : 'bg-green-100'}`}>
                            <Shield size={18} className={s.law === 'BNS' ? 'text-orange-500' : 'text-green-500'} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{s.law} Section {s.section}</p>
                            <p className="text-xs text-gray-500">{s.title}</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">{s.confidence}% match</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Documents */}
            {activeSection === 'documents' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Case Documents</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {caseData.documents.map((doc, i) => (
                      <div key={i} className={`flex items-center justify-between rounded-xl p-4 border ${doc.generated ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-3">
                          {doc.generated ? <Check size={18} className="text-green-500" /> : <Clock size={18} className="text-gray-300" />}
                          <div>
                            <p className="text-sm font-medium text-gray-700">{doc.name}</p>
                            <p className="text-xs text-gray-400">{doc.generated ? `Generated on ${doc.date}` : 'Not yet generated'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.generated ? (
                            <>
                              <button className="p-2 hover:bg-green-100 rounded-lg transition"><Eye size={16} className="text-gray-500" /></button>
                              <button className="p-2 hover:bg-green-100 rounded-lg transition"><Download size={16} className="text-green-500" /></button>
                            </>
                          ) : (
                            <button className="px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg text-xs font-medium hover:bg-orange-200 transition">Generate</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Case Diary */}
            {activeSection === 'diary' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-semibold text-gray-800">Case Diary Timeline</h3>
                    <button className="px-4 py-2 bg-gradient-to-r from-orange-400 to-green-500 text-white rounded-xl text-sm font-medium hover:from-orange-500 hover:to-green-600 transition flex items-center gap-2">
                      <Plus size={16} /> Add Entry
                    </button>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-400 to-green-500" />
                    
                    <div className="space-y-6">
                      {caseData.diary.map((entry, i) => (
                        <div key={i} className="relative flex gap-4 pl-12">
                          <div className="absolute left-3.5 w-3.5 h-3.5 bg-white border-2 border-orange-400 rounded-full" />
                          <div className="flex-1 bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-medium">
                                  {entry.event.replace(/_/g, ' ')}
                                </span>
                                <span className="text-xs text-gray-400">{entry.date} at {entry.time}</span>
                              </div>
                            </div>
                            <h4 className="text-sm font-semibold text-gray-800">{entry.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">{entry.description}</p>
                            <p className="text-xs text-gray-400 mt-2">— {entry.officer}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}