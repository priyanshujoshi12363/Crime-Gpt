// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, FileText, Clock, AlertCircle, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ activeCases: 0, totalCases: 0, documentsGenerated: 0 });
  const [recentCases, setRecentCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const dashboardStats = await window.crimeGPT.getStats();
    setStats(dashboardStats);

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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚖️</span>
            <div>
              <h1 className="text-lg font-bold">CrimeGPT</h1>
              <p className="text-xs text-gray-400">Offline Mode</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-lg text-white">
            <FileText size={20} />
            <span>Dashboard</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition">
            <Plus size={20} />
            <span>New Case</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition">
            <Clock size={20} />
            <span>Case Diary</span>
          </a>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">{user?.fullName?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-white text-sm">
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
              <p className="text-sm text-gray-500">Welcome back, {user?.fullName}</p>
            </div>
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cases..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none w-64"
                />
              </div>
            </form>
          </div>
        </header>

        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <AlertCircle size={24} className="text-blue-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.activeCases}</p>
              <p className="text-sm text-gray-500 mt-1">Active Cases</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <FileText size={24} className="text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCases}</p>
              <p className="text-sm text-gray-500 mt-1">Total Cases</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <FileText size={24} className="text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.documentsGenerated}</p>
              <p className="text-sm text-gray-500 mt-1">Documents Generated</p>
            </div>
          </div>

          {/* Recent Cases */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Cases</h3>
              <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                View All <ChevronRight size={16} />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {recentCases.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No cases found</p>
                  <p className="text-sm">Create a new case to get started</p>
                </div>
              ) : (
                recentCases.map((caseItem) => (
                  <div key={caseItem.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                    <div>
                      <p className="font-medium text-gray-900">{caseItem.fir_number}</p>
                      <p className="text-sm text-gray-500 truncate max-w-md">{caseItem.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{caseItem.incident_date} • {caseItem.incident_location}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        caseItem.status === 'ACTIVE' ? 'bg-blue-50 text-blue-700' :
                        caseItem.status === 'CHARGE_SHEET_FILED' ? 'bg-green-50 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {caseItem.status}
                      </span>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
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