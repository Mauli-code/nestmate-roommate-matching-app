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
  RoommateFilterModal,
} from '../../src/components';
import { MOCK_RECOMMENDED_ROOMMATES } from '../../src/data/mockData';

const DEFAULT_FILTERS = {
  location: 'All',
  maxBudget: null,
  minScore: 0,
  sleepSchedule: 'Any',
  cleanliness: 'Any',
  nonSmokerOnly: false,
  petsOnly: false,
};

const SORT_OPTIONS = [
  { id: 'compatibility', label: 'Highest Match', icon: 'sparkles' },
  { id: 'budget_asc', label: 'Lowest Budget', icon: 'arrow-down' },
  { id: 'budget_desc', label: 'Highest Budget', icon: 'arrow-up' },
  { id: 'location', label: 'By Location', icon: 'location-outline' },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('compatibility');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [requestedMap, setRequestedMap] = useState({});

  // Calculate active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.location !== 'All') count++;
    if (filters.maxBudget !== null) count++;
    if (filters.minScore > 0) count++;
    if (filters.sleepSchedule !== 'Any') count++;
    if (filters.cleanliness !== 'Any') count++;
    if (filters.nonSmokerOnly) count++;
    if (filters.petsOnly) count++;
    return count;
  }, [filters]);

  // Client-side filtering and sorting logic
  const filteredAndSortedRoommates = useMemo(() => {
    const list = MOCK_RECOMMENDED_ROOMMATES.filter((r) => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          r.name.toLowerCase().includes(query) ||
          r.role.toLowerCase().includes(query) ||
          r.preferredArea.toLowerCase().includes(query) ||
          (r.tags && r.tags.some((t) => t.toLowerCase().includes(query)));
        if (!matchesQuery) return false;
      }

      // Location
      if (filters.location !== 'All' && r.preferredArea.toLowerCase() !== filters.location.toLowerCase()) {
        return false;
      }

      // Max Budget
      if (filters.maxBudget !== null && r.budget > filters.maxBudget) {
        return false;
      }

      // Min Score
      if (filters.minScore > 0 && r.score < filters.minScore) {
        return false;
      }

      // Sleep Schedule
      if (filters.sleepSchedule !== 'Any' && r.lifestyle?.sleepSchedule !== filters.sleepSchedule) {
        return false;
      }

      // Cleanliness
      if (filters.cleanliness !== 'Any' && r.lifestyle?.cleanliness !== filters.cleanliness) {
        return false;
      }

      // Non-smoker only
      if (filters.nonSmokerOnly && r.lifestyle?.smoking === true) {
        return false;
      }

      // Pets only
      if (filters.petsOnly && !r.lifestyle?.pets) {
        return false;
      }

      return true;
    });

    // Sort according to selected sort option
    return list.sort((a, b) => {
      if (sortBy === 'compatibility') {
        return b.score - a.score;
      }
      if (sortBy === 'budget_asc') {
        return a.budget - b.budget;
      }
      if (sortBy === 'budget_desc') {
        return b.budget - a.budget;
      }
      if (sortBy === 'location') {
        return a.preferredArea.localeCompare(b.preferredArea);
      }
      return 0;
    });
  }, [searchQuery, filters, sortBy]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilters(DEFAULT_FILTERS);
  };

  const handleMatchRequest = (candidateId) => {
    setRequestedMap((prev) => ({
      ...prev,
      [candidateId]: true,
    }));
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="filter-outline" size={36} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>No Matching Roommates</Text>
      <Text style={styles.emptyText}>
        No profiles match your active filters and search query. Try broadening your budget, area, or score criteria.
      </Text>
      <Button
        title="Reset All Filters"
        variant="secondary"
        size="md"
        onPress={handleResetFilters}
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
          label={`${filteredAndSortedRoommates.length} Matches`}
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
          onFilterPress={() => setIsFilterModalOpen(true)}
          hasActiveFilters={activeFiltersCount > 0}
        />
      </View>

      {/* Sorting Selector Bar */}
      <View style={styles.sortSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortScroll}
        >
          <Text style={styles.sortPrefix}>Sort:</Text>
          {SORT_OPTIONS.map((opt) => {
            const isSelected = sortBy === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                activeOpacity={0.7}
                onPress={() => setSortBy(opt.id)}
                style={[
                  styles.sortPill,
                  isSelected && styles.sortPillSelected,
                ]}
              >
                <Ionicons
                  name={opt.icon}
                  size={12}
                  color={isSelected ? COLORS.textInverse : COLORS.textSecondary}
                  style={styles.sortIcon}
                />
                <Text
                  style={[
                    styles.sortPillText,
                    isSelected && styles.sortPillTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Active Filter Pills Bar */}
      {activeFiltersCount > 0 && (
        <View style={styles.activeFiltersBar}>
          <View style={styles.activeBadge}>
            <Ionicons name="funnel" size={12} color={COLORS.primaryDark} />
            <Text style={styles.activeBadgeText}>{activeFiltersCount} Active Filter{activeFiltersCount > 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity onPress={handleResetFilters} activeOpacity={0.7}>
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading recommendations...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedRoommates}
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
              onMatchRequest={() => handleMatchRequest(item.id)}
              isRequested={!!requestedMap[item.id]}
            />
          )}
        />
      )}

      {/* Filter Modal */}
      <RoommateFilterModal
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
        onReset={(defaultFilters) => setFilters(defaultFilters)}
      />
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
    paddingBottom: SPACING.xs,
  },
  sortSection: {
    paddingBottom: SPACING.sm,
  },
  sortScroll: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  sortPrefix: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.textSecondary,
    marginRight: 2,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    gap: 4,
  },
  sortPillSelected: {
    backgroundColor: COLORS.navyDark,
    borderColor: COLORS.navyDark,
  },
  sortIcon: {
    marginRight: 1,
  },
  sortPillText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textSecondary,
  },
  sortPillTextSelected: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  activeFiltersBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.softBlue,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
    gap: 4,
  },
  activeBadgeText: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  clearFiltersText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: TYPOGRAPHY.medium,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    paddingTop: SPACING.xs,
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
    minWidth: 160,
  },
});
