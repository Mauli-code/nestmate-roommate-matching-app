import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants';

export default function PriceLabel({ price, period = '/mo', style, priceStyle, periodStyle }) {
  if (price === undefined || price === null) return null;
  const formatted = typeof price === 'number' ? price.toLocaleString('en-IN') : price;

  return (
    <Text style={[styles.price, priceStyle, style]}>
      ₹{formatted}
      {period ? <Text style={[styles.period, periodStyle]}>{period}</Text> : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  price: {
    fontSize: TYPOGRAPHY.lg.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primary,
  },
  period: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.regular,
    color: COLORS.textSecondary,
  },
});
