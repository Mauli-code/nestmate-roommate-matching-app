import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADII, SHADOWS, SPACING, TYPOGRAPHY } from '../constants';
import PriceLabel from './PriceLabel';
import PropertyBadge from './PropertyBadge';

export default function PropertyCard({ property, onPress, onSave, isSaved = false, style }) {
  if (!property) return null;
  const { title, rent, type, location, bedrooms, bathrooms, furnishing, availability, image } = property;

  const availColor = availability === 'Available Now' ? COLORS.success : COLORS.warning;

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={[styles.card, style]}>
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
        {/* Type badge */}
        <PropertyBadge label={type} style={styles.typeBadge} />
        {/* Save button */}
        <TouchableOpacity style={styles.saveButton} onPress={onSave} activeOpacity={0.8}>
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={18} color={isSaved ? COLORS.primary : COLORS.surface} />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Availability dot */}
        <View style={styles.availRow}>
          <View style={[styles.dot, { backgroundColor: availColor }]} />
          <Text style={[styles.availText, { color: availColor }]}>{availability}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>{title}</Text>

        {/* Rent */}
        <PriceLabel price={rent} period="/mo" style={styles.rent} periodStyle={styles.rentSub} />

        {/* Location */}
        <View style={styles.row}>
          <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
        </View>

        {/* Meta chips */}
        <View style={styles.metaRow}>
          <View style={styles.chip}>
            <Ionicons name="bed-outline" size={12} color={COLORS.primaryDark} />
            <Text style={styles.chipText}>{bedrooms} Bed</Text>
          </View>
          {bathrooms && (
            <View style={styles.chip}>
              <Ionicons name="water-outline" size={12} color={COLORS.primaryDark} />
              <Text style={styles.chipText}>{bathrooms} Bath</Text>
            </View>
          )}
          <View style={styles.chip}>
            <Ionicons name="cube-outline" size={12} color={COLORS.primaryDark} />
            <Text style={styles.chipText}>{furnishing.replace(' Furnished', '')}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  imageContainer: { position: 'relative', width: '100%', height: 180 },
  image: { width: '100%', height: '100%' },
  typeBadge: {
    position: 'absolute', top: SPACING.sm, left: SPACING.sm,
    backgroundColor: COLORS.navyDark + 'CC',
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
    borderRadius: RADII.pill,
  },
  typeBadgeText: { color: COLORS.textInverse, fontSize: 11, fontWeight: TYPOGRAPHY.semiBold },
  saveButton: {
    position: 'absolute', top: SPACING.sm, right: SPACING.sm,
    backgroundColor: COLORS.navyDark + '88',
    padding: 7, borderRadius: RADII.pill,
  },
  body: { padding: SPACING.lg },
  availRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  availText: { fontSize: 11, fontWeight: TYPOGRAPHY.semiBold },
  title: { fontSize: TYPOGRAPHY.md.fontSize, fontWeight: TYPOGRAPHY.bold, color: COLORS.navyDark, marginBottom: SPACING.xs, lineHeight: 20 },
  rent: { fontSize: TYPOGRAPHY.lg.fontSize, fontWeight: TYPOGRAPHY.bold, color: COLORS.primary, marginBottom: SPACING.xs },
  rentSub: { fontSize: 12, fontWeight: TYPOGRAPHY.regular, color: COLORS.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.sm },
  locationText: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.softBlue, paddingHorizontal: SPACING.sm,
    paddingVertical: 3, borderRadius: RADII.pill,
  },
  chipText: { fontSize: 11, color: COLORS.primaryDark, fontWeight: TYPOGRAPHY.medium },
});
