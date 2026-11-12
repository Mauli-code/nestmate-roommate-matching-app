import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../constants';

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search by city or neighborhood...',
  onClear,
  onFilterPress,
  hasActiveFilters = false,
  containerStyle,
  ...rest
}) {
  const hasValue = Boolean(value && String(value).length > 0);

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChangeText) {
      onChangeText('');
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.searchBox}>
        <Ionicons
          name="search-outline"
          size={20}
          color={COLORS.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          accessibilityLabel="Search input"
          {...rest}
        />
        {hasValue && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {onFilterPress && (
        <TouchableOpacity
          onPress={onFilterPress}
          activeOpacity={0.7}
          style={[
            styles.filterButton,
            hasActiveFilters && styles.filterButtonActive,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={hasActiveFilters ? COLORS.textInverse : COLORS.navyDark}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.md,
    height: 46,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm.fontSize,
    color: COLORS.textPrimary,
    height: '100%',
  },
  clearButton: {
    padding: SPACING.xs,
  },
  filterButton: {
    marginLeft: SPACING.sm,
    width: 46,
    height: 46,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.navyDark,
    borderColor: COLORS.navyDark,
  },
});
