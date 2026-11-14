import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../constants/theme';

export default function PreferenceChoice({ label, value, options, onChange, error }) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: value === option.value }}
            onPress={() => onChange(option.value)}
            style={[styles.option, value === option.value && styles.selected]}
          >
            <Text style={[styles.optionText, value === option.value && styles.selectedText]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: SPACING.md },
  label: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sm.fontSize, fontWeight: TYPOGRAPHY.medium, marginBottom: SPACING.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  option: { borderColor: COLORS.border, borderRadius: RADII.pill, borderWidth: 1, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
  selected: { backgroundColor: COLORS.navyDark, borderColor: COLORS.navyDark },
  optionText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sm.fontSize },
  selectedText: { color: COLORS.textInverse, fontWeight: TYPOGRAPHY.semiBold },
  error: { color: COLORS.danger, fontSize: TYPOGRAPHY.xs.fontSize, marginTop: SPACING.xs },
});
