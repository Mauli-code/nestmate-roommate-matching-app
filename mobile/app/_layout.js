import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar style="dark" />
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
