import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fetchMatches } from './src/api/matches';
import { savePreferences as savePreferencesRequest } from './src/api/preferences';
import { login, logout, readSession, register } from './src/api/auth';
import { fetchProfile, updateProfile } from './src/api/profile';
import { resolvePhotoUrl, uploadProfilePhoto } from './src/api/photo';
import * as ImagePicker from 'expo-image-picker';
import { validatePreferences } from './src/preferences';

const DEFAULT_PROFILE_ID = 'user-1';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [profileId, setProfileId] = useState(DEFAULT_PROFILE_ID);
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [preferences, setPreferences] = useState({
    minBudget: '',
    maxBudget: '',
    preferredArea: '',
    sleepSchedule: '',
    foodHabits: '',
    cleanliness: '',
    smoking: '',
    drinking: '',
  });

  useEffect(() => {
    readSession()
      .then((savedSession) => {
        if (savedSession) {
          setSession(savedSession);
          setProfileId(savedSession.user.id);
        }
      })
      .finally(() => setAuthReady(true));
  }, []);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const result = await fetchMatches(profileId, session?.token);
      setMatches(result.matches);
      setHasLoaded(true);
    } catch (error) {
      setMatches([]);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [profileId, session]);

  if (!authReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.state}>
          <ActivityIndicator color="#2563eb" size="large" />
          <Text style={styles.stateText}>Loading your account...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <AuthScreen
            onAuthenticated={(newSession) => {
              setSession(newSession);
              setProfileId(newSession.user.id);
            }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {screen === 'home' ? (
          <HomeScreen
            onFindRoommates={() => setScreen('matches')}
            onProfile={() => setScreen('profile')}
            onSetPreferences={() => setScreen('preferences')}
            onLogout={async () => {
              await logout(session.token);
              setSession(null);
              setScreen('home');
            }}
            userName={session.user.fullName}
          />
        ) : screen === 'profile' ? (
          <ProfileScreen
            onBack={() => setScreen('home')}
            token={session.token}
          />
        ) : screen === 'preferences' ? (
          <PreferenceSetupScreen
            onBack={() => setScreen('home')}
            onSaved={async () => {
              setScreen('matches');
              await loadMatches();
            }}
            profileId={profileId}
            preferences={preferences}
            setPreferences={setPreferences}
            token={session.token}
          />
        ) : screen === 'details' ? (
          <ProfileDetailsScreen
            match={selectedMatch}
            onBack={() => setScreen('matches')}
          />
        ) : (
          <RecommendationsScreen
            errorMessage={errorMessage}
            hasLoaded={hasLoaded}
            loading={loading}
            matches={matches}
            onBack={() => setScreen('home')}
            onFindMatches={loadMatches}
            onSelectMatch={(match) => {
              setSelectedMatch(match);
              setScreen('details');
            }}
            profileId={profileId}
            setProfileId={setProfileId}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErrorMessage('');
    if (!email.trim() || password.length < 8 || (mode === 'register' && fullName.trim().length < 2)) {
      setErrorMessage(mode === 'register'
        ? 'Enter your name, a valid email, and a password with at least 8 characters.'
        : 'Enter your email and a password with at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const result = mode === 'register'
        ? await register(fullName, email, password)
        : await login(email, password);
      onAuthenticated({ token: result.accessToken, user: result.user });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.authCard}>
      <Text style={styles.logo}>NestMate</Text>
      <Text style={styles.title}>{mode === 'register' ? 'Create your account' : 'Welcome back'}</Text>
      <Text style={styles.subtitle}>Sign in to manage your roommate preferences.</Text>
      {mode === 'register' && (
        <TextInput
          autoCapitalize="words"
          onChangeText={setFullName}
          placeholder="Full name"
          style={styles.input}
          value={fullName}
        />
      )}
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email address"
        style={styles.input}
        value={email}
      />
      <TextInput
        onChangeText={setPassword}
        placeholder="Password (8+ characters)"
        secureTextEntry
        style={styles.input}
        value={password}
      />
      {errorMessage !== '' && <Text style={styles.fieldError}>{errorMessage}</Text>}
      <Pressable
        disabled={loading}
        onPress={submit}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.primaryButtonText}>{loading ? 'Please wait...' : mode === 'register' ? 'Register' : 'Log in'}</Text>
      </Pressable>
      <Pressable onPress={() => setMode(mode === 'register' ? 'login' : 'register')} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>
          {mode === 'register' ? 'Already have an account? Log in' : 'New to NestMate? Register'}
        </Text>
      </Pressable>
    </View>
  );
}

function HomeScreen({ onFindRoommates, onLogout, onProfile, onSetPreferences, userName }) {
  return (
    <View style={styles.home}>
      <Text style={styles.logo}>NestMate</Text>
      <Text style={styles.welcomeText}>Welcome, {userName}</Text>
      <Text style={styles.homeTitle}>Find a roommate who fits your lifestyle.</Text>
      <Text style={styles.homeSubtitle}>
        Compare compatibility across budget, location, lifestyle, and habits.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onFindRoommates}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.primaryButtonText}>Find roommates</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onSetPreferences}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>Set my preferences</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onProfile} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>View my profile</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onLogout} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Log out</Text>
      </Pressable>
    </View>
  );
}

