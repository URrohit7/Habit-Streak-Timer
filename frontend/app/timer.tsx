import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTimerStore } from '../store/timerStore';
import { Audio } from 'expo-av';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function TimerScreen() {
  const {
    isRunning,
    elapsedSeconds,
    timerName,
    lapTimes,
    date,
    timeSlotIndex,
    pauseTimer,
    resumeTimer,
    resetTimer,
    addLap,
    stopTimer,
  } = useTimerStore();

  const [remarks, setRemarks] = useState('');
  const [showRemarks, setShowRemarks] = useState(false);

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

  const handleStop = () => {
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
      Alert.alert('✅ Timer Stopped', 'Time has been saved to your tracker!');
    } catch (error) {
      console.error('Error stopping timer:', error);
      Alert.alert('Error', 'Failed to save timer data');
    }
  };

  const time = formatTime(elapsedSeconds);
  const fastestLap = lapTimes.length > 0 ? Math.min(...lapTimes) : 0;
  const slowestLap = lapTimes.length > 0 ? Math.max(...lapTimes) : 0;

  if (!isRunning && elapsedSeconds === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="timer-outline" size={80} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Active Timer</Text>
          <Text style={styles.emptyText}>
            Start a timer from the Home tab by tapping the play button on any time slot.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.timerNameText}>{timerName || 'Study Session'}</Text>
            <Text style={styles.dateText}>{date}</Text>
          </View>
          {isRunning && (
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Running</Text>
            </View>
          )}
        </View>

        {/* Large Timer Display */}
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
          {isRunning ? (
            <>
              <TouchableOpacity style={styles.pauseButton} onPress={pauseTimer}>
                <Ionicons name="pause" size={40} color="#ffffff" />
                <Text style={styles.controlButtonText}>Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.lapButton} onPress={addLap}>
                <Ionicons name="flag" size={32} color="#6366f1" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
                <Ionicons name="stop" size={40} color="#ffffff" />
                <Text style={styles.controlButtonText}>Stop</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.resumeButton} onPress={resumeTimer}>
                <Ionicons name="play" size={40} color="#ffffff" />
                <Text style={styles.controlButtonText}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetButton} onPress={() => {
                Alert.alert(
                  'Reset Timer',
                  'Are you sure?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Reset', style: 'destructive', onPress: resetTimer },
                  ]
                );
              }}>
                <Ionicons name="refresh" size={32} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
                <Ionicons name="stop" size={40} color="#ffffff" />
                <Text style={styles.controlButtonText}>Stop</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Lap Times */}
        {lapTimes.length > 0 && (
          <View style={styles.lapSection}>
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
                  <Text style={styles.lapNumber}>Lap {index + 1}</Text>
                  <Text style={styles.lapTime}>
                    {lapTime.hrs}:{lapTime.mins}:{lapTime.secs}
                  </Text>
                  {isFastest && <Text style={styles.lapBadge}>🏆</Text>}
                  {isSlowest && <Text style={styles.lapBadge}>🐢</Text>}
                </View>
              );
            })}
          </View>
        )}

        {/* Remarks Modal */}
        {showRemarks && (
          <View style={styles.remarksOverlay}>
            <View style={styles.remarksModal}>
              <Text style={styles.remarksTitle}>Session Complete!</Text>
              <Text style={styles.remarksSubtitle}>Add your remarks (optional)</Text>
              <TextInput
                style={styles.remarksInput}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="How was this study session?..."
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
                <TouchableOpacity style={styles.saveRemarksButton} onPress={handleSaveRemarks}>
                  <Text style={styles.saveRemarksButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  timerNameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  timerDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  timeUnit: {
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#1f2937',
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  timeSeparator: {
    fontSize: 60,
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
  pauseButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
    minWidth: 130,
  },
  resumeButton: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
    minWidth: 130,
  },
  stopButton: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
    minWidth: 130,
  },
  lapButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  resetButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  lapSection: {
    margin: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    fontVariant: ['tabular-nums'],
  },
  lapBadge: {
    fontSize: 20,
  },
  remarksOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    fontSize: 24,
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
  saveRemarksButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  saveRemarksButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
