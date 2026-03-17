import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import CandleTimer from '../components/CandleTimer';

export default function PomodoroScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CandleTimer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
