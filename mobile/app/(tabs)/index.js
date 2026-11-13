import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Platform,
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
} from '../../src/components';
import {
  CURRENT_USER,
  MOCK_RECOMMENDED_ROOMMATES,
  MOCK_RECOMMENDED_ACCOMMODATIONS,
} from '../../src/data/mockData';
import {
  searchHomeRoommates,
  searchHomeAccommodations,
} from '../../src/utils/searchUtils';

const FILTER_PILLS = [
  'All',
  'Near Campus',
  'Under $1,200',
  'Private Room',
  'Pet Friendly',
];

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPill, setSelectedPill] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState({});

  const isSearchActive = Boolean(searchQuery.trim() || selectedPill !== 'All');

  const filteredRoommates = React.useMemo(() => {
    return searchHomeRoommates(MOCK_RECOMMENDED_ROOMMATES, searchQuery, selectedPill);
  }, [searchQuery, selectedPill]);

  const filteredAccommodations = React.useMemo(() => {
    return searchHomeAccommodations(MOCK_RECOMMENDED_ACCOMMODATIONS, searchQuery, selectedPill);
  }, [searchQuery, selectedPill]);

  const totalResults = filteredRoommates.length + filteredAccommodations.length;

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedPill('All');
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const toggleFavorite = (id) => {
    setFavorites((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning, {CURRENT_USER.name.split(' ')[0]} 👋</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.locationPill}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="location-sharp" size={14} color={COLORS.primary} />
              <Text style={styles.locationText}>{CURRENT_USER.location}</Text>
              <Ionicons name="chevron-down" size={12} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/saved')}
          >
            <Ionicons name="notifications-outline" size={22} color={COLORS.navyDark} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Search Bar with Filter Trigger */}
        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={handleClearSearch}
            placeholder="Search by city, campus, or neighborhood..."
            onFilterPress={() => router.push('/(tabs)/discover')}
            hasActiveFilters={isSearchActive}
          />
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsContainer}
        >
          {FILTER_PILLS.map((pill) => {
            const isSelected = selectedPill === pill;
            return (
              <TouchableOpacity
                key={pill}
                activeOpacity={0.7}
                onPress={() => setSelectedPill(isSelected && pill !== 'All' ? 'All' : pill)}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillSelected,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextSelected,
                  ]}
                >
                  {pill}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Search Status Header when search is active */}
        {isSearchActive && (
          <View style={styles.searchStatusRow}>
            <View style={styles.searchStatusLeft}>
              <Ionicons name="search" size={14} color={COLORS.primary} />
              <Text style={styles.searchStatusText}>
                {totalResults} {totalResults === 1 ? 'match' : 'matches'} found
                {searchQuery.trim() ? ` for "${searchQuery.trim()}"` : ''}
                {selectedPill !== 'All' ? ` in ${selectedPill}` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClearSearch} activeOpacity={0.7}>
              <Text style={styles.clearSearchLink}>Clear search</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* No Results Empty State */}
        {isSearchActive && totalResults === 0 && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="search-outline" size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Results Found</Text>
            <Text style={styles.emptyText}>
              No roommates or accommodations matched your query. Try different keywords or clear your search to see all listings.
            </Text>
            <Button
              title="Clear Search & Show All"
              variant="secondary"
              size="md"
              onPress={handleClearSearch}
              style={styles.emptyButton}
            />
          </View>
        )}

        {/* Default Home Content when NOT searching */}
        {!isSearchActive && (
          <>
            {/* Smart Match Banner */}
            <Card variant="flat" style={styles.smartMatchBanner} padding="none">
              <View style={styles.smartMatchContent}>
                <View style={styles.smartMatchHeader}>
                  <View style={styles.sparkleBadge}>
                    <Ionicons name="sparkles" size={14} color={COLORS.primary} />
                    <Text style={styles.sparkleText}>Smart Match Active</Text>
                  </View>
                  <Text style={styles.smartMatchScore}>4 Pillars Aligned</Text>
                </View>
                <Text style={styles.smartMatchTitle}>
                  Finding Roommates Within ${CURRENT_USER.budget}/mo in {CURRENT_USER.preferredArea}
                </Text>
                <Text style={styles.smartMatchSub}>
                  Matching by budget (25%), location (25%), sleep/cleanliness (25%), & habits (25%).
                </Text>
              </View>
            </Card>

            {/* Quick Stats Grid */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{CURRENT_USER.stats.activeMatches}</Text>
                <Text style={styles.statLabel}>Active Matches</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{CURRENT_USER.stats.pendingRequests}</Text>
                <Text style={styles.statLabel}>Requests</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{CURRENT_USER.stats.savedAccommodations}</Text>
                <Text style={styles.statLabel}>Saved Places</Text>
              </View>
            </View>
          </>
        )}

        {/* Roommates Section (Shown when matches exist) */}
        {filteredRoommates.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  {isSearchActive ? `Matching Roommates (${filteredRoommates.length})` : 'Top Roommate Matches'}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {isSearchActive ? 'Roommates matching your search' : 'Ranked by algorithm compatibility score'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/discover')}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalCardList}
            >
              {filteredRoommates.map((roommate) => (
                <Card
                  key={roommate.id}
                  variant="elevated"
                  padding="none"
                  style={styles.roommateCard}
                >
                  <View style={styles.roommateCardInner}>
                    <View style={styles.roommateTopRow}>
                      <Image
                        source={{ uri: roommate.avatar }}
                        style={styles.roommateAvatar}
                      />
                      <Badge
                        label={`${roommate.score}% Match`}
                        variant={roommate.score >= 90 ? 'success' : 'primary'}
                        size="sm"
                      />
                    </View>

                    <Text style={styles.roommateName}>
                      {roommate.name}, {roommate.age}
                    </Text>
                    <Text style={styles.roommateRole} numberOfLines={1}>
                      {roommate.role}
                    </Text>

                    <View style={styles.roommateMetaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons name="wallet-outline" size={13} color={COLORS.textSecondary} />
                        <Text style={styles.metaText}>${roommate.budget}/mo</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
                        <Text style={styles.metaText}>{roommate.preferredArea}</Text>
                      </View>
                    </View>

                    <View style={styles.tagList}>
                      {roommate.tags && roommate.tags.slice(0, 2).map((tag, idx) => (
                        <View key={idx} style={styles.miniTag}>
                          <Text style={styles.miniTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>

                    <Button
                      title="View Profile"
                      variant="secondary"
                      size="sm"
                      onPress={() => router.push(`/roommate/${roommate.id}`)}
                      style={styles.roommateActionBtn}
                    />
                  </View>
                </Card>
              ))}
            </ScrollView>
          </>
        )}

        {/* Accommodations Section (Shown when matches exist) */}
        {filteredAccommodations.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  {isSearchActive ? `Matching Accommodations (${filteredAccommodations.length})` : 'Featured Accommodations'}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {isSearchActive ? 'Places matching your search' : 'Verified places compatible with your budget'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/accommodations')}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.accommodationList}>
              {filteredAccommodations.map((accom) => {
                const isFav = favorites[accom.id] !== undefined ? favorites[accom.id] : accom.isFavorite;

                return (
                  <Card
                    key={accom.id}
                    variant="elevated"
                    padding="none"
                    style={styles.accomCard}
                    onPress={() => router.push('/(tabs)/accommodations')}
                  >
                    <View style={styles.accomImageContainer}>
                      <Image source={{ uri: accom.image }} style={styles.accomImage} />
                      <View style={styles.accomBadgeRow}>
                        <Badge label={accom.type} variant="navy" size="sm" />
                        <TouchableOpacity
                          activeOpacity={0.7}
                          style={styles.favoriteButton}
                          onPress={() => toggleFavorite(accom.id)}
                        >
                          <Ionicons
                            name={isFav ? 'heart' : 'heart-outline'}
                            size={18}
                            color={isFav ? COLORS.danger : COLORS.navyDark}
                          />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.accomRentTag}>
                        <Text style={styles.rentAmount}>${accom.rent}</Text>
                        <Text style={styles.rentPeriod}>/month</Text>
                      </View>
                    </View>

                    <View style={styles.accomDetails}>
                      <Text style={styles.accomTitle} numberOfLines={1}>
                        {accom.title}
                      </Text>
                      <View style={styles.accomLocationRow}>
                        <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.accomLocationText} numberOfLines={1}>
                          {accom.location} • {accom.distance}
                        </Text>
                      </View>

                      <View style={styles.amenitiesRow}>
                        {accom.amenities && accom.amenities.slice(0, 3).map((amenity, idx) => (
                          <View key={idx} style={styles.amenityChip}>
                            <Text style={styles.amenityChipText}>{amenity}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl + 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  greeting: {
    fontSize: TYPOGRAPHY.xl.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
    letterSpacing: -0.3,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    fontSize: TYPOGRAPHY.sm.fontSize,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.medium,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...SHADOWS.sm,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  pillsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  filterPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 3,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.xs,
  },
  filterPillSelected: {
    backgroundColor: COLORS.navyDark,
    borderColor: COLORS.navyDark,
  },
  filterPillText: {
    fontSize: TYPOGRAPHY.sm.fontSize,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textSecondary,
  },
  filterPillTextSelected: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  smartMatchBanner: {
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    backgroundColor: COLORS.softBlue,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.softBlueBorder,
  },
  smartMatchContent: {
    padding: SPACING.lg,
  },
  smartMatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sparkleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sparkleText: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  smartMatchScore: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    color: COLORS.primaryDark,
    fontWeight: TYPOGRAPHY.medium,
  },
  smartMatchTitle: {
    fontSize: TYPOGRAPHY.md.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
    marginTop: 4,
    marginBottom: 4,
  },
  smartMatchSub: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'space-around',
    ...SHADOWS.sm,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.lg.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.sm.fontSize,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  horizontalCardList: {
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.sm,
    gap: SPACING.md,
  },
  roommateCard: {
    width: 230,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.md,
    borderRadius: RADII.lg,
  },
  roommateCardInner: {
    padding: SPACING.md,
  },
  roommateTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  roommateAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surfaceSubtle,
  },
  roommateName: {
    fontSize: TYPOGRAPHY.md.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
  },
  roommateRole: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  roommateMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADII.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.medium,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: SPACING.md,
  },
  miniTag: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.xs,
  },
  miniTagText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  roommateActionBtn: {
    minHeight: 34,
  },
  accommodationList: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
  },
  accomCard: {
    marginBottom: SPACING.xs,
  },
  accomImageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: COLORS.surfaceSubtle,
  },
  accomImage: {
    width: '100%',
    height: '100%',
  },
  accomBadgeRow: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  accomRentTag: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(15, 37, 55, 0.88)',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.sm,
  },
  rentAmount: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.bold,
    fontSize: TYPOGRAPHY.md.fontSize,
  },
  rentPeriod: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: TYPOGRAPHY.xs.fontSize,
    marginLeft: 2,
  },
  accomDetails: {
    padding: SPACING.md,
  },
  accomTitle: {
    fontSize: TYPOGRAPHY.md.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
    marginBottom: 4,
  },
  accomLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  accomLocationText: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    color: COLORS.textSecondary,
    flex: 1,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  amenityChip: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADII.xs,
  },
  amenityChipText: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    color: COLORS.textSecondary,
  },
  searchStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    marginTop: 2,
    marginBottom: SPACING.xs,
  },
  searchStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  searchStatusText: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.medium,
  },
  clearSearchLink: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.xl,
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
