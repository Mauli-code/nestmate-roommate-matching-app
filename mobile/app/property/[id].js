import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, RADII, SHADOWS, SPACING, TYPOGRAPHY } from '../../src/constants';
import { PropertyBadge, PriceLabel } from '../../src/components';
import { useSavedProperties } from '../../src/hooks/useSavedProperties';
import { MOCK_PROPERTIES } from '../../src/data/mockData';

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function PropertyDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isSaved, toggleSave } = useSavedProperties();
  const property = MOCK_PROPERTIES.find(p => p.id === id);

  if (!property) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: COLORS.textSecondary }}>Property not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: COLORS.primary }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const saved = isSaved(property.id);
  const availColor = property.availability === 'Available Now' ? COLORS.success : COLORS.warning;

  const handleContact = () => {
    Alert.alert('Contact Owner', `A contact request for "${property.title}" has been noted. This feature will connect to the backend soon.`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Back bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.navyDark} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>Property Details</Text>
        <TouchableOpacity onPress={() => toggleSave(property)} style={styles.saveBtn}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={saved ? COLORS.primary : COLORS.navyDark} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero image */}
        <Image source={{ uri: property.image }} style={styles.heroImage} resizeMode="cover" />

        <View style={styles.content}>
          {/* Type + Availability */}
          <View style={styles.badgeRow}>
            <PropertyBadge label={property.type} style={styles.typeBadge} />
            <View style={[styles.availBadge, { backgroundColor: availColor + '20', borderColor: availColor }]}>
              <View style={[styles.dot, { backgroundColor: availColor }]} />
              <Text style={[styles.availText, { color: availColor }]}>{property.availability}</Text>
            </View>
          </View>

          <Text style={styles.title}>{property.title}</Text>
          <PriceLabel price={property.rent} period=" / month" style={styles.rent} periodStyle={styles.rentSub} />

          {/* Address */}
          <View style={styles.addressRow}>
            <Ionicons name="location" size={15} color={COLORS.primary} />
            <Text style={styles.addressText}>{property.fullAddress}</Text>
          </View>

          {/* Info Grid */}
          <View style={styles.infoGrid}>
            <InfoRow icon="bed-outline" label="Bedrooms" value={`${property.bedrooms} BHK`} />
            {property.bathrooms && <InfoRow icon="water-outline" label="Bathrooms" value={`${property.bathrooms} Bathroom${property.bathrooms > 1 ? 's' : ''}`} />}
            <InfoRow icon="cube-outline" label="Furnishing" value={property.furnishing} />
            <InfoRow icon="cash-outline" label="Deposit" value={`₹${property.deposit.toLocaleString('en-IN')}`} />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this property</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenityGrid}>
                {property.amenities.map(a => (
                  <View key={a} style={styles.amenityChip}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                    <Text style={styles.amenityText}>{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* House Rules */}
          {property.houseRules?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>House Rules</Text>
              {property.houseRules.map(r => (
                <View key={r} style={styles.ruleRow}>
                  <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.ruleText}>{r}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed bottom CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.rentBox}>
          <Text style={styles.bottomRent}>₹{property.rent.toLocaleString('en-IN')}</Text>
          <Text style={styles.bottomRentSub}>/month</Text>
        </View>
        <TouchableOpacity style={styles.contactBtn} activeOpacity={0.85} onPress={handleContact}>
          <Ionicons name="call-outline" size={18} color={COLORS.textInverse} />
          <Text style={styles.contactBtnText}>Contact Owner</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 4, marginRight: SPACING.sm },
  saveBtn: { padding: 4, marginLeft: SPACING.sm },
  topBarTitle: { flex: 1, fontSize: TYPOGRAPHY.base.fontSize, fontWeight: TYPOGRAPHY.semiBold, color: COLORS.navyDark },
  heroImage: { width: '100%', height: 240 },
  content: { padding: SPACING.lg },
  badgeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  typeBadge: { backgroundColor: COLORS.navyDark, paddingHorizontal: SPACING.sm + 2, paddingVertical: 4, borderRadius: RADII.pill },
  typeBadgeText: { color: COLORS.textInverse, fontSize: 11, fontWeight: TYPOGRAPHY.semiBold },
  availBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm + 2, paddingVertical: 4, borderRadius: RADII.pill, borderWidth: 1, gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  availText: { fontSize: 11, fontWeight: TYPOGRAPHY.semiBold },
  title: { fontSize: TYPOGRAPHY.xl.fontSize, fontWeight: TYPOGRAPHY.bold, color: COLORS.navyDark, marginBottom: SPACING.xs, lineHeight: 28 },
  rent: { fontSize: TYPOGRAPHY.xxl.fontSize, fontWeight: TYPOGRAPHY.bold, color: COLORS.primary, marginBottom: SPACING.sm },
  rentSub: { fontSize: 14, fontWeight: TYPOGRAPHY.regular, color: COLORS.textSecondary },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginBottom: SPACING.lg },
  addressText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  infoGrid: { backgroundColor: COLORS.surface, borderRadius: RADII.lg, padding: SPACING.md, marginBottom: SPACING.lg, ...SHADOWS.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  infoIconBox: { width: 36, height: 36, borderRadius: RADII.sm, backgroundColor: COLORS.softBlue, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  infoLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: TYPOGRAPHY.medium },
  infoValue: { fontSize: 14, color: COLORS.navyDark, fontWeight: TYPOGRAPHY.semiBold, marginTop: 1 },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: TYPOGRAPHY.base.fontSize, fontWeight: TYPOGRAPHY.bold, color: COLORS.navyDark, marginBottom: SPACING.sm },
  description: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.successLight, paddingHorizontal: SPACING.sm + 2, paddingVertical: 5, borderRadius: RADII.pill },
  amenityText: { fontSize: 12, color: '#065F46', fontWeight: TYPOGRAPHY.medium },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  ruleText: { fontSize: 13, color: COLORS.textSecondary },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, ...SHADOWS.lg },
  rentBox: { flex: 1 },
  bottomRent: { fontSize: TYPOGRAPHY.lg.fontSize, fontWeight: TYPOGRAPHY.bold, color: COLORS.navyDark },
  bottomRentSub: { fontSize: 12, color: COLORS.textSecondary },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADII.lg },
  contactBtnText: { color: COLORS.textInverse, fontWeight: TYPOGRAPHY.semiBold, fontSize: 15 },
});
