import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADII, SHADOWS, SPACING, TYPOGRAPHY } from '../constants';
import Card from './Card';
import Badge from './Badge';
import Button from './Button';

export default function RoommateCard({
  roommate,
  onPress,
  onViewBreakdown,
  onMatchRequest,
  isRequested = false,
  style,
}) {
  if (!roommate) return null;

  const {
    id,
    name,
    age,
    role,
    avatar,
    budget,
    preferredArea,
    moveInDate,
    score = 0,
    lifestyle = {},
    tags = [],
    bio,
  } = roommate;

  // Determine badge color variant by score
  const getBadgeVariant = (s) => {
    if (s >= 90) return 'success';
    if (s >= 75) return 'primary';
    if (s >= 60) return 'warning';
    return 'danger';
  };

  return (
    <Card
      variant="elevated"
      padding="none"
      style={[styles.card, style]}
      onPress={onPress}
    >
      <View style={styles.cardInner}>
        {/* Top Header Row with Avatar and Match Badge */}
        <View style={styles.headerRow}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: avatar }}
              style={styles.avatar}
              defaultSource={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' }}
            />
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText} numberOfLines={1}>
                {name}, {age}
              </Text>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} style={styles.verifiedIcon} />
            </View>
            <Text style={styles.roleText} numberOfLines={1}>
              {role}
            </Text>
          </View>

          <Badge
            label={`${score}% Match`}
            variant={getBadgeVariant(score)}
            size="md"
            icon={<Ionicons name="sparkles" size={12} color={score >= 90 ? '#065F46' : COLORS.primaryDark} />}
          />
        </View>

        {/* Short Bio preview */}
        {bio && (
          <Text style={styles.bioText} numberOfLines={2}>
            "{bio}"
          </Text>
        )}

        {/* Key Attributes Box */}
        <View style={styles.metaBox}>
          <View style={styles.metaItem}>
            <Ionicons name="wallet-outline" size={15} color={COLORS.primaryDark} />
            <Text style={styles.metaLabel}>Budget</Text>
            <Text style={styles.metaValue}>${budget}/mo</Text>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={15} color={COLORS.primaryDark} />
            <Text style={styles.metaLabel}>Preferred Area</Text>
            <Text style={styles.metaValue}>{preferredArea}</Text>
          </View>

          <View style={styles.metaDivider} />

          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={15} color={COLORS.primaryDark} />
            <Text style={styles.metaLabel}>Move-in</Text>
            <Text style={styles.metaValue}>{moveInDate || 'Dec 2026'}</Text>
          </View>
        </View>

        {/* Lifestyle / Habits Chips */}
        <View style={styles.lifestyleRow}>
          {lifestyle.cleanliness && (
            <View style={styles.lifestyleChip}>
              <Ionicons name="sparkles-outline" size={12} color={COLORS.textSecondary} />
              <Text style={styles.lifestyleChipText}>Clean: {lifestyle.cleanliness}</Text>
            </View>
          )}

          {lifestyle.sleepSchedule && (
            <View style={styles.lifestyleChip}>
              <Ionicons name="moon-outline" size={12} color={COLORS.textSecondary} />
              <Text style={styles.lifestyleChipText}>Sleep: {lifestyle.sleepSchedule}</Text>
            </View>
          )}

          <View style={styles.lifestyleChip}>
            <Ionicons
              name={lifestyle.smoking ? 'alert-circle-outline' : 'shield-checkmark-outline'}
              size={12}
              color={COLORS.textSecondary}
            />
            <Text style={styles.lifestyleChipText}>
              {lifestyle.smoking ? 'Smoker' : 'Non-smoker'}
            </Text>
          </View>

          <View style={styles.lifestyleChip}>
            <Ionicons
              name={lifestyle.pets ? 'paw-outline' : 'close-circle-outline'}
              size={12}
              color={COLORS.textSecondary}
            />
            <Text style={styles.lifestyleChipText}>
              {lifestyle.pets ? 'Pets OK' : 'No pets'}
            </Text>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          <Button
            title="Breakdown"
            variant="secondary"
            size="sm"
            icon={<Ionicons name="pie-chart-outline" size={14} color={COLORS.primaryDark} />}
            onPress={onViewBreakdown || onPress}
            style={styles.breakdownButton}
          />
          <Button
            title={isRequested ? 'Request Sent' : 'Match Request'}
            variant={isRequested ? 'secondary' : 'primary'}
            size="sm"
            disabled={isRequested}
            icon={
              <Ionicons
                name={isRequested ? 'checkmark' : 'person-add-outline'}
                size={14}
                color={isRequested ? COLORS.textMuted : COLORS.textInverse}
              />
            }
            onPress={onMatchRequest}
            style={styles.matchButton}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    marginBottom: SPACING.md,
  },
  cardInner: {
    padding: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceSubtle,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  headerInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nameText: {
    fontSize: TYPOGRAPHY.base.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
  },
  verifiedIcon: {
    marginLeft: 2,
  },
  roleText: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bioText: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  metaBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.softBlue,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.softBlueBorder,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  metaValue: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
    marginTop: 1,
  },
  metaDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.softBlueBorder,
  },
  lifestyleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.md,
  },
  lifestyleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADII.xs,
    gap: 4,
  },
  lifestyleChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.medium,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  breakdownButton: {
    flex: 1,
    minHeight: 38,
  },
  matchButton: {
    flex: 1.3,
    minHeight: 38,
  },
});
