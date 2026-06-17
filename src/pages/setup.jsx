// src/pages/Setup.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Lock, Eye, EyeOff, ArrowRight, Check, X } from 'lucide-react';

export default function Setup() {
  const { setupAdmin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordChecks = {
    length: password.length >= 6,
    hasNumber: /\d/.test(password),
    hasUpper: /[A-Z]/.test(password),
    match: password && password === confirmPassword
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('All fields are required');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!passwordChecks.length || !passwordChecks.hasNumber || !passwordChecks.hasUpper) {
      setError('Password must meet all requirements');
      return;
    }

    if (!passwordChecks.match) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await setupAdmin(username, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-5xl flex flex-col md:flex-row min-h-[600px]">
        
        {/* LEFT PANEL */}
        <div className="w-full md:w-2/5 p-8 md:p-10 flex flex-col justify-between relative overflow-hidden bg-[#0a1628]">
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="diagonal" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="40" stroke="#fff" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#diagonal)" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <Shield size={24} className="text-orange-500" />
              <span className="text-xl font-bold text-white">CrimeGPT</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              Digital Empowerment<br />
              <span className="text-orange-400">for Indian Law</span><br />
              <span className="text-green-400">Enforcement</span>
            </h2>
            <p className="text-blue-200/80 text-sm md:text-base leading-relaxed">
              Join the next generation of case management. Secure, efficient, and intelligent tools designed for the modern officer.
            </p>
          </div>

          <div className="relative z-10 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-white text-xs font-semibold flex items-center gap-2">
                <Shield size={14} className="text-orange-400" />
                Offline & Encrypted
              </p>
              <p className="text-blue-200/60 text-xs mt-1">
                All data stored locally. No internet required. AES-256 encryption at rest.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full md:w-3/5 p-8 md:p-10 bg-white">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Create Admin Account</h3>
            <p className="text-gray-500 text-sm mt-1">Set up your credentials to access the station dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">!</div>
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    {passwordChecks.length ? <Check size={12} className="text-green-600" /> : <X size={12} className="text-red-400" />}
                    <span className={passwordChecks.length ? 'text-green-700' : 'text-red-500'}>At least 6 characters</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {passwordChecks.hasNumber ? <Check size={12} className="text-green-600" /> : <X size={12} className="text-red-400" />}
                    <span className={passwordChecks.hasNumber ? 'text-green-700' : 'text-red-500'}>Contains a number</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {passwordChecks.hasUpper ? <Check size={12} className="text-green-600" /> : <X size={12} className="text-red-400" />}
                    <span className={passwordChecks.hasUpper ? 'text-green-700' : 'text-red-500'}>Contains uppercase letter</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  required
                />
              </div>
              {confirmPassword && (
                <div className="flex items-center gap-2 mt-1 text-xs">
                  {passwordChecks.match ? <Check size={12} className="text-green-600" /> : <X size={12} className="text-red-400" />}
                  <span className={passwordChecks.match ? 'text-green-700' : 'text-red-500'}>Passwords match</span>
                </div>
              )}
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 text-xs font-bold">!</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-orange-800">Security Notice</p>
                <p className="text-xs text-orange-700/80">This account will be stored locally on this machine. Choose a strong password to protect sensitive case data.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
<div className="text-center mt-4">
            <button 
              onClick={() => window.location.reload()}
              className="text-sm text-orange-500 hover:text-orange-600 font-medium"
            >
              Already have an account? Sign In
            </button>
          </div>
          <div className="flex justify-center gap-6 mt-6 text-[10px] text-gray-400">
            <span className="hover:text-gray-600 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-600 cursor-pointer">Offline Secure</span>
            <span className="hover:text-gray-600 cursor-pointer">v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}