import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Button, Input, PreferenceChoice } from '../../src/components';
import { fetchProfile, updateProfile, changePassword } from '../../src/api/profile';
import { savePreferences } from '../../src/api/preferences';
import { uploadProfilePhoto, resolvePhotoUrl } from '../../src/api/photo';
import { useAuth } from '../../src/context/AuthContext';
import { validatePreferences } from '../../src/preferences';
import { validatePassword } from '../../src/validation';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../../src/constants/theme';

const emptyValues = {
  fullName: '', occupation: '', city: '', bio: '', phone: '', minBudget: '', maxBudget: '',
  preferredArea: '', sleepSchedule: '', foodHabits: '', cleanliness: '', smoking: '',
  drinking: '', pets: '',
};

function valuesFromProfile(data) {
  const user = data.user || {};
  const preferences = data.preferences || {};
  const lifestyle = preferences.lifestyle || {};
  return {
    fullName: user.fullName || '', occupation: user.occupation || '', city: user.city || '',
    bio: user.bio || '', phone: user.phone || '', minBudget: String(preferences.minBudget || ''),
    maxBudget: String(preferences.maxBudget || ''), preferredArea: preferences.preferredArea || '',
    sleepSchedule: lifestyle.sleepSchedule || '', foodHabits: preferences.foodHabits || '',
    cleanliness: lifestyle.cleanliness || '', smoking: lifestyle.smoking ? 'yes' : 'no',
    drinking: preferences.drinking || '', pets: lifestyle.pets || 'any',
  };
}

