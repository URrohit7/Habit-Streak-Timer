import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Quote {
  text: string;
  author: string;
  category: string;
}

export default function QuotesScreen() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [readIndices, setReadIndices] = useState<number[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'read'>('all');
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadQuotes();
    loadReadStatus();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const dailyResponse = await fetch(`${BACKEND_URL}/api/quotes/daily`);
      const daily = await dailyResponse.json();
      setDailyQuote(daily);

      const allResponse = await fetch(`${BACKEND_URL}/api/quotes/all`);
      const all = await allResponse.json();
      setQuotes(all);
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReadStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/quotes/read`);
      const data = await response.json();
      setReadIndices(data.readIndices || []);
    } catch (error) {
      console.error('Error loading read status:', error);
    }
  };

  const toggleReadStatus = async (index: number) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/quotes/read/${index}`, {
        method: 'POST',
      });
      const data = await response.json();
      setReadIndices(data.readIndices || []);
    } catch (error) {
      console.error('Error toggling read status:', error);
    }
  };

  const handleShare = async (quote: Quote) => {
    try {
      await Share.share({
        message: `"${quote.text}"\n\n— ${quote.author}`,
      });
    } catch (error) {
      console.error('Error sharing quote:', error);
    }
  };

  const getRandomQuote = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/quotes/random`);
      const quote = await response.json();
      setDailyQuote(quote);
      
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Error getting random quote:', error);
    }
  };

  const getFilteredQuotes = () => {
    if (filterMode === 'read') {
      return quotes.filter((_, index) => readIndices.includes(index));
    }
    if (filterMode === 'unread') {
      return quotes.filter((_, index) => !readIndices.includes(index));
    }
    return quotes;
  };

  const filteredQuotes = getFilteredQuotes();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading inspiration...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="bulb" size={28} color="#f59e0b" />
          <Text style={styles.title}>Daily Motivation</Text>
        </View>

        {/* Daily Quote Card */}
        {dailyQuote && (
          <Animated.View style={[styles.featuredCard, { opacity: fadeAnim }]}>
            <View style={styles.featuredHeader}>
              <View style={styles.dailyBadge}>
                <Ionicons name="star" size={16} color="#f59e0b" />
                <Text style={styles.dailyBadgeText}>Quote of the Day</Text>
              </View>
              <TouchableOpacity onPress={getRandomQuote}>
                <Ionicons name="refresh" size={24} color="#6366f1" />
              </TouchableOpacity>
            </View>
            <Text style={styles.featuredText}>"{dailyQuote.text}"</Text>
            <Text style={styles.featuredAuthor}>— {dailyQuote.author}</Text>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => handleShare(dailyQuote)}
            >
              <Ionicons name="share-social" size={20} color="#6366f1" />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, filterMode === 'all' && styles.filterTabActive]}
            onPress={() => setFilterMode('all')}
          >
            <Text style={[styles.filterTabText, filterMode === 'all' && styles.filterTabTextActive]}>
              All ({quotes.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterMode === 'unread' && styles.filterTabActive]}
            onPress={() => setFilterMode('unread')}
          >
            <Text style={[styles.filterTabText, filterMode === 'unread' && styles.filterTabTextActive]}>
              Unread ({quotes.length - readIndices.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterMode === 'read' && styles.filterTabActive]}
            onPress={() => setFilterMode('read')}
          >
            <Text style={[styles.filterTabText, filterMode === 'read' && styles.filterTabTextActive]}>
              Read ({readIndices.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* All Quotes List */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {filterMode === 'all' ? 'All Quotes' : filterMode === 'read' ? 'Read Quotes' : 'Unread Quotes'}
          </Text>
          <Text style={styles.listSubtitle}>{filteredQuotes.length} quotes</Text>
        </View>

        <FlashList
          data={filteredQuotes}
          estimatedItemSize={150}
          keyExtractor={(item, index) => `${item.author}-${index}`}
          renderItem={({ item, index: filteredIndex }) => {
            // Find the original index in the full quotes array
            const originalIndex = quotes.findIndex(
              (q) => q.text === item.text && q.author === item.author
            );
            const isRead = readIndices.includes(originalIndex);
            
            return (
              <View style={[styles.quoteCard, isRead && styles.quoteCardRead]}>
                <View style={styles.quoteCardHeader}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.readButton, isRead && styles.readButtonActive]}
                    onPress={() => toggleReadStatus(originalIndex)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={isRead ? 'checkmark-circle' : 'checkmark-circle-outline'}
                      size={24}
                      color={isRead ? '#10b981' : '#d1d5db'}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.quoteText, isRead && styles.quoteTextRead]}>
                  "{item.text}"
                </Text>
                <View style={styles.quoteFooter}>
                  <Text style={styles.authorText}>— {item.author}</Text>
                  <TouchableOpacity onPress={() => handleShare(item)}>
                    <Ionicons name="share-social-outline" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
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
  featuredCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dailyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dailyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  featuredText: {
    fontSize: 20,
    lineHeight: 32,
    color: '#1f2937',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  featuredAuthor: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'right',
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#6366f1',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  listSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  quoteCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quoteCardRead: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  quoteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
  },
  readButton: {
    padding: 4,
  },
  readButtonActive: {},
  quoteText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  quoteTextRead: {
    color: '#4b5563',
  },
  quoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});
