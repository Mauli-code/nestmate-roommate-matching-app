import { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.readSession()
      .then((session) => {
        if (session) {
          setToken(session.token);
          setUser(session.user);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const result = await authApi.login(email, password);
    setToken(result.accessToken);
    setUser(result.user);
    return result;
  }

  async function register(fullName, email, password) {
    const result = await authApi.register(fullName, email, password);
    setToken(result.accessToken);
    setUser(result.user);
    return result;
  }

  async function logout() {
    await authApi.logout(token);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
