import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiLogout, apiCheckSession } from '../api';
import SplashScreen from '../components/SplashScreen';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking session

  // On mount: ask the server if we have a valid session (cookie is sent automatically)
  useEffect(() => {
    // Remove the pre-React HTML splash as soon as React mounts
    // so our animated React SplashScreen can be seen during the cold start delay
    const htmlSplash = document.getElementById('pre-react-splash');
    if (htmlSplash) htmlSplash.remove();

    apiCheckSession()
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => {
        // No valid session — just stay logged out
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Called after successful login/register — server already set the cookie
  const login = useCallback((_token, userData) => {
    // _token is ignored (kept for call-site compatibility), cookie is already set
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try { await apiLogout(); } catch { /* ignore */ }
    setUser(null);
  }, []);

  const isAuthenticated = !!user;

  // Show animated splash screen while checking session (covers Render cold starts)
  if (loading) {
    return <SplashScreen />;
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