function ProfileScreen({ onBack, token }) {
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await fetchProfile(token);
      setProfile(result);
      setFullName(result.user.fullName);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function saveName() {
    if (fullName.trim().length < 2) {
      setErrorMessage('Full name must contain at least 2 characters.');
      return;
    }

    async function choosePhoto() {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage('Photo library permission is required to choose a profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        const image = result.assets[0];
        if (image.fileSize && image.fileSize > 5 * 1024 * 1024) {
          setErrorMessage('Choose an image that is 5 MB or smaller.');
          return;
        }
        setSelectedPhoto(image);
        setErrorMessage('');
        setMessage('');
      }
    }

    async function savePhoto() {
      if (!selectedPhoto) return;
      setUploadingPhoto(true);
      setErrorMessage('');
      try {
        const result = await uploadProfilePhoto(token, selectedPhoto);
        setProfile(result);
        setSelectedPhoto(null);
        setMessage('Profile photo updated successfully.');
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setUploadingPhoto(false);
      }
    }

    setSaving(true);
    setMessage('');
    setErrorMessage('');
    try {
      const result = await updateProfile(token, fullName);
      setProfile(result);
      setFullName(result.user.fullName);
      setMessage('Profile updated successfully.');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>‹ Home</Text>
      </Pressable>
      <Text style={styles.title}>My profile</Text>
      {loading && <Text style={styles.stateText}>Loading profile...</Text>}
      {!loading && errorMessage !== '' && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable onPress={loadProfile} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      )}
      {!loading && profile && (
        <>
          <View style={styles.detailsCard}>
            <Text style={styles.detailsSectionTitle}>Profile photo</Text>
            {(selectedPhoto || profile.user.photoUrl) ? (
              <Image
                source={{ uri: selectedPhoto?.uri || resolvePhotoUrl(profile.user.photoUrl) }}
                style={styles.profilePhoto}
              />
            ) : (
              <Text style={styles.stateText}>No profile photo uploaded yet.</Text>
            )}
            <Pressable onPress={choosePhoto} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>
                {profile.user.photoUrl ? 'Choose a replacement' : 'Choose a photo'}
              </Text>
            </Pressable>
            {selectedPhoto && (
              <Pressable
                disabled={uploadingPhoto}
                onPress={savePhoto}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.primaryButtonText}>
                  {uploadingPhoto ? 'Uploading...' : 'Upload photo'}
                </Text>
              </Pressable>
            )}
          </View>
          <View style={styles.detailsCard}>
            <Text style={styles.detailsSectionTitle}>Personal information</Text>
            <TextInput
              accessibilityLabel="Full name"
              onChangeText={setFullName}
              style={styles.input}
              value={fullName}
            />
            <DetailRow label="Email" value={profile.user.email} />
            <Pressable
              disabled={saving}
              onPress={saveName}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save name'}</Text>
            </Pressable>
          </View>
          <View style={styles.detailsCard}>
            <Text style={styles.detailsSectionTitle}>Saved roommate preferences</Text>
            {profile.preferences ? (
              <>
                <DetailRow label="Budget" value={formatValue(profile.preferences.budget)} />
                <DetailRow label="Location" value={formatValue(profile.preferences.preferredArea)} />
                <DetailRow label="Food habits" value={formatValue(profile.preferences.foodHabits)} />
                <DetailRow label="Drinking" value={formatValue(profile.preferences.drinking)} />
                <DetailRow label="Sleep schedule" value={formatValue(profile.preferences.lifestyle?.sleepSchedule)} />
                <DetailRow label="Cleanliness" value={formatValue(profile.preferences.lifestyle?.cleanliness)} />
              </>
            ) : (
              <Text style={styles.stateText}>No roommate preferences saved yet.</Text>
            )}
          </View>
          {message !== '' && <Text style={styles.successText}>{message}</Text>}
        </>
      )}
    </>
  );
}

