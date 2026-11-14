import { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';
import { fetchProfile } from '../api/profile';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    async function restore() {
      try {
        const session = await authApi.readSession();
        if (session) {
          setToken(session.token);
          setUser(session.user);
          await refreshProfile(session.token);
        }
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []);

  async function refreshProfile(currentToken = token) {
    if (!currentToken) return null;
    try {
      const result = await fetchProfile(currentToken);
      setProfile(result);
      setProfileLoaded(true);
      if (result?.user) setUser(result.user);
      return result;
    } catch {
      setProfileLoaded(false);
      return null;
    }
  }

  async function login(email, password) {
    const result = await authApi.login(email, password);
    setToken(result.accessToken);
    setUser(result.user);
    await refreshProfile(result.accessToken);
    return result;
  }

  async function register(fullName, email, password) {
    const result = await authApi.register(fullName, email, password);
    setToken(result.accessToken);
    setUser(result.user);
    await refreshProfile(result.accessToken);
    return result;
  }

  async function logout() {
    await authApi.logout(token);
    setToken(null);
    setUser(null);
    setProfile(null);
    setProfileLoaded(false);
  }

  return (
    <AuthContext.Provider value={{
      token, user, profile, profileLoaded, loading, login, register, logout,
      setUser, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
