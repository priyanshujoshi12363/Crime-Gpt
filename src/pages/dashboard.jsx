import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import AIChat from './AIChat';
import NewCase from './NewCase';
import SearchCases from './SearchCases';
import CaseDetail from './CaseDetail';
import { Search, FileText, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ activeCases: 0, totalCases: 0, documentsGenerated: 0 });
  const [recentCases, setRecentCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    const s = await window.crimeGPT.getStats();
    setStats(s);
    const cases = await window.crimeGPT.getAllCases();
    setRecentCases(cases.slice(0, 5));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const results = await window.crimeGPT.searchCases(searchQuery);
      setRecentCases(results);
    } else {
      loadDashboard();
    }
  };

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

  if (activeView === 'diary') {
    return (
      <SearchCases 
        onNavigate={setActiveView} 
        onViewCase={(id) => { setSelectedCase(id); setActiveView('case-detail'); }} 
      />
    );
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
            <form onSubmit={handleSearch} className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search cases..." className="pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 w-72 transition-all" />
            </form>
          </div>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-3 gap-5 mb-8">
            <StatCard icon={<AlertCircle size={20} />} color="orange" value={stats.activeCases} label="Active Cases" />
            <StatCard icon={<FileText size={20} />} color="green" value={stats.totalCases} label="Total Cases" />
            <StatCard icon={<FileText size={20} />} color="orange" value={stats.documentsGenerated} label="Documents" />
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">Recent Cases</h3>
              <button onClick={() => setActiveView('search')} className="text-sm text-orange-500 hover:text-orange-600 font-medium">
                View All
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {recentCases.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <FileText size={40} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-400 font-medium">No cases found</p>
                  <button onClick={() => setActiveView('new-case')} className="mt-3 text-sm text-orange-500 hover:text-orange-600 font-medium">
                    Create your first case
                  </button>
                </div>
              ) : (
                recentCases.map((c) => (
                  <div 
                    key={c.id} 
                    onClick={() => { setSelectedCase(c.id); setActiveView('case-detail'); }}
                    className="px-6 py-4 flex items-center justify-between hover:bg-orange-50/30 transition cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{c.fir_number}</p>
                      <p className="text-xs text-gray-400 truncate max-w-md mt-0.5">{c.description}</p>
                      <p className="text-[11px] text-gray-300 mt-1">{c.incident_date} • {c.incident_location}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-medium ${c.status === 'ACTIVE' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                      {c.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}