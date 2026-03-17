import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [quote, setQuote] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    loadQuote();
  }, []);

  const loadQuote = async () => {
    try {
      // Get the "It's not too late" quote or random motivational quote
      const response = await fetch(`${BACKEND_URL}/api/quotes/random`);
      const data = await response.json();
      setQuote(data);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 3 seconds
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => onFinish());
      }, 3000);
    } catch (error) {
      console.error('Error loading splash quote:', error);
      onFinish();
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.appName}>TickFlow</Text>
        <Text style={styles.tagline}>Study Tracker</Text>
        {quote && (
          <View style={styles.quoteContainer}>
            <Text style={styles.quoteText}>"{quote.text}"</Text>
            <Text style={styles.quoteAuthor}>— {quote.author}</Text>
          </View>
        )}
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  appName: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 24,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 48,
  },
  quoteContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  quoteText: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 28,
    marginBottom: 12,
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'right',
    opacity: 0.9,
  },
});
