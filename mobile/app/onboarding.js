import { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input, PreferenceChoice } from '../src/components';
import { savePreferences } from '../src/api/preferences';
import { updateProfile } from '../src/api/profile';
import { useAuth } from '../src/context/AuthContext';
import { validatePreferenceStep } from '../src/preferences';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../src/constants/theme';

const stepNames = ['Basics', 'Budget', 'Lifestyle', 'Habits'];
const emptyValues = {
  occupation: '', city: '', bio: '', minBudget: '', maxBudget: '', preferredArea: '',
  sleepSchedule: '', foodHabits: '', cleanliness: '', smoking: '', drinking: '', pets: '',
};

export default function OnboardingScreen() {
  const router = useRouter();
  const { token, user, refreshProfile } = useAuth();
  const [values, setValues] = useState(emptyValues);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setServerError('');
  }

  async function next() {
    const nextErrors = validatePreferenceStep(values, step);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setServerError('');
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setSaving(true);
    try {
      await updateProfile(token, {
        occupation: values.occupation,
        city: values.city.trim(),
        bio: values.bio.trim(),
      });
      await savePreferences(user.id, {
        minBudget: values.minBudget,
        maxBudget: values.maxBudget,
        preferredArea: values.preferredArea.trim(),
        sleepSchedule: values.sleepSchedule,
        foodHabits: values.foodHabits,
        cleanliness: values.cleanliness,
        smoking: values.smoking,
        drinking: values.drinking,
        pets: values.pets,
      }, token);
      await refreshProfile(token);
      router.replace('/(tabs)');
    } catch (error) {
      setErrors(error.errors || {});
      setServerError(error.message || 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.kicker}>YOUR ROOMMATE PROFILE</Text>
        <Text style={styles.title}>{stepNames[step]}</Text>
        <Text style={styles.stepText}>Step {step + 1} of 4</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((step + 1) / 4) * 100}%` }]} />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {serverError ? <Text accessibilityRole="alert" style={styles.serverError}>{serverError}</Text> : null}
        {step === 0 ? (
          <>
            <PreferenceChoice label="I am a" value={values.occupation} error={errors.occupation}
              onChange={(value) => update('occupation', value)} options={[
                { label: 'Student', value: 'student' }, { label: 'Working', value: 'working' },
              ]} />
            <Input label="City" value={values.city} onChangeText={(value) => update('city', value)}
              error={errors.city} placeholder="e.g. Pune" autoCapitalize="words" />
            <Input label="Short bio (optional)" value={values.bio} onChangeText={(value) => update('bio', value)}
              error={errors.bio} placeholder="A little about you" multiline maxLength={200}
              inputStyle={styles.bioInput} />
          </>
        ) : null}
        {step === 1 ? (
          <>
            <Input label="Minimum monthly budget (₹)" value={values.minBudget}
              onChangeText={(value) => update('minBudget', value)} error={errors.minBudget}
              placeholder="e.g. 8000" keyboardType="number-pad" />
            <Input label="Maximum monthly budget (₹)" value={values.maxBudget}
              onChangeText={(value) => update('maxBudget', value)} error={errors.maxBudget}
              placeholder="e.g. 18000" keyboardType="number-pad" />
            <Input label="Preferred area" value={values.preferredArea}
              onChangeText={(value) => update('preferredArea', value)} error={errors.preferredArea}
              placeholder="e.g. Baner" autoCapitalize="words" />
          </>
        ) : null}
        {step === 2 ? (
          <>
            <PreferenceChoice label="Sleep schedule" value={values.sleepSchedule} error={errors.sleepSchedule}
              onChange={(value) => update('sleepSchedule', value)} options={[
                { label: 'Early', value: 'early' }, { label: 'Flexible', value: 'flexible' }, { label: 'Late', value: 'late' },
              ]} />
            <PreferenceChoice label="Food habits" value={values.foodHabits} error={errors.foodHabits}
              onChange={(value) => update('foodHabits', value)} options={[
                { label: 'Vegetarian', value: 'vegetarian' }, { label: 'Non-vegetarian', value: 'non-vegetarian' },
                { label: 'Vegan', value: 'vegan' }, { label: 'No preference', value: 'any' },
              ]} />
            <PreferenceChoice label="Cleanliness" value={values.cleanliness} error={errors.cleanliness}
              onChange={(value) => update('cleanliness', value)} options={[
                { label: 'High', value: 'high' }, { label: 'Medium', value: 'medium' }, { label: 'Relaxed', value: 'relaxed' },
              ]} />
          </>
        ) : null}
        {step === 3 ? (
          <>
            <PreferenceChoice label="Smoking" value={values.smoking} error={errors.smoking}
              onChange={(value) => update('smoking', value)} options={[
                { label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' },
              ]} />
            <PreferenceChoice label="Drinking" value={values.drinking} error={errors.drinking}
              onChange={(value) => update('drinking', value)} options={[
                { label: 'Never', value: 'never' }, { label: 'Socially', value: 'occasionally' }, { label: 'Often', value: 'often' },
              ]} />
            <PreferenceChoice label="Pets" value={values.pets} error={errors.pets}
              onChange={(value) => update('pets', value)} options={[
                { label: 'No pets', value: 'no' }, { label: 'Pets are okay', value: 'yes' },
                { label: 'No preference', value: 'any' },
              ]} />
          </>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        {step > 0 ? <Button title="Back" variant="outline" onPress={() => setStep(step - 1)} disabled={saving} /> : <View />}
        <Button title={step === 3 ? 'Save profile' : 'Next'} onPress={next} loading={saving} disabled={saving} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.surface, padding: SPACING.xl, paddingBottom: SPACING.lg },
  kicker: { color: COLORS.primary, fontSize: TYPOGRAPHY.xs.fontSize, fontWeight: '700', letterSpacing: 1 },
  title: { color: COLORS.navyDark, fontSize: TYPOGRAPHY.xxl.fontSize, fontWeight: '700', marginTop: SPACING.sm },
  stepText: { color: COLORS.textSecondary, marginTop: SPACING.xs },
  progressTrack: { height: 6, borderRadius: RADII.pill, backgroundColor: COLORS.border, marginTop: SPACING.lg },
  progressFill: { height: 6, borderRadius: RADII.pill, backgroundColor: COLORS.primary },
  form: { flexGrow: 1, padding: SPACING.xl },
  bioInput: { minHeight: 90, textAlignVertical: 'top' },
  serverError: { color: COLORS.danger, marginBottom: SPACING.lg },
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.md, padding: SPACING.lg, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
});
