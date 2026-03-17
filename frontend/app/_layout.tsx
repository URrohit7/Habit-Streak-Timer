import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const HomeIcon = ({ color, size }: any) => (
  <Ionicons name="home" size={size} color={color} />
);

const CalendarIcon = ({ color, size }: any) => (
  <Ionicons name="calendar" size={size} color={color} />
);

const TimerIcon = ({ color, size }: any) => (
  <Ionicons name="timer" size={size} color={color} />
);

const QuotesIcon = ({ color, size }: any) => (
  <Ionicons name="bulb" size={size} color={color} />
);

const PomodoroIcon = ({ color, size }: any) => (
  <Text style={{ fontSize: size, lineHeight: size + 4 }}>🕯️</Text>
);

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: HomeIcon,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: CalendarIcon,
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          title: 'Timer',
          tabBarIcon: TimerIcon,
        }}
      />
      <Tabs.Screen
        name="quotes"
        options={{
          title: 'Quotes',
          tabBarIcon: QuotesIcon,
        }}
      />
      <Tabs.Screen
        name="pomodoro"
        options={{
          title: '',
          tabBarIcon: PomodoroIcon,
        }}
      />
    </Tabs>
  );
}
