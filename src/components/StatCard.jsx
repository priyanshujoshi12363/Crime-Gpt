export default function StatCard({ icon, color, value, label }) {
  const gradients = {
    orange: 'from-orange-50 to-orange-100/50',
    green: 'from-green-50 to-green-100/50'
  };
  const iconColors = { orange: 'text-orange-500', green: 'text-green-500' };
  const borders = { orange: 'border-orange-100 hover:border-orange-200', green: 'border-green-100 hover:border-green-200' };

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all duration-300 ${borders[color]}`}>
      <div className={`w-11 h-11 bg-gradient-to-br ${gradients[color]} rounded-xl flex items-center justify-center mb-4 shadow-sm`}>
        <div className={iconColors[color]}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </div>
  );
}