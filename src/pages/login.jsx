// src/pages/Login.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Lock, Eye, EyeOff, ArrowRight, Loader2, Globe, Sparkles } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'gu', label: 'ગુજરાતી' },
];

const TEXT = {
  en: { 
    signIn: 'Sign in to continue', username: 'Username', password: 'Password',
    btn: 'Sign In', footer: 'Encrypted • Offline • Secure',
    placeholder_user: 'Enter your username', placeholder_pass: 'Enter your password',
    error_empty: 'All fields are required', error_invalid: 'Invalid credentials',
  },
  hi: { 
    signIn: 'जारी रखने के लिए साइन इन करें', username: 'उपयोगकर्ता नाम', password: 'पासवर्ड',
    btn: 'साइन इन', footer: 'एन्क्रिप्टेड • ऑफलाइन • सुरक्षित',
    placeholder_user: 'उपयोगकर्ता नाम दर्ज करें', placeholder_pass: 'पासवर्ड दर्ज करें',
    error_empty: 'सभी फील्ड आवश्यक हैं', error_invalid: 'अमान्य क्रेडेंशियल',
  },
  gu: { 
    signIn: 'ચાલુ રાખવા સાઇન ઇન કરો', username: 'વપરાશકર્તા નામ', password: 'પાસવર્ડ',
    btn: 'સાઇન ઇન', footer: 'એન્ક્રિપ્ટેડ • ઑફલાઇન • સુરક્ષિત',
    placeholder_user: 'વપરાશકર્તા નામ દાખલ કરો', placeholder_pass: 'પાસવર્ડ દાખલ કરો',
    error_empty: 'બધા ફિલ્ડ જરૂરી છે', error_invalid: 'અમાન્ય ઓળખપત્રો',
  },
};

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('en');
  const t = TEXT[lang];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError(t.error_empty);
      return;
    }
    setLoading(true);
    const result = await login(username, password);
    if (!result.success) setError(result.error || t.error_invalid);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 40%, #F0FFF4 100%)' }}>
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <img src="./logo1.png" alt="CrimeGPT" className="w-24 h-24 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">CrimeGPT</h1>
          <p className="text-gray-500 text-sm mt-1">{t.signIn}</p>
          
          {/* Language Switcher */}
          <div className="flex items-center justify-center gap-1 mt-4 bg-gray-100 rounded-xl p-1 inline-flex">
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  lang === l.code ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {l.label}
              </button>
            ))}
          </div>
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
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">{t.username}</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.placeholder_user}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-all"
                  required autoFocus />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">{t.password}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.placeholder_pass}
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent focus:bg-white transition-all"
                  required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-orange-400 via-orange-500 to-green-500 text-white rounded-xl font-semibold text-sm hover:from-orange-500 hover:via-orange-600 hover:to-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-200 hover:shadow-orange-300 flex items-center justify-center gap-2 relative overflow-hidden group">
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>{t.btn}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">{t.footer}</p>
      </div>
    </div>
  );
}