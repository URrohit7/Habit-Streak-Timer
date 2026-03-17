import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TimerState {
  isRunning: boolean;
  elapsedSeconds: number;
  timerName: string;
  date: string;
  timeSlotIndex: number;
  lapTimes: number[];
  startTime: Date | null;
  
  // Actions
  startTimer: (date: string, slotIndex: number, name: string) => void;
  stopTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  addLap: () => void;
  updateElapsed: (seconds: number) => void;
  loadTimer: () => Promise<void>;
  clearTimer: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isRunning: false,
  elapsedSeconds: 0,
  timerName: '',
  date: '',
  timeSlotIndex: -1,
  lapTimes: [],
  startTime: null,

  startTimer: (date: string, slotIndex: number, name: string) => {
    const state = {
      isRunning: true,
      elapsedSeconds: 0,
      timerName: name,
      date,
      timeSlotIndex: slotIndex,
      lapTimes: [],
      startTime: new Date(),
    };
    set(state);
    AsyncStorage.setItem('activeTimer', JSON.stringify(state));
  },

  stopTimer: () => {
    set({ isRunning: false });
    AsyncStorage.removeItem('activeTimer');
  },

  pauseTimer: () => {
    set({ isRunning: false });
    const state = get();
    AsyncStorage.setItem('activeTimer', JSON.stringify(state));
  },

  resumeTimer: () => {
    set({ isRunning: true, startTime: new Date() });
    const state = get();
    AsyncStorage.setItem('activeTimer', JSON.stringify(state));
  },

  resetTimer: () => {
    set({ elapsedSeconds: 0, lapTimes: [], startTime: new Date() });
    const state = get();
    AsyncStorage.setItem('activeTimer', JSON.stringify(state));
  },

  addLap: () => {
    const { elapsedSeconds, lapTimes } = get();
    set({ lapTimes: [...lapTimes, elapsedSeconds] });
    const state = get();
    AsyncStorage.setItem('activeTimer', JSON.stringify(state));
  },

  updateElapsed: (seconds: number) => {
    set({ elapsedSeconds: seconds });
  },

  loadTimer: async () => {
    try {
      const stored = await AsyncStorage.getItem('activeTimer');
      if (stored) {
        const timer = JSON.parse(stored);
        set({
          ...timer,
          startTime: timer.startTime ? new Date(timer.startTime) : null,
        });
      }
    } catch (error) {
      console.error('Failed to load timer:', error);
    }
  },

  clearTimer: () => {
    set({
      isRunning: false,
      elapsedSeconds: 0,
      timerName: '',
      date: '',
      timeSlotIndex: -1,
      lapTimes: [],
      startTime: null,
    });
    AsyncStorage.removeItem('activeTimer');
  },
}));
