import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  RADII,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants';
import Button from './Button';

const LOCATIONS = ['All', 'Central', 'North'];
const BUDGET_OPTIONS = [
  { label: 'Any', value: null },
  { label: 'Up to $1,100', value: 1100 },
  { label: 'Up to $1,250', value: 1250 },
  { label: 'Up to $1,500', value: 1500 },
];
const MIN_SCORE_OPTIONS = [
  { label: 'Any', value: 0 },
  { label: '80%+', value: 80 },
  { label: '85%+', value: 85 },
  { label: '90%+', value: 90 },
];
const SLEEP_OPTIONS = ['Any', 'early', 'flexible', 'late'];
const CLEAN_OPTIONS = ['Any', 'medium', 'high'];

export default function RoommateFilterModal({
  visible,
  onClose,
  filters,
  onApply,
  onReset,
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  // Sync when opened
  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters, visible]);

  const updateFilter = (key, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    const defaultFilters = {
      location: 'All',
      maxBudget: null,
      minScore: 0,
      sleepSchedule: 'Any',
      cleanliness: 'Any',
      nonSmokerOnly: false,
      petsOnly: false,
    };
    setLocalFilters(defaultFilters);
    onReset(defaultFilters);
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Filter Roommates</Text>
              <Text style={styles.subtitle}>Find your most compatible matches</Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={COLORS.navyDark} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Preferred Location */}
            <View style={styles.filterGroup}>
              <Text style={styles.groupLabel}>Preferred Area</Text>
              <View style={styles.optionsRow}>
                {LOCATIONS.map((loc) => {
                  const isSelected = localFilters.location === loc;
                  return (
                    <TouchableOpacity
                      key={loc}
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected,
                      ]}
                      onPress={() => updateFilter('location', loc)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {loc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Max Budget */}
            <View style={styles.filterGroup}>
              <Text style={styles.groupLabel}>Maximum Monthly Budget</Text>
              <View style={styles.optionsRow}>
                {BUDGET_OPTIONS.map((opt) => {
                  const isSelected = localFilters.maxBudget === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected,
                      ]}
                      onPress={() => updateFilter('maxBudget', opt.value)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Minimum Compatibility Score */}
            <View style={styles.filterGroup}>
              <Text style={styles.groupLabel}>Minimum Compatibility Score</Text>
              <View style={styles.optionsRow}>
                {MIN_SCORE_OPTIONS.map((opt) => {
                  const isSelected = localFilters.minScore === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected,
                      ]}
                      onPress={() => updateFilter('minScore', opt.value)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Lifestyle Sleep Schedule */}
            <View style={styles.filterGroup}>
              <Text style={styles.groupLabel}>Sleep Schedule</Text>
              <View style={styles.optionsRow}>
                {SLEEP_OPTIONS.map((opt) => {
                  const isSelected = localFilters.sleepSchedule === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected,
                      ]}
                      onPress={() => updateFilter('sleepSchedule', opt)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {opt === 'Any' ? 'Any' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Cleanliness Level */}
            <View style={styles.filterGroup}>
              <Text style={styles.groupLabel}>Cleanliness Standards</Text>
              <View style={styles.optionsRow}>
                {CLEAN_OPTIONS.map((opt) => {
                  const isSelected = localFilters.cleanliness === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected,
                      ]}
                      onPress={() => updateFilter('cleanliness', opt)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {opt === 'Any' ? 'Any' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Toggles: Smoking & Pets */}
            <View style={styles.filterGroup}>
              <Text style={styles.groupLabel}>Habits & Living Requirements</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.toggleRow}
                onPress={() => updateFilter('nonSmokerOnly', !localFilters.nonSmokerOnly)}
              >
                <View style={styles.toggleLeft}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.toggleText}>Non-smoker only</Text>
                </View>
                <Ionicons
                  name={localFilters.nonSmokerOnly ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={localFilters.nonSmokerOnly ? COLORS.primary : COLORS.border}
                />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.toggleRow}
                onPress={() => updateFilter('petsOnly', !localFilters.petsOnly)}
              >
                <View style={styles.toggleLeft}>
                  <Ionicons name="paw-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.toggleText}>Pet friendly household</Text>
                </View>
                <Ionicons
                  name={localFilters.petsOnly ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={localFilters.petsOnly ? COLORS.primary : COLORS.border}
                />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <Button
              title="Reset All"
              variant="outline"
              size="md"
              onPress={handleReset}
              style={styles.resetButton}
            />
            <Button
              title="Apply Filters"
              variant="primary"
              size="md"
              onPress={handleApply}
              style={styles.applyButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 37, 55, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADII.xl,
    borderTopRightRadius: RADII.xl,
    maxHeight: '85%',
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.lg.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.lg,
  },
  filterGroup: {
    gap: SPACING.sm,
  },
  groupLabel: {
    fontSize: TYPOGRAPHY.sm.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 3,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.navyDark,
    borderColor: COLORS.navyDark,
  },
  chipText: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textSecondary,
  },
  chipTextSelected: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  toggleText: {
    fontSize: TYPOGRAPHY.sm.fontSize,
    color: COLORS.navyDark,
    fontWeight: TYPOGRAPHY.medium,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
  },
  resetButton: {
    flex: 1,
  },
  applyButton: {
    flex: 1.5,
  },
});
