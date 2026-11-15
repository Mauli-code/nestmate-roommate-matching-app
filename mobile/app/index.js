import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

export default function Index() {
  const { token, profile, profileLoaded, loading } = useAuth();
  if (loading) return null;
  if (!token) return <Redirect href="/(auth)/login" />;
  if (profileLoaded && !profile?.preferences) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