export default function ProfileScreen() {
  const router = useRouter();
  const { token, user, logout, refreshProfile, refreshMatches } = useAuth();
  const [data, setData] = useState(null);
  const [values, setValues] = useState(emptyValues);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  async function loadProfile() {
    setLoading(true);
    setLoadError('');
    try {
      const result = await fetchProfile(token);
      setData(result);
      setValues({ ...emptyValues, ...valuesFromProfile(result) });
      await refreshProfile(token);
    } catch (error) {
      setLoadError(error.message || 'Could not load your profile.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProfile(); }, [token]);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setMessage('');
  }

  async function saveProfile() {
    const nextErrors = validatePreferences(values);
    if (typeof values.fullName !== 'string' || values.fullName.trim().length < 2 || values.fullName.trim().length > 80) {
      nextErrors.fullName = 'Enter a name between 2 and 80 characters.';
    }
    setErrors(nextErrors);
    setMessage('');
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    try {
      await updateProfile(token, {
        fullName: values.fullName,
        occupation: values.occupation,
        city: values.city,
        bio: values.bio,
        phone: values.phone,
      });
      await savePreferences(user.id, {
        minBudget: values.minBudget, maxBudget: values.maxBudget,
        preferredArea: values.preferredArea, sleepSchedule: values.sleepSchedule,
        foodHabits: values.foodHabits, cleanliness: values.cleanliness,
        smoking: values.smoking, drinking: values.drinking, pets: values.pets,
      }, token);
      const updated = await fetchProfile(token);
      setData(updated);
      setValues({ ...emptyValues, ...valuesFromProfile(updated) });
      await refreshProfile(token);
      await refreshMatches().catch(() => {});
      setEditing(false);
      setMessage('Profile saved.');
    } catch (error) {
      setErrors(error.errors || {});
      setMessage(error.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  }

  async function choosePhoto() {
    setPhotoError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhotoError('Allow photo access to choose a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, quality: 0.85,
    });
    if (result.canceled) return;
    const image = result.assets[0];
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.mimeType)) {
      setPhotoError('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    const fileSize = image.fileSize ?? image.file?.size;
    if (!Number.isFinite(fileSize)) {
      setPhotoError('Could not read the photo size. Choose a different image.');
      return;
    }
    if (fileSize > 5 * 1024 * 1024) {
      setPhotoError('Choose an image that is 5 MB or smaller.');
      return;
    }
    setPhotoLoading(true);
    try {
      await uploadProfilePhoto(token, image);
      await loadProfile();
    } catch (error) {
      setPhotoError(error.message || 'Could not upload the photo.');
    } finally {
      setPhotoLoading(false);
    }
  }

  async function savePassword() {
    const validationError = validatePassword(newPassword);
    if (!oldPassword || validationError) {
      setPasswordError(validationError || 'Enter your current password.');
      return;
    }
    setPasswordError('');
    setPasswordMessage('');
    setPasswordLoading(true);
    try {
      await changePassword(token, oldPassword, newPassword);
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      setPasswordError(error.errors?.oldPassword || error.errors?.newPassword || error.message);
    } finally {
      setPasswordLoading(false);
    }
  }

  function confirmLogout() {
    setLogoutError('');
    setLogoutConfirm(true);
  }

  async function finishLogout() {
    setLogoutLoading(true);
    setLogoutError('');
    try {
      await logout();
      setLogoutConfirm(false);
      router.replace('/(auth)/login');
    } catch (error) {
      setLogoutError(error.message || 'Could not clear the saved session. Try again.');
    } finally {
      setLogoutLoading(false);
    }
  }

  if (loading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></SafeAreaView>;
  }
  if (loadError || !data) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>{loadError || 'Profile is unavailable.'}</Text>
        <Button title="Try again" onPress={loadProfile} />
      </SafeAreaView>
    );
  }

  const profileUser = data.user || {};
  const preferences = data.preferences;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headingRow}>
          <Text style={styles.heading}>Your profile</Text>
          <Button title="Edit" variant="outline" size="sm" onPress={() => {
            setValues({ ...emptyValues, ...valuesFromProfile(data) });
            setErrors({}); setMessage(''); setEditing(true);
          }} />
        </View>
        <View style={styles.userCard}>
          {profileUser.photoUrl ? (
            <Image source={{ uri: resolvePhotoUrl(profileUser.photoUrl) }} style={styles.avatar} />
          ) : <View style={styles.avatarPlaceholder}><Text style={styles.avatarLetter}>{profileUser.fullName?.[0] || '?'}</Text></View>}
          <View style={styles.identity}>
            <Text style={styles.name}>{profileUser.fullName}</Text>
            <Text style={styles.secondary}>{profileUser.email}</Text>
            <Text style={styles.secondary}>{profileUser.occupation || 'Occupation not set'} · {profileUser.city || 'City not set'}</Text>
          </View>
        </View>
        <Button title={photoLoading ? 'Uploading photo…' : 'Change photo'} variant="outline" onPress={choosePhoto} loading={photoLoading} disabled={photoLoading} />
        {photoError ? <Text style={styles.error}>{photoError}</Text> : null}
        {message ? <Text style={styles.success}>{message}</Text> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About you</Text>
          <Text style={styles.value}>{profileUser.bio || 'No bio yet.'}</Text>
          {profileUser.phone ? <Text style={styles.secondary}>Private phone: {profileUser.phone}</Text> : null}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Roommate preferences</Text>
          {preferences ? (
            <>
              <Text style={styles.value}>₹{Number(preferences.minBudget).toLocaleString('en-IN')}–₹{Number(preferences.maxBudget).toLocaleString('en-IN')} per month</Text>
              <Text style={styles.secondary}>Area: {preferences.preferredArea}</Text>
              <Text style={styles.secondary}>Sleep: {preferences.lifestyle?.sleepSchedule || '—'} · Cleanliness: {preferences.lifestyle?.cleanliness || '—'}</Text>
              <Text style={styles.secondary}>Food: {preferences.foodHabits || '—'} · Smoking: {preferences.lifestyle?.smoking ? 'Yes' : 'No'} · Drinking: {preferences.drinking || '—'} · Pets: {preferences.lifestyle?.pets || '—'}</Text>
            </>
          ) : <Text style={styles.secondary}>Preferences have not been saved.</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change password</Text>
          <Input label="Current password" value={oldPassword} onChangeText={setOldPassword} secureTextEntry autoCapitalize="none" />
          <Input label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" />
          {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
          {passwordMessage ? <Text style={styles.success}>{passwordMessage}</Text> : null}
          <Button title="Change password" variant="outline" onPress={savePassword} loading={passwordLoading} disabled={passwordLoading} />
        </View>
        <Button title="Log out" variant="danger" onPress={confirmLogout} />
      </ScrollView>

      <Modal visible={editing} animationType="slide" onRequestClose={() => setEditing(false)}>
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.heading}>Edit profile</Text>
            <Button title="Close" variant="ghost" size="sm" onPress={() => setEditing(false)} />
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Input label="Full name" value={values.fullName} onChangeText={(value) => update('fullName', value)} error={errors.fullName} />
            <PreferenceChoice label="Occupation" value={values.occupation} error={errors.occupation} onChange={(value) => update('occupation', value)} options={[
              { label: 'Student', value: 'student' }, { label: 'Working', value: 'working' },
            ]} />
            <Input label="City" value={values.city} onChangeText={(value) => update('city', value)} error={errors.city} />
            <Input label="Short bio" value={values.bio} onChangeText={(value) => update('bio', value)} error={errors.bio} multiline maxLength={200} />
            <Input label="Phone (private)" value={values.phone} onChangeText={(value) => update('phone', value)} error={errors.phone} keyboardType="phone-pad" />
            <Input label="Minimum budget (₹)" value={values.minBudget} onChangeText={(value) => update('minBudget', value)} error={errors.minBudget} keyboardType="number-pad" />
            <Input label="Maximum budget (₹)" value={values.maxBudget} onChangeText={(value) => update('maxBudget', value)} error={errors.maxBudget} keyboardType="number-pad" />
            <Input label="Preferred area" value={values.preferredArea} onChangeText={(value) => update('preferredArea', value)} error={errors.preferredArea} />
            <PreferenceChoice label="Sleep schedule" value={values.sleepSchedule} error={errors.sleepSchedule} onChange={(value) => update('sleepSchedule', value)} options={[
              { label: 'Early', value: 'early' }, { label: 'Flexible', value: 'flexible' }, { label: 'Late', value: 'late' },
            ]} />
            <PreferenceChoice label="Food habits" value={values.foodHabits} error={errors.foodHabits} onChange={(value) => update('foodHabits', value)} options={[
              { label: 'Vegetarian', value: 'vegetarian' }, { label: 'Non-vegetarian', value: 'non-vegetarian' }, { label: 'Vegan', value: 'vegan' }, { label: 'Any', value: 'any' },
            ]} />
            <PreferenceChoice label="Cleanliness" value={values.cleanliness} error={errors.cleanliness} onChange={(value) => update('cleanliness', value)} options={[
              { label: 'High', value: 'high' }, { label: 'Medium', value: 'medium' }, { label: 'Relaxed', value: 'relaxed' },
            ]} />
            <PreferenceChoice label="Smoking" value={values.smoking} error={errors.smoking} onChange={(value) => update('smoking', value)} options={[
              { label: 'No', value: 'no' }, { label: 'Yes', value: 'yes' },
            ]} />
            <PreferenceChoice label="Drinking" value={values.drinking} error={errors.drinking} onChange={(value) => update('drinking', value)} options={[
              { label: 'Never', value: 'never' }, { label: 'Socially', value: 'occasionally' }, { label: 'Often', value: 'often' },
            ]} />
            <PreferenceChoice label="Pets" value={values.pets} error={errors.pets} onChange={(value) => update('pets', value)} options={[
              { label: 'No pets', value: 'no' }, { label: 'Pets okay', value: 'yes' }, { label: 'Any', value: 'any' },
            ]} />
            {message ? <Text style={styles.error}>{message}</Text> : null}
            <Button title="Save profile" onPress={saveProfile} loading={saving} disabled={saving} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={logoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutConfirm(false)}
      >
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.sectionTitle}>Log out of NestMate?</Text>
            <Text style={styles.secondary}>You can sign in again to see your saved profile.</Text>
            {logoutError ? <Text accessibilityRole="alert" style={styles.error}>{logoutError}</Text> : null}
            <View style={styles.dialogActions}>
              <Button title="Cancel" variant="ghost" onPress={() => setLogoutConfirm(false)} disabled={logoutLoading} />
              <Button title="Log out" variant="danger" onPress={finishLogout} loading={logoutLoading} disabled={logoutLoading} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background, padding: SPACING.xl, gap: SPACING.md },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxxl, gap: SPACING.md },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heading: { color: COLORS.navyDark, fontSize: TYPOGRAPHY.xxl.fontSize, fontWeight: '700' },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: SPACING.lg, gap: SPACING.md },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.softBlue, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: COLORS.primary, fontSize: 28, fontWeight: '700' },
  identity: { flex: 1, gap: 3 },
  name: { color: COLORS.navyDark, fontSize: TYPOGRAPHY.lg.fontSize, fontWeight: '700' },
  secondary: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sm.fontSize, marginTop: SPACING.xs },
  value: { color: COLORS.navyDark, fontSize: TYPOGRAPHY.md.fontSize, marginTop: SPACING.sm },
  section: { backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: SPACING.lg, marginTop: SPACING.sm },
  sectionTitle: { color: COLORS.navyDark, fontSize: TYPOGRAPHY.base.fontSize, fontWeight: '700' },
  error: { color: COLORS.danger, marginVertical: SPACING.sm },
  success: { color: COLORS.success, marginVertical: SPACING.sm },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, backgroundColor: COLORS.surface },
  modalContent: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  dialogBackdrop: { flex: 1, justifyContent: 'center', padding: SPACING.xl, backgroundColor: 'rgba(15, 37, 55, 0.45)' },
  dialog: { backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: SPACING.xl },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.lg },
});