function PreferenceSetupScreen({ onBack, onSaved, preferences, profileId, setPreferences, token }) {
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  function updatePreference(field, value) {
    setPreferences((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setSaveError('');
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function savePreferences() {
    const validationErrors = validatePreferences(preferences);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setSaving(true);
      setSaveError('');
      try {
        await savePreferencesRequest(profileId, preferences, token);
        setSaved(true);
        await onSaved();
      } catch (error) {
        setSaveError(error.message);
      } finally {
        setSaving(false);
      }
    }
  }

  return (
    <>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>‹ Home</Text>
      </Pressable>
      <Text style={styles.title}>My roommate preferences</Text>
      <Text style={styles.subtitle}>
        Tell us what matters to you so matching results can use your preferences.
      </Text>

      <View style={styles.formCard}>
        <Text style={styles.formSectionTitle}>Budget and location</Text>
        <Text style={styles.fieldLabel}>Monthly budget range</Text>
        <View style={styles.budgetRow}>
          <TextInput
            accessibilityLabel="Minimum monthly budget"
            keyboardType="numeric"
            onChangeText={(value) => updatePreference('minBudget', value)}
            placeholder="Minimum"
            style={styles.input}
            value={preferences.minBudget}
          />
          <Text style={styles.rangeSeparator}>to</Text>
          <TextInput
            accessibilityLabel="Maximum monthly budget"
            keyboardType="numeric"
            onChangeText={(value) => updatePreference('maxBudget', value)}
            placeholder="Maximum"
            style={styles.input}
            value={preferences.maxBudget}
          />
        </View>
        <FieldError message={errors.minBudget || errors.maxBudget} />
        <Text style={styles.fieldLabel}>Preferred location</Text>
        <TextInput
          accessibilityLabel="Preferred location"
          onChangeText={(value) => updatePreference('preferredArea', value)}
          placeholder="e.g. Central"
          style={styles.input}
          value={preferences.preferredArea}
        />
        <FieldError message={errors.preferredArea} />
      </View>

      <PreferenceGroup
        error={errors.sleepSchedule}
        label="Sleeping habits"
        options={[
          ['early', 'Early sleeper'],
          ['flexible', 'Flexible'],
          ['late', 'Night owl'],
        ]}
        selected={preferences.sleepSchedule}
        onSelect={(value) => updatePreference('sleepSchedule', value)}
      />
      <PreferenceGroup
        error={errors.foodHabits}
        label="Food habits"
        options={[
          ['vegetarian', 'Vegetarian'],
          ['nonVegetarian', 'Non-vegetarian'],
          ['any', 'No preference'],
        ]}
        selected={preferences.foodHabits}
        onSelect={(value) => updatePreference('foodHabits', value)}
      />
      <PreferenceGroup
        error={errors.cleanliness}
        label="Cleanliness preference"
        options={[
          ['low', 'Relaxed'],
          ['medium', 'Balanced'],
          ['high', 'Very tidy'],
        ]}
        selected={preferences.cleanliness}
        onSelect={(value) => updatePreference('cleanliness', value)}
      />
      <PreferenceGroup
        error={errors.smoking}
        label="Smoking preference"
        options={[
          ['no', 'Non-smoker'],
          ['yes', 'Smoker is okay'],
        ]}
        selected={preferences.smoking}
        onSelect={(value) => updatePreference('smoking', value)}
      />
      <PreferenceGroup
        error={errors.drinking}
        label="Drinking preference"
        options={[
          ['no', 'Never'],
          ['occasionally', 'Occasionally'],
          ['yes', 'No preference'],
        ]}
        selected={preferences.drinking}
        onSelect={(value) => updatePreference('drinking', value)}
      />

      {saved && (
        <View style={styles.successCard}>
          <Text style={styles.successText}>
            Preferences saved successfully.
          </Text>
        </View>
      )}
      {saveError !== '' && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{saveError}</Text>
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={saving}
        onPress={savePreferences}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save preferences'}</Text>
      </Pressable>
    </>
  );
}

function PreferenceGroup({ error, label, onSelect, options, selected }) {
  return (
    <View style={styles.formCard}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map(([value, text]) => (
          <Pressable
            accessibilityRole="button"
            key={value}
            onPress={() => onSelect(value)}
            style={[styles.optionButton, selected === value && styles.optionButtonSelected]}
          >
            <Text style={[styles.optionText, selected === value && styles.optionTextSelected]}>
              {text}
            </Text>
          </Pressable>
        ))}
      </View>
      <FieldError message={error} />
    </View>
  );
}

function FieldError({ message }) {
  return message ? <Text style={styles.fieldError}>{message}</Text> : null;
}

function RecommendationsScreen({
  errorMessage,
  hasLoaded,
  loading,
  matches,
  onBack,
  onFindMatches,
  onSelectMatch,
  profileId,
  setProfileId,
}) {
  return (
    <>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>‹ Home</Text>
      </Pressable>
      <Text style={styles.title}>Roommate recommendations</Text>
      <Text style={styles.subtitle}>
        Ranked by budget, location, lifestyle, and habits.
      </Text>

      <View style={styles.searchRow}>
        <TextInput
          accessibilityLabel="Profile ID"
          autoCapitalize="none"
          onChangeText={setProfileId}
          placeholder="Your profile ID"
          style={styles.input}
          value={profileId}
        />
        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={onFindMatches}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.buttonText}>Find</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Refresh recommendations"
          accessibilityRole="button"
          disabled={loading}
          onPress={onFindMatches}
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.refreshText}>↻</Text>
        </Pressable>
      </View>

      <Text style={styles.resultsLabel}>
        {hasLoaded ? `${matches.length} recommendation${matches.length === 1 ? '' : 's'}` : 'Recommendations'}
      </Text>

      {loading && (
        <View style={styles.state}>
          <ActivityIndicator color="#2563eb" size="large" />
          <Text style={styles.stateText}>Finding compatible roommates...</Text>
        </View>
      )}

      {!loading && errorMessage !== '' && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not load recommendations</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable onPress={onFindMatches} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      )}

      {!loading &&
        errorMessage === '' &&
        hasLoaded &&
        matches.length === 0 && (
          <View style={styles.state}>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.stateText}>
              There are no candidate profiles available for this account.
            </Text>
          </View>
        )}

      {!loading &&
        errorMessage === '' &&
        matches.map((match, index) => (
          <MatchCard
            key={`${match.candidateId || 'unknown'}-${index}`}
            match={match}
            onPress={() => onSelectMatch(match)}
            rank={index + 1}
          />
        ))}

      {!loading && !hasLoaded && errorMessage === '' && (
        <View style={styles.state}>
          <Text style={styles.emptyTitle}>Ready to find your match?</Text>
          <Text style={styles.stateText}>
            Enter a profile ID and tap Find to load recommendations.
          </Text>
        </View>
      )}
    </>
  );
}

