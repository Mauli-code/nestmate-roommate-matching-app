import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  RADII,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '../constants';
import Button from './Button';
import Badge from './Badge';

export default function MatchRequestModal({
  visible,
  onClose,
  candidate,
}) {
  if (!candidate) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Top Success Badge */}
          <View style={styles.iconCircle}>
            <Ionicons name="paper-plane" size={28} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>Match Request Sent!</Text>
          <Text style={styles.subtitle}>
            We've sent your profile to <Text style={styles.bold}>{candidate.name}</Text>.
          </Text>

          {/* Candidate Card Summary */}
          <View style={styles.summaryBox}>
            <Image source={{ uri: candidate.avatar }} style={styles.avatar} />
            <View style={styles.summaryText}>
              <Text style={styles.candidateName}>{candidate.name}, {candidate.age}</Text>
              <Text style={styles.candidateRole} numberOfLines={1}>{candidate.role}</Text>
              <View style={styles.badgeRow}>
                <Badge
                  label={`${candidate.score}% Match`}
                  variant="success"
                  size="sm"
                />
                <Badge
                  label="Pending Approval"
                  variant="warning"
                  size="sm"
                />
              </View>
            </View>
          </View>

          <View style={styles.tipBox}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.primaryDark} />
            <Text style={styles.tipText}>
              Once accepted, you'll be able to chat, compare accommodations, and plan your move-in together.
            </Text>
          </View>

          {/* Action button */}
          <Button
            title="Great, Got It"
            variant="primary"
            size="md"
            onPress={onClose}
            style={styles.closeBtn}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 37, 55, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.xl.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sm.fontSize,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  bold: {
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADII.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.border,
  },
  summaryText: {
    flex: 1,
  },
  candidateName: {
    fontSize: TYPOGRAPHY.base.fontSize,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.navyDark,
  },
  candidateRole: {
    fontSize: TYPOGRAPHY.xs.fontSize,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.softBlue,
    borderRadius: RADII.sm,
    padding: SPACING.sm,
    gap: 6,
    marginBottom: SPACING.lg,
    width: '100%',
  },
  tipText: {
    fontSize: 11,
    color: COLORS.primaryDark,
    flex: 1,
    lineHeight: 15,
  },
  closeBtn: {
    width: '100%',
  },
});
