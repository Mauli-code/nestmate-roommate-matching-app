import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, RADII, SHADOWS, SPACING, TYPOGRAPHY } from '../../src/constants';
import { PanoramaViewer } from '../../src/components';
import { getPropertyById } from '../../src/data/mockData';

export default function VirtualTourScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const property = getPropertyById(id);

  if (!property) {
    return (
      <SafeAreaView style={styles.errorSafe} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorCenterBox}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="alert-circle-outline" size={44} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Accommodation Not Found</Text>
          <Text style={styles.errorSub}>
            The accommodation you requested could not be located.
          </Text>
          <TouchableOpacity
            style={styles.backBtnAction}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={18} color={COLORS.textInverse} />
            <Text style={styles.backBtnText}>Return to Accommodations</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const tour = property.virtualTour;

  if (!tour || !tour.enabled || !tour.scenes || tour.scenes.length === 0) {
    return (
      <SafeAreaView style={styles.errorSafe} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" />
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color="#F8FAFC" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle} numberOfLines={1}>{property.title}</Text>
        </View>

        <View style={styles.errorCenterBox}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="scan-outline" size={44} color="#60A5FA" />
          </View>
          <Text style={styles.errorTitle}>Virtual Tour Unavailable</Text>
          <Text style={styles.errorSub}>
            A 360° virtual tour has not been published yet for "{property.title}". You can explore property photos and schedule an in-person viewing.
          </Text>
          <TouchableOpacity
            style={styles.backBtnAction}
            onPress={() => router.push(`/property/${property.id}`)}
            activeOpacity={0.85}
          >
            <Ionicons name="home-outline" size={18} color={COLORS.textInverse} />
            <Text style={styles.backBtnText}>View Property Details</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color="#F8FAFC" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {tour.title || property.title}
          </Text>
          <Text style={styles.topBarSubtitle}>
            {property.location} • {tour.scenes.length} {tour.scenes.length === 1 ? 'Room' : 'Rooms'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push(`/property/${property.id}`)}
          style={styles.propertyInfoBtn}
          accessibilityLabel="Property details"
        >
          <Ionicons name="information-circle-outline" size={22} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Interactive 360 Panorama Viewer */}
      <View style={styles.viewerFlex}>
        <PanoramaViewer
          scenes={tour.scenes}
          initialSceneId={tour.defaultSceneId}
          propertyTitle={property.title}
        />
      </View>

      {/* Bottom Quick Info Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomRentBox}>
          <Text style={styles.bottomRentLabel}>Rent</Text>
          <Text style={styles.bottomRentValue}>
            ₹{property.rent.toLocaleString('en-IN')}
            <Text style={styles.bottomRentSub}>/mo</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={styles.detailCtaBtn}
          onPress={() => router.push(`/property/${property.id}`)}
          activeOpacity={0.85}
        >
          <Text style={styles.detailCtaText}>View Property</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textInverse} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  viewerFlex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconBtn: {
    padding: 6,
    marginRight: SPACING.xs,
  },
  headerTitleBox: {
    flex: 1,
  },
  topBarTitle: {
    color: '#F8FAFC',
    fontSize: TYPOGRAPHY.base.fontSize,
    fontWeight: TYPOGRAPHY.bold,
  },
  topBarSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: TYPOGRAPHY.medium,
    marginTop: 1,
  },
  propertyInfoBtn: {
    padding: 6,
    marginLeft: SPACING.xs,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  bottomRentBox: {
    flexDirection: 'column',
  },
  bottomRentLabel: {
    color: '#94A3B8',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomRentValue: {
    color: '#38BDF8',
    fontSize: 18,
    fontWeight: TYPOGRAPHY.bold,
  },
  bottomRentSub: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: TYPOGRAPHY.regular,
  },
  detailCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADII.pill,
    ...SHADOWS.md,
  },
  detailCtaText: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.semiBold,
    fontSize: 13,
  },
  errorSafe: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  errorCenterBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  errorIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.bold,
    color: '#F8FAFC',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  backBtnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADII.lg,
  },
  backBtnText: {
    color: COLORS.textInverse,
    fontSize: 14,
    fontWeight: TYPOGRAPHY.semiBold,
  },
});
