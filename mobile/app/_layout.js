import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { useAuth } from '../src/context/AuthContext';
import { useEffect } from 'react';

function RouteGuard() {
  const { token, loading, profile, profileLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const section = segments[0];

  useEffect(() => {
    if (loading) return;
    if (!token && section !== '(auth)') router.replace('/(auth)/login');
    if (token && section === '(auth)' && profileLoaded) {
      router.replace(profile?.preferences ? '/(tabs)' : '/onboarding');
    }
    if (token && profileLoaded && !profile?.preferences && section !== 'onboarding') {
      router.replace('/onboarding');
    }
    if (token && profileLoaded && profile?.preferences && section === 'onboarding') {
      router.replace('/(tabs)');
    }
  }, [loading, token, profile, profileLoaded, section, router]);

  if (loading || (!token && section !== '(auth)')) return null;
  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <RouteGuard />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#F8FAFC' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="roommate/[id]" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="property/[id]" options={{ headerShown: false, presentation: 'card' }} />
        </Stack>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
