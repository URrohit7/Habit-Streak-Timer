import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TimeSlotCardProps {
  slot: any;
  index: number;
  onUpdate: (slot: any) => void;
  onDelete: () => void;
  onStartTimer: () => void;
  subjects: string[];
}

export default function TimeSlotCard({
  slot,
  index,
  onUpdate,
  onDelete,
  onStartTimer,
  subjects,
}: TimeSlotCardProps) {
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateField = (field: string, value: any) => {
    onUpdate({ ...slot, [field]: value });
  };

  const toggleCheckbox = (field: 'practice' | 'revision') => {
    onUpdate({ ...slot, [field]: !slot[field] });
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (slot.isBreak) {
    return (
      <View style={[styles.card, styles.breakCard]}>
        <View style={styles.breakHeader}>
          <Ionicons name="cafe" size={20} color="#f59e0b" />
          <TextInput
            style={styles.breakTimeInput}
            value={slot.timeRange}
            onChangeText={(text) => updateField('timeRange', text)}
            placeholder="Time"
          />
          <TextInput
            style={styles.breakLabelInput}
            value={slot.subject}
            onChangeText={(text) => updateField('subject', text)}
            placeholder="Break name"
          />
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header with Time and Timer Button */}
      <View style={styles.cardHeader}>
        <View style={styles.timeContainer}>
          <TextInput
            style={styles.timeInput}
            value={slot.timeRange}
            onChangeText={(text) => updateField('timeRange', text)}
            placeholder="9:00-10:30 AM"
          />
          {slot.timeSpent > 0 && (
            <Text style={styles.timeSpent}>⏱ {formatTime(slot.timeSpent)}</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.timerButton}
            onPress={onStartTimer}
          >
            <Ionicons name="play-circle" size={28} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteIconButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Subject */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>SUBJECT</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowSubjectPicker(true)}
        >
          <Text style={styles.pickerButtonText}>
            {slot.subject || 'Select or type subject'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Topic */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>TOPIC / CHAPTER</Text>
        <TextInput
          style={styles.fieldInput}
          value={slot.topic}
          onChangeText={(text) => updateField('topic', text)}
          placeholder="Enter topic or chapter"
          multiline
        />
      </View>

      {/* Practice & Revision Checkboxes */}
      <View style={styles.checkboxRow}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => toggleCheckbox('practice')}
        >
          <View style={[styles.checkbox, slot.practice && styles.checkboxChecked]}>
            {slot.practice && (
              <Ionicons name="checkmark" size={20} color="#10b981" />
            )}
          </View>
          <Text style={styles.checkboxLabel}>Practice</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => toggleCheckbox('revision')}
        >
          <View style={[styles.checkbox, slot.revision && styles.checkboxChecked]}>
            {slot.revision && (
              <Ionicons name="checkmark" size={20} color="#10b981" />
            )}
          </View>
          <Text style={styles.checkboxLabel}>Revision</Text>
        </TouchableOpacity>
      </View>

      {/* Notes */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>NOTES</Text>
        <TextInput
          style={[styles.fieldInput, styles.notesInput]}
          value={slot.notes}
          onChangeText={(text) => updateField('notes', text)}
          placeholder="Add notes..."
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Remarks (if any) */}
      {slot.remarks && (
        <View style={styles.remarksContainer}>
          <Text style={styles.remarksLabel}>Remarks:</Text>
          <Text style={styles.remarksText}>{slot.remarks}</Text>
        </View>
      )}

      {/* Subject Picker Modal */}
      <Modal
        visible={showSubjectPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSubjectPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Subject</Text>
              <TouchableOpacity onPress={() => setShowSubjectPicker(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.customSubjectInput}
              placeholder="Or type custom subject..."
              onChangeText={(text) => {
                updateField('subject', text);
              }}
              onSubmitEditing={() => setShowSubjectPicker(false)}
            />

            <FlatList
              data={subjects}
              keyExtractor={(item, idx) => idx.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.subjectItem}
                  onPress={() => {
                    updateField('subject', item);
                    setShowSubjectPicker(false);
                  }}
                >
                  <Text style={styles.subjectItemText}>{item}</Text>
                  {slot.subject === item && (
                    <Ionicons name="checkmark" size={20} color="#6366f1" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModal}>
            <Ionicons name="warning" size={48} color="#ef4444" />
            <Text style={styles.deleteTitle}>Delete Time Slot?</Text>
            <Text style={styles.deleteMessage}>
              Are you sure you want to delete this time slot?
            </Text>
            <View style={styles.deleteButtons}>
              <TouchableOpacity
                style={styles.cancelDeleteButton}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.cancelDeleteText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  breakCard: {
    backgroundColor: '#fef3c7',
    borderColor: '#fbbf24',
  },
  breakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  breakTimeInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(146, 64, 14, 0.3)',
    paddingVertical: 2,
    paddingHorizontal: 4,
    minWidth: 100,
  },
  breakLabel: {
    fontSize: 14,
    color: '#92400e',
  },
  breakLabelInput: {
    fontSize: 14,
    color: '#92400e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(146, 64, 14, 0.3)',
    paddingVertical: 2,
    paddingHorizontal: 4,
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timeContainer: {
    flex: 1,
  },
  timeInput: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 4,
  },
  timeSpent: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 4,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  timerButton: {
    padding: 4,
  },
  deleteIconButton: {
    padding: 4,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#f9fafb',
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#1f2937',
  },
  checkboxRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    borderColor: '#10b981',
    backgroundColor: '#d1fae5',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  remarksContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  remarksLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  remarksText: {
    fontSize: 14,
    color: '#78350f',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  customSubjectInput: {
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#eef2ff',
  },
  subjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  subjectItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  deleteTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  deleteMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  deleteButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelDeleteButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cancelDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  confirmDeleteButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
