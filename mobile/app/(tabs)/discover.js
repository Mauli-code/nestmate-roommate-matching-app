import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
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
  MatchRequestModal,
} from '../../src/components';
import { useMatchRequests } from '../../src/hooks/useMatchRequests';
import { useAuth } from '../../src/context/AuthContext';
import { toMatchCards } from '../../src/match-display';
import { searchRoommates } from '../../src/utils/searchUtils';

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
  const { matches, refreshMatches } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('compatibility');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [modalCandidate, setModalCandidate] = useState(null);

  const { isRequested, sendRequest, refreshRequests } = useMatchRequests();

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

  // Robust, case-insensitive, whitespace-trimmed filtering and sorting
  const roommates = useMemo(() => toMatchCards(matches), [matches]);
  const filteredAndSortedRoommates = useMemo(() => {
    return searchRoommates(roommates, searchQuery, filters, sortBy);
  }, [roommates, searchQuery, filters, sortBy]);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshMatches();
    } catch (requestError) {
      setError(requestError.message || 'Could not load roommate matches.');
    } finally {
      setLoading(false);
    }
  }, [refreshMatches]);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  }, [loadMatches]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilters(DEFAULT_FILTERS);
    setError(null);
  };

  const handleMatchRequest = async (candidate) => {
    const res = await sendRequest(candidate);
    if (res.success) {
      setModalCandidate(candidate);
    }
  };

  const renderEmptyState = () => {
    const hasSearch = Boolean(searchQuery.trim());
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons
            name={hasSearch ? 'search-outline' : 'filter-outline'}
            size={36}
            color={COLORS.primary}
          />
        </View>
        <Text style={styles.emptyTitle}>
          {hasSearch ? 'No Results Found' : 'No Matching Roommates'}
        </Text>
        <Text style={styles.emptyText}>
          {hasSearch
            ? `No roommate profiles matched "${searchQuery.trim()}". Try searching by another name, role, or area.`
            : 'No profiles match your active filters. Try broadening your budget, area, or score criteria.'}
        </Text>
        <Button
          title={hasSearch ? 'Clear Search' : 'Reset All Filters'}
          variant="secondary"
          size="md"
          onPress={hasSearch ? () => setSearchQuery('') : handleResetFilters}
          style={styles.emptyButton}
        />
      </View>
    );
  };

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
      {error ? (
        <View style={styles.errorContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="alert-circle-outline" size={36} color={COLORS.danger} />
          </View>
          <Text style={styles.emptyTitle}>Unable to Load Roommates</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <Button
            title="Try Again"
            variant="primary"
            size="md"
            onPress={() => {
              setError(null);
              onRefresh();
            }}
            style={styles.emptyButton}
          />
        </View>
      ) : loading ? (
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
              onMatchRequest={() => handleMatchRequest(item)}
              isRequested={isRequested(item.id)}
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
      {/* Match Request Confirmation Modal */}
      <MatchRequestModal
        visible={!!modalCandidate}
        candidate={modalCandidate}
        onClose={() => setModalCandidate(null)}
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
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxxl,
  },
});
