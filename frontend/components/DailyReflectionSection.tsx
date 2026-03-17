import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DailyReflectionSectionProps {
  reflection: any;
  onUpdate: (field: string, value: any) => void;
}

export default function DailyReflectionSection({
  reflection,
  onUpdate,
}: DailyReflectionSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const fields = [
    { key: 'revisionsCompleted', label: "Today's Revisions Completed" },
    { key: 'topicsToRevise', label: 'Topics To Revise Tomorrow' },
    { key: 'nextDayPlan', label: 'Next Day Study Plan' },
    { key: 'weakAreas', label: 'Weak Areas / Improvements' },
    { key: 'syllabusCovered', label: 'Syllabus Covered Today' },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="book" size={20} color="#6366f1" />
          <Text style={styles.title}>Daily Reflection</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#6b7280"
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          {fields.map((field) => (
            <View key={field.key} style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <TextInput
                style={styles.fieldInput}
                value={reflection?.[field.key] || ''}
                onChangeText={(text) => onUpdate(field.key, text)}
                placeholder={`Enter ${field.label.toLowerCase()}...`}
                multiline
                numberOfLines={2}
              />
            </View>
          ))}

          {/* Productivity Slider */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Overall Productivity (1-10)</Text>
            <View style={styles.productivityContainer}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.productivityButton,
                    reflection?.productivity === num && styles.productivityButtonActive,
                  ]}
                  onPress={() => onUpdate('productivity', num)}
                >
                  <Text
                    style={[
                      styles.productivityText,
                      reflection?.productivity === num && styles.productivityTextActive,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f9fafb',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  productivityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  productivityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  productivityButtonActive: {
    borderColor: '#6366f1',
    backgroundColor: '#6366f1',
  },
  productivityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  productivityTextActive: {
    color: '#ffffff',
  },
});
