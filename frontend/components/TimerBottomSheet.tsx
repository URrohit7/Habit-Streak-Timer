import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useTimerStore } from '../store/timerStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TimerBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  date: string;
  slotIndex: number;
  initialName: string;
  onTimerStopped: () => void;
}

export default function TimerBottomSheet({
  visible,
  onClose,
  date,
  slotIndex,
  initialName,
  onTimerStopped,
}: TimerBottomSheetProps) {
  const {
    isRunning,
    elapsedSeconds,
    lapTimes,
    timerName,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    addLap,
    updateElapsed,
  } = useTimerStore();

  const [editableName, setEditableName] = useState(initialName);
  const [showRemarks, setShowRemarks] = useState(false);
  const [remarks, setRemarks] = useState('');
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      setEditableName(initialName);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        updateElapsed(elapsedSeconds + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, elapsedSeconds]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return {
      hrs: hrs.toString().padStart(2, '0'),
      mins: mins.toString().padStart(2, '0'),
      secs: secs.toString().padStart(2, '0'),
    };
  };

  const handleStart = async () => {
    try {
      startTimer(date, slotIndex, editableName);
      await fetch(`${BACKEND_URL}/api/timer/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          timeSlotIndex: slotIndex,
          timerName: editableName,
          startTime: new Date().toISOString(),
          elapsedSeconds: 0,
          isRunning: true,
          lapTimes: [],
        }),
      });
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const handleStop = async () => {
    pauseTimer();
    setShowRemarks(true);
  };

  const handleSaveRemarks = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/timer/stop?remarks=${encodeURIComponent(remarks)}`, {
        method: 'POST',
      });
      
      // Play completion sound
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/complete.mp3'),
          { shouldPlay: true }
        );
        await sound.playAsync();
      } catch (soundError) {
        console.log('Sound not available');
      }

      stopTimer();
      setShowRemarks(false);
      setRemarks('');
      onTimerStopped();
      Alert.alert('✅ Timer Stopped', 'Time has been saved to your tracker!');
      onClose();
    } catch (error) {
      console.error('Error stopping timer:', error);
      Alert.alert('Error', 'Failed to save timer data');
    }
  };

  const handlePause = () => {
    pauseTimer();
  };

  const handleResume = () => {
    resumeTimer();
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Timer',
      'Are you sure you want to reset the timer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => resetTimer(),
        },
      ]
    );
  };

  const handleAddLap = () => {
    addLap();
  };

  const time = formatTime(elapsedSeconds);
  const fastestLap = lapTimes.length > 0 ? Math.min(...lapTimes) : 0;
  const slowestLap = lapTimes.length > 0 ? Math.max(...lapTimes) : 0;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Timer Name */}
          <View style={styles.nameContainer}>
            <TextInput
              style={styles.nameInput}
              value={editableName}
              onChangeText={setEditableName}
              placeholder="Timer name..."
              textAlign="center"
            />
          </View>

          {/* Timer Display */}
          <View style={styles.timerDisplay}>
            <View style={styles.timeUnit}>
              <Text style={styles.timeValue}>{time.hrs}</Text>
              <Text style={styles.timeLabel}>Hours</Text>
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.timeUnit}>
              <Text style={styles.timeValue}>{time.mins}</Text>
              <Text style={styles.timeLabel}>Minutes</Text>
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.timeUnit}>
              <Text style={styles.timeValue}>{time.secs}</Text>
              <Text style={styles.timeLabel}>Seconds</Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {!isRunning && elapsedSeconds === 0 && (
              <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                <Ionicons name="play" size={32} color="#ffffff" />
                <Text style={styles.startButtonText}>Start</Text>
              </TouchableOpacity>
            )}

            {isRunning && (
              <>
                <TouchableOpacity style={styles.controlButton} onPress={handlePause}>
                  <Ionicons name="pause" size={28} color="#f59e0b" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlButton} onPress={handleAddLap}>
                  <Ionicons name="flag" size={28} color="#6366f1" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlButton} onPress={handleStop}>
                  <Ionicons name="stop" size={28} color="#ef4444" />
                </TouchableOpacity>
              </>
            )}

            {!isRunning && elapsedSeconds > 0 && (
              <>
                <TouchableOpacity style={styles.controlButton} onPress={handleResume}>
                  <Ionicons name="play" size={28} color="#10b981" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlButton} onPress={handleReset}>
                  <Ionicons name="refresh" size={28} color="#6b7280" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlButton} onPress={handleStop}>
                  <Ionicons name="stop" size={28} color="#ef4444" />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Lap Times */}
          {lapTimes.length > 0 && (
            <ScrollView style={styles.lapContainer}>
              <Text style={styles.lapTitle}>Lap Times</Text>
              {lapTimes.map((lap, index) => {
                const lapTime = formatTime(lap);
                const isFastest = lap === fastestLap && lapTimes.length > 1;
                const isSlowest = lap === slowestLap && lapTimes.length > 1;
                return (
                  <View
                    key={index}
                    style={[
                      styles.lapItem,
                      isFastest && styles.fastestLap,
                      isSlowest && styles.slowestLap,
                    ]}
                  >
                    <Text style={styles.lapNumber}>#{index + 1}</Text>
                    <Text style={styles.lapTime}>
                      {lapTime.hrs}:{lapTime.mins}:{lapTime.secs}
                    </Text>
                    {isFastest && <Text style={styles.lapBadge}>🏆 Fastest</Text>}
                    {isSlowest && <Text style={styles.lapBadge}>🐢 Slowest</Text>}
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Remarks Modal */}
          <Modal
            visible={showRemarks}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setShowRemarks(false)}
          >
            <View style={styles.remarksOverlay}>
              <View style={styles.remarksModal}>
                <Text style={styles.remarksTitle}>Add Remarks</Text>
                <Text style={styles.remarksSubtitle}>
                  How did this study session go?
                </Text>
                <TextInput
                  style={styles.remarksInput}
                  value={remarks}
                  onChangeText={setRemarks}
                  placeholder="Enter your remarks or notes..."
                  multiline
                  numberOfLines={4}
                  autoFocus
                />
                <View style={styles.remarksButtons}>
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => {
                      setRemarks('');
                      handleSaveRemarks();
                    }}
                  >
                    <Text style={styles.skipButtonText}>Skip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveRemarks}
                  >
                    <Text style={styles.saveButtonText}>Save & Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: SCREEN_HEIGHT * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  nameContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timerDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  timeUnit: {
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#1f2937',
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  timeSeparator: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#d1d5db',
    marginTop: -20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  startButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  lapContainer: {
    maxHeight: 200,
    marginTop: 24,
    paddingHorizontal: 24,
  },
  lapTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  lapItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  fastestLap: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  slowestLap: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  lapNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  lapTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  lapBadge: {
    fontSize: 12,
  },
  remarksOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  remarksModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  remarksTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  remarksSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  remarksInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#f9fafb',
  },
  remarksButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  skipButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
