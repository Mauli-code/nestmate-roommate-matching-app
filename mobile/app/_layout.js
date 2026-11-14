import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { useAuth } from '../src/context/AuthContext';
import { useEffect } from 'react';
import { getAuthRedirect } from '../src/route-guard';

function RouteGuard() {
  const { token, loading, profile, profileLoaded, profileChecked } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const section = segments[0];

  const redirect = getAuthRedirect({ token, section, profileChecked, profileLoaded, profile });

  useEffect(() => {
    if (!loading && redirect) router.replace(redirect);
  }, [loading, redirect, router]);

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
