// src/pages/SearchCases.jsx
import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ChevronRight, FileText, Calendar, MapPin, ArrowLeft, Eye, X, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const CASE_TYPES = ['All', 'Theft', 'Murder', 'Assault', 'Robbery', 'Fraud', 'Kidnapping', 'Cyber Crime', 'Dowry', 'Domestic Violence', 'Rape', 'Other'];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active Cases' },
  { value: 'CHARGE_SHEET_FILED', label: 'Charge Sheet Filed' },
  { value: 'CLOSED', label: 'Closed Cases' },
];

export default function SearchCases({ onNavigate, onViewCase }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [allCases, setAllCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Load all cases on mount
  useEffect(() => {
    loadCases();
  }, []);

  // Filter and sort whenever dependencies change
  useEffect(() => {
    applyFilters();
  }, [allCases, searchQuery, activeFilter, statusFilter, sortBy]);

  const loadCases = async () => {
    setLoading(true);
    try {
      const cases = await window.crimeGPT.getAllCases();
      setAllCases(cases || []);
    } catch (err) {
      console.error('Failed to load cases:', err);
      setAllCases([]);
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If search is empty, reload all cases
      await loadCases();
      return;
    }

    setSearching(true);
    try {
      // Use the IPC search which searches FIR number, description, and location
      const results = await window.crimeGPT.searchCases(searchQuery.trim());
      setAllCases(results || []);
    } catch (err) {
      console.error('Search failed:', err);
    }
    setSearching(false);
  };

  // Real-time search as user types (with debounce)
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // If field is cleared, reload all
    if (!value.trim()) {
      loadCases();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const applyFilters = () => {
    let result = [...allCases];

    // Filter by case type
    if (activeFilter !== 'All') {
      result = result.filter(c => 
        (c.case_type || '').toLowerCase() === activeFilter.toLowerCase()
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at || b.incident_date) - new Date(a.created_at || a.incident_date));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at || a.incident_date) - new Date(b.created_at || b.incident_date));
        break;
      case 'active':
        result = result.filter(c => c.status === 'ACTIVE');
        break;
      case 'closed':
        result = result.filter(c => c.status === 'CLOSED');
        break;
      default:
        break;
    }

    setFilteredCases(result);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveFilter('All');
    setStatusFilter('all');
    setSortBy('newest');
    loadCases();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'CHARGE_SHEET_FILED':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'CLOSED':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'UNDER_INVESTIGATION':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const hasActiveFilters = searchQuery || activeFilter !== 'All' || statusFilter !== 'all';

  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={user} activeView="search" onNavigate={onNavigate} />
      
      <main className="flex-1 overflow-auto" style={{ background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 40%, #F0FFF4 100%)' }}>
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('dashboard')} className="p-2 hover:bg-gray-50 rounded-xl transition text-gray-400 hover:text-gray-600">
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-800">Search Cases</h2>
              <p className="text-sm text-gray-400">Find and retrieve case records from database</p>
            </div>
            {/* Refresh button */}
            <button 
              onClick={loadCases} 
              className="px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition"
              title="Refresh"
            >
              Refresh
            </button>
          </div>
        </header>

        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Search Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Search by FIR number, case type, location, description, or officer name..."
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition font-medium"
                    style={{ color: '#111827', caretColor: '#f97316' }}
                  />
                </div>
                <button 
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-6 py-3 bg-gradient-to-r from-orange-400 to-green-500 text-white rounded-xl text-sm font-medium hover:from-orange-500 hover:to-green-600 transition flex items-center gap-2 shadow-lg shadow-orange-200 disabled:opacity-50"
                >
                  {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
              
              {/* Filters Row */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {/* Case Type Filters */}
                {CASE_TYPES.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeFilter === filter
                        ? 'bg-gradient-to-r from-orange-400 to-green-500 text-white shadow-sm' 
                        : 'bg-gray-50 text-gray-500 hover:bg-orange-50 hover:text-orange-600 border border-gray-100'
                    }`}
                  >
                    {filter}
                  </button>
                ))}

                {/* Separator */}
                <div className="w-px h-5 bg-gray-200 mx-2" />

                {/* Status Filter */}
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-500 border border-gray-100 hover:bg-orange-50 hover:text-orange-600 cursor-pointer transition"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                {/* Sort */}
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-500 border border-gray-100 hover:bg-orange-50 hover:text-orange-600 cursor-pointer transition"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>

                {/* Clear filters */}
                {hasActiveFilters && (
                  <button 
                    onClick={clearFilters}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 transition flex items-center gap-1"
                  >
                    <X size={12} /> Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800">
                  {loading ? 'Loading...' : `${filteredCases.length} Case${filteredCases.length !== 1 ? 's' : ''} Found`}
                </h3>
                {hasActiveFilters && !loading && (
                  <p className="text-xs text-gray-400">
                    Filtered from {allCases.length} total case{allCases.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={40} className="animate-spin text-orange-400" />
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredCases.length === 0 && (
                <div className="text-center py-16">
                  <FileText size={48} className="text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No cases found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {hasActiveFilters 
                      ? 'Try adjusting your search or filters' 
                      : 'Register a new case to get started'}
                  </p>
                  {hasActiveFilters && (
                    <button 
                      onClick={clearFilters}
                      className="mt-4 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200 transition"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              )}

              {/* Case List */}
              {!loading && (
                <div className="divide-y divide-gray-50">
                  {filteredCases.map((c) => (
                    <div 
                      key={c.id} 
                      onClick={() => onViewCase && onViewCase(c.id)}
                      className="px-6 py-4 flex items-center justify-between hover:bg-orange-50/30 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText size={18} className="text-orange-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="font-semibold text-gray-800 text-sm">{c.fir_number}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(c.status)}`}>
                              {(c.status || 'ACTIVE').replace(/_/g, ' ')}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-medium text-gray-500">
                              {c.case_type || 'Other'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xl">
                            {c.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Calendar size={12} /> {c.incident_date || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <MapPin size={12} /> {c.incident_location || 'N/A'}
                            </span>
                            <span className="text-xs text-gray-400">
                              IO: {c.officer_name || 'N/A'}
                            </span>
                            {/* Show sections if available */}
                            {c.applied_sections && Array.isArray(c.applied_sections) && c.applied_sections.length > 0 && (
                              <span className="text-xs text-gray-400">
                                Sections: {c.applied_sections.slice(0, 2).map(s => `${s.law || ''} ${s.section || ''}`).join(', ')}
                                {c.applied_sections.length > 2 && ` +${c.applied_sections.length - 2} more`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onViewCase && onViewCase(c.id); }}
                          className="p-2 hover:bg-orange-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                          title="View Case"
                        >
                          <Eye size={16} className="text-orange-500" />
                        </button>
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-orange-500 transition" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            {!loading && allCases.length > 0 && (
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
                  <p className="text-2xl font-bold text-gray-800">{allCases.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Total Cases</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
                  <p className="text-2xl font-bold text-orange-500">{allCases.filter(c => c.status === 'ACTIVE').length}</p>
                  <p className="text-xs text-gray-400 mt-1">Active</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
                  <p className="text-2xl font-bold text-blue-500">{allCases.filter(c => c.status === 'CHARGE_SHEET_FILED').length}</p>
                  <p className="text-xs text-gray-400 mt-1">Charge Sheet Filed</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
                  <p className="text-2xl font-bold text-green-500">{allCases.filter(c => c.status === 'CLOSED').length}</p>
                  <p className="text-xs text-gray-400 mt-1">Closed</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}