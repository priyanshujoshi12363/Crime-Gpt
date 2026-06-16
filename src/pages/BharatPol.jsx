// src/pages/BharatPol.jsx
import { useState, useEffect } from 'react';
import { Search, Shield, AlertTriangle, Loader2, MapPin, Phone, User, FileText, ArrowLeft, Plus, Send, X, BadgeCheck, Globe } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

export default function BharatPol({ onNavigate }) {
  const { user } = useAuth();

  const [criminals, setCriminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedCriminal, setSelectedCriminal] = useState(null);
  const [syncing, setSyncing] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  // ─── Local Cases States ───
  const [localCases, setLocalCases] = useState([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedLocalCase, setSelectedLocalCase] = useState(null);
  const [posting, setPosting] = useState(false);
  const [postedCases, setPostedCases] = useState(new Set());

  const addNotification = (type, title, message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  // ─── Fetch BharatPol Criminals ───
  const fetchCriminals = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 5 };
      if (search.trim()) params.search = search.trim();
      const result = await window.crimeGPT.getBharatPolCriminals(params);
      if (result.success) {
        setCriminals(result.data);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      }
    } catch (err) { console.error('Fetch failed:', err); }
    setLoading(false);
  };

  // ─── Fetch Local CrimeGPT Cases ───
  const fetchLocalCases = async () => {
    try {
      const cases = await window.crimeGPT.getAllCases();
      setLocalCases(cases || []);
    } catch (err) { console.error('Local cases fetch failed:', err); }
  };

  useEffect(() => { fetchCriminals(); fetchLocalCases(); }, [page, search]);

  const handlePostCase = async (caseData) => {
    setPosting(true);
    try {
      const payload = {
        firNumber: caseData.fir_number,
        caseType: caseData.case_type,
        description: caseData.description,
        incidentDate: caseData.incident_date,
        incidentLocation: caseData.incident_location,
        officerName: caseData.officer_name || user?.fullName,
        station: 'CrimeGPT Police Station, Ahmedabad',
      sections: (() => {
  try {
    const secs = typeof caseData.applied_sections === 'string' ? JSON.parse(caseData.applied_sections) : caseData.applied_sections;
    return Array.isArray(secs) ? secs.map(s => `${s.law || s.law_code || 'BNS'} ${s.section || s.section_number || ''}`).join(', ') : '';
  } catch { return ''; }
})(),
        accusedName: caseData.accused?.[0]?.full_name || caseData.accused?.[0]?.name || '',
        accusedPhone: caseData.accused?.[0]?.phone || '',
      };
      
      console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));
      
      const result = await window.crimeGPT.shareBharatPolCase(payload);
      
      console.log('📥 Received result:', result);
      
      if (result.success) {
        setPostedCases(prev => new Set([...prev, caseData.id]));
        addNotification('success', 'Case Posted', `${caseData.fir_number} shared to BharatPol network`);
        setShowPostModal(false);
        setSelectedLocalCase(null);
      } else {
        addNotification('error', 'Failed', result.message || 'Could not post case');
      }
    } catch (err) {
      console.error('❌ Post error:', err);
      addNotification('error', 'Failed', err.message || 'Could not post case');
    }
    setPosting(false);
  };
  // ─── Sync BharatPol Case to Local ───
  const handleSyncCase = async (criminal, caseData) => {
    setSyncing(caseData.firNumber);
    try {
      const result = await window.crimeGPT.syncBharatPolCase({
        firNumber: caseData.firNumber,
        accusedName: criminal.name,
        accusedPhone: criminal.phone,
      });
      if (result.success) {
        addNotification('success', 'Case Synced', `${caseData.firNumber} saved to local database`);
      }
    } catch (err) { addNotification('error', 'Sync Failed', 'Could not sync case'); }
    setSyncing(null);
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={user} activeView="bharatpol" onNavigate={onNavigate} />
      <main className="flex-1 overflow-auto" style={{ background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 40%, #F0FFF4 100%)' }}>
        
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate('dashboard')} className="p-2 hover:bg-gray-50 rounded-xl transition text-gray-400 hover:text-gray-600">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">BharatPol Network</h2>
                <p className="text-sm text-gray-400">{total} criminals in national database</p>
              </div>
            </div>
            
            {/* + Post Button */}
            <button onClick={() => { fetchLocalCases(); setShowPostModal(true); }}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-200">
              <Plus size={16} /> Post Case to BharatPol
            </button>
          </div>
        </header>

        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Search */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-6">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search by name, phone, or FIR number..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition font-medium"
                  style={{ color: '#111827' }} />
              </div>
            </div>

            {/* Criminals List */}
            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 size={40} className="animate-spin text-indigo-400" /></div>
            ) : (
              <div className="space-y-4">
                {criminals.map((criminal) => (
                  <div key={criminal.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
                    <div className="p-5 flex items-center justify-between cursor-pointer"
                      onClick={() => setSelectedCriminal(selectedCriminal?.id === criminal.id ? null : criminal)}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${criminal.isWanted ? 'bg-red-100' : 'bg-gray-100'}`}>
                          {criminal.isWanted ? <AlertTriangle size={22} className="text-red-500" /> : <User size={22} className="text-gray-400" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800">{criminal.name}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${criminal.dangerLevel === 'HIGH' ? 'bg-red-100 text-red-600' : criminal.dangerLevel === 'MEDIUM' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                              {criminal.dangerLevel}
                            </span>
                            {criminal.isWanted && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500 text-white">WANTED</span>}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{criminal.previousCases?.length || 0} cases • Father: {criminal.fatherName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {criminal.lastKnownLocation}</span>
                        <span className="flex items-center gap-1"><Phone size={12} /> {criminal.phone}</span>
                      </div>
                    </div>
                    
                    {selectedCriminal?.id === criminal.id && (
                      <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Previous Cases</h4>
                        <div className="space-y-3">
                          {(criminal.previousCases || []).map((caseData, i) => (
                            <div key={i} className="bg-white rounded-xl p-4 border border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText size={14} className="text-indigo-500" />
                                  <p className="text-sm font-semibold text-gray-800">{caseData.firNumber}</p>
                                </div>
                                <button onClick={() => handleSyncCase(criminal, caseData)} disabled={syncing === caseData.firNumber}
                                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-1">
                                  {syncing === caseData.firNumber ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                  Sync to Local
                                </button>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">{caseData.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition">←</button>
                <span className="text-sm text-gray-500 font-medium">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition">→</button>
              </div>
            )}
          </div>
        </div>

        {/* ─── POST CASE MODAL ─── */}
        {showPostModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Globe size={18} className="text-indigo-500" /> Post Case to BharatPol</h3>
                <button onClick={() => setShowPostModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
              </div>
              <p className="text-xs text-gray-500 mb-4">Select a case from your local database to share with the national network</p>
              
              <div className="space-y-3">
                {localCases.length === 0 ? (
                  <div className="text-center py-10">
                    <FileText size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No local cases found</p>
                  </div>
                ) : (
                  localCases.map((c) => (
                    <div key={c.id} 
                      onClick={() => setSelectedLocalCase(selectedLocalCase?.id === c.id ? null : c)}
                      className={`p-4 rounded-xl border cursor-pointer transition ${
                        selectedLocalCase?.id === c.id ? 'bg-indigo-50 border-indigo-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      } ${postedCases.has(c.id) ? 'opacity-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800 text-sm">{c.fir_number}</p>
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px]">{c.case_type}</span>
                            {postedCases.has(c.id) && (
                              <span className="flex items-center gap-1 text-[10px] text-green-600"><BadgeCheck size={12} /> Posted</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1 truncate max-w-md">{c.description}</p>
                        </div>
                        {selectedLocalCase?.id === c.id && !postedCases.has(c.id) && (
                          <button onClick={(e) => { e.stopPropagation(); handlePostCase(c); }} disabled={posting}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-1">
                            {posting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                            Post
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
          {notifications.map((n) => (
            <div key={n.id} className={`px-5 py-3 rounded-2xl shadow-2xl flex items-start gap-3 min-w-[300px] animate-slide-in border ${n.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold">{n.title}</p><p className="text-xs opacity-80 mt-0.5">{n.message}</p></div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}