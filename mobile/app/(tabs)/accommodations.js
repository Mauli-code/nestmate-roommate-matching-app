import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ScrollView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADII, SHADOWS, SPACING, TYPOGRAPHY } from '../../src/constants';
import { SearchBar, Badge, Button } from '../../src/components';
import PropertyCard from '../../src/components/PropertyCard';
import PropertyFilterModal, { DEFAULT_PROPERTY_FILTERS } from '../../src/components/PropertyFilterModal';
import { useSavedProperties } from '../../src/hooks/useSavedProperties';
import { MOCK_PROPERTIES } from '../../src/data/mockData';

const SORT_OPTIONS = [
  { id: 'popular', label: 'Popular', icon: 'flame-outline' },
  { id: 'price_asc', label: 'Price ↑', icon: 'arrow-up-outline' },
  { id: 'price_desc', label: 'Price ↓', icon: 'arrow-down-outline' },
  { id: 'newest', label: 'Newest', icon: 'time-outline' },
];

export default function AccommodationsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [filters, setFilters] = useState(DEFAULT_PROPERTY_FILTERS);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { isSaved, toggleSave } = useSavedProperties();

  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if (filters.type !== 'All') n++;
    if (filters.minRent !== null || filters.maxRent !== null) n++;
    if (filters.furnishing !== 'Any') n++;
    if (filters.bedrooms !== 'Any') n++;
    if (filters.availability !== 'Any') n++;
    return n;
  }, [filters]);

  const results = useMemo(() => {
    let list = MOCK_PROPERTIES.filter(p => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !p.title.toLowerCase().includes(q) &&
          !p.location.toLowerCase().includes(q) &&
          !p.type.toLowerCase().includes(q)
        ) return false;
      }
      if (filters.type !== 'All' && p.type !== filters.type) return false;
      if (filters.minRent !== null && p.rent < filters.minRent) return false;
      if (filters.maxRent !== null && p.rent > filters.maxRent) return false;
      if (filters.furnishing !== 'Any' && p.furnishing !== filters.furnishing) return false;
      if (filters.bedrooms !== 'Any') {
        const bed = filters.bedrooms === '4+' ? 4 : parseInt(filters.bedrooms);
        if (filters.bedrooms === '4+' ? p.bedrooms < 4 : p.bedrooms !== bed) return false;
      }
      if (filters.availability !== 'Any' && p.availability !== filters.availability) return false;
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'price_asc') return a.rent - b.rent;
      if (sortBy === 'price_desc') return b.rent - a.rent;
      if (sortBy === 'newest') return a.postedDaysAgo - b.postedDaysAgo;
      return b.popularity - a.popularity;
    });
  }, [searchQuery, filters, sortBy]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleReset = () => {
    setSearchQuery('');
    setFilters(DEFAULT_PROPERTY_FILTERS);
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="home-outline" size={36} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>No Properties Found</Text>
      <Text style={styles.emptyText}>Try adjusting your search or filters to find more accommodation options.</Text>
      <Button title="Reset Filters" variant="secondary" size="md" onPress={handleReset} style={{ marginTop: 12 }} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Find Accommodation</Text>
          <Text style={styles.headerSub}>PGs, Flats &amp; Shared Rooms</Text>
        </View>
        <Badge label={`${results.length} Listed`} variant="primary" size="md" />
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by location, name or type..."
          onClear={() => setSearchQuery('')}
          onFilterPress={() => setFilterModalOpen(true)}
          hasActiveFilters={activeFiltersCount > 0}
        />
      </View>

      {/* Sort Pills */}
      <View style={styles.sortSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortScroll}>
          <Text style={styles.sortPrefix}>Sort:</Text>
          {SORT_OPTIONS.map(opt => {
            const sel = sortBy === opt.id;
            return (
              <TouchableOpacity key={opt.id} onPress={() => setSortBy(opt.id)} activeOpacity={0.7}
                style={[styles.sortPill, sel && styles.sortPillSelected]}>
                <Ionicons name={opt.icon} size={12} color={sel ? COLORS.textInverse : COLORS.textSecondary} />
                <Text style={[styles.sortPillText, sel && styles.sortPillTextSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Active filter bar */}
      {activeFiltersCount > 0 && (
        <View style={styles.activeFilterBar}>
          <View style={styles.activeBadge}>
            <Ionicons name="funnel" size={12} color={COLORS.primaryDark} />
            <Text style={styles.activeBadgeText}>{activeFiltersCount} Filter{activeFiltersCount > 1 ? 's' : ''} Active</Text>
          </View>
          <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      <FlatList
        data={results}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onPress={() => router.push(`/property/${item.id}`)}
            onSave={() => toggleSave(item)}
            isSaved={isSaved(item.id)}
          />
        )}
      />

      <PropertyFilterModal
        visible={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={filters}
        onApply={setFilters}
        onReset={setFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.xs },
  headerTitle: { fontSize: TYPOGRAPHY.xl.fontSize, fontWeight: TYPOGRAPHY.bold, color: COLORS.navyDark, letterSpacing: -0.3 },
  headerSub: { fontSize: TYPOGRAPHY.xs.fontSize, color: COLORS.textSecondary, marginTop: 2 },
  searchSection: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.xs },
  sortSection: { paddingBottom: SPACING.sm },
  sortScroll: { paddingHorizontal: SPACING.lg, alignItems: 'center', gap: SPACING.xs + 2 },
  sortPrefix: { fontSize: 12, fontWeight: TYPOGRAPHY.semiBold, color: COLORS.textSecondary, marginRight: 2 },
  sortPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, paddingVertical: 5, borderRadius: RADII.pill, gap: 4 },
  sortPillSelected: { backgroundColor: COLORS.navyDark, borderColor: COLORS.navyDark },
  sortPillText: { fontSize: 12, fontWeight: TYPOGRAPHY.medium, color: COLORS.textSecondary },
  sortPillTextSelected: { color: COLORS.textInverse, fontWeight: TYPOGRAPHY.semiBold },
  activeFilterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm },
  activeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.softBlue, borderRadius: RADII.pill, paddingHorizontal: SPACING.sm + 2, paddingVertical: 3, gap: 4 },
  activeBadgeText: { fontSize: 12, color: COLORS.primaryDark, fontWeight: TYPOGRAPHY.semiBold },
  clearText: { fontSize: 13, color: COLORS.primary, fontWeight: TYPOGRAPHY.semiBold },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 32, paddingTop: SPACING.sm },
  emptyContainer: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.softBlue, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: TYPOGRAPHY.lg.fontSize, fontWeight: TYPOGRAPHY.bold, color: COLORS.navyDark, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
});
