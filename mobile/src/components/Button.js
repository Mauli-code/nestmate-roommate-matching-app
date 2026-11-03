import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../constants';

export default function Button({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  activeOpacity = 0.75,
  ...rest
}) {
  const isInteractive = !disabled && !loading;

  return (
    <TouchableOpacity
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      activeOpacity={activeOpacity}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'outline' || variant === 'ghost' || variant === 'secondary'
              ? COLORS.primary
              : COLORS.textInverse
          }
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text
            style={[
              styles.textBase,
              styles[`text_${variant}`],
              styles[`textSize_${size}`],
              disabled && styles.textDisabled,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.md,
    minHeight: 44,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  iconLeft: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
  },

  // Variants
  primary: {
    backgroundColor: COLORS.navyDark,
  },
  secondary: {
    backgroundColor: COLORS.softBlue,
    borderWidth: 1,
    borderColor: COLORS.softBlueBorder,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.navyDark,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: COLORS.danger,
  },
  disabled: {
    backgroundColor: COLORS.border,
    borderColor: COLORS.border,
    opacity: 0.65,
  },

  // Sizes
  size_sm: {
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    minHeight: 36,
    borderRadius: RADII.sm,
  },
  size_md: {
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.lg,
    minHeight: 46,
    borderRadius: RADII.md,
  },
  size_lg: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    minHeight: 52,
    borderRadius: RADII.lg,
  },

  // Text Styles
  textBase: {
    fontWeight: TYPOGRAPHY.semiBold,
    textAlign: 'center',
  },
  text_primary: {
    color: COLORS.textInverse,
  },
  text_secondary: {
    color: COLORS.primaryDark,
  },
  text_outline: {
    color: COLORS.navyDark,
  },
  text_ghost: {
    color: COLORS.primary,
  },
  text_danger: {
    color: COLORS.textInverse,
  },
  textDisabled: {
    color: COLORS.textMuted,
  },

  // Text Sizes
  textSize_sm: {
    fontSize: TYPOGRAPHY.sm.fontSize,
  },
  textSize_md: {
    fontSize: TYPOGRAPHY.md.fontSize,
  },
  textSize_lg: {
    fontSize: TYPOGRAPHY.base.fontSize,
  },
});
