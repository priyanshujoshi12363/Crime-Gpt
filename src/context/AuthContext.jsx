import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const result = await window.crimeGPT.checkSetup();
        setNeedsSetup(result.needsSetup);
      } catch (error) {
        console.error('Auth check failed:', error);
        setNeedsSetup(true);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, []);

  const setupAdmin = async (username, password) => {
    const result = await window.crimeGPT.setupAdmin(username, password);
    if (result.success) {
      setNeedsSetup(false);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const login = async (username, password) => {
    const result = await window.crimeGPT.login(username, password);
    if (result.success) {
      setUser(result.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, needsSetup, loading, setupAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}