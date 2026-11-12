import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../constants';

export default function Badge({
  label,
  variant = 'primary', // 'primary' | 'success' | 'warning' | 'danger' | 'navy' | 'neutral'
  size = 'md', // 'sm' | 'md'
  icon,
  style,
  textStyle,
}) {
  return (
    <View style={[styles.base, styles[variant], styles[`size_${size}`], style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          styles.text,
          styles[`text_${variant}`],
          styles[`textSize_${size}`],
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: RADII.pill,
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    fontWeight: TYPOGRAPHY.semiBold,
  },

  // Variants
  primary: {
    backgroundColor: COLORS.softBlue,
    borderWidth: 1,
    borderColor: COLORS.softBlueBorder,
  },
  navy: {
    backgroundColor: COLORS.navyDark,
  },
  success: {
    backgroundColor: COLORS.successLight,
  },
  warning: {
    backgroundColor: COLORS.warningLight,
  },
  danger: {
    backgroundColor: COLORS.dangerLight,
  },
  neutral: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Text colors
  text_primary: {
    color: COLORS.primaryDark,
  },
  text_navy: {
    color: COLORS.textInverse,
  },
  text_success: {
    color: '#065F46',
  },
  text_warning: {
    color: '#92400E',
  },
  text_danger: {
    color: '#991B1B',
  },
  text_neutral: {
    color: COLORS.textSecondary,
  },

  // Sizes
  size_sm: {
    paddingVertical: 2,
    paddingHorizontal: SPACING.sm,
  },
  size_md: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  textSize_sm: {
    fontSize: TYPOGRAPHY.xs.fontSize,
  },
  textSize_md: {
    fontSize: TYPOGRAPHY.sm.fontSize,
  },
});