function MatchCard({ match, onPress, rank }) {
  return (
    <Pressable
      accessibilityHint="Opens the roommate profile details"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.matchCard, pressed && styles.buttonPressed]}
    >
      <View style={styles.matchHeader}>
        <View>
          <Text style={styles.candidateLabel}>#{rank} candidate profile</Text>
          <Text style={styles.candidateId}>{match.candidateId || 'Unknown'}</Text>
        </View>
        <Text style={styles.score}>{match.score}%</Text>
      </View>

      <Text style={styles.breakdownTitle}>Score breakdown</Text>
      {Object.entries(match.breakdown || {}).map(([category, value]) => (
        <View key={category} style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>{formatCategory(category)}</Text>
          <Text style={styles.breakdownValue}>{Math.round(value * 100)}%</Text>
        </View>
      ))}
      <Text style={styles.viewDetailsText}>View profile details</Text>
    </Pressable>
  );
}

function ProfileDetailsScreen({ match, onBack }) {
  const profile = match?.profile || match?.profileDetails || {};
  const lifestyle = profile.lifestyle || {};

  return (
    <>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>‹ Recommendations</Text>
      </Pressable>
      <Text style={styles.title}>Roommate profile</Text>
      <Text style={styles.subtitle}>
        Details currently available from the matching response.
      </Text>

      <View style={styles.detailsCard}>
        <Text style={styles.candidateLabel}>PROFILE</Text>
        <Text style={styles.detailsName}>{match?.candidateId || 'Unknown'}</Text>
        <DetailRow label="Compatibility score" value={formatScore(match?.score)} />
        <DetailRow label="Budget" value={formatValue(profile.budget)} />
        <DetailRow label="Preferred location" value={formatValue(profile.preferredArea)} />
        <DetailRow label="Move-in date" value={formatValue(profile.moveInDate)} />
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailsSectionTitle}>Lifestyle and habits</Text>
        <DetailRow label="Sleep schedule" value={formatValue(lifestyle.sleepSchedule)} />
        <DetailRow label="Cleanliness" value={formatValue(lifestyle.cleanliness)} />
        <DetailRow label="Smoking" value={formatBoolean(lifestyle.smoking)} />
        <DetailRow label="Pets" value={formatBoolean(lifestyle.pets)} />
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailsSectionTitle}>Score breakdown</Text>
        {Object.entries(match?.breakdown || {}).map(([category, value]) => (
          <DetailRow
            key={category}
            label={formatCategory(category)}
            value={`${Math.round(value * 100)}%`}
          />
        ))}
      </View>
    </>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function formatValue(value) {
  return value === undefined || value === null || value === '' ? 'Not provided' : String(value);
}

