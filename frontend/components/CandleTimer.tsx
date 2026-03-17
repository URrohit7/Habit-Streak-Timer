import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

export default function CandleTimer() {
  const [duration, setDuration] = useState(25); // Default 25 minutes
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(true); // Show settings first
  const [candleHeight] = useState(new Animated.Value(1));
  const [flameOpacity] = useState(new Animated.Value(1));

  useEffect(() => {
    let interval: any;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            finishTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      const progress = timeLeft / (duration * 60);
      Animated.timing(candleHeight, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [timeLeft, isRunning]);

  const startTimer = () => {
    setTimeLeft(duration * 60);
    setIsRunning(true);
    setShowSettings(false);
    candleHeight.setValue(1);
    flameOpacity.setValue(1);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(0);
    candleHeight.setValue(1);
  };

  const finishTimer = () => {
    // Flame goes out animation
    Animated.sequence([
      Animated.timing(flameOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const candleHeightInterpolated = candleHeight.interpolate({
    inputRange: [0, 1],
    outputRange: ['10%', '70%'],
  });

  return (
    <LinearGradient
      colors={['#1a1a2e', '#0f3460', '#16213e']}
      style={styles.container}
    >
      <Text style={styles.title}>🕯️ Pomodoro Candle</Text>
      <Text style={styles.subtitle}>Focus with the flame</Text>

      {/* Candle Display */}
      <View style={styles.candleContainer}>
        {/* Flame */}
        {(isRunning || timeLeft > 0) && (
          <Animatable.View
            animation={isRunning ? "pulse" : undefined}
            iterationCount="infinite"
            duration={1000}
            style={[styles.flameContainer, { opacity: flameOpacity }]}
          >
            <LinearGradient
              colors={['#ff6b35', '#f7931e', '#ffd700']}
              style={styles.flame}
            >
              <Text style={styles.flameEmoji}>🔥</Text>
            </LinearGradient>
          </Animatable.View>
        )}

        {/* Candle Body */}
        <Animated.View style={[styles.candle, { height: candleHeightInterpolated }]}>
          <LinearGradient
            colors={['#ffeaa7', '#fdcb6e', '#e17055']}
            style={styles.candleGradient}
          >
            {/* Melting wax effect */}
            <View style={styles.meltingWax} />
          </LinearGradient>
        </Animated.View>

        {/* Candle Base */}
        <View style={styles.candleBase} />
      </View>

      {/* Timer Display */}
      <View style={styles.timerDisplay}>
        <Text style={styles.timerText}>
          {timeLeft > 0 ? formatTime(timeLeft) : `${duration}:00`}
        </Text>
        <Text style={styles.timerLabel}>
          {timeLeft > 0 ? 'Time Remaining' : 'Ready to Focus'}
        </Text>
      </View>

      {/* Controls */}
      {!showSettings ? (
        <View style={styles.controls}>
          {!isRunning && timeLeft === 0 && (
            <TouchableOpacity style={styles.startButton} onPress={startTimer}>
              <Ionicons name="play" size={32} color="#fff" />
              <Text style={styles.buttonText}>Light the Candle</Text>
            </TouchableOpacity>
          )}

          {isRunning && (
            <>
              <TouchableOpacity style={styles.controlButton} onPress={pauseTimer}>
                <Ionicons name="pause" size={28} color="#f59e0b" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={resetTimer}>
                <Ionicons name="stop" size={28} color="#ef4444" />
              </TouchableOpacity>
            </>
          )}

          {!isRunning && timeLeft > 0 && (
            <>
              <TouchableOpacity style={styles.startButton} onPress={() => setIsRunning(true)}>
                <Ionicons name="play" size={28} color="#fff" />
                <Text style={styles.buttonText}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={resetTimer}>
                <Ionicons name="refresh" size={24} color="#6b7280" />
              </TouchableOpacity>
            </>
          )}

          {!isRunning && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowSettings(true)}
            >
              <Ionicons name="settings" size={24} color="#6366f1" />
              <Text style={styles.settingsText}>Customize Timer</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.settingsPanel}>
          <Text style={styles.settingsTitle}>Set Timer Duration</Text>
          <View style={styles.presetButtons}>
            {[15, 25, 30, 45, 60].map((min) => (
              <TouchableOpacity
                key={min}
                style={[
                  styles.presetButton,
                  duration === min && styles.presetButtonActive,
                ]}
                onPress={() => setDuration(min)}
              >
                <Text
                  style={[
                    styles.presetButtonText,
                    duration === min && styles.presetButtonTextActive,
                  ]}
                >
                  {min}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.customInput}>
            <Text style={styles.inputLabel}>Custom (minutes):</Text>
            <TextInput
              style={styles.input}
              value={duration.toString()}
              onChangeText={(text) => {
                const num = parseInt(text) || 0;
                if (num > 0 && num <= 180) setDuration(num);
              }}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => setShowSettings(false)}
          >
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info */}
      <Text style={styles.infoText}>
        💡 Focus deeply while the candle burns
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#d1d5db',
    marginBottom: 40,
  },
  candleContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 400,
    marginBottom: 40,
  },
  flameContainer: {
    marginBottom: -10,
    zIndex: 10,
  },
  flame: {
    width: 60,
    height: 80,
    borderRadius: 30,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flameEmoji: {
    fontSize: 40,
  },
  candle: {
    width: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  candleGradient: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  meltingWax: {
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
  },
  candleBase: {
    width: 100,
    height: 20,
    backgroundColor: '#8B4513',
    borderRadius: 10,
    marginTop: 5,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  settingsText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsPanel: {
    width: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 20,
  },
  presetButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#8b5cf6',
  },
  presetButtonText: {
    color: '#d1d5db',
    fontSize: 16,
    fontWeight: '600',
  },
  presetButtonTextActive: {
    color: '#fff',
  },
  customInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  inputLabel: {
    color: '#d1d5db',
    fontSize: 16,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  infoText: {
    position: 'absolute',
    bottom: 40,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
