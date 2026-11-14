import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADII, SHADOWS, SPACING, TYPOGRAPHY } from '../constants';
import { generatePanoramaHtml } from '../utils/panoramaHtml';

let WebViewComponent = null;
if (Platform.OS !== 'web') {
  try {
    // Dynamic require so tests and web bundling won't fail if native module is absent
    WebViewComponent = require('react-native-webview').WebView;
  } catch (err) {
    WebViewComponent = null;
  }
}

export default function PanoramaViewer({
  scenes = [],
  initialSceneId,
  propertyTitle = 'Virtual Accommodation Tour',
  onSceneChange,
  style,
}) {
  const [activeSceneId, setActiveSceneId] = useState(
    initialSceneId || (scenes[0] && scenes[0].id) || 'default'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);

  const activeScene = scenes.find(s => s.id === activeSceneId) || scenes[0] || {
    id: 'default',
    name: 'Main Room',
    icon: 'home-outline',
    description: '360° Virtual Panorama View',
    panoramaUrl: '',
    initialYaw: 0,
    initialPitch: 0,
    initialFov: 75,
  };

  const webViewRef = useRef(null);
  const iframeRef = useRef(null);

  // Send command to viewer
  const sendViewerCommand = (command) => {
    const payload = JSON.stringify(command);
    if (Platform.OS === 'web') {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(payload, '*');
      }
    } else if (webViewRef.current) {
      if (webViewRef.current.postMessage) {
        webViewRef.current.postMessage(payload);
      } else if (webViewRef.current.injectJavaScript) {
        webViewRef.current.injectJavaScript(
          `window.handleInboundMessage && window.handleInboundMessage(${JSON.stringify(payload)}); true;`
        );
      }
    }
  };

  const handleSelectScene = (scene) => {
    if (!scene || scene.id === activeSceneId) return;
    setActiveSceneId(scene.id);
    setIsLoading(true);
    setErrorNotice(null);
    sendViewerCommand({ type: 'switchScene', scene });
    if (onSceneChange) onSceneChange(scene);
  };

  const handleZoomIn = () => sendViewerCommand({ type: 'zoomIn' });
  const handleZoomOut = () => sendViewerCommand({ type: 'zoomOut' });
  const handleReset = () => sendViewerCommand({ type: 'resetView' });
  const handleToggleAutoRotate = () => {
    const next = !autoRotate;
    setAutoRotate(next);
    sendViewerCommand({ type: 'toggleAutoRotate', enabled: next });
  };

  // Inbound messages from WebGL viewer
  const handleMessage = (event) => {
    try {
      const rawData = event.nativeEvent ? event.nativeEvent.data : event.data;
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      if (!data) return;

      if (data.type === 'loaded') {
        setIsLoading(false);
        if (data.isFallback) {
          setIsFallback(true);
          setErrorNotice(data.warning || 'Displayed offline 360° fallback.');
        } else {
          setIsFallback(false);
          setErrorNotice(null);
        }
      } else if (data.type === 'error') {
        setIsLoading(false);
        setErrorNotice(data.error || 'Failed to render 360 scene.');
      }
    } catch (err) {
      // Non-JSON or third-party message
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  const html = generatePanoramaHtml({
    scene: activeScene,
    scenes,
    propertyTitle,
    autoRotate,
  });

  return (
    <View style={[styles.container, style]}>
      {/* 360 Viewer Canvas (Web or Native WebView) */}
      <View style={styles.viewerContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef}
            srcDoc={html}
            style={webIframeStyle}
            title={propertyTitle}
            allow="accelerometer; gyroscope; fullscreen"
          />
        ) : WebViewComponent ? (
          <WebViewComponent
            ref={webViewRef}
            source={{ html }}
            style={styles.webView}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onMessage={handleMessage}
            onLoadEnd={() => setIsLoading(false)}
          />
        ) : (
          <View style={styles.mockNativeFallback}>
            <Ionicons name="cube-outline" size={48} color={COLORS.primary} />
            <Text style={styles.fallbackTitle}>360° Panoramic Viewer</Text>
            <Text style={styles.fallbackSub}>{activeScene.name} • {propertyTitle}</Text>
          </View>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <View style={styles.loadingBackdrop}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingLabel}>Loading 360° Interior...</Text>
          </View>
        )}

        {/* Top Room Banner */}
        <View style={styles.topInfoBar}>
          <View style={styles.roomTag}>
            <Ionicons name={activeScene.icon || 'home-outline'} size={15} color={COLORS.textInverse} />
            <Text style={styles.roomTagText}>{activeScene.name}</Text>
          </View>
          <View style={styles.vrIndicator}>
            <Ionicons name="scan-outline" size={13} color="#60A5FA" />
            <Text style={styles.vrIndicatorText}>360° VR</Text>
          </View>
        </View>

        {/* Floating Right Control Tools */}
        <View style={styles.floatingControls}>
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={handleZoomIn}
            activeOpacity={0.8}
            accessibilityLabel="Zoom In"
          >
            <Ionicons name="add" size={20} color={COLORS.surface} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolBtn}
            onPress={handleZoomOut}
            activeOpacity={0.8}
            accessibilityLabel="Zoom Out"
          >
            <Ionicons name="remove" size={20} color={COLORS.surface} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolBtn}
            onPress={handleReset}
            activeOpacity={0.8}
            accessibilityLabel="Reset View"
          >
            <Ionicons name="compass-outline" size={19} color={COLORS.surface} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, autoRotate && styles.toolBtnActive]}
            onPress={handleToggleAutoRotate}
            activeOpacity={0.8}
            accessibilityLabel="Auto-Rotate"
          >
            <Ionicons
              name={autoRotate ? 'pause-outline' : 'play-outline'}
              size={18}
              color={autoRotate ? COLORS.navyDark : COLORS.surface}
            />
          </TouchableOpacity>
        </View>

        {/* Offline Fallback / Error Toast Banner */}
        {errorNotice && (
          <View style={styles.errorNoticeBox}>
            <Ionicons name="information-circle-outline" size={16} color="#FBBF24" />
            <Text style={styles.errorNoticeText} numberOfLines={1}>{errorNotice}</Text>
          </View>
        )}
      </View>

      {/* Room Selector Carousel */}
      {scenes && scenes.length > 1 && (
        <View style={styles.sceneBar}>
          <Text style={styles.sceneBarTitle}>Explore Rooms ({scenes.length}):</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sceneScroll}
          >
            {scenes.map((sc) => {
              const isCurrent = sc.id === activeSceneId;
              return (
                <TouchableOpacity
                  key={sc.id}
                  style={[styles.scenePill, isCurrent && styles.scenePillActive]}
                  onPress={() => handleSelectScene(sc)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={sc.icon || 'home-outline'}
                    size={14}
                    color={isCurrent ? COLORS.textInverse : COLORS.navyDark}
                  />
                  <Text style={[styles.scenePillText, isCurrent && styles.scenePillTextActive]}>
                    {sc.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Room Description Snippet */}
      {activeScene.description && (
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>{activeScene.description}</Text>
        </View>
      )}
    </View>
  );
}

const webIframeStyle = {
  width: '100%',
  height: '100%',
  border: 'none',
  display: 'block',
  backgroundColor: '#0F172A',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  viewerContainer: {
    flex: 1,
    minHeight: 320,
    position: 'relative',
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  mockNativeFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: '#1E293B',
  },
  fallbackTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: TYPOGRAPHY.bold,
    marginTop: SPACING.md,
  },
  fallbackSub: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
  },
  loadingBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  loadingLabel: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: TYPOGRAPHY.medium,
    marginTop: SPACING.sm,
  },
  topInfoBar: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    zIndex: 10,
  },
  roomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...SHADOWS.md,
  },
  roomTagText: {
    color: COLORS.textInverse,
    fontSize: 13,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  vrIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(30, 58, 138, 0.85)',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  vrIndicatorText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: TYPOGRAPHY.bold,
  },
  floatingControls: {
    position: 'absolute',
    right: SPACING.md,
    top: '32%',
    gap: SPACING.xs + 2,
    zIndex: 10,
  },
  toolBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  toolBtnActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  errorNoticeBox: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: '#F59E0B',
    zIndex: 10,
  },
  errorNoticeText: {
    color: '#FDE68A',
    fontSize: 12,
    flex: 1,
  },
  sceneBar: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm + 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sceneBarTitle: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.lg,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sceneScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  scenePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.softBlue,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  scenePillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  scenePillText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.navyDark,
  },
  scenePillTextActive: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  descriptionCard: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
