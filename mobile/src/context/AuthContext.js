import { createContext, useCallback, useContext, useEffect, useState } from 'react';
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
  const [matches, setMatches] = useState([]);

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

  const refreshMatches = useCallback(async () => {
    if (!token || !user?.id) return [];
    const result = await fetchMatches(user.id, token);
    setMatches((current) => mergeMatches(current, result.matches, false));
    return result.matches;
  }, [token, user?.id]);

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
    setMatches([]);
  }

  return (
    <AuthContext.Provider value={{
      token, user, profile, profileLoaded, matches, loading, login, register, logout,
      setUser, refreshProfile, refreshMatches,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
