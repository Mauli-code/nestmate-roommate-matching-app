import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADII, SHADOWS, SPACING } from '../constants';

export default function Card({
  children,
  onPress,
  variant = 'elevated', // 'elevated' | 'outlined' | 'flat'
  padding = 'md', // 'none' | 'sm' | 'md' | 'lg'
  style,
  activeOpacity = 0.85,
  ...rest
}) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      activeOpacity={activeOpacity}
      accessibilityRole={onPress ? 'button' : undefined}
      style={[
        styles.base,
        styles[variant],
        styles[`padding_${padding}`],
        style,
      ]}
      {...rest}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    overflow: 'hidden',
  },
  elevated: {
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  outlined: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  flat: {
    backgroundColor: COLORS.surfaceSubtle,
  },
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: SPACING.sm,
  },
  padding_md: {
    padding: SPACING.lg,
  },
  padding_lg: {
    padding: SPACING.xl,
  },
});
