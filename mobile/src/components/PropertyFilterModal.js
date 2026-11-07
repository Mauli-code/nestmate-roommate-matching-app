import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADII, SHADOWS, SPACING, TYPOGRAPHY } from '../constants';
import Button from './Button';

const PROPERTY_TYPES = ['All', 'PG', 'Flat', 'Shared Room', 'Private Room'];
const FURNISHINGS = ['Any', 'Fully Furnished', 'Semi-Furnished', 'Unfurnished'];
const BEDROOM_OPTIONS = ['Any', '1', '2', '3', '4+'];
const AVAILABILITIES = ['Any', 'Available Now', 'Available Dec 2026', 'Available Jan 2027'];

export const DEFAULT_PROPERTY_FILTERS = {
  type: 'All',
  minRent: null,
  maxRent: null,
  furnishing: 'Any',
  bedrooms: 'Any',
  availability: 'Any',
};

function PillSelector({ options, selected, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
      {options.map(opt => {
        const isSelected = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onSelect(opt)}
            activeOpacity={0.7}
            style={[styles.pill, isSelected && styles.pillSelected]}
          >
            <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export default function PropertyFilterModal({ visible, onClose, filters, onApply, onReset }) {
  const [local, setLocal] = useState(filters || DEFAULT_PROPERTY_FILTERS);

  const set = (key, val) => setLocal(prev => ({ ...prev, [key]: val }));

  const handleApply = () => { onApply(local); onClose(); };
  const handleReset = () => {
    setLocal(DEFAULT_PROPERTY_FILTERS);
    onReset(DEFAULT_PROPERTY_FILTERS);
    onClose();
  };

  // Sync when modal opens
  React.useEffect(() => { if (visible) setLocal(filters || DEFAULT_PROPERTY_FILTERS); }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.navyDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filter Properties</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Property Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Type</Text>
            <PillSelector options={PROPERTY_TYPES} selected={local.type} onSelect={v => set('type', v)} />
          </View>

          {/* Rent Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monthly Rent (₹)</Text>
            <View style={styles.rentRow}>
              {[
                { label: 'Under ₹10K', min: null, max: 10000 },
                { label: '₹10K–20K', min: 10000, max: 20000 },
                { label: '₹20K–35K', min: 20000, max: 35000 },
                { label: 'Above ₹35K', min: 35000, max: null },
              ].map(opt => {
                const isSelected = local.minRent === opt.min && local.maxRent === opt.max;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    onPress={() => { set('minRent', opt.min); set('maxRent', opt.max); }}
                    activeOpacity={0.7}
                    style={[styles.rentPill, isSelected && styles.pillSelected]}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Furnishing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Furnishing</Text>
            <PillSelector options={FURNISHINGS} selected={local.furnishing} onSelect={v => set('furnishing', v)} />
          </View>

          {/* Bedrooms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bedrooms</Text>
            <PillSelector options={BEDROOM_OPTIONS} selected={local.bedrooms} onSelect={v => set('bedrooms', v)} />
          </View>

          {/* Availability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <PillSelector options={AVAILABILITIES} selected={local.availability} onSelect={v => set('availability', v)} />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button title="Apply Filters" variant="primary" size="lg" onPress={handleApply} style={{ flex: 1 }} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  closeBtn: { padding: 4 },
  headerTitle: { fontSize: TYPOGRAPHY.base.fontSize, fontWeight: TYPOGRAPHY.bold, color: COLORS.navyDark },
  resetText: { fontSize: 14, color: COLORS.primary, fontWeight: TYPOGRAPHY.semiBold },
  body: { padding: SPACING.lg, paddingBottom: 32 },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: TYPOGRAPHY.sm.fontSize, fontWeight: TYPOGRAPHY.semiBold, color: COLORS.navyDark, marginBottom: SPACING.sm },
  pill: {
    paddingHorizontal: SPACING.md, paddingVertical: 7,
    borderRadius: RADII.pill, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  pillSelected: { backgroundColor: COLORS.navyDark, borderColor: COLORS.navyDark },
  pillText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.medium },
  pillTextSelected: { color: COLORS.textInverse, fontWeight: TYPOGRAPHY.semiBold },
  rentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rentPill: {
    paddingHorizontal: SPACING.md, paddingVertical: 7,
    borderRadius: RADII.pill, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  footer: {
    padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
});
