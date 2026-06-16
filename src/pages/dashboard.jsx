import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import AIChat from './AIChat';
import NewCase from './NewCase';
import SearchCases from './SearchCases';
import CaseDetail from './CaseDetail';
import BharatPol from './BharatPol';
import { Search, FileText, AlertCircle, Loader2, X, Shield } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ activeCases: 0, totalCases: 0, documentsGenerated: 0 });
  const [recentCases, setRecentCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedCase, setSelectedCase] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => { 
    if (activeView === 'dashboard') loadDashboard(); 
  }, [activeView]);

  const loadDashboard = async () => {
    try {
      const s = await window.crimeGPT.getStats();
      setStats(s);
      const cases = await window.crimeGPT.getAllCases();
      setRecentCases(cases.slice(0, 5));
    } catch (err) {
      console.error('Dashboard load failed:', err);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      loadDashboard();
      return;
    }
    setSearching(true);
    try {
      const results = await window.crimeGPT.searchCases(searchQuery.trim());
      setSearchResults(results || []);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    }
    setSearching(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    loadDashboard();
  };

  const handleCaseClick = (caseId) => {
    setSelectedCase(caseId);
    setActiveView('case-detail');
  };

  const displayCases = searchResults !== null ? searchResults : recentCases;
  const isSearching = searchResults !== null;

  if (activeView === 'chat') {
    return (
      <div className="flex h-screen bg-white">
        <Sidebar user={user} activeView={activeView} onNavigate={setActiveView} onLogout={logout} />
        <AIChat onBack={() => setActiveView('dashboard')} />
      </div>
    );
  }

  if (activeView === 'new-case') {
    return <NewCase onNavigate={setActiveView} />;
  }

  if (activeView === 'search') {
    return (
      <SearchCases 
        onNavigate={setActiveView} 
        onViewCase={(id) => { setSelectedCase(id); setActiveView('case-detail'); }} 
      />
    );
  }

  if (activeView === 'case-detail') {
    return <CaseDetail onNavigate={setActiveView} caseId={selectedCase} />;
  }

  if (activeView === 'bharatpol') {
    return <BharatPol onNavigate={setActiveView} />;
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={user} activeView={activeView} onNavigate={setActiveView} onLogout={logout} />

      <main className="flex-1 overflow-auto" style={{ background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 40%, #F0FFF4 100%)' }}>
        <header className="bg-white/70 backdrop-blur-xl border-b border-gray-100 px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
              <p className="text-sm text-gray-400">Welcome back, {user?.fullName}</p>
            </div>
            <form onSubmit={handleSearch} className="relative flex items-center gap-2">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  placeholder="Search FIR number, description, location..." 
                  className="pl-11 pr-10 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 w-80 transition-all font-medium" 
                  style={{ color: '#1a1a1a', caretColor: '#f97316' }}
                />
                {searchQuery && (
                  <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>
              <button type="submit" disabled={searching}
                className="px-4 py-2.5 bg-gradient-to-r from-orange-400 to-green-500 text-white rounded-xl text-sm font-medium hover:from-orange-500 hover:to-green-600 transition disabled:opacity-50 flex items-center gap-2">
                {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                {searching ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-4 gap-5 mb-8">
            <StatCard icon={<AlertCircle size={20} />} color="orange" value={stats.activeCases} label="Active Cases" />
            <StatCard icon={<FileText size={20} />} color="green" value={stats.totalCases} label="Total Cases" />
            <StatCard icon={<FileText size={20} />} color="orange" value={stats.documentsGenerated} label="Documents Generated" />
            <StatCard icon={<Shield size={20} />} color="indigo" value="20" label="BharatPol Database" />
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-800">
                  {isSearching ? `Search Results (${displayCases.length})` : 'Recent Cases'}
                </h3>
                {isSearching && searchQuery && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Showing results for "<span className="text-gray-500">{searchQuery}</span>"
                    <button onClick={clearSearch} className="ml-2 text-orange-500 hover:text-orange-600">Clear</button>
                  </p>
                )}
              </div>
              <button onClick={() => setActiveView('search')} className="text-sm text-orange-500 hover:text-orange-600 font-medium">
                Advanced Search
              </button>
            </div>

            <div className="divide-y divide-gray-50">
              {searching && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={32} className="animate-spin text-orange-400" />
                </div>
              )}

              {!searching && displayCases.length === 0 && !isSearching && (
                <div className="px-6 py-16 text-center">
                  <FileText size={40} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-400 font-medium">No cases filed yet</p>
                  <button onClick={() => setActiveView('new-case')} className="mt-3 text-sm text-orange-500 hover:text-orange-600 font-medium">
                    Register your first FIR
                  </button>
                </div>
              )}

              {!searching && isSearching && displayCases.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <Search size={40} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-400 font-medium">No cases found</p>
                  <p className="text-sm text-gray-400 mt-1">Try different keywords or FIR number</p>
                  <button onClick={clearSearch} className="mt-3 text-sm text-orange-500 hover:text-orange-600 font-medium">
                    Show all cases
                  </button>
                </div>
              )}

              {!searching && displayCases.map((c) => (
                <div 
                  key={c.id} 
                  onClick={() => handleCaseClick(c.id)}
                  className="px-6 py-4 flex items-center justify-between hover:bg-orange-50/30 transition cursor-pointer group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800 text-sm">{c.fir_number}</p>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-medium">{c.case_type || 'Other'}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate max-w-md mt-0.5">{c.description || 'No description'}</p>
                    <p className="text-[11px] text-gray-300 mt-1">
                      {c.incident_date || 'N/A'} • {c.incident_location || 'N/A'} • IO: {c.officer_name || 'N/A'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-medium ml-3 flex-shrink-0 ${
                    c.status === 'ACTIVE' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                    c.status === 'CHARGE_SHEET_FILED' ? 'bg-green-50 text-green-600 border border-green-100' :
                    c.status === 'CLOSED' ? 'bg-gray-100 text-gray-500 border border-gray-200' :
                    'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}>
                    {(c.status || 'ACTIVE').replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {!isSearching && (
            <div className="grid grid-cols-4 gap-4 mt-6">
              <button onClick={() => setActiveView('new-case')}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition text-left group">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-orange-100 transition">
                  <FileText size={20} className="text-orange-500" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">Register New FIR</p>
                <p className="text-xs text-gray-400 mt-1">File a new First Information Report</p>
              </button>
              <button onClick={() => setActiveView('search')}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition text-left group">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-100 transition">
                  <Search size={20} className="text-green-500" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">Search Cases</p>
                <p className="text-xs text-gray-400 mt-1">Find cases by FIR, location, or keywords</p>
              </button>
              <button onClick={() => setActiveView('bharatpol')}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition text-left group">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition">
                  <Shield size={20} className="text-indigo-500" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">BharatPol Database</p>
                <p className="text-xs text-gray-400 mt-1">National criminal records & wanted list</p>
              </button>
              <button onClick={() => setActiveView('chat')}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition text-left group">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-100 transition">
                  <AlertCircle size={20} className="text-purple-500" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">AI Legal Assistant</p>
                <p className="text-xs text-gray-400 mt-1">Get legal advice and section suggestions</p>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}