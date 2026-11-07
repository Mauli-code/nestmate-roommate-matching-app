import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADII, SHADOWS, SPACING, TYPOGRAPHY } from '../../src/constants';
import { useMatchRequests } from '../../src/hooks/useMatchRequests';
import { useSavedProperties } from '../../src/hooks/useSavedProperties';
import PropertyCard from '../../src/components/PropertyCard';

function EmptyState({ icon, title, subtitle, actionLabel, onAction }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name={icon} size={36} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{subtitle}</Text>
      {actionLabel && (
        <TouchableOpacity onPress={onAction} style={styles.emptyActionBtn} activeOpacity={0.8}>
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function SavedScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('roommates');
  const { requestsMap, loading: loadingRM } = useMatchRequests();
  const { savedList, loading: loadingProps, isSaved, toggleSave } = useSavedProperties();

  const sentRequests = Object.values(requestsMap);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved</Text>
        <Text style={styles.headerSub}>Your bookmarks &amp; match requests</Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'roommates' && styles.segmentActive]}
          onPress={() => setActiveTab('roommates')}
          activeOpacity={0.8}
        >
          <Ionicons name="people-outline" size={16} color={activeTab === 'roommates' ? COLORS.textInverse : COLORS.textSecondary} />
          <Text style={[styles.segmentText, activeTab === 'roommates' && styles.segmentTextActive]}>
            Roommates ({sentRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'properties' && styles.segmentActive]}
          onPress={() => setActiveTab('properties')}
          activeOpacity={0.8}
        >
          <Ionicons name="home-outline" size={16} color={activeTab === 'properties' ? COLORS.textInverse : COLORS.textSecondary} />
          <Text style={[styles.segmentText, activeTab === 'properties' && styles.segmentTextActive]}>
            Properties ({savedList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'roommates' ? (
        <FlatList
          data={sentRequests}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="person-add-outline"
              title="No Match Requests Yet"
              subtitle="Discover roommates and send match requests to see them here."
              actionLabel="Discover Roommates"
              onAction={() => router.push('/(tabs)/discover')}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.requestCard}
              onPress={() => router.push(`/roommate/${item.candidateId}`)}
              activeOpacity={0.85}
            >
              <Image source={{ uri: item.candidateAvatar }} style={styles.avatar} />
              <View style={styles.requestInfo}>
                <Text style={styles.requestName}>{item.candidateName}</Text>
                <Text style={styles.requestRole} numberOfLines={1}>{item.candidateRole}</Text>
                <View style={styles.requestMeta}>
                  <View style={[styles.statusDot, { backgroundColor: COLORS.warning }]} />
                  <Text style={styles.requestStatus}>Request Pending</Text>
                  {item.candidateScore && (
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreText}>{item.candidateScore}% match</Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={savedList}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="bookmark-outline"
              title="No Saved Properties"
              subtitle="Browse accommodations and save your favourites to view them here."
              actionLabel="Browse Properties"
              onAction={() => router.push('/(tabs)/accommodations')}
            />
          }
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => router.push(`/property/${item.id}`)}
              onSave={() => toggleSave(item)}
              isSaved={isSaved(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  headerTitle: { fontSize: TYPOGRAPHY.xl.fontSize, fontWeight: TYPOGRAPHY.bold, color: COLORS.navyDark, letterSpacing: -0.3 },
  headerSub: { fontSize: TYPOGRAPHY.xs.fontSize, color: COLORS.textSecondary, marginTop: 2 },
  segmentContainer: { flexDirection: 'row', marginHorizontal: SPACING.lg, marginBottom: SPACING.md, backgroundColor: COLORS.surfaceSubtle, borderRadius: RADII.lg, padding: 4 },
  segment: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm, borderRadius: RADII.md, gap: 6 },
  segmentActive: { backgroundColor: COLORS.navyDark, ...SHADOWS.sm },
  segmentText: { fontSize: 13, fontWeight: TYPOGRAPHY.semiBold, color: COLORS.textSecondary },
  segmentTextActive: { color: COLORS.textInverse },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 32, paddingTop: SPACING.xs },
  requestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.sm },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: SPACING.md },
  requestInfo: { flex: 1 },
  requestName: { fontSize: TYPOGRAPHY.base.fontSize, fontWeight: TYPOGRAPHY.semiBold, color: COLORS.navyDark },
  requestRole: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  requestMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  requestStatus: { fontSize: 11, color: COLORS.textMuted, fontWeight: TYPOGRAPHY.medium },
  scoreBadge: { backgroundColor: COLORS.softBlue, paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADII.pill },
  scoreText: { fontSize: 11, color: COLORS.primaryDark, fontWeight: TYPOGRAPHY.semiBold },
  emptyContainer: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.softBlue, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: TYPOGRAPHY.lg.fontSize, fontWeight: TYPOGRAPHY.bold, color: COLORS.navyDark, marginBottom: 8, textAlign: 'center' },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  emptyActionBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADII.lg },
  emptyActionText: { color: COLORS.textInverse, fontWeight: TYPOGRAPHY.semiBold, fontSize: 14 },
});
