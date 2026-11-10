import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADII, TYPOGRAPHY } from '../constants';

export default function PropertyBadge({ label, variant = 'dark', style, textStyle }) {
  if (!label) return null;

  const isSuccess = variant === 'success' || label === 'Available Now';
  const isDark = variant === 'dark';
  const isOutline = variant === 'outline';

  return (
    <View
      style={[
        styles.badge,
        isDark && styles.badgeDark,
        isSuccess && styles.badgeSuccess,
        isOutline && styles.badgeOutline,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          isDark && styles.textDark,
          isSuccess && styles.textSuccess,
          isOutline && styles.textOutline,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
    alignSelf: 'flex-start',
  },
  badgeDark: {
    backgroundColor: COLORS.navyDark + 'CC',
  },
  badgeSuccess: {
    backgroundColor: COLORS.successLight,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  badgeOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  text: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  textDark: {
    color: COLORS.textInverse,
  },
  textSuccess: {
    color: '#065F46',
  },
  textOutline: {
    color: COLORS.textSecondary,
  },
});
