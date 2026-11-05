import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  RADII,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants';
import Card from './Card';
import Badge from './Badge';

export default function CompatibilityBreakdown({
  score = 0,
  breakdown = {},
  candidateName = 'Candidate',
  style,
}) {
  // Normalize category points so they strictly add up to 25 each, total 100
  const getPoints = (val) => {
    if (val === undefined || val === null) return 0;
    if (val <= 1) return Math.round(val * 25);
    return Math.min(25, Math.max(0, Math.round(val)));
  };

  const budgetPts = getPoints(breakdown.budget);
  const locationPts = getPoints(breakdown.location);
  const lifestylePts = getPoints(breakdown.lifestyle);
  const habitsPts = getPoints(breakdown.habitsAndPreferences);

  // Compute total points sum to match backend expectation
  const totalCalculated = budgetPts + locationPts + lifestylePts + habitsPts;
  const displayScore = score || totalCalculated;

  const categories = [
    {
      id: 'budget',
      title: 'Budget Compatibility',
      points: budgetPts,
      icon: 'wallet-outline',
      reason: budgetPts >= 24 ? 'Exact budget match ($1,200/mo)' : 'Close budget range (+/- 10%)',
    },
    {
      id: 'location',
      title: 'Location Compatibility',
      points: locationPts,
      icon: 'location-outline',
      reason: locationPts >= 25 ? 'Both prefer Central / Manhattan area' : 'Nearby transit commute',
    },
    {
      id: 'lifestyle',
      title: 'Lifestyle Compatibility',
      points: lifestylePts,
      icon: 'moon-outline',
      reason: lifestylePts >= 22 ? 'Aligned sleep schedules & high cleanliness' : 'Compatible living routines',
    },
    {
      id: 'habits',
      title: 'Habits & Preferences',
      points: habitsPts,
      icon: 'shield-checkmark-outline',
      reason: habitsPts >= 20 ? 'Both non-smokers and quiet study preferences' : 'Tolerant household habits',
    },
  ];

  const getBarColor = (pts) => {
    if (pts >= 22) return COLORS.success;
    if (pts >= 18) return COLORS.primary;
    if (pts >= 14) return COLORS.warning;
    return COLORS.danger;
  };

  return (
    <Card variant="elevated" padding="md" style={[styles.container, style]}>
      {/* Header with Total Score */}
      <View style={styles.header}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreValue}>{displayScore}%</Text>
          <Text style={styles.scoreSub}>Match</Text>
        </View>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Compatibility Breakdown</Text>
          <Text style={styles.headerDesc}>
            Calculated across 4 core algorithm pillars (25 points each).
          </Text>
          <Badge
            label={displayScore >= 90 ? '🌟 Highly Compatible' : '👍 Compatible Match'}
            variant={displayScore >= 90 ? 'success' : 'primary'}
            size="sm"
            style={styles.matchBadge}
          />
        </View>
      </View>

      <View style={styles.divider} />

      {/* 4 Pillars Progress Bars */}
      <View style={styles.categoriesList}>
        {categories.map((cat) => {
          const percentage = Math.round((cat.points / 25) * 100);
          const barColor = getBarColor(cat.points);

          return (
            <View key={cat.id} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleRow}>
                  <Ionicons name={cat.icon} size={15} color={COLORS.navyDark} />
                  <Text style={styles.categoryTitle}>{cat.title}</Text>
                </View>
                <Text style={styles.pointsText}>
                  <Text style={[styles.pointsEarned, { color: barColor }]}>
                    {cat.points}
                  </Text>
                  <Text style={styles.pointsMax}> / 25 pts</Text>
                </Text>
              </View>

              {/* Progress Bar Track */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>

              <Text style={styles.reasonText}>{cat.reason}</Text>
            </View>
          );
        })}
      </View>

      {/* Summary Footer */}
      <View style={styles.footerNote}>
        <Ionicons name="information-circle-outline" size={14} color={COLORS.textSecondary} />
        <Text style={styles.footerText}>
          Score equals the sum of all 4 categories ({budgetPts} + {locationPts} + {lifestylePts} + {habitsPts} = {displayScore} / 100).
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  scoreCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.navyDark,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  scoreValue: {
    fontSize: TYPOGRAPHY.xl.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.textInverse,
    lineHeight: 24,
  },
  scoreSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.md.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
  },
  headerDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  matchBadge: {
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  categoriesList: {
    gap: SPACING.md,
  },
  categoryItem: {
    gap: 4,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: TYPOGRAPHY.sm.fontSize,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.navyDark,
  },
  pointsText: {
    fontSize: TYPOGRAPHY.xs.fontSize,
  },
  pointsEarned: {
    fontWeight: TYPOGRAPHY.bold,
    fontSize: TYPOGRAPHY.sm.fontSize,
  },
  pointsMax: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADII.pill,
    overflow: 'hidden',
    marginTop: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: RADII.pill,
  },
  reasonText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.softBlue,
    borderRadius: RADII.sm,
    padding: SPACING.sm,
    marginTop: SPACING.md,
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.primaryDark,
    flex: 1,
    lineHeight: 15,
  },
});
