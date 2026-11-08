import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { addFavorite, fetchFavorites, removeFavorite } from './src/api/favorites';
import {
  acceptConnectionRequest,
  cancelConnectionRequest,
  fetchReceivedRequests,
  fetchSentRequests,
  rejectConnectionRequest,
  sendConnectionRequest,
} from './src/api/connectionRequests';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './src/api/notifications';
import { searchRoommates } from './src/api/search';
import {
  createAccommodation,
  fetchAccommodations,
  fetchAccommodationRecommendations,
} from './src/api/accommodations';
import {
  acceptBookingRequest,
  cancelBookingRequest,
  fetchReceivedBookingRequests,
  fetchSentBookingRequests,
  rejectBookingRequest,
  sendBookingRequest,
} from './src/api/bookingRequests';
import {
  fetchConversations,
  fetchMessages,
  getOrCreateConversation,
  markMessagesRead,
  sendMessage,
} from './src/api/chat';
import * as ImagePicker from 'expo-image-picker';
import { validatePreferences } from './src/preferences';
import {
  fetchAccommodationReviews,
  fetchRoommateReviews,
  submitAccommodationReview,
  submitRoommateReview,
} from './src/api/reviews';

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
  const [detailsBackScreen, setDetailsBackScreen] = useState('matches');
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState('');
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState('');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const [accommodationScreen, setAccommodationScreen] = useState('list');
  const [bookingRequests, setBookingRequests] = useState({ received: [], sent: [] });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [conversations, setConversations] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
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

  const loadFavorites = useCallback(async () => {
    if (!session?.token) return;
    setFavoritesLoading(true);
    setFavoritesError('');
    try {
      const result = await fetchFavorites(session.token);
      setFavorites(Array.isArray(result?.favorites) ? result.favorites : []);
    } catch (error) {
      setFavoritesError(error.message);
    } finally {
      setFavoritesLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  async function toggleFavorite(roommateId) {
    const alreadyFavorite = favorites.some(
      (favorite) => favorite.roommate?.id === roommateId,
    );
    setFavoritesError('');
    try {
      if (alreadyFavorite) {
        await removeFavorite(roommateId, session.token);
        setFavorites((current) =>
          current.filter((favorite) => favorite.roommate?.id !== roommateId),
        );
      } else {
        await addFavorite(roommateId, session.token);
        await loadFavorites();
      }
    } catch (error) {
      setFavoritesError(error.message);
    }
  }

  const loadRequests = useCallback(async () => {
    if (!session?.token) return;
    setRequestsLoading(true);
    setRequestsError('');
    try {
      const [received, sent] = await Promise.all([
        fetchReceivedRequests(session.token),
        fetchSentRequests(session.token),
      ]);
      setReceivedRequests(received?.requests || []);
      setSentRequests(sent?.requests || []);
    } catch (error) {
      setRequestsError(error.message);
    } finally {
      setRequestsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function sendRequest(receiverId) {
    setConnectionMessage('');
    try {
      await sendConnectionRequest(receiverId, session.token);
      setConnectionMessage('Connection request sent successfully.');
      await loadRequests();
    } catch (error) {
      setConnectionMessage(error.message);
    }
  }

  const loadBookingRequests = useCallback(async () => {
    if (!session?.token) return;
    setBookingLoading(true);
    setBookingError('');
    try {
      const [received, sent] = await Promise.all([
        fetchReceivedBookingRequests(session.token),
        fetchSentBookingRequests(session.token),
      ]);
      setBookingRequests({
        received: received?.requests || [],
        sent: sent?.requests || [],
      });
    } catch (error) {
      setBookingError(error.message);
    } finally {
      setBookingLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadBookingRequests();
  }, [loadBookingRequests]);

  const loadConversations = useCallback(async (silent = false) => {
    if (!session?.token) return;
    if (!silent) setChatLoading(true);
    setChatError('');
    try {
      const result = await fetchConversations(session.token);
      setConversations(result?.conversations || []);
    } catch (error) {
      setChatError(error.message);
    } finally {
      if (!silent) setChatLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(() => loadConversations(true), 5000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  async function openConversation(otherUserId) {
    setChatError('');
    try {
      const result = await getOrCreateConversation(otherUserId, session.token);
      setSelectedConversation(result.conversation);
      setScreen('chat-details');
    } catch (error) {
      setChatError(error.message);
    }
  }

  const loadNotifications = useCallback(async () => {
    if (!session?.token) return;
    setNotificationsLoading(true);
    setNotificationsError('');
    try {
      const result = await fetchNotifications(session.token);
      setNotifications(result?.notifications || []);
      setUnreadCount(Number(result?.unreadCount) || 0);
    } catch (error) {
      setNotificationsError(error.message);
    } finally {
      setNotificationsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function openNotification(notification) {
    try {
      if (!notification.read) {
        await markNotificationRead(notification.id, session.token);
        await loadNotifications();
      }
      if (notification.relatedUserId) {
        setSelectedMatch({ candidateId: notification.relatedUserId });
        setDetailsBackScreen('notifications');
        setScreen('details');
      }
    } catch (error) {
      setNotificationsError(error.message);
    }
  }

  if (!authReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.state}>
          <ActivityIndicator color="#2563eb" size="large" />
          <Text style={styles.stateText}>Loading your account...</Text>
        </View>
        <Pressable onPress={onBookings} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Booking requests</Text>
        </Pressable>
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
            onFavorites={() => setScreen('favorites')}
            onRequests={() => setScreen('requests')}
            onNotifications={() => setScreen('notifications')}
            onSearch={() => setScreen('search')}
            onAccommodations={() => setScreen('accommodations')}
            onChats={() => setScreen('chats')}
            unreadCount={unreadCount}
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
            onBack={() => setScreen(detailsBackScreen)}
            onConnect={sendRequest}
            onChat={openConversation}
            token={session.token}
          />
        ) : screen === 'favorites' ? (
          <FavoritesScreen
            errorMessage={favoritesError}
            favorites={favorites}
            loading={favoritesLoading}
            onBack={() => setScreen('home')}
            onRefresh={loadFavorites}
            onSelectFavorite={(favorite) => {
              setSelectedMatch({
                candidateId: favorite.roommate?.id,
                score: favorite.compatibility?.score,
                breakdown: favorite.compatibility?.breakdown,
                profile: favorite.roommate?.profile,
              });
              setDetailsBackScreen('favorites');
              setScreen('details');
            }}
          />
        ) : screen === 'requests' ? (
          <ConnectionRequestsScreen
            errorMessage={requestsError}
            loading={requestsLoading}
            onBack={() => setScreen('home')}
            onRefresh={loadRequests}
            onAccept={async (requestId) => {
              await acceptConnectionRequest(requestId, session.token);
              await loadRequests();
            }}
            onReject={async (requestId) => {
              await rejectConnectionRequest(requestId, session.token);
              await loadRequests();
            }}
            onCancel={async (requestId) => {
              await cancelConnectionRequest(requestId, session.token);
              await loadRequests();
            }}
            received={receivedRequests}
            sent={sentRequests}
          />
        ) : screen === 'notifications' ? (
          <NotificationsScreen
            errorMessage={notificationsError}
            loading={notificationsLoading}
            notifications={notifications}
            onBack={() => setScreen('home')}
            onMarkAllRead={async () => {
              await markAllNotificationsRead(session.token);
              await loadNotifications();
            }}
            onOpen={openNotification}
            onRefresh={loadNotifications}
          />
        ) : screen === 'search' ? (
          <SearchScreen
            favoriteIds={favorites.map((favorite) => favorite.roommate?.id)}
            onBack={() => setScreen('home')}
            onConnect={sendRequest}
            onSelect={(match) => {
              setSelectedMatch(match);
              setDetailsBackScreen('search');
              setScreen('details');
            }}
            onToggleFavorite={toggleFavorite}
            token={session.token}
          />
        ) : screen === 'accommodations' ? (
          <AccommodationScreen
            onBack={() => setScreen('home')}
            onBookings={() => setScreen('bookings')}
            token={session.token}
          />
        ) : screen === 'bookings' ? (
          <BookingRequestsScreen
            errorMessage={bookingError}
            loading={bookingLoading}
            onBack={() => setScreen('home')}
            onRefresh={loadBookingRequests}
            onAccept={async (id) => {
              await acceptBookingRequest(id, session.token);
              await loadBookingRequests();
            }}
            onReject={async (id) => {
              await rejectBookingRequest(id, session.token);
              await loadBookingRequests();
            }}
            onCancel={async (id) => {
              await cancelBookingRequest(id, session.token);
              await loadBookingRequests();
            }}
            received={bookingRequests.received}
            sent={bookingRequests.sent}
          />
        ) : screen === 'chats' ? (
          <ChatListScreen
            conversations={conversations}
            errorMessage={chatError}
            loading={chatLoading}
            onBack={() => setScreen('home')}
            onRefresh={loadConversations}
            onSelect={(conversation) => {
              setSelectedConversation(conversation);
              setScreen('chat-details');
            }}
          />
        ) : screen === 'chat-details' ? (
          <ChatDetailsScreen
            conversation={selectedConversation}
            onBack={() => setScreen('chats')}
            token={session.token}
            onChanged={loadConversations}
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
              setDetailsBackScreen('matches');
              setScreen('details');
            }}
            favoriteIds={favorites.map((favorite) => favorite.roommate?.id)}
            onToggleFavorite={toggleFavorite}
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

function HomeScreen({
  onFavorites,
  onFindRoommates,
  onLogout,
  onNotifications,
  onProfile,
  onRequests,
  onSearch,
  onAccommodations,
  onChats,
  onSetPreferences,
  unreadCount,
  userName,
}) {
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
      <Pressable accessibilityRole="button" onPress={onSearch} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Search roommates</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onAccommodations} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Accommodation listings</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onChats} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>My chats</Text>
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
      <Pressable accessibilityRole="button" onPress={onFavorites} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>My favorite roommates</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onRequests} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Connection requests</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onNotifications} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>
          Notifications {unreadCount > 0 ? `(${unreadCount} unread)` : ''}
        </Text>
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
  favoriteIds,
  hasLoaded,
  loading,
  matches,
  onBack,
  onFindMatches,
  onSelectMatch,
  onToggleFavorite,
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
            isFavorite={favoriteIds.includes(match.candidateId)}
            match={match}
            onPress={() => onSelectMatch(match)}
            onToggleFavorite={() => onToggleFavorite(match.candidateId)}
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

function SearchScreen({
  favoriteIds,
  onBack,
  onConnect,
  onSelect,
  onToggleFavorite,
  token,
}) {
  const [filters, setFilters] = useState({
    minBudget: '',
    maxBudget: '',
    preferredArea: '',
    lifestyle: '',
    foodHabits: '',
    sleepSchedule: '',
    smoking: '',
    drinking: '',
    sort: 'compatibility',
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  async function search() {
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await searchRoommates(filters, token);
      setResults(result.results.map((item) => ({
        candidateId: item.profile.id,
        score: item.score,
        breakdown: item.breakdown,
        profile: item.profile,
      })));
      setHasSearched(true);
    } catch (error) {
      setErrorMessage(error.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setFilters({
      minBudget: '',
      maxBudget: '',
      preferredArea: '',
      lifestyle: '',
      foodHabits: '',
      sleepSchedule: '',
      smoking: '',
      drinking: '',
      sort: 'compatibility',
    });
    setResults([]);
    setHasSearched(false);
    setErrorMessage('');
  }

  return (
    <>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>‹ Home</Text>
      </Pressable>
      <Text style={styles.title}>Search roommates</Text>
      <Text style={styles.subtitle}>Combine filters to find suitable profiles.</Text>
      <View style={styles.budgetRow}>
        <TextInput
          keyboardType="numeric"
          onChangeText={(value) => updateFilter('minBudget', value)}
          placeholder="Min budget"
          style={styles.input}
          value={filters.minBudget}
        />
        <Text style={styles.rangeSeparator}>to</Text>
        <TextInput
          keyboardType="numeric"
          onChangeText={(value) => updateFilter('maxBudget', value)}
          placeholder="Max budget"
          style={styles.input}
          value={filters.maxBudget}
        />
      </View>
      <TextInput
        onChangeText={(value) => updateFilter('preferredArea', value)}
        placeholder="Preferred city or location"
        style={styles.input}
        value={filters.preferredArea}
      />
      <PreferenceGroup
        label="Lifestyle"
        options={[['low', 'Relaxed'], ['medium', 'Balanced'], ['high', 'Very tidy']]}
        selected={filters.lifestyle}
        onSelect={(value) => updateFilter('lifestyle', value)}
      />
      <PreferenceGroup
        label="Food habits"
        options={[['vegetarian', 'Vegetarian'], ['nonVegetarian', 'Non-vegetarian']]}
        selected={filters.foodHabits}
        onSelect={(value) => updateFilter('foodHabits', value)}
      />
      <PreferenceGroup
        label="Sleeping habits"
        options={[['early', 'Early'], ['late', 'Late'], ['flexible', 'Flexible']]}
        selected={filters.sleepSchedule}
        onSelect={(value) => updateFilter('sleepSchedule', value)}
      />
      <PreferenceGroup
        label="Smoking"
        options={[['yes', 'Smoker'], ['no', 'Non-smoker']]}
        selected={filters.smoking}
        onSelect={(value) => updateFilter('smoking', value)}
      />
      <PreferenceGroup
        label="Drinking"
        options={[['yes', 'Yes'], ['occasionally', 'Occasionally'], ['no', 'Never']]}
        selected={filters.drinking}
        onSelect={(value) => updateFilter('drinking', value)}
      />
      <PreferenceGroup
        label="Sort by"
        options={[['compatibility', 'Compatibility'], ['budget', 'Budget'], ['location', 'Location']]}
        selected={filters.sort}
        onSelect={(value) => updateFilter('sort', value)}
      />
      <View style={styles.searchActions}>
        <Pressable disabled={loading} onPress={search} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{loading ? 'Searching...' : 'Search'}</Text>
        </Pressable>
        <Pressable onPress={clearFilters} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Clear filters</Text>
        </Pressable>
      </View>
      {errorMessage !== '' && <Text style={styles.errorText}>{errorMessage}</Text>}
      {!loading && hasSearched && results.length === 0 && (
        <View style={styles.state}>
          <Text style={styles.emptyTitle}>No roommates found</Text>
          <Text style={styles.stateText}>Try clearing a filter or widening your budget.</Text>
        </View>
      )}
      {!loading && results.map((match, index) => (
        <MatchCard
          key={match.candidateId}
          isFavorite={favoriteIds.includes(match.candidateId)}
          match={match}
          onPress={() => onSelect(match)}
          onToggleFavorite={() => onToggleFavorite(match.candidateId)}
          rank={index + 1}
        />
      ))}
    </>
  );
}

function AccommodationScreen({ onBack, onBookings, token }) {
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState({ preferredArea: '', minRent: '', maxRent: '', type: '' });
  const [form, setForm] = useState({
    title: '', description: '', city: '', preferredArea: '', monthlyRent: '',
    securityDeposit: '', availableRooms: '1', availableFrom: '', type: 'flat',
  });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [recommendationsError, setRecommendationsError] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const loadListings = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await fetchAccommodations(filters, token);
      setListings(result?.listings || []);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [filters, token]);

  useEffect(() => { loadListings(); }, [loadListings]);

  const loadRecommendations = useCallback(async () => {
    setRecommendationsError('');
    try {
      const result = await fetchAccommodationRecommendations(token);
      setRecommendations(result?.recommendations || []);
    } catch (error) {
      setRecommendationsError(error.message);
    }
  }, [token]);

  useEffect(() => { loadRecommendations(); }, [loadRecommendations]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function contactOwner() {
    if (!selectedListing?.listing?.ownerId) return;
    try {
      await sendConnectionRequest(selectedListing.listing.ownerId, token);
      setContactMessage('Connection request sent to the listing owner.');
    } catch (error) {
      setContactMessage(error.message);
    }
  }

  async function publish() {
    setSaving(true);
    setMessage('');
    setErrorMessage('');
    try {
      await createAccommodation({
        ...form,
        monthlyRent: Number(form.monthlyRent),
        securityDeposit: Number(form.securityDeposit || 0),
        availableRooms: Number(form.availableRooms),
        photoUrls: [],
      }, token);
      setMessage('Accommodation listing published successfully.');
      setShowForm(false);
      await loadListings();
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
      <View style={styles.favoriteTitleRow}>
        <View>
          <Text style={styles.title}>Accommodation</Text>
          <Text style={styles.subtitle}>Find rooms and share available spaces.</Text>
        </View>
        <Pressable onPress={() => setShowForm((value) => !value)} style={styles.refreshButton}>
          <Text style={styles.refreshText}>＋</Text>
        </Pressable>
      </View>
      {selectedListing ? (
        <View style={styles.detailsCard}>
          <Pressable onPress={() => setSelectedListing(null)} style={styles.backButton}>
            <Text style={styles.backText}>‹ Listings</Text>
          </Pressable>
          <Text style={styles.detailsName}>{selectedListing.title}</Text>
          <DetailRow label="Suitability score" value={`${selectedListing.score}%`} />
          <DetailRow label="Rent" value={`₹${selectedListing.listing.monthlyRent}/month`} />
          <DetailRow label="Location" value={`${selectedListing.listing.city}, ${selectedListing.listing.preferredArea}`} />
          <DetailRow label="Type" value={selectedListing.listing.type} />
          <Text style={styles.notificationMessage}>{selectedListing.listing.description}</Text>
          <ReviewSection
            targetId={selectedListing.listing.id}
            targetType="accommodation"
            token={token}
            fetchReviews={fetchAccommodationReviews}
            submitReview={submitAccommodationReview}
          />
          <Text style={styles.breakdownTitle}>Why this listing matches</Text>
          {Object.entries(selectedListing.breakdown || {}).map(([category, value]) => (
            <DetailRow key={category} label={category} value={`${Math.round(value * 100)}%`} />
          ))}
          <BookingForm
            listingId={selectedListing.listing.id}
            onSent={(text) => setContactMessage(text)}
            token={token}
          />
          <Pressable onPress={contactOwner} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Contact listing owner</Text>
          </Pressable>
          {contactMessage !== '' && <Text style={styles.successText}>{contactMessage}</Text>}
        </View>
      ) : (
      <>
      <View style={styles.favoriteTitleRow}>
        <View>
          <Text style={styles.detailsSectionTitle}>Recommended for you</Text>
          <Text style={styles.subtitle}>Ranked using your saved budget, location, and move-in preferences.</Text>
        </View>
        <Pressable onPress={loadRecommendations} style={styles.refreshButton}>
          <Text style={styles.refreshText}>↻</Text>
        </Pressable>
      </View>
      {recommendationsError !== '' && <Text style={styles.errorText}>{recommendationsError}</Text>}
      {recommendations.length === 0 && recommendationsError === '' && (
        <Text style={styles.stateText}>No personalized recommendations are available yet.</Text>
      )}
      {recommendations.map((recommendation) => (
        <Pressable
          key={recommendation.listing.id}
          onPress={() => setSelectedListing(recommendation)}
          style={({ pressed }) => [styles.matchCard, pressed && styles.buttonPressed]}
        >
          <View style={styles.matchHeader}>
            <View>
              <Text style={styles.candidateLabel}>Recommended accommodation</Text>
              <Text style={styles.candidateId}>{recommendation.listing.title}</Text>
            </View>
            <Text style={styles.score}>{recommendation.score}%</Text>
          </View>
          <Text style={styles.stateText}>
            {recommendation.listing.city} · {recommendation.listing.preferredArea} · ₹{recommendation.listing.monthlyRent}/month
          </Text>
          <Text style={styles.viewDetailsText}>View listing details</Text>
        </Pressable>
      ))}
      </>
      )}
      <View style={styles.budgetRow}>
        <TextInput placeholder="Location" onChangeText={(value) => setFilters({ ...filters, preferredArea: value })} style={styles.input} value={filters.preferredArea} />
        <TextInput keyboardType="numeric" placeholder="Min rent" onChangeText={(value) => setFilters({ ...filters, minRent: value })} style={styles.input} value={filters.minRent} />
      </View>
      <View style={styles.budgetRow}>
        <TextInput keyboardType="numeric" placeholder="Max rent" onChangeText={(value) => setFilters({ ...filters, maxRent: value })} style={styles.input} value={filters.maxRent} />
        <Pressable onPress={loadListings} style={styles.button}><Text style={styles.buttonText}>Filter</Text></Pressable>
      </View>
      <PreferenceGroup
        label="Accommodation type"
        options={[['', 'Any'], ['flat', 'Flat'], ['apartment', 'Apartment'], ['pg', 'PG'], ['shared-room', 'Shared room']]}
        selected={filters.type}
        onSelect={(value) => setFilters({ ...filters, type: value })}
      />
      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Publish a listing</Text>
          {[
            ['title', 'Listing title'],
            ['description', 'Description'],
            ['city', 'City'],
            ['preferredArea', 'Preferred location'],
            ['monthlyRent', 'Monthly rent'],
            ['securityDeposit', 'Security deposit'],
            ['availableRooms', 'Available rooms/beds'],
            ['availableFrom', 'Available from (YYYY-MM-DD)'],
          ].map(([field, placeholder]) => (
            <TextInput
              key={field}
              keyboardType={['monthlyRent', 'securityDeposit', 'availableRooms'].includes(field) ? 'numeric' : 'default'}
              multiline={field === 'description'}
              onChangeText={(value) => update(field, value)}
              placeholder={placeholder}
              style={styles.input}
              value={form[field]}
            />
          ))}
          <PreferenceGroup
            label="Type"
            options={[['flat', 'Flat'], ['apartment', 'Apartment'], ['pg', 'PG'], ['shared-room', 'Shared room']]}
            selected={form.type}
            onSelect={(value) => update('type', value)}
          />
          <Pressable disabled={saving} onPress={publish} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{saving ? 'Publishing...' : 'Publish listing'}</Text>
          </Pressable>
        </View>
      )}
      {message !== '' && <Text style={styles.successText}>{message}</Text>}
      {errorMessage !== '' && <Text style={styles.errorText}>{errorMessage}</Text>}
      {loading && <Text style={styles.stateText}>Loading listings...</Text>}
      {!loading && !errorMessage && listings.length === 0 && <Text style={styles.stateText}>No accommodation listings found.</Text>}
      {!loading && listings.map((listing) => (
        <View key={listing.id} style={styles.matchCard}>
          <Text style={styles.candidateId}>{listing.title}</Text>
          <Text style={styles.stateText}>{listing.city} · {listing.preferredArea}</Text>
          <DetailRow label="Rent" value={`₹${listing.monthlyRent}/month`} />
          <DetailRow label="Type" value={listing.type} />
          <DetailRow label="Available rooms" value={String(listing.availableRooms)} />
          <Text style={styles.notificationMessage}>{listing.description}</Text>
        </View>
      ))}
    </>
  );
}

function BookingForm({ listingId, onSent, token }) {
  const [moveInDate, setMoveInDate] = useState('');
  const [occupants, setOccupants] = useState('1');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function submit() {
    setSaving(true);
    setErrorMessage('');
    try {
      await sendBookingRequest(
        listingId,
        { requestedMoveInDate: moveInDate, occupants: Number(occupants), message },
        token,
      );
      onSent('Booking request sent successfully.');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.formCard}>
      <Text style={styles.formSectionTitle}>Request this accommodation</Text>
      <TextInput
        onChangeText={setMoveInDate}
        placeholder="Requested move-in date (YYYY-MM-DD)"
        style={styles.input}
        value={moveInDate}
      />
      <TextInput
        keyboardType="numeric"
        onChangeText={setOccupants}
        placeholder="Number of occupants"
        style={styles.input}
        value={occupants}
      />
      <TextInput
        multiline
        onChangeText={setMessage}
        placeholder="Optional message"
        style={styles.input}
        value={message}
      />
      {errorMessage !== '' && <Text style={styles.errorText}>{errorMessage}</Text>}
      <Pressable disabled={saving} onPress={submit} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>{saving ? 'Sending...' : 'Send booking request'}</Text>
      </Pressable>
    </View>
  );
}

function BookingRequestsScreen({
  errorMessage,
  loading,
  onAccept,
  onBack,
  onCancel,
  onRefresh,
  onReject,
  received,
  sent,
}) {
  const [actionError, setActionError] = useState('');

  async function action(callback) {
    setActionError('');
    try {
      await callback();
    } catch (error) {
      setActionError(error.message);
    }
  }

  return (
    <>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>‹ Home</Text>
      </Pressable>
      <View style={styles.favoriteTitleRow}>
        <View>
          <Text style={styles.title}>Booking requests</Text>
          <Text style={styles.subtitle}>Manage accommodation interest.</Text>
        </View>
        <Pressable onPress={onRefresh} style={styles.refreshButton}>
          <Text style={styles.refreshText}>↻</Text>
        </Pressable>
      </View>
      {(errorMessage || actionError) !== '' && (
        <Text style={styles.errorText}>{actionError || errorMessage}</Text>
      )}
      {loading && <Text style={styles.stateText}>Loading booking requests...</Text>}
      {!loading && (
        <>
          <Text style={styles.detailsSectionTitle}>Received</Text>
          {received.length === 0 && <Text style={styles.stateText}>No received booking requests.</Text>}
          {received.map((request) => (
            <BookingRequestCard
              key={request.id}
              request={request}
              primaryLabel="Accept"
              secondaryLabel="Reject"
              onPrimary={() => action(() => onAccept(request.id))}
              onSecondary={() => action(() => onReject(request.id))}
            />
          ))}
          <Text style={styles.detailsSectionTitle}>Sent</Text>
          {sent.length === 0 && <Text style={styles.stateText}>No sent booking requests.</Text>}
          {sent.map((request) => (
            <BookingRequestCard
              key={request.id}
              request={request}
              primaryLabel="Cancel"
              onPrimary={() => action(() => onCancel(request.id))}
            />
          ))}
        </>
      )}
    </>
  );
}

function BookingRequestCard({
  onPrimary,
  onSecondary,
  primaryLabel,
  request,
}) {
  return (
    <View style={styles.matchCard}>
      <Text style={styles.candidateId}>Listing: {request.listingId}</Text>
      <Text style={styles.stateText}>
        Status: {request.status} · Move-in: {request.requestedMoveInDate}
      </Text>
      <Text style={styles.stateText}>Occupants: {request.occupants}</Text>
      {request.message && <Text style={styles.notificationMessage}>{request.message}</Text>}
      {request.status === 'pending' && (
        <View style={styles.requestActions}>
          <Pressable onPress={onPrimary} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
          </Pressable>
          {onSecondary && (
            <Pressable onPress={onSecondary} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Reject</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function ChatListScreen({
  conversations,
  errorMessage,
  loading,
  onBack,
  onRefresh,
  onSelect,
}) {
  return (
    <>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>‹ Home</Text>
      </Pressable>
      <View style={styles.favoriteTitleRow}>
        <View>
          <Text style={styles.title}>My chats</Text>
          <Text style={styles.subtitle}>Private conversations with your connections.</Text>
        </View>
        <Pressable onPress={onRefresh} style={styles.refreshButton}>
          <Text style={styles.refreshText}>↻</Text>
        </Pressable>
      </View>
      {errorMessage !== '' && <Text style={styles.errorText}>{errorMessage}</Text>}
      {loading && <Text style={styles.stateText}>Loading conversations...</Text>}
      {!loading && conversations.length === 0 && (
        <Text style={styles.stateText}>
          No conversations yet. Open a roommate profile and start a chat after your connection is accepted.
        </Text>
      )}
      {!loading && conversations.map((conversation) => (
        <Pressable
          key={conversation.id}
          onPress={() => onSelect(conversation)}
          style={styles.notificationCard}
        >
          <View style={styles.matchHeader}>
            <Text style={styles.notificationTitle}>{conversation.otherUser.fullName}</Text>
            {conversation.unreadCount > 0 && (
              <Text style={styles.unreadBadge}>{conversation.unreadCount} new</Text>
            )}
          </View>
          <Text style={styles.notificationMessage}>
            {conversation.lastMessage?.content || 'Start a conversation'}
          </Text>
          <Text style={styles.notificationDate}>
            {formatDate(conversation.lastMessage?.createdAt || conversation.updatedAt)}
          </Text>
        </Pressable>
      ))}
    </>
  );
}

function ChatDetailsScreen({ conversation, onBack, onChanged, token }) {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const pollingRef = useRef(false);

  const loadMessages = useCallback(async (silent = false) => {
    if (!conversation?.id) return;
    if (pollingRef.current) return;
    pollingRef.current = true;
    if (!silent) setLoading(true);
    setErrorMessage('');
    try {
      const result = await fetchMessages(conversation.id, token);
      setMessages((current) => {
        const merged = new Map(current.map((message) => [message.id, message]));
        for (const message of result?.messages || []) {
          merged.set(message.id, message);
        }
        return [...merged.values()].sort((first, second) =>
          first.createdAt.localeCompare(second.createdAt),
        );
      });
      await markMessagesRead(conversation.id, token);
      if (!silent) await onChanged();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      if (!silent) setLoading(false);
      pollingRef.current = false;
    }
  }, [conversation, onChanged, token]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(() => loadMessages(true), 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  async function submit() {
    if (!content.trim()) {
      setErrorMessage('Enter a message before sending.');
      return;
    }
    setSending(true);
    setErrorMessage('');
    try {
      await sendMessage(conversation.id, content, token);
      setContent('');
      await loadMessages();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setSending(false);
    }
  }

  if (!conversation) {
    return <Text style={styles.stateText}>Choose a conversation to continue.</Text>;
  }

  return (
    <>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>‹ Chats</Text>
      </Pressable>
      <View style={styles.favoriteTitleRow}>
        <View>
          <Text style={styles.title}>{conversation.otherUser.fullName}</Text>
          <Text style={styles.subtitle}>Messages are private to both participants.</Text>
        </View>
        <Pressable onPress={loadMessages} style={styles.refreshButton}>
          <Text style={styles.refreshText}>↻</Text>
        </Pressable>
      </View>
      {errorMessage !== '' && <Text style={styles.errorText}>{errorMessage}</Text>}
      {loading && <Text style={styles.stateText}>Loading messages...</Text>}
      {!loading && messages.length === 0 && (
        <Text style={styles.stateText}>No messages yet. Say hello.</Text>
      )}
      {!loading && messages.map((message) => (
        <View
          key={message.id}
          style={[styles.chatBubble, message.isMine ? styles.myChatBubble : styles.theirChatBubble]}
        >
          <Text style={message.isMine ? styles.myChatText : styles.theirChatText}>
            {message.content}
          </Text>
          <Text style={message.isMine ? styles.myChatMeta : styles.theirChatMeta}>
            {formatDate(message.createdAt)} {message.isMine ? `· ${message.read ? 'Read' : 'Sent'}` : ''}
          </Text>
        </View>
      ))}
      <View style={styles.chatComposer}>
        <TextInput
          multiline
          onChangeText={setContent}
          placeholder="Write a message..."
          style={styles.chatInput}
          value={content}
        />
        <Pressable disabled={sending} onPress={submit} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{sending ? 'Sending...' : 'Send'}</Text>
        </Pressable>
      </View>
    </>
  );
}

function MatchCard({ isFavorite, match, onPress, onToggleFavorite, rank }) {
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
      <View style={styles.matchActions}>
        <Text style={styles.viewDetailsText}>View profile details</Text>
        <Pressable
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          accessibilityRole="button"
          onPress={onToggleFavorite}
          style={styles.favoriteButton}
        >
          <Text style={styles.favoriteText}>{isFavorite ? '♥ Saved' : '♡ Save'}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function FavoritesScreen({
  errorMessage,
  favorites,
  loading,
  onBack,
  onRefresh,
  onSelectFavorite,
}) {
  return (
    <>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>‹ Home</Text>
      </Pressable>
      <View style={styles.favoriteTitleRow}>
        <View>
          <Text style={styles.title}>Favorite roommates</Text>
          <Text style={styles.subtitle}>Roommates you saved for later.</Text>
        </View>
        <Pressable
          accessibilityLabel="Refresh favorites"
          accessibilityRole="button"
          disabled={loading}
          onPress={onRefresh}
          style={styles.refreshButton}
        >
          <Text style={styles.refreshText}>↻</Text>
        </Pressable>
      </View>
      {loading && (
        <View style={styles.state}>
          <ActivityIndicator color="#2563eb" size="large" />
          <Text style={styles.stateText}>Loading favorites...</Text>
        </View>
      )}
      {!loading && errorMessage !== '' && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not load favorites</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable onPress={onRefresh} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      )}
      {!loading && errorMessage === '' && favorites.length === 0 && (
        <View style={styles.state}>
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.stateText}>
            Save a roommate from your recommendations to see them here.
          </Text>
        </View>
      )}
      {!loading &&
        errorMessage === '' &&
        favorites.map((favorite) => (
          <Pressable
            accessibilityRole="button"
            key={favorite.roommate?.id}
            onPress={() => onSelectFavorite(favorite)}
            style={({ pressed }) => [styles.matchCard, pressed && styles.buttonPressed]}
          >
            <View style={styles.matchHeader}>
              <View>
                <Text style={styles.candidateLabel}>Favorite roommate</Text>
                <Text style={styles.candidateId}>
                  {favorite.roommate?.fullName || favorite.roommate?.id || 'Unknown'}
                </Text>
              </View>
              <Text style={styles.score}>{formatScore(favorite.compatibility?.score)}</Text>
            </View>
            <DetailRow label="Location" value={formatValue(favorite.roommate?.profile?.preferredArea)} />
            <Text style={styles.viewDetailsText}>View profile details</Text>
          </Pressable>
        ))}
    </>
  );
}

function ConnectionRequestsScreen({
  errorMessage,
  loading,
  onAccept,
  onBack,
  onCancel,
  onRefresh,
  onReject,
  received,
  sent,
}) {
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');

  async function perform(action, successMessage) {
    setActionError('');
    setMessage('');
    try {
      await action();
      setMessage(successMessage);
    } catch (error) {
      setActionError(error.message);
    }

    function NotificationsScreen({
      errorMessage,
      loading,
      notifications,
      onBack,
      onMarkAllRead,
      onOpen,
      onRefresh,
    }) {
      const [actionError, setActionError] = useState('');
      const [message, setMessage] = useState('');

      async function markAll() {
        setActionError('');
        try {
          await onMarkAllRead();
          setMessage('All notifications marked as read.');
        } catch (error) {
          setActionError(error.message);
        }
      }

      return (
        <>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>‹ Home</Text>
          </Pressable>
          <View style={styles.favoriteTitleRow}>
            <View>
              <Text style={styles.title}>Notifications</Text>
              <Text style={styles.subtitle}>Updates about your roommate activity.</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onRefresh} style={styles.refreshButton}>
              <Text style={styles.refreshText}>↻</Text>
            </Pressable>
          </View>
          <Pressable onPress={markAll} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Mark all as read</Text>
          </Pressable>
          {message !== '' && <Text style={styles.successText}>{message}</Text>}
          {(errorMessage || actionError) !== '' && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{actionError || errorMessage}</Text>
              <Pressable onPress={onRefresh} style={styles.retryButton}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          )}
          {loading && (
            <View style={styles.state}>
              <ActivityIndicator color="#2563eb" size="large" />
              <Text style={styles.stateText}>Loading notifications...</Text>
            </View>
          )}
          {!loading && !errorMessage && notifications.length === 0 && (
            <View style={styles.state}>
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.stateText}>Important roommate updates will appear here.</Text>
            </View>
          )}
          {!loading &&
            notifications.map((notification) => (
              <Pressable
                accessibilityRole="button"
                key={notification.id}
                onPress={() => onOpen(notification)}
                style={[styles.notificationCard, !notification.read && styles.unreadNotification]}
              >
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationDate}>
                  {notification.read ? 'Read' : 'Unread'} · {formatDate(notification.createdAt)}
                </Text>
              </Pressable>
            ))}
        </>
      );
    }
  }

  return (
    <>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>‹ Home</Text>
      </Pressable>
      <View style={styles.favoriteTitleRow}>
        <View>
          <Text style={styles.title}>Connection requests</Text>
          <Text style={styles.subtitle}>Manage roommate connections.</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onRefresh} style={styles.refreshButton}>
          <Text style={styles.refreshText}>↻</Text>
        </Pressable>
      </View>
      {message !== '' && <Text style={styles.successText}>{message}</Text>}
      {(errorMessage || actionError) !== '' && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{actionError || errorMessage}</Text>
          <Pressable onPress={onRefresh} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      )}
      {loading && (
        <View style={styles.state}>
          <ActivityIndicator color="#2563eb" size="large" />
          <Text style={styles.stateText}>Loading connection requests...</Text>
        </View>
      )}
      {!loading && (
        <>
          <Text style={styles.detailsSectionTitle}>Received</Text>
          {received.length === 0 ? (
            <Text style={styles.stateText}>No received requests.</Text>
          ) : (
            received.map((request) => (
              <RequestCard
                key={request.id}
                person={request.sender}
                request={request}
                actionLabel="Accept"
                secondaryLabel="Reject"
                onAction={() => perform(
                  () => onAccept(request.id),
                  'Connection request accepted.',
                )}
                onSecondary={() => perform(
                  () => onReject(request.id),
                  'Connection request rejected.',
                )}
              />
            ))
          )}
          <Text style={styles.detailsSectionTitle}>Sent</Text>
          {sent.length === 0 ? (
            <Text style={styles.stateText}>No sent requests.</Text>
          ) : (
            sent.map((request) => (
              <RequestCard
                key={request.id}
                person={request.receiver}
                request={request}
                actionLabel="Cancel"
                onAction={() => perform(
                  () => onCancel(request.id),
                  'Connection request cancelled.',
                )}
              />
            ))
          )}
        </>
      )}
    </>
  );
}

function RequestCard({
  actionLabel,
  onAction,
  onSecondary,
  person,
  request,
}) {
  return (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <View>
          <Text style={styles.candidateLabel}>{request.status} request</Text>
          <Text style={styles.candidateId}>{person?.fullName || 'Roommate'}</Text>
        </View>
        <Text style={styles.score}>{formatScore(request.compatibility?.score)}</Text>
      </View>
      <Text style={styles.stateText}>
        Compatibility score is based on the latest saved preferences.
      </Text>
      {request.status === 'pending' && (
        <View style={styles.requestActions}>
          <Pressable onPress={onAction} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{actionLabel}</Text>
          </Pressable>
          {onSecondary && (
            <Pressable onPress={onSecondary} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Reject</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function ProfileDetailsScreen({ match, onBack, onConnect, onChat, token }) {
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
        {onConnect && match?.candidateId && (
          <Pressable
            accessibilityRole="button"
            onPress={() => onConnect(match.candidateId)}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Send connection request</Text>
          </Pressable>
        )}
        {onChat && match?.candidateId && (
          <Pressable
            accessibilityRole="button"
            onPress={() => onChat(match.candidateId)}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Open chat</Text>
          </Pressable>
        )}
      </View>
      {match?.candidateId && (
        <ReviewSection
          targetId={match.candidateId}
          targetType="roommate"
          token={token}
          fetchReviews={fetchRoommateReviews}
          submitReview={submitRoommateReview}
        />
      )}
    </>
  );
}

function ReviewSection({ fetchReviews, submitReview, targetId, targetType, token }) {
  const [data, setData] = useState({ reviews: [], averageRating: 0, totalReviews: 0 });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      setData(await fetchReviews(targetId, token));
    } catch (error) {
      setErrorMessage(error.message);
    }
  }, [fetchReviews, targetId, token]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  async function submit() {
    setSaving(true);
    setErrorMessage('');
    setMessage('');
    try {
      await submitReview(targetId, { rating, comment }, token);
      setMessage('Review submitted successfully.');
      setComment('');
      await loadReviews();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.detailsCard}>
      <Text style={styles.detailsSectionTitle}>Reviews</Text>
      <Text style={styles.reviewAverage}>
        {data.averageRating || 'No ratings yet'} {data.totalReviews > 0 ? `(${data.totalReviews})` : ''}
      </Text>
      {data.reviews.map((review) => (
        <View key={review.id} style={styles.reviewRow}>
          <Text style={styles.notificationTitle}>{'★'.repeat(review.rating)}</Text>
          <Text style={styles.notificationMessage}>
            {review.reviewer?.fullName || 'User'}: {review.comment || 'No written comment'}
          </Text>
        </View>
      ))}
      <Text style={styles.fieldLabel}>Your rating</Text>
      <View style={styles.optionRow}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable key={value} onPress={() => setRating(value)} style={styles.optionButton}>
            <Text style={value <= rating ? styles.selectedStar : styles.optionText}>★</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        multiline
        onChangeText={setComment}
        placeholder="Optional comment"
        style={styles.input}
        value={comment}
      />
      {errorMessage !== '' && <Text style={styles.errorText}>{errorMessage}</Text>}
      {message !== '' && <Text style={styles.successText}>{message}</Text>}
      <Pressable disabled={saving} onPress={submit} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>{saving ? 'Submitting...' : 'Submit review'}</Text>
      </Pressable>
    </View>
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

function formatDate(value) {
  if (!value) return 'Recently';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Recently' : date.toLocaleString();
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
  favoriteTitleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  matchActions: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  favoriteButton: { paddingVertical: 4, paddingHorizontal: 8 },
  favoriteText: { color: '#2563eb', fontSize: 14, fontWeight: '700' },
  requestActions: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  searchActions: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  notificationCard: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 14,
    borderWidth: 1,
    gap: 7,
    padding: 18,
  },
  unreadNotification: { backgroundColor: '#eff6ff', borderColor: '#93c5fd' },
  notificationTitle: { color: '#0f172a', fontSize: 17, fontWeight: '700' },
  notificationMessage: { color: '#475569', lineHeight: 21 },
  notificationDate: { color: '#64748b', fontSize: 12 },
  reviewAverage: { color: '#ca8a04', fontSize: 20, fontWeight: '800' },
  reviewRow: { borderTopColor: '#e2e8f0', borderTopWidth: 1, gap: 4, paddingTop: 10 },
  selectedStar: { color: '#eab308', fontSize: 22 },
  unreadBadge: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chatBubble: {
    borderRadius: 14,
    gap: 5,
    maxWidth: '84%',
    padding: 12,
  },
  myChatBubble: { alignSelf: 'flex-end', backgroundColor: '#2563eb' },
  theirChatBubble: { alignSelf: 'flex-start', backgroundColor: '#e2e8f0' },
  myChatText: { color: '#fff', fontSize: 16 },
  theirChatText: { color: '#0f172a', fontSize: 16 },
  myChatMeta: { color: '#dbeafe', fontSize: 11 },
  theirChatMeta: { color: '#64748b', fontSize: 11 },
  chatComposer: { gap: 10 },
  chatInput: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
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
