/**
 * Local Storage Service
 * Replaces backend API with browser localStorage
 * All data is stored locally on the device
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TimeSlot {
  timeRange: string;
  subject: string;
  topic: string;
  practice: boolean;
  revision: boolean;
  notes: string;
  timeSpent: number;
  remarks: string;
  isBreak: boolean;
}

export interface DailyReflection {
  successfulTopics: string;
  difficultAreas: string;
  tomorrowPlan: string;
  selfRating: number;
}

export interface TrackerData {
  date: string;
  day: string;
  mood: number;
  timeSlots: TimeSlot[];
  dailyReflection: DailyReflection;
  isCompleted: boolean;
}

const STORAGE_KEY_PREFIX = 'habit_tracker_';
const STREAK_KEY = 'habit_tracker_streak';
const LAST_COMPLETED_KEY = 'habit_tracker_last_completed_date';

/**
 * Get tracker data for a specific date
 */
export async function getTracker(date: string): Promise<TrackerData> {
  try {
    const key = `${STORAGE_KEY_PREFIX}${date}`;
    const data = await AsyncStorage.getItem(key);
    
    if (data) {
      return JSON.parse(data);
    }
    
    // Return default empty tracker for new date
    return {
      date,
      day: getDayName(date),
      mood: 0,
      timeSlots: [],
      dailyReflection: {
        successfulTopics: '',
        difficultAreas: '',
        tomorrowPlan: '',
        selfRating: 0,
      },
      isCompleted: false,
    };
  } catch (error) {
    console.error('Error getting tracker:', error);
    throw error;
  }
}

/**
 * Save tracker data for a specific date
 */
export async function saveTracker(date: string, data: TrackerData): Promise<void> {
  try {
    const key = `${STORAGE_KEY_PREFIX}${date}`;
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving tracker:', error);
    throw error;
  }
}

/**
 * Get current streak
 */
export async function getStreak(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(STREAK_KEY);
    return data ? parseInt(data, 10) : 0;
  } catch (error) {
    console.error('Error getting streak:', error);
    return 0;
  }
}

/**
 * Update streak when day is marked complete
 */
export async function updateStreak(date: string): Promise<{ currentStreak: number }> {
  try {
    const lastCompleted = await AsyncStorage.getItem(LAST_COMPLETED_KEY);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let currentStreak = await getStreak();

    // Check if this is a consecutive day
    if (lastCompleted === yesterday || lastCompleted === null) {
      currentStreak += 1;
    } else {
      // Streak broken, restart from 1
      currentStreak = 1;
    }

    await AsyncStorage.setItem(STREAK_KEY, currentStreak.toString());
    await AsyncStorage.setItem(LAST_COMPLETED_KEY, date);

    return { currentStreak };
  } catch (error) {
    console.error('Error updating streak:', error);
    throw error;
  }
}

/**
 * Reset streak
 */
export async function resetStreak(): Promise<void> {
  try {
    await AsyncStorage.setItem(STREAK_KEY, '0');
    await AsyncStorage.removeItem(LAST_COMPLETED_KEY);
  } catch (error) {
    console.error('Error resetting streak:', error);
    throw error;
  }
}

/**
 * Get all tracked dates (for history/analytics)
 */
export async function getAllTrackedDates(): Promise<string[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys
      .filter(key => key.startsWith(STORAGE_KEY_PREFIX))
      .map(key => key.replace(STORAGE_KEY_PREFIX, ''))
      .sort()
      .reverse(); // Most recent first
  } catch (error) {
    console.error('Error getting all tracked dates:', error);
    return [];
  }
}

/**
 * Clear all data (use with caution!)
 */
export async function clearAllData(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const trackerKeys = keys.filter(key => key.startsWith('habit_tracker_'));
    await AsyncStorage.multiRemove(trackerKeys);
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
}

/**
 * Export all data as JSON
 */
export async function exportAllData(): Promise<string> {
  try {
    const dates = await getAllTrackedDates();
    const data: Record<string, TrackerData> = {};

    for (const date of dates) {
      data[date] = await getTracker(date);
    }

    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
}

/**
 * Helper function to get day name from date string
 */
function getDayName(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}
