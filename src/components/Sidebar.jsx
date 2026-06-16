import { FileText, Plus, Clock, MessageSquare, Zap, Search, Shield } from 'lucide-react';
import NavButton from './NavButton';

export default function Sidebar({ user, activeView, onNavigate, onLogout }) {
  return (
    <aside 
      className="w-64 flex flex-col relative overflow-hidden border-r border-orange-100"
      style={{ background: 'linear-gradient(180deg, #FFF8F0 0%, #FFFFFF 30%, #F0FFF4 100%)' }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-400/10 rounded-full blur-3xl -ml-12 -mb-12" />
      
      <div className="relative p-5 border-b border-orange-100">
        <div className="flex items-center gap-3">
          <img 
            src="./logo1.png" 
            alt="CrimeGPT Logo" 
            className="w-10 h-10 rounded-xl object-contain"
          />
          <div>
            <h1 className="text-lg font-bold text-gray-800">CrimeGPT</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <p className="text-[10px] text-green-600 font-medium">Offline Ready</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="relative flex-1 p-3 space-y-1">
        <NavButton 
          icon={<FileText size={18} />} 
          label="Dashboard" 
          active={activeView === 'dashboard'} 
          onClick={() => onNavigate('dashboard')} 
        />
        <NavButton 
          icon={<Plus size={18} />} 
          label="New Case" 
          active={activeView === 'new-case'} 
          onClick={() => onNavigate('new-case')} 
        />
        <NavButton 
          icon={<Search size={18} />} 
          label="Search Cases" 
          active={activeView === 'search'} 
          onClick={() => onNavigate('search')} 
        />
        <NavButton 
          icon={<Shield size={18} />} 
          label="BharatPol" 
          active={activeView === 'bharatpol'} 
          onClick={() => onNavigate('bharatpol')} 
        />
        <NavButton 
          icon={<MessageSquare size={18} />} 
          label="AI Chat" 
          active={activeView === 'chat'} 
          onClick={() => onNavigate('chat')} 
          badge={<Zap size={10} className="text-orange-500" />} 
        />
      </nav>

      <div className="relative p-4 border-t border-orange-100">
        <div className="flex items-center gap-3 px-2 py-2 bg-gradient-to-r from-orange-50 to-green-50 rounded-xl border border-orange-100">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md">
            {user?.fullName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-gray-700">{user?.fullName}</p>
            <p className="text-[10px] text-green-600 font-medium">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}