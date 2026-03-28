import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiLogout, apiCheckSession } from '../api';

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
    apiCheckSession()
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => {
        // No valid session — just stay logged out
      })
      .finally(() => setLoading(false));
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

  // Show nothing while checking session to prevent flash of login page
  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: '#1a1a2e', color: '#a29bfe',
        fontSize: '16px', fontFamily: 'Inter, sans-serif',
      }}>
        Loading…
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

