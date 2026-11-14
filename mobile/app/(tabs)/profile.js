import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, RADII, SHADOWS, SPACING, TYPOGRAPHY } from '../../src/constants';
import { Badge, Button, Card } from '../../src/components';
import { CURRENT_USER } from '../../src/data/mockData';

const USER_PROFILE_KEY = '@nestmate_user_profile';

const SLEEP_OPTIONS = ['early', 'flexible', 'late'];
const CLEAN_OPTIONS = ['high', 'medium', 'relaxed'];

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [user, setUser] = useState(CURRENT_USER);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);

  // Form states for editing
  const [editBudget, setEditBudget] = useState(String(CURRENT_USER.budget));
  const [editArea, setEditArea] = useState(CURRENT_USER.preferredArea);
  const [editSleep, setEditSleep] = useState(CURRENT_USER.lifestyle.sleepSchedule);
  const [editClean, setEditClean] = useState(CURRENT_USER.lifestyle.cleanliness);
  const [editSmoking, setEditSmoking] = useState(CURRENT_USER.lifestyle.smoking);
  const [editPets, setEditPets] = useState(CURRENT_USER.lifestyle.pets);

  // Load custom saved profile from AsyncStorage if exists
  useEffect(() => {
    async function loadProfile() {
      try {
        const stored = await AsyncStorage.getItem(USER_PROFILE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setEditBudget(String(parsed.budget));
          setEditArea(parsed.preferredArea);
          setEditSleep(parsed.lifestyle.sleepSchedule);
          setEditClean(parsed.lifestyle.cleanliness);
          setEditSmoking(parsed.lifestyle.smoking);
          setEditPets(parsed.lifestyle.pets);
        }
      } catch (e) {
        console.warn('Failed to load user profile from storage', e);
      }
    }
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    const numBudget = parseInt(editBudget, 10);
    if (isNaN(numBudget) || numBudget <= 0) {
      Alert.alert('Invalid Budget', 'Please enter a valid monthly budget.');
      return;
    }

    const updatedUser = {
      ...user,
      budget: numBudget,
      preferredArea: editArea.trim() || user.preferredArea,
      lifestyle: {
        ...user.lifestyle,
        sleepSchedule: editSleep,
        cleanliness: editClean,
        smoking: editSmoking,
        pets: editPets,
      },
    };

    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditModalOpen(false);
      Alert.alert('Profile Updated', 'Your roommate matching preferences have been saved successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to save changes.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of NestMate?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity
          onPress={() => setIsEditModalOpen(true)}
          style={styles.editHeaderButton}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={18} color={COLORS.primary} />
          <Text style={styles.editHeaderText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Card variant="elevated" style={styles.userCard}>
          <View style={styles.userHeaderRow}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' }}
                style={styles.avatar}
              />
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color={COLORS.textInverse} />
              </View>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userRole}>{user.university}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
                <Text style={styles.userLocation}>{user.location}</Text>
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{user.stats.activeMatches}</Text>
              <Text style={styles.statLabel}>Active Matches</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{user.stats.pendingRequests}</Text>
              <Text style={styles.statLabel}>Requests</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{user.stats.savedAccommodations}</Text>
              <Text style={styles.statLabel}>Saved Places</Text>
            </View>
          </View>
        </Card>

        {/* Housing & Budget Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Housing Preferences</Text>
          <Card variant="outlined" style={styles.prefCard}>
            <View style={styles.prefRow}>
              <View style={styles.prefIconBox}>
                <Ionicons name="wallet-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.prefInfo}>
                <Text style={styles.prefLabel}>Monthly Budget</Text>
                <Text style={styles.prefValue}>₹{user.budget.toLocaleString('en-IN')} / month</Text>
              </View>
            </View>

            <View style={styles.prefDivider} />

            <View style={styles.prefRow}>
              <View style={styles.prefIconBox}>
                <Ionicons name="map-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.prefInfo}>
                <Text style={styles.prefLabel}>Target Area</Text>
                <Text style={styles.prefValue}>{user.preferredArea}</Text>
              </View>
            </View>

            <View style={styles.prefDivider} />

            <View style={styles.prefRow}>
              <View style={styles.prefIconBox}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.prefInfo}>
                <Text style={styles.prefLabel}>Target Move-in Date</Text>
                <Text style={styles.prefValue}>{user.moveInDate}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Lifestyle & Habits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lifestyle & Habits</Text>
          <View style={styles.lifestyleGrid}>
            <View style={styles.lifestyleCard}>
              <Ionicons name="moon-outline" size={20} color={COLORS.primaryDark} />
              <Text style={styles.lifestyleCardTitle}>Sleep</Text>
              <Text style={styles.lifestyleCardValue}>{user.lifestyle.sleepSchedule}</Text>
            </View>

            <View style={styles.lifestyleCard}>
              <Ionicons name="sparkles-outline" size={20} color={COLORS.primaryDark} />
              <Text style={styles.lifestyleCardTitle}>Cleanliness</Text>
              <Text style={styles.lifestyleCardValue}>{user.lifestyle.cleanliness}</Text>
            </View>

            <View style={styles.lifestyleCard}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primaryDark} />
              <Text style={styles.lifestyleCardTitle}>Smoking</Text>
              <Text style={styles.lifestyleCardValue}>
                {user.lifestyle.smoking ? 'Smoker' : 'Non-Smoker'}
              </Text>
            </View>

            <View style={styles.lifestyleCard}>
              <Ionicons name="paw-outline" size={20} color={COLORS.primaryDark} />
              <Text style={styles.lifestyleCardTitle}>Pets</Text>
              <Text style={styles.lifestyleCardValue}>
                {user.lifestyle.pets ? 'Pet Friendly' : 'No Pets'}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings & System Toggles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <Card variant="outlined" style={styles.settingsCard}>
            <View style={styles.settingToggleRow}>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingTitle}>Match Notifications</Text>
                <Text style={styles.settingSubtitle}>Alerts for new compatible roommate recommendations</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
              />
            </View>

            <View style={styles.prefDivider} />

            <View style={styles.settingToggleRow}>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingTitle}>Profile Discovery Visibility</Text>
                <Text style={styles.settingSubtitle}>Allow other seekers to discover your profile</Text>
              </View>
              <Switch
                value={profileVisible}
                onValueChange={setProfileVisible}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
              />
            </View>
          </Card>
        </View>

        {/* Backend Status info pill */}
        <View style={styles.statusBox}>
          <Ionicons name="server-outline" size={16} color={COLORS.success} />
          <Text style={styles.statusText}>Backend: NestJS API Connected (Health: OK)</Text>
        </View>

        {/* Log Out Button */}
        <Button
          title="Log Out"
          variant="outline"
          size="md"
          icon={<Ionicons name="log-out-outline" size={18} color={COLORS.danger} />}
          onPress={handleLogout}
          style={styles.logoutButton}
          textStyle={{ color: COLORS.danger }}
        />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent={false} onRequestClose={() => setIsEditModalOpen(false)}>
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsEditModalOpen(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={24} color={COLORS.navyDark} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Match Preferences</Text>
            <TouchableOpacity onPress={handleSaveProfile} style={styles.modalSaveBtn}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            {/* Budget Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Monthly Budget (₹)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={editBudget}
                onChangeText={setEditBudget}
                placeholder="e.g. 15000"
              />
            </View>

            {/* Target Area Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Preferred Area / Neighborhood</Text>
              <TextInput
                style={styles.textInput}
                value={editArea}
                onChangeText={setEditArea}
                placeholder="e.g. Koramangala or Central"
              />
            </View>

            {/* Sleep Schedule Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sleep Schedule</Text>
              <View style={styles.pillRow}>
                {SLEEP_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.modalPill, editSleep === opt && styles.modalPillActive]}
                    onPress={() => setEditSleep(opt)}
                  >
                    <Text style={[styles.modalPillText, editSleep === opt && styles.modalPillTextActive]}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Cleanliness Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cleanliness</Text>
              <View style={styles.pillRow}>
                {CLEAN_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.modalPill, editClean === opt && styles.modalPillActive]}
                    onPress={() => setEditClean(opt)}
                  >
                    <Text style={[styles.modalPillText, editClean === opt && styles.modalPillTextActive]}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Smoking Toggle */}
            <View style={styles.switchRow}>
              <Text style={styles.inputLabel}>Smoking Allowed / Smoker</Text>
              <Switch
                value={editSmoking}
                onValueChange={setEditSmoking}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
              />
            </View>

            {/* Pets Toggle */}
            <View style={styles.switchRow}>
              <Text style={styles.inputLabel}>Pet Friendly</Text>
              <Switch
                value={editPets}
                onValueChange={setEditPets}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button title="Save Preferences" variant="primary" size="lg" onPress={handleSaveProfile} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
  },
  editHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editHeaderText: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.primary,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  userCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  userHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.lg.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
  },
  userRole: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  userLocation: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.base.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
    marginBottom: SPACING.sm,
  },
  prefCard: {
    padding: SPACING.md,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  prefIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADII.md,
    backgroundColor: COLORS.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  prefInfo: {
    flex: 1,
  },
  prefLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.medium,
  },
  prefValue: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.navyDark,
    marginTop: 1,
  },
  prefDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
  },
  lifestyleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  lifestyleCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: 4,
  },
  lifestyleCardTitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.medium,
    marginTop: 2,
  },
  lifestyleCardValue: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.navyDark,
    textTransform: 'capitalize',
  },
  settingsCard: {
    padding: SPACING.md,
  },
  settingToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  settingTextGroup: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.navyDark,
  },
  settingSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.pill,
    marginBottom: SPACING.lg,
    alignSelf: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: TYPOGRAPHY.medium,
  },
  logoutButton: {
    borderColor: COLORS.danger,
    marginTop: SPACING.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.base.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
  },
  modalSaveBtn: {
    padding: 4,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primary,
  },
  modalBody: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.navyDark,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 14,
    color: COLORS.navyDark,
  },
  pillRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modalPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modalPillActive: {
    backgroundColor: COLORS.navyDark,
    borderColor: COLORS.navyDark,
  },
  modalPillText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.medium,
  },
  modalPillTextActive: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  modalFooter: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
