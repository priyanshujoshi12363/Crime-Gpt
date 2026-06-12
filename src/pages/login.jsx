// src/pages/Login.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

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
    
    if (!result.success) {
      setError(result.error || 'Invalid credentials');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-green-50 to-green-100 flex items-center justify-center p-4 relative">
      {/* Dotted pattern background */}
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-xl shadow-lg shadow-orange-500/20 mb-3">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-orange-500 tracking-tight">CrimeGPT</h1>
          <p className="text-gray-500 text-[10px] font-medium uppercase tracking-widest mt-1">
            Law Enforcement Intelligence Suite
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#E8F5E9] rounded-2xl shadow-xl p-8 border border-green-100">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-700">Secure Login</h2>
            <p className="text-gray-500 text-xs mt-0.5">Enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-xs">
                {error}
              </div>
            )}

            {/* Username Field */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Badge ID / Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your credentials"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-gray-600">Password</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-orange-500/20 hover:shadow-orange-500/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Hardware Token Note */}
          <div className="mt-4 p-3 bg-white/60 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-green-600" />
              <p className="text-[10px] text-gray-600">
                Use your hardware token if required by your department's multi-factor authentication policy.
              </p>
            </div>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex justify-center gap-4 mt-4 text-[10px] text-gray-400">
          <span className="hover:text-gray-600 cursor-pointer">English</span>
          <span>•</span>
          <span className="hover:text-gray-600 cursor-pointer">हिन्दी</span>
          <span>•</span>
          <span className="hover:text-gray-600 cursor-pointer">ਪੰਜਾਬੀ</span>
        </div>

        {/* Bottom Warning */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 mb-1">
            <Shield size={12} className="text-red-500" />
            <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Authorized Personnel Only</p>
          </div>
          <p className="text-[9px] text-gray-500 max-w-xs mx-auto leading-relaxed">
            This system contains classified law enforcement data. Unauthorized access is a federal offense. All actions on this workstation are monitored and logged.
          </p>
          <p className="text-[8px] text-gray-400 mt-2">
            System ID: CR-NODC-8821 • v4.2.1-stable
          </p>
        </div>
      </div>
    </div>
  );
}