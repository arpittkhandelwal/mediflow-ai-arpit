import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, getCurrentSession } from '../services/supabase';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [token,   setToken]   = useState(localStorage.getItem('mediflow_token'));

  // On mount: check stored session OR Supabase OAuth session
  useEffect(() => {
    const init = async () => {
      try {
        // Check Supabase session (handles Google OAuth callback)
        const session = await getCurrentSession();
        if (session) {
          const t = session.access_token;
          localStorage.setItem('mediflow_token', t);
          setToken(t);

          // Sync user profile to backend
          const storedUser = localStorage.getItem('mediflow_user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            try {
              const { user: profile } = await authAPI.me();
              setUser(profile);
              localStorage.setItem('mediflow_user', JSON.stringify(profile));
            } catch {
              setUser({ id: session.user.id, email: session.user.email, role: null });
            }
          }
        }
      } catch (e) {
        console.error('Auth init error:', e);
      } finally {
        setLoading(false);
      }
    };

    init();

    // Listen for Supabase auth state changes (OAuth callbacks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const t = session.access_token;
        localStorage.setItem('mediflow_token', t);
        setToken(t);
        try {
          const { user: profile } = await authAPI.me();
          setUser(profile);
          localStorage.setItem('mediflow_user', JSON.stringify(profile));
        } catch {}
      } else if (event === 'SIGNED_OUT') {
        clearAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('mediflow_token');
    localStorage.removeItem('mediflow_user');
    setUser(null);
    setToken(null);
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('mediflow_token', res.token);
    localStorage.setItem('mediflow_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const signup = async (data) => {
    const res = await authAPI.signup(data);
    if (res.session?.access_token) {
      localStorage.setItem('mediflow_token', res.session.access_token);
      setToken(res.session.access_token);
    }
    setUser(res.user);
    localStorage.setItem('mediflow_user', JSON.stringify(res.user));
    return res;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    await supabase.auth.signOut();
    clearAuth();
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
