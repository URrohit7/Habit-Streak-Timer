import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function CalendarScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [trackers, setTrackers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState({});

  useEffect(() => {
    loadTrackers();
  }, []);

  const loadTrackers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/tracker/recent/list`);
      const data = await response.json();
      setTrackers(data);

      // Create marked dates object
      const marked: any = {};
      data.forEach((tracker: any) => {
        marked[tracker.date] = {
          marked: true,
          dotColor: tracker.isCompleted ? '#10b981' : '#6366f1',
          selected: tracker.date === selectedDate,
          selectedColor: tracker.date === selectedDate ? '#6366f1' : undefined,
        };
      });
      setMarkedDates(marked);
    } catch (error) {
      console.error('Error loading trackers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrackerForDate = (date: string) => {
    return trackers.find((t) => t.date === date);
  };

  const calculateTotalHours = (tracker: any) => {
    if (!tracker || !tracker.timeSlots) return 0;
    const totalSeconds = tracker.timeSlots.reduce(
      (sum: number, slot: any) => sum + (slot.timeSpent || 0),
      0
    );
    return (totalSeconds / 3600).toFixed(1);
  };

  const selectedTracker = getTrackerForDate(selectedDate);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="calendar" size={28} color="#6366f1" />
          <Text style={styles.title}>Study Calendar</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Calendar */}
            <View style={styles.calendarContainer}>
              <Calendar
                current={selectedDate}
                onDayPress={(day) => setSelectedDate(day.dateString)}
                markedDates={markedDates}
                theme={{
                  todayTextColor: '#6366f1',
                  selectedDayBackgroundColor: '#6366f1',
                  selectedDayTextColor: '#ffffff',
                  arrowColor: '#6366f1',
                  monthTextColor: '#1f2937',
                  textMonthFontWeight: 'bold',
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                }}
              />
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Completed</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#6366f1' }]} />
                <Text style={styles.legendText}>In Progress</Text>
              </View>
            </View>

            {/* Selected Day Details */}
            {selectedTracker ? (
              <View style={styles.detailsCard}>
                <View style={styles.detailsHeader}>
                  <View>
                    <Text style={styles.detailsDate}>{selectedDate}</Text>
                    <Text style={styles.detailsDay}>{selectedTracker.day}</Text>
                  </View>
                  {selectedTracker.isCompleted && (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                      <Text style={styles.completedText}>Completed</Text>
                    </View>
                  )}
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Ionicons name="time" size={24} color="#6366f1" />
                    <Text style={styles.statValue}>{calculateTotalHours(selectedTracker)}h</Text>
                    <Text style={styles.statLabel}>Study Time</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Ionicons name="book" size={24} color="#10b981" />
                    <Text style={styles.statValue}>
                      {selectedTracker.timeSlots.filter((s: any) => !s.isBreak && s.subject).length}
                    </Text>
                    <Text style={styles.statLabel}>Sessions</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Ionicons name="bar-chart" size={24} color="#f59e0b" />
                    <Text style={styles.statValue}>
                      {selectedTracker.dailyReflection?.productivity || 0}/10
                    </Text>
                    <Text style={styles.statLabel}>Productivity</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => router.push('/')}
                >
                  <Text style={styles.viewButtonText}>View Full Tracker</Text>
                  <Ionicons name="arrow-forward" size={20} color="#6366f1" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>No tracker for this date</Text>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => router.push('/')}
                >
                  <Text style={styles.createButtonText}>Create Tracker</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Monthly Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Monthly Overview</Text>
              <View style={styles.summaryStats}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {trackers.filter((t) => t.isCompleted).length}
                  </Text>
                  <Text style={styles.summaryLabel}>Days Completed</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {trackers.reduce(
                      (sum, t) => sum + parseFloat(calculateTotalHours(t)),
                      0
                    ).toFixed(1)}h
                  </Text>
                  <Text style={styles.summaryLabel}>Total Study Time</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  detailsDate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  detailsDay: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  viewButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
});
