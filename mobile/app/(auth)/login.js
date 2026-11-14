import { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Button, Input } from '../../src/components';
import { useAuth } from '../../src/context/AuthContext';
import { validateEmail } from '../../src/validation';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    const nextErrors = { email: validateEmail(email) };
    if (!password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    setMessage('');
    if (Object.values(nextErrors).some(Boolean)) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      setErrors(error.errors || {});
      setMessage(error.message || 'Could not log in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>NestMate</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to see your roommate matches.</Text>
        {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
        <Input label="Email" value={email} onChangeText={setEmail} error={errors.email}
          placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address"
          autoComplete="email" returnKeyType="next" />
        <Input label="Password" value={password} onChangeText={setPassword} error={errors.password}
          placeholder="Your password" secureTextEntry={!showPassword} autoCapitalize="none"
          autoComplete="password" returnKeyType="done" onSubmitEditing={submit}
          rightIcon={<Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textSecondary} />}
          onRightIconPress={() => setShowPassword(!showPassword)} />
        <Button title="Log in" onPress={submit} loading={loading} disabled={loading} fullWidth />
        <View style={styles.linkRow}>
          <Text style={styles.linkText}>New to NestMate? </Text>
          <Link href="/(auth)/register" style={styles.link}>Create an account</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: SPACING.xl },
  brand: { color: COLORS.primary, fontSize: TYPOGRAPHY.lg.fontSize, fontWeight: '700', marginBottom: SPACING.xl },
  title: { color: COLORS.navyDark, fontSize: TYPOGRAPHY.xxl.fontSize, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, marginTop: SPACING.xs, marginBottom: SPACING.xl },
  message: { color: COLORS.danger, marginBottom: SPACING.md },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
  linkText: { color: COLORS.textSecondary },
  link: { color: COLORS.primary, fontWeight: '600' },
});
