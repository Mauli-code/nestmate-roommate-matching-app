import { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Button, Input } from '../../src/components';
import { useAuth } from '../../src/context/AuthContext';
import { hasErrors, validateRegistration } from '../../src/validation';
import { COLORS, SPACING, TYPOGRAPHY } from '../../src/constants/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [values, setValues] = useState({ fullName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  }

  async function submit() {
    const nextErrors = validateRegistration(values);
    setErrors(nextErrors);
    setMessage('');
    if (hasErrors(nextErrors)) return;
    setLoading(true);
    try {
      await register(values.fullName.trim(), values.email.trim(), values.password);
    } catch (error) {
      setErrors(error.errors || {});
      setMessage(error.message || 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>NestMate</Text>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Start with a few details. You can add your preferences next.</Text>
        {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
        <Input label="Full name" value={values.fullName} onChangeText={(value) => update('fullName', value)}
          error={errors.fullName} placeholder="Your name" autoComplete="name" returnKeyType="next" />
        <Input label="Email" value={values.email} onChangeText={(value) => update('email', value)}
          error={errors.email} placeholder="you@example.com" autoCapitalize="none"
          keyboardType="email-address" autoComplete="email" returnKeyType="next" />
        <Input label="Password" value={values.password} onChangeText={(value) => update('password', value)}
          error={errors.password} placeholder="At least 8 characters" secureTextEntry={!showPassword}
          autoCapitalize="none" autoComplete="new-password" returnKeyType="done" onSubmitEditing={submit}
          rightIcon={<Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textSecondary} />}
          onRightIconPress={() => setShowPassword(!showPassword)} />
        <Button title="Create account" onPress={submit} loading={loading} disabled={loading} fullWidth />
        <View style={styles.linkRow}>
          <Text style={styles.linkText}>Already have an account? </Text>
          <Link href="/(auth)/login" style={styles.link}>Log in</Link>
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