function formatBoolean(value) {
  if (typeof value !== 'boolean') {
    return 'Not provided';
  }

  return value ? 'Yes' : 'No';
}

function formatScore(score) {
  return typeof score === 'number' ? `${score}%` : 'Not provided';
}

function formatCategory(category) {
  return category
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase());
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 24, gap: 16 },
  home: { flex: 1, justifyContent: 'center', minHeight: 560, gap: 18 },
  authCard: { flex: 1, justifyContent: 'center', minHeight: 560, gap: 16 },
  logo: { color: '#2563eb', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  welcomeText: { color: '#334155', fontSize: 16, fontWeight: '600' },
  homeTitle: { color: '#0f172a', fontSize: 34, fontWeight: '800', lineHeight: 42 },
  homeSubtitle: { color: '#64748b', fontSize: 16, lineHeight: 24 },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#2563eb',
    borderRadius: 10,
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { alignSelf: 'flex-start', paddingVertical: 8 },
  secondaryButtonText: { color: '#2563eb', fontSize: 16, fontWeight: '700' },
  backButton: { alignSelf: 'flex-start', paddingVertical: 4 },
  backText: { color: '#2563eb', fontSize: 16, fontWeight: '700' },
  title: { color: '#0f172a', fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#64748b', fontSize: 15, lineHeight: 22 },
  resultsLabel: { color: '#334155', fontSize: 15, fontWeight: '700' },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  budgetRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  rangeSeparator: { color: '#64748b', fontSize: 14 },
  formCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  formSectionTitle: { color: '#0f172a', fontSize: 18, fontWeight: '700' },
  fieldLabel: { color: '#334155', fontSize: 15, fontWeight: '700' },
  fieldError: { color: '#b91c1c', fontSize: 13 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionButton: {
    borderColor: '#cbd5e1',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionButtonSelected: { backgroundColor: '#dbeafe', borderColor: '#2563eb' },
  optionText: { color: '#475569', fontSize: 14 },
  optionTextSelected: { color: '#1d4ed8', fontWeight: '700' },
  successCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  successText: { color: '#166534', lineHeight: 21 },
  button: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  buttonPressed: { opacity: 0.8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  refreshButton: {
    alignItems: 'center',
    borderColor: '#2563eb',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  refreshText: { color: '#2563eb', fontSize: 22, fontWeight: '700' },
  state: { alignItems: 'center', padding: 32, gap: 8 },
  stateText: { color: '#64748b', fontSize: 15, textAlign: 'center' },
  emptyTitle: { color: '#0f172a', fontSize: 18, fontWeight: '700' },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  errorTitle: { color: '#991b1b', fontSize: 17, fontWeight: '700' },
  errorText: { color: '#b91c1c', lineHeight: 21 },
  retryButton: { alignSelf: 'flex-start', paddingVertical: 6 },
  retryText: { color: '#991b1b', fontWeight: '700' },
  matchCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  matchHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  candidateLabel: { color: '#64748b', fontSize: 12, textTransform: 'uppercase' },
  candidateId: { color: '#0f172a', fontSize: 18, fontWeight: '700', marginTop: 2 },
  score: { color: '#16a34a', fontSize: 24, fontWeight: '800' },
  breakdownTitle: { color: '#334155', fontSize: 14, fontWeight: '700', marginTop: 6 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { color: '#64748b', fontSize: 14 },
  breakdownValue: { color: '#334155', fontSize: 14, fontWeight: '600' },
  viewDetailsText: { color: '#2563eb', fontSize: 14, fontWeight: '700', marginTop: 4 },
  detailsCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  profilePhoto: {
    alignSelf: 'center',
    borderRadius: 64,
    height: 128,
    width: 128,
  },
  detailsName: { color: '#0f172a', fontSize: 24, fontWeight: '800', marginTop: 2 },
  detailsSectionTitle: { color: '#0f172a', fontSize: 17, fontWeight: '700' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  detailValue: { color: '#334155', flex: 1, fontSize: 14, fontWeight: '600', textAlign: 'right' },
});
