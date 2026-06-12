import { AuthProvider, useAuth } from './context/AuthContext';
import Setup from './pages/Setup';
import Login from './pages/Login';
import AISetup from './pages/AISetup';
import Dashboard from './pages/Dashboard';
import { useState, useEffect } from 'react';
import { Shield, Loader2 } from 'lucide-react';

function AppContent() {
  const { user, needsSetup, loading } = useAuth();
  const [aiReady, setAiReady] = useState(false);
  const [checkingAI, setCheckingAI] = useState(true);

  useEffect(() => {
    async function checkAI() {
      try {
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 5000)
        );
        
        const check = window.crimeGPT.checkAISetup();
        const status = await Promise.race([check, timeout]);
        
        setAiReady(status.ready);
      } catch (error) {
        console.error('AI check failed:', error);
        setAiReady(true);
      } finally {
        setCheckingAI(false);
      }
    }
    checkAI();
  }, []);

  if (loading || checkingAI) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-green-400 rounded-full animate-pulse opacity-20" />
            <div className="absolute inset-2 bg-white rounded-full" />
            <Shield size={36} className="relative z-10 text-orange-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">CrimeGPT</h1>
          <p className="text-gray-500 text-sm mb-6">Initializing System</p>
          
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-xs">Checking system requirements...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!aiReady) {
    return <AISetup onComplete={() => setAiReady(true)} />;
  }

  if (needsSetup) {
    return <Setup />;
  }

  if (!user) {
    return <Login />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}