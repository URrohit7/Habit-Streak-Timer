import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import TimeSlotCard from '../components/TimeSlotCard';
import DailyReflectionSection from '../components/DailyReflectionSection';
import TimerBottomSheet from '../components/TimerBottomSheet';
import StreakAnimation from '../components/StreakAnimation';
import FloatingTimer from '../components/FloatingTimer';
import { useTimerStore } from '../store/timerStore';
import { useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const MOOD_EMOJIS = ['😫', '😕', '😐', '😊', '🤩'];
const DEFAULT_SUBJECTS = [
  'English',
  'Nepali',
  'Accountancy',
  'Business Mathematics',
  'Social Studies & Life Skill',
  'Economics',
];

export default function HomeScreen() {
  const router = useRouter();
  const [tracker, setTracker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [streak, setStreak] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(-1);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [showFloatingTimer, setShowFloatingTimer] = useState(false);
  const [todayStudyHours, setTodayStudyHours] = useState('0h 0m');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  
  const { isRunning, timerName, startTimer } = useTimerStore();
  
  // Debounce ref for saving
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadTracker();
    loadStreak();
    calculateTodayStudyHours();
  }, [selectedDate]);

  useEffect(() => {
    if (tracker) {
      calculateTodayStudyHours();
    }
  }, [tracker]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const loadTracker = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/tracker/${selectedDate}`);
      const data = await response.json();
      setTracker(data);
    } catch (error) {
      console.error('Error loading tracker:', error);
      Alert.alert('Error', 'Failed to load tracker data');
    } finally {
      setLoading(false);
    }
  };

  const loadStreak = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/streak`);
      const data = await response.json();
      setStreak(data.currentStreak || 0);
    } catch (error) {
      console.error('Error loading streak:', error);
    }
  };

  const saveTracker = async (updatedTracker: any) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tracker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTracker),
      });
      const data = await response.json();
      // Don't update tracker state from response to avoid overwriting in-progress edits
    } catch (error) {
      console.error('Error saving tracker:', error);
    }
  };

  // Debounced save - only saves after 800ms of inactivity
  const debouncedSave = useCallback((updatedTracker: any) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveTracker(updatedTracker);
    }, 800);
  }, []);

  const updateField = (field: string, value: any) => {
    const updated = { ...tracker, [field]: value };
    setTracker(updated);
    debouncedSave(updated);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Check if date is in the future
      if (selectedDate > new Date()) {
        Alert.alert('Invalid Date', 'You cannot select a future date. Please choose today or a past date.');
        return;
      }
      
      setTempDate(selectedDate);
      setSelectedDate(dateString);
      
      if (Platform.OS === 'ios') {
        // iOS shows Done button
      } else {
        // Android auto-applies
        loadTracker();
      }
    }
  };

  const confirmDateSelection = () => {
    setShowDatePicker(false);
    loadTracker();
  };

  const updateTimeSlot = (index: number, updatedSlot: any) => {
    const updatedSlots = [...tracker.timeSlots];
    updatedSlots[index] = updatedSlot;
    const updated = { ...tracker, timeSlots: updatedSlots };
    setTracker(updated);
    debouncedSave(updated);
  };

  const addTimeSlot = () => {
    const newSlot = {
      timeRange: '',
      subject: '',
      topic: '',
      practice: false,
      revision: false,
      notes: '',
      timeSpent: 0,
      remarks: '',
      isBreak: false,
    };
    const updated = {
      ...tracker,
      timeSlots: [...tracker.timeSlots, newSlot],
    };
    setTracker(updated);
    saveTracker(updated);
  };

  const deleteTimeSlot = (index: number) => {
    const updatedSlots = tracker.timeSlots.filter((_: any, i: number) => i !== index);
    const updated = { ...tracker, timeSlots: updatedSlots };
    setTracker(updated);
    saveTracker(updated);
  };

  const openTimerForSlot = (index: number) => {
    const slot = tracker.timeSlots[index];
    const name = slot.subject && slot.topic 
      ? `${slot.subject} - ${slot.topic}`
      : slot.subject || slot.topic || `Time Slot ${index + 1}`;
    
    setSelectedSlotIndex(index);
    setShowTimer(true);
    // Timer will automatically show FloatingTimer when minimized via onClose handler
  };

  const calculateTodayStudyHours = () => {
    if (!tracker || !tracker.timeSlots) {
      setTodayStudyHours('0h 0m');
      return;
    }
    
    const totalSeconds = tracker.timeSlots.reduce(
      (sum: number, slot: any) => sum + (slot.timeSpent || 0),
      0
    );
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    setTodayStudyHours(`${hours}h ${minutes}m`);
  };

  const markDayComplete = () => {
    Alert.alert(
      'Mark Day Complete',
      `Are you sure you want to mark ${selectedDate} as complete?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              const response = await fetch(`${BACKEND_URL}/api/tracker/complete/${selectedDate}`, {
                method: 'POST',
              });
              const data = await response.json();
              
              // Update local state
              await loadStreak();
              await loadTracker();
              
              // Show Duolingo-style streak animation
              setStreak(data.streak);
              setShowStreakAnimation(true);
            } catch (error) {
              console.error('Error marking complete:', error);
              Alert.alert('Error', 'Failed to mark day complete');
            }
          },
        },
      ]
    );
  };

  const updateReflection = (field: string, value: any) => {
    const updatedReflection = { ...tracker.dailyReflection, [field]: value };
    const updated = { ...tracker, dailyReflection: updatedReflection };
    setTracker(updated);
    debouncedSave(updated);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading your tracker...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <LinearGradient
            colors={['#6366f1', '#8b5cf6', '#d946ef']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View>
              <Text style={styles.title}>Study Tracker</Text>
              <Text style={styles.subtitle}>Today: {todayStudyHours}</Text>
            </View>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={20} color="#ff6b35" />
              <Text style={styles.streakText}>{streak} Day Streak</Text>
            </View>
          </LinearGradient>

          {/* Date & Day */}
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>DATE</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#6366f1" />
                  <Text style={styles.dateText}>{tracker?.date || selectedDate}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>DAY</Text>
                <TextInput
                  style={styles.input}
                  value={tracker?.day || ''}
                  onChangeText={(text) => updateField('day', text)}
                  placeholder="Monday"
                />
              </View>
            </View>

            {/* Date Picker Modal */}
            {showDatePicker && (
              <Modal
                transparent={true}
                animationType="fade"
                visible={showDatePicker}
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.datePickerModal}>
                    <Text style={styles.datePickerTitle}>Select Date</Text>
                    <Text style={styles.datePickerSubtitle}>Choose today or a past date</Text>
                    <DateTimePicker
                      value={tempDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleDateChange}
                      maximumDate={new Date()}
                      style={styles.datePicker}
                    />
                    <View style={styles.datePickerButtons}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={confirmDateSelection}
                      >
                        <Text style={styles.confirmButtonText}>Confirm</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}

            {/* Mood Selector */}
            <View style={styles.moodSection}>
              <Text style={styles.label}>MOOD / ENERGY</Text>
              <View style={styles.moodContainer}>
                {MOOD_EMOJIS.map((emoji, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => updateField('mood', index + 1)}
                    style={[
                      styles.moodButton,
                      tracker?.mood === index + 1 && styles.moodButtonActive,
                    ]}
                  >
                    <Text style={styles.moodEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Active Timer Indicator */}
          {isRunning && (
            <TouchableOpacity
              style={styles.activeTimerBanner}
              onPress={() => setShowTimer(true)}
            >
              <Ionicons name="timer" size={20} color="#ffffff" />
              <Text style={styles.activeTimerText}>
                Timer Running: {timerName}
              </Text>
              <Ionicons name="chevron-up" size={20} color="#ffffff" />
            </TouchableOpacity>
          )}

          {/* Time Slots */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time Blocks</Text>
            {tracker?.timeSlots.map((slot: any, index: number) => (
              <TimeSlotCard
                key={index}
                slot={slot}
                index={index}
                onUpdate={(updatedSlot) => updateTimeSlot(index, updatedSlot)}
                onDelete={() => deleteTimeSlot(index)}
                onStartTimer={() => openTimerForSlot(index)}
                subjects={DEFAULT_SUBJECTS}
              />
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addTimeSlot}>
              <Ionicons name="add-circle" size={24} color="#6366f1" />
              <Text style={styles.addButtonText}>Add Time Slot</Text>
            </TouchableOpacity>
          </View>

          {/* Daily Reflection */}
          <DailyReflectionSection
            reflection={tracker?.dailyReflection || {}}
            onUpdate={updateReflection}
          />

          {/* Mark Complete Button */}
          <TouchableOpacity
            style={[
              styles.completeButton,
              tracker?.isCompleted && styles.completedButton,
            ]}
            onPress={markDayComplete}
            disabled={tracker?.isCompleted}
          >
            {tracker?.isCompleted ? (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <Text style={styles.completedButtonText}>Day Completed ✓</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={24} color="#ffffff" />
                <Text style={styles.completeButtonText}>Mark Day Complete</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerQuote}>
              "Stay Focused. Stay Consistent."
            </Text>
            <Text style={styles.footerCredit}>
              Created by Rohit Karna
            </Text>
          </View>
        </ScrollView>

        {/* Timer Bottom Sheet */}
        <TimerBottomSheet
          visible={showTimer}
          onClose={() => {
            setShowTimer(false);
            if (isRunning) {
              setShowFloatingTimer(true);
            }
          }}
          date={selectedDate}
          slotIndex={selectedSlotIndex}
          initialName={
            selectedSlotIndex >= 0 && tracker?.timeSlots[selectedSlotIndex]
              ? (() => {
                  const slot = tracker.timeSlots[selectedSlotIndex];
                  return slot.subject && slot.topic
                    ? `${slot.subject} - ${slot.topic}`
                    : slot.subject || slot.topic || `Time Slot ${selectedSlotIndex + 1}`;
                })():
              'Study Session'
          }
          onTimerStopped={() => {
            loadTracker();
            setShowFloatingTimer(false);
          }}
        />

        {/* Streak Animation */}
        {showStreakAnimation && (
          <StreakAnimation
            streak={streak}
            onComplete={() => setShowStreakAnimation(false)}
          />
        )}

        {/* Floating PiP Timer */}
        {showFloatingTimer && (
          <FloatingTimer
            onClose={() => setShowFloatingTimer(false)}
            onFullscreen={() => {
              setShowFloatingTimer(false);
              router.push('/timer');
            }}
          />
        )}
      </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 20,
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  card: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f9fafb',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  dateText: {
    fontSize: 14,
    color: '#1f2937',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  datePickerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  datePicker: {
    width: '100%',
    marginBottom: 20,
  },
  datePickerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  confirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  moodSection: {
    marginTop: 8,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  moodButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodButtonActive: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  moodEmoji: {
    fontSize: 28,
  },
  activeTimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    gap: 8,
  },
  activeTimerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
    marginTop: 12,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  completedButton: {
    backgroundColor: '#10b981',
  },
  completedButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerQuote: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerCredit: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '600',
  },
});
