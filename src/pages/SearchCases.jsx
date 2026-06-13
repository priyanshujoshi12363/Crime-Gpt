// src/pages/SearchCases.jsx
import { useState } from 'react';
import { Search, Filter, ChevronRight, FileText, Calendar, MapPin, ArrowLeft, Eye } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

export default function SearchCases({ onNavigate, onViewCase }) {
  const { user } = useAuth();

  const cases = [
    { id: '1', fir: 'CR-2026-0145', type: 'Theft', date: '2026-06-10', location: 'Ahmedabad, Gujarat', status: 'ACTIVE', officer: 'Rajesh Kumar', description: 'Unknown accused entered complainant house and stole gold jewelry worth Rs. 50,000' },
    { id: '2', fir: 'CR-2026-0144', type: 'Assault', date: '2026-06-09', location: 'Surat, Gujarat', status: 'CHARGE_SHEET_FILED', officer: 'Priya Singh', description: 'Physical assault with deadly weapon causing grievous hurt to victim' },
    { id: '3', fir: 'CR-2026-0143', type: 'Robbery', date: '2026-06-08', location: 'Vadodara, Gujarat', status: 'ACTIVE', officer: 'Rajesh Kumar', description: 'Armed robbery at jewelry shop, items worth Rs. 2 lakhs stolen' },
    { id: '4', fir: 'CR-2026-0142', type: 'Fraud', date: '2026-06-07', location: 'Rajkot, Gujarat', status: 'CLOSED', officer: 'Amit Verma', description: 'Online banking fraud of Rs. 1.5 lakhs through phishing' },
    { id: '5', fir: 'CR-2026-0141', type: 'Kidnapping', date: '2026-06-06', location: 'Bhavnagar, Gujarat', status: 'ACTIVE', officer: 'Priya Singh', description: 'Minor girl kidnapped from school premises, investigation ongoing' },
    { id: '6', fir: 'CR-2026-0140', type: 'Murder', date: '2026-06-05', location: 'Jamnagar, Gujarat', status: 'CHARGE_SHEET_FILED', officer: 'Amit Verma', description: 'Husband murdered wife over dowry dispute, accused arrested' },
    { id: '7', fir: 'CR-2026-0139', type: 'Cyber Crime', date: '2026-06-04', location: 'Gandhinagar, Gujarat', status: 'ACTIVE', officer: 'Rajesh Kumar', description: 'Social media account hacked and used for defamation' }
  ];

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
              <p className="text-sm text-gray-400">Find and retrieve case records</p>
            </div>
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
                    placeholder="Search by FIR number, case type, location, or description..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-300"
                  />
                </div>
                <button className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition flex items-center gap-2">
                  <Filter size={16} /> Filters
                </button>
                <button className="px-6 py-3 bg-gradient-to-r from-orange-400 to-green-500 text-white rounded-xl text-sm font-medium hover:from-orange-500 hover:to-green-600 transition flex items-center gap-2">
                  <Search size={16} /> Search
                </button>
              </div>
              
              {/* Filter Chips */}
              <div className="flex flex-wrap gap-2 mt-4">
                {['All', 'Theft', 'Murder', 'Assault', 'Robbery', 'Fraud', 'Kidnapping', 'Cyber Crime'].map((filter) => (
                  <button
                    key={filter}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      filter === 'All' 
                        ? 'bg-gradient-to-r from-orange-400 to-green-500 text-white' 
                        : 'bg-gray-50 text-gray-500 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800">
                  {cases.length} Cases Found
                </h3>
                <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-500">
                  <option>Newest First</option>
                  <option>Oldest First</option>
                  <option>Active Cases</option>
                  <option>Closed Cases</option>
                </select>
              </div>
              <div className="divide-y divide-gray-50">
                {cases.map((c) => (
                  <div 
                    key={c.id} 
                    onClick={() => onViewCase && onViewCase(c.id)}
                    className="px-6 py-4 flex items-center justify-between hover:bg-orange-50/30 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-green-100 rounded-xl flex items-center justify-center">
                        <FileText size={18} className="text-orange-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-gray-800">{c.fir}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            c.status === 'ACTIVE' ? 'bg-orange-50 text-orange-600' :
                            c.status === 'CHARGE_SHEET_FILED' ? 'bg-green-50 text-green-600' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {c.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xl">{c.description}</p>
                        <div className="flex items-center gap-4 mt-1.5">
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar size={12} /> {c.date}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin size={12} /> {c.location}
                          </span>
                          <span className="text-xs text-gray-400">IO: {c.officer}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-gray-50 rounded-lg text-xs font-medium text-gray-500">{c.type}</span>
                      <button className="p-2 hover:bg-orange-50 rounded-lg transition opacity-0 group-hover:opacity-100">
                        <Eye size={16} className="text-orange-500" />
                      </button>
                      <ChevronRight size={18} className="text-gray-300 group-hover:text-orange-500 transition" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}