import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    const result = await login(username, password);
    if (!result.success) setError(result.error || 'Invalid credentials');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">   <img 
  src="./logo1.png" 
  alt="CrimeGPT" 
  className="w-24 h-24 object-contain mx-auto mb-4"
/>
          <h1 className="text-2xl font-bold text-gray-800">CrimeGPT</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to continue</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-100/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-xs font-bold">!</div>
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-orange-400 via-orange-500 to-green-500 text-white rounded-xl font-semibold text-sm hover:from-orange-500 hover:via-orange-600 hover:to-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-200 hover:shadow-orange-300 flex items-center justify-center gap-2 relative overflow-hidden group"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span className="group-hover:translate-x-0.5 transition-transform">Sign In</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          Encrypted • Offline • Secure
        </p>
      </div>
    </div>
  );
}