import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { api, setCsrfToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, authenticated: false, user: null });

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/session');
      setCsrfToken(data.csrfToken);
      setState({ loading: false, authenticated: data.authenticated, user: data.user || null });
    } catch {
      setState({ loading: false, authenticated: false, user: null });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    setCsrfToken(data.csrfToken);
    setState({ loading: false, authenticated: true, user: data.user });
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setCsrfToken('');
    setState({ loading: false, authenticated: false, user: null });
  };

  const value = useMemo(() => ({ ...state, login, logout, refresh }), [state, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }

export function ProtectedRoute() {
  const auth = useAuth();
  const location = useLocation();
  if (auth.loading) return <div className="page-loader"><span /></div>;
  if (!auth.authenticated) return <Navigate to="/finance/login" state={{ from: location }} replace />;
  return <Outlet />;
}
