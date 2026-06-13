// src/pages/NewCase.jsx
import { useState } from 'react';
import { ArrowLeft, Save, FileText, Upload, X, Sparkles, Download, Eye, Plus, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

export default function NewCase({ onNavigate }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('fir');
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={user} activeView="new-case" onNavigate={onNavigate} />
      
      <main className="flex-1 overflow-auto" style={{ background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 40%, #F0FFF4 100%)' }}>
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-4 sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('dashboard')} className="p-2 hover:bg-gray-50 rounded-xl transition text-gray-400 hover:text-gray-600">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">New Case Entry</h2>
              <p className="text-sm text-gray-400">File a new FIR and generate documents</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-2">
              <Save size={16} /> Save Draft
            </button>
            <button className="px-5 py-2 bg-gradient-to-r from-orange-400 to-green-500 text-white rounded-xl font-medium text-sm hover:from-orange-500 hover:to-green-600 transition flex items-center gap-2 shadow-lg shadow-orange-200">
              <FileText size={16} /> Generate Documents & Save
            </button>
          </div>
        </header>

        <div className="p-8">
          <div className="max-w-5xl mx-auto">
            
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
              {[
                { id: 'fir', label: 'FIR Details' },
                { id: 'parties', label: 'Parties Involved' },
                { id: 'evidence', label: 'Evidence & Seizure' },
                { id: 'docs', label: 'Generated Documents' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id 
                      ? 'bg-white text-gray-800 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* FIR Details Tab */}
            {activeTab === 'fir' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Incident Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">FIR Number</label>
                      <input type="text" placeholder="Auto-generated" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-400" disabled />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Case Type</label>
                      <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/50">
                        <option>Select Case Type</option>
                        <option>Theft</option>
                        <option>Murder</option>
                        <option>Assault</option>
                        <option>Robbery</option>
                        <option>Fraud</option>
                        <option>Kidnapping</option>
                        <option>Domestic Violence</option>
                        <option>Cyber Crime</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Incident Date</label>
                      <input type="date" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Incident Time</label>
                      <input type="time" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Incident Location</label>
                      <input type="text" placeholder="Full address of incident location" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Language</label>
                      <div className="flex gap-2">
                        {['English', 'हिन्दी', 'ગુજરાતી'].map((lang) => (
                          <button key={lang} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-orange-50 hover:border-orange-200 transition">{lang}</button>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Incident Description</label>
                      <textarea rows={5} placeholder="Describe the incident in detail. Include what happened, when, where, and who was involved..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-none" />
                    </div>
                  </div>
                </div>

                {/* AI Suggestions Panel */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-orange-500" />
                      <h3 className="text-base font-semibold text-gray-800">AI Legal Section Suggestions</h3>
                    </div>
                    <button 
                      onClick={() => setShowAISuggestions(!showAISuggestions)}
                      className="px-4 py-2 bg-gradient-to-r from-orange-400 to-green-500 text-white rounded-xl text-sm font-medium hover:from-orange-500 hover:to-green-600 transition flex items-center gap-2"
                    >
                      <Sparkles size={14} /> Analyze Description
                    </button>
                  </div>
                  
                  {showAISuggestions && (
                    <div className="space-y-3">
                      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                        <p className="text-sm font-medium text-orange-800 mb-2">BNS Sections</p>
                        <div className="space-y-2">
                          {[
                            { section: '303', title: 'Theft', confidence: 95 },
                            { section: '331', title: 'House Breaking', confidence: 88 },
                            { section: '317', title: 'Criminal Trespass', confidence: 76 }
                          ].map((s) => (
                            <div key={s.section} className="flex items-center justify-between bg-white rounded-lg p-3">
                              <div>
                                <p className="text-sm font-medium text-gray-800">BNS {s.section} - {s.title}</p>
                              </div>
                              <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">{s.confidence}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                        <p className="text-sm font-medium text-green-800 mb-2">BNSS Procedures</p>
                        <div className="space-y-2">
                          {[
                            { section: '154', title: 'FIR Registration', confidence: 100 },
                            { section: '41', title: 'Arrest Without Warrant', confidence: 85 }
                          ].map((s) => (
                            <div key={s.section} className="flex items-center justify-between bg-white rounded-lg p-3">
                              <div>
                                <p className="text-sm font-medium text-gray-800">BNSS {s.section} - {s.title}</p>
                              </div>
                              <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">{s.confidence}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Parties Tab */}
            {activeTab === 'parties' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Complainant Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
                      <input type="text" placeholder="Complainant name" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone Number</label>
                      <input type="text" placeholder="Phone number" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Address</label>
                      <input type="text" placeholder="Full address" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">ID Type</label>
                      <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/50">
                        <option>Aadhaar</option>
                        <option>Voter ID</option>
                        <option>Passport</option>
                        <option>Driving License</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">ID Number</label>
                      <input type="text" placeholder="ID number" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-800">Accused Details</h3>
                    <button className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1">
                      <Plus size={16} /> Add Accused
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
                      <input type="text" placeholder="Accused name" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Alias / Nickname</label>
                      <input type="text" placeholder="Also known as" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Father's Name</label>
                      <input type="text" placeholder="Father's name" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Age</label>
                      <input type="number" placeholder="Age" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Physical Description</label>
                      <textarea rows={2} placeholder="Height, complexion, identifying marks..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-none" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-800">Witness Details</h3>
                    <button className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1">
                      <Plus size={16} /> Add Witness
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
                      <input type="text" placeholder="Witness name" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone Number</label>
                      <input type="text" placeholder="Phone number" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/50" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Statement</label>
                      <textarea rows={3} placeholder="Witness statement about the incident..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Evidence Tab */}
            {activeTab === 'evidence' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Evidence Images</h3>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-orange-300 transition cursor-pointer">
                    <Upload size={32} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-500">Drag & drop images or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 10MB</p>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="relative bg-gray-50 rounded-xl aspect-square flex items-center justify-center border border-gray-200">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                            <FileText size={20} className="text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-400">crime_scene_{i}.jpg</p>
                        </div>
                        <button className="absolute top-2 right-2 w-6 h-6 bg-red-50 rounded-full flex items-center justify-center hover:bg-red-100">
                          <X size={12} className="text-red-400" />
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
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="grid grid-cols-4 gap-3 bg-gray-50 rounded-xl p-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Item Name</label>
                          <input type="text" placeholder="Item" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                          <input type="text" placeholder="Qty" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Seized From</label>
                          <input type="text" placeholder="Person" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400" />
                        </div>
                        <div className="flex items-end">
                          <button className="text-red-400 hover:text-red-500 p-2">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-orange-300 hover:text-orange-500 transition flex items-center justify-center gap-2">
                      <Plus size={16} /> Add Seized Item
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'docs' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">Generated Documents</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { name: 'Purvani Chargesheet', type: 'chargesheet', icon: '📋' },
                      { name: 'Medical Treatment Letter', type: 'medical', icon: '🏥' },
                      { name: 'Remand Request Letter', type: 'remand', icon: '📝' },
                      { name: 'Seizure Receipt', type: 'seizure', icon: '📦' },
                      { name: 'Court Custody Letter', type: 'court', icon: '⚖️' },
                      { name: 'Accused Panchanama', type: 'panchnama', icon: '📄' },
                      { name: 'Face Identification Form', type: 'faceid', icon: '👤' }
                    ].map((doc) => (
                      <div key={doc.type} className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-orange-200 transition cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-lg">{doc.icon}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">{doc.name}</p>
                            <p className="text-xs text-gray-400">Ready to generate</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-orange-50 rounded-lg transition" title="Preview">
                            <Eye size={16} className="text-gray-400" />
                          </button>
                          <button className="p-2 hover:bg-green-50 rounded-lg transition" title="Download">
                            <Download size={16} className="text-green-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 bg-gradient-to-r from-orange-400 to-green-500 text-white py-3 rounded-xl font-medium hover:from-orange-500 hover:to-green-600 transition flex items-center justify-center gap-2 shadow-lg shadow-orange-200">
                    <FileText size={18} /> Generate All 7 Documents
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}