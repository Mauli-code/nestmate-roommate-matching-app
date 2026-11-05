import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  SearchBar,
  RoommateCard,
} from '../../src/components';
import { MOCK_RECOMMENDED_ROOMMATES } from '../../src/data/mockData';

export default function DiscoverScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roommates, setRoommates] = useState(MOCK_RECOMMENDED_ROOMMATES);

  // Filtered list based on search
  const filteredRoommates = useMemo(() => {
    if (!searchQuery.trim()) return roommates;
    const query = searchQuery.toLowerCase().trim();
    return roommates.filter((r) =>
      r.name.toLowerCase().includes(query) ||
      r.role.toLowerCase().includes(query) ||
      r.preferredArea.toLowerCase().includes(query) ||
      (r.tags && r.tags.some((t) => t.toLowerCase().includes(query)))
    );
  }, [roommates, searchQuery]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  const handleResetSearch = () => {
    setSearchQuery('');
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="search-outline" size={36} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>No Roommates Found</Text>
      <Text style={styles.emptyText}>
        We couldn't find any roommate matches matching "{searchQuery}". Try searching for another area, name, or role.
      </Text>
      <Button
        title="Clear Search"
        variant="secondary"
        size="md"
        onPress={handleResetSearch}
        style={styles.emptyButton}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Find Roommates</Text>
          <Text style={styles.headerSubtitle}>
            Ranked by Smart Match compatibility
          </Text>
        </View>
        <Badge
          label={`${filteredRoommates.length} Matches`}
          variant="primary"
          size="md"
        />
      </View>

      {/* Search and Filter Row */}
      <View style={styles.searchSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, role, area, or vibe..."
          onClear={() => setSearchQuery('')}
          onFilterPress={() => {}}
          hasActiveFilters={false}
        />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading recommendations...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRoommates}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={renderEmptyState}
          renderItem={({ item }) => (
            <RoommateCard
              roommate={item}
              onPress={() => router.push(`/roommate/${item.id}`)}
              onViewBreakdown={() => router.push(`/roommate/${item.id}`)}
              onMatchRequest={() => {}}
            />
          )}
        />
      )}
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
    paddingBottom: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sm.fontSize,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxxl,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.lg.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sm.fontSize,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    minWidth: 140,
  },
  placeholderCard: {
    marginBottom: SPACING.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: TYPOGRAPHY.md.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
  },
  cardRole: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardArea: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    color: COLORS.primaryDark,
    marginTop: 6,
    fontWeight: TYPOGRAPHY.medium,
  },
});
