import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fetchMatches } from './src/api/matches';

const DEFAULT_PROFILE_ID = 'user-1';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [profileId, setProfileId] = useState(DEFAULT_PROFILE_ID);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const result = await fetchMatches(profileId);
      setMatches(result.matches);
      setHasLoaded(true);
    } catch (error) {
      setMatches([]);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {screen === 'home' ? (
          <HomeScreen onFindRoommates={() => setScreen('matches')} />
        ) : (
          <RecommendationsScreen
            errorMessage={errorMessage}
            hasLoaded={hasLoaded}
            loading={loading}
            matches={matches}
            onBack={() => setScreen('home')}
            onFindMatches={loadMatches}
            profileId={profileId}
            setProfileId={setProfileId}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function HomeScreen({ onFindRoommates }) {
  return (
    <View style={styles.home}>
      <Text style={styles.logo}>NestMate</Text>
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
    </View>
  );
}

function RecommendationsScreen({
  errorMessage,
  hasLoaded,
  loading,
  matches,
  onBack,
  onFindMatches,
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

function MatchCard({ match, rank }) {
  return (
    <View style={styles.matchCard}>
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
    </View>
  );
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
  logo: { color: '#2563eb', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
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
});
