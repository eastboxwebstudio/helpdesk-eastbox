import { createContext, useContext, useMemo, useState } from 'react';
import { api, initializeAuthFromStorage, setAuthToken } from '../lib/api';

const AuthContext = createContext(null);

const readUserFromStorage = () => {
  const userRaw = localStorage.getItem('eastbox_user');
  return userRaw ? JSON.parse(userRaw) : null;
};

export function AuthProvider({ children }) {
  const initialToken = initializeAuthFromStorage();
  const [token, setToken] = useState(initialToken);
  const [user, setUser] = useState(readUserFromStorage());

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userInfo } = response.data;
    setAuthToken(newToken);
    localStorage.setItem('eastbox_user', JSON.stringify(userInfo));
    setToken(newToken);
    setUser(userInfo);
    return userInfo;
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem('eastbox_user');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, user, login, logout, isAuthenticated: Boolean(token) }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
