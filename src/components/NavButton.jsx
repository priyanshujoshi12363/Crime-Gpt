export default function NavButton({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
        active 
          ? 'bg-gradient-to-r from-orange-400 to-green-500 text-white shadow-lg shadow-orange-200' 
          : 'text-gray-500 hover:text-gray-700 hover:bg-orange-50'
      }`}
    >
      <span className={active ? 'text-white' : 'text-gray-400 group-hover:text-orange-500'}>{icon}</span>
      <span className="flex-1 text-left font-medium">{label}</span>
      {badge && <span>{badge}</span>}
    </button>
  );
}