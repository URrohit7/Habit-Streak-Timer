import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import * as Animatable from 'react-native-animatable';

export default function StreakAnimation({ streak, onComplete }: { streak: number; onComplete: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Flame burst animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.5,
        tension: 20,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Auto dismiss
    setTimeout(onComplete, 2500);
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.overlay}>
      <Animatable.View
        animation="bounceIn"
        duration={1000}
        style={styles.container}
      >
        <Animated.Text
          style={[
            styles.flame,
            {
              transform: [{ scale: scaleAnim }, { rotate }],
            },
          ]}
        >
          🔥
        </Animated.Text>
        <Animatable.Text
          animation="fadeInUp"
          delay={300}
          style={styles.streakNumber}
        >
          {streak}
        </Animatable.Text>
        <Animatable.Text
          animation="fadeInUp"
          delay={500}
          style={styles.streakText}
        >
          DAY STREAK!
        </Animatable.Text>
        <Animatable.Text
          animation="pulse"
          iterationCount="infinite"
          style={styles.message}
        >
          Keep the fire burning! 🔥
        </Animatable.Text>
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#ff6b35',
  },
  flame: {
    fontSize: 120,
    marginBottom: 20,
  },
  streakNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  streakText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
});
