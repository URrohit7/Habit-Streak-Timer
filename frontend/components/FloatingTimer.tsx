import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTimerStore } from '../store/timerStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PIP_SIZE = 180;

interface FloatingTimerProps {
  onClose: () => void;
  onFullscreen: () => void;
}

export default function FloatingTimer({ onClose, onFullscreen }: FloatingTimerProps) {
  const { isRunning, elapsedSeconds, timerName } = useTimerStore();
  const [position] = useState(new Animated.ValueXY({ x: SCREEN_WIDTH - PIP_SIZE - 16, y: 100 }));
  const [showSettings, setShowSettings] = useState(false);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event(
      [null, { dx: position.x, dy: position.y }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (_, gesture) => {
      // Snap to edges
      const newX = gesture.moveX < SCREEN_WIDTH / 2 ? 16 : SCREEN_WIDTH - PIP_SIZE - 16;
      Animated.spring(position, {
        toValue: { x: newX, y: gesture.moveY },
        useNativeDriver: false,
      }).start();
    },
  });

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRunning && elapsedSeconds === 0) return null;

  return (
    <>
      <Animated.View
        style={[
          styles.pipContainer,
          {
            transform: position.getTranslateTransform(),
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Settings Button */}
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
        >
          <Ionicons name="settings" size={16} color="#ffffff" />
        </TouchableOpacity>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={16} color="#ffffff" />
        </TouchableOpacity>

        {/* Timer Display */}
        <View style={styles.timerContent}>
          <Text style={styles.pipTimerName} numberOfLines={1}>
            {timerName || 'Timer'}
          </Text>
          <Text style={styles.pipTime}>{formatTime(elapsedSeconds)}</Text>
          {isRunning && (
            <View style={styles.runningIndicator}>
              <View style={styles.pulsingDot} />
              <Text style={styles.runningText}>Running</Text>
            </View>
          )}
        </View>

        {/* Fullscreen Button */}
        <TouchableOpacity style={styles.fullscreenButton} onPress={onFullscreen}>
          <Ionicons name="expand" size={20} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsModal}>
            <Text style={styles.settingsTitle}>Timer Settings</Text>
            <Text style={styles.settingsInfo}>Drag to move • Tap to expand</Text>
            <TouchableOpacity
              style={styles.settingsCloseButton}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.settingsCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pipContainer: {
    position: 'absolute',
    width: PIP_SIZE,
    height: PIP_SIZE,
    backgroundColor: '#1f2937',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#6366f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  settingsButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    borderRadius: 12,
    padding: 6,
    zIndex: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    borderRadius: 12,
    padding: 6,
    zIndex: 10,
  },
  timerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 32,
  },
  pipTimerName: {
    fontSize: 12,
    color: '#d1d5db',
    marginBottom: 8,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  pipTime: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  runningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  runningText: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '600',
  },
  fullscreenButton: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    borderRadius: 20,
    padding: 8,
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  settingsInfo: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  settingsCloseButton: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  settingsCloseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
