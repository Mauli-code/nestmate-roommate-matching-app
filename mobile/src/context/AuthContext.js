import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as authApi from '../api/auth';
import { fetchProfile } from '../api/profile';
import { fetchMatches } from '../api/matches';
import { mergeMatches } from '../match-refresh';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [matches, setMatches] = useState([]);

  // Keep a ref so clearSession can be called from anywhere without stale closure
  const tokenRef = useRef(null);

  function clearSession() {
    authApi.logout(tokenRef.current).catch(() => {});
    tokenRef.current = null;
    setToken(null);
    setUser(null);
    setProfile(null);
    setProfileLoaded(false);
    setProfileChecked(false);
    setMatches([]);
  }

  // Auto-logout on any 401 from the API
  function guardedFetch(fn) {
    return fn().catch((err) => {
      if (err?.status === 401) clearSession();
      throw err;
    });
  }

  useEffect(() => {
    async function restore() {
      try {
        const session = await authApi.readSession();
        if (session) {
          tokenRef.current = session.token;
          setToken(session.token);
          setUser(session.user);
          await refreshProfile(session.token);
        }
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []);

  async function refreshProfile(currentToken = token) {
    if (!currentToken) return null;
    setProfileChecked(false);
    try {
      const result = await guardedFetch(() => fetchProfile(currentToken));
      setProfile(result);
      setProfileLoaded(true);
      setProfileChecked(true);
      if (result?.user) setUser(result.user);
      return result;
    } catch {
      setProfileLoaded(false);
      setProfileChecked(true);
      return null;
    }
  }

  const refreshMatches = useCallback(async () => {
    if (!token || !user?.id) return [];
    const result = await guardedFetch(() => fetchMatches(user.id, token));
    setMatches((current) => mergeMatches(current, result.matches, false));
    return result.matches;
  }, [token, user?.id]);

  async function login(email, password) {
    const result = await authApi.login(email, password);
    tokenRef.current = result.accessToken;
    setToken(result.accessToken);
    setUser(result.user);
    await refreshProfile(result.accessToken);
    return result;
  }

  async function register(fullName, email, password) {
    const result = await authApi.register(fullName, email, password);
    tokenRef.current = result.accessToken;
    setToken(result.accessToken);
    setUser(result.user);
    await refreshProfile(result.accessToken);
    return result;
  }

  async function logout() {
    clearSession();
  }

  return (
    <AuthContext.Provider value={{
      token, user, profile, profileLoaded, profileChecked, matches, loading, login, register, logout,
      setUser, refreshProfile, refreshMatches,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
