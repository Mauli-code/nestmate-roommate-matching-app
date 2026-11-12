import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  RADII,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../../src/constants';
import {
  Badge,
  Button,
  Card,
  CompatibilityBreakdown,
  MatchRequestModal,
} from '../../src/components';
import { useMatchRequests } from '../../src/hooks/useMatchRequests';
import { useSavedRoommates } from '../../src/hooks/useSavedRoommates';
import { MOCK_RECOMMENDED_ROOMMATES } from '../../src/data/mockData';

export default function RoommateDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [showModal, setShowModal] = useState(false);

  const { isRequested, sendRequest } = useMatchRequests();
  const { isSaved, toggleSave } = useSavedRoommates();

  // Find roommate by id
  const roommate = MOCK_RECOMMENDED_ROOMMATES.find((r) => r.id === id) || MOCK_RECOMMENDED_ROOMMATES[0];
  const requested = isRequested(roommate.id);
  const saved = isSaved(roommate.id);

  const handleMatchRequest = async () => {
    const res = await sendRequest(roommate);
    if (res.success) {
      setShowModal(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.circleButton}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.navyDark} />
        </TouchableOpacity>

        <Text style={styles.topBarTitle} numberOfLines={1}>Roommate Profile</Text>

        <TouchableOpacity
          onPress={() => toggleSave(roommate)}
          style={styles.circleButton}
          activeOpacity={0.7}
          accessibilityLabel="Save roommate"
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={saved ? COLORS.primary : COLORS.navyDark}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Hero Header */}
        <View style={styles.heroCard}>
          <Image source={{ uri: roommate.avatar }} style={styles.heroAvatar} />
          <View style={styles.heroOverlay}>
            <Badge
              label={`${roommate.score}% Match`}
              variant={roommate.score >= 90 ? 'success' : 'primary'}
              size="md"
              icon={<Ionicons name="sparkles" size={14} color={roommate.score >= 90 ? '#065F46' : COLORS.primaryDark} />}
            />
          </View>
        </View>

        {/* Identity & Role */}
        <View style={styles.sectionPadding}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>
              {roommate.name}, {roommate.age}
            </Text>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
          </View>

          <Text style={styles.roleText}>{roommate.role}</Text>

          {/* Quick Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Ionicons name="wallet-outline" size={18} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Monthly Budget</Text>
              <Text style={styles.infoValue}>${roommate.budget}/mo</Text>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="location-outline" size={18} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Preferred Area</Text>
              <Text style={styles.infoValue}>{roommate.preferredArea}</Text>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Move-In Date</Text>
              <Text style={styles.infoValue}>{roommate.moveInDate || 'Dec 1, 2026'}</Text>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              <Text style={styles.infoLabel}>Lease Duration</Text>
              <Text style={styles.infoValue}>{roommate.leaseDuration || '12 Months'}</Text>
            </View>
          </View>

          {/* Compatibility Breakdown Card */}
          <View style={styles.section}>
            <CompatibilityBreakdown
              score={roommate.score}
              breakdown={roommate.breakdown}
              candidateName={roommate.name}
            />
          </View>

          {/* About Me / Introduction */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <Card variant="flat" padding="md" style={styles.bioCard}>
              <Text style={styles.bioText}>{roommate.bio}</Text>
            </Card>
          </View>

          {/* Lifestyle & Habits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lifestyle & Living Habits</Text>
            <View style={styles.habitsGrid}>
              <View style={styles.habitItem}>
                <View style={styles.habitIconCircle}>
                  <Ionicons name="sparkles-outline" size={18} color={COLORS.primaryDark} />
                </View>
                <View>
                  <Text style={styles.habitLabel}>Cleanliness</Text>
                  <Text style={styles.habitValue}>
                    {roommate.lifestyle?.cleanliness === 'high' ? 'High (Daily tidy)' : 'Medium (Weekly clean)'}
                  </Text>
                </View>
              </View>

              <View style={styles.habitItem}>
                <View style={styles.habitIconCircle}>
                  <Ionicons name="moon-outline" size={18} color={COLORS.primaryDark} />
                </View>
                <View>
                  <Text style={styles.habitLabel}>Sleep Schedule</Text>
                  <Text style={styles.habitValue}>
                    {roommate.lifestyle?.sleepSchedule === 'early' ? 'Early riser (10 PM - 6 AM)' : 'Flexible / Night owl'}
                  </Text>
                </View>
              </View>

              <View style={styles.habitItem}>
                <View style={styles.habitIconCircle}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primaryDark} />
                </View>
                <View>
                  <Text style={styles.habitLabel}>Smoking Policy</Text>
                  <Text style={styles.habitValue}>
                    {roommate.lifestyle?.smoking ? 'Smoker (Outside only)' : 'Strict Non-smoker'}
                  </Text>
                </View>
              </View>

              <View style={styles.habitItem}>
                <View style={styles.habitIconCircle}>
                  <Ionicons name="paw-outline" size={18} color={COLORS.primaryDark} />
                </View>
                <View>
                  <Text style={styles.habitLabel}>Pets</Text>
                  <Text style={styles.habitValue}>
                    {roommate.lifestyle?.pets ? 'Has / Loves pets' : 'No pets'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Roommate Preferences */}
          {roommate.preferences && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Roommate Preferences</Text>
              <Card variant="flat" padding="md">
                <View style={styles.prefRow}>
                  <Text style={styles.prefLabel}>💻 Work from home:</Text>
                  <Text style={styles.prefValue}>{roommate.preferences.workFromHome}</Text>
                </View>
                <View style={styles.prefRow}>
                  <Text style={styles.prefLabel}>🍳 Cooking habits:</Text>
                  <Text style={styles.prefValue}>{roommate.preferences.cooking}</Text>
                </View>
                <View style={styles.prefRow}>
                  <Text style={styles.prefLabel}>👥 Guests policy:</Text>
                  <Text style={styles.prefValue}>{roommate.preferences.guests}</Text>
                </View>
              </Card>
            </View>
          )}

          {/* Personality / Interest Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vibes & Interests</Text>
            <View style={styles.tagsContainer}>
              {roommate.tags?.map((tag, idx) => (
                <View key={idx} style={styles.tagPill}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <Button
          title={requested ? 'Request Sent (Pending)' : 'Send Match Request'}
          variant={requested ? 'secondary' : 'primary'}
          size="lg"
          disabled={requested}
          icon={
            <Ionicons
              name={requested ? 'checkmark-circle' : 'person-add'}
              size={18}
              color={requested ? COLORS.primaryDark : COLORS.textInverse}
            />
          }
          onPress={handleMatchRequest}
          style={styles.actionButton}
        />
      </View>

      {/* Confirmation Modal */}
      <MatchRequestModal
        visible={showModal}
        candidate={roommate}
        onClose={() => setShowModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topBarTitle: {
    fontSize: TYPOGRAPHY.base.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  heroCard: {
    width: '100%',
    height: 300,
    position: 'relative',
    backgroundColor: COLORS.navyDark,
  },
  heroAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.lg,
  },
  sectionPadding: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontSize: TYPOGRAPHY.xxl.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
  },
  roleText: {
    fontSize: TYPOGRAPHY.md.fontSize,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  infoBox: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 6,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.sm.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
    marginTop: 2,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
    marginBottom: SPACING.sm,
  },
  bioCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bioText: {
    fontSize: TYPOGRAPHY.sm.fontSize,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  habitsGrid: {
    gap: SPACING.sm,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  habitIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    fontWeight: TYPOGRAPHY.medium,
  },
  habitValue: {
    fontSize: TYPOGRAPHY.sm.fontSize,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.navyDark,
    marginTop: 1,
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  prefLabel: {
    fontSize: TYPOGRAPHY.sm.fontSize,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.medium,
  },
  prefValue: {
    fontSize: TYPOGRAPHY.sm.fontSize,
    color: COLORS.navyDark,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tagPill: {
    backgroundColor: COLORS.softBlue,
    borderWidth: 1,
    borderColor: COLORS.softBlueBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADII.pill,
  },
  tagText: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.primaryDark,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.md,
    ...SHADOWS.lg,
  },
  actionButton: {
    width: '100%',
  },
});
