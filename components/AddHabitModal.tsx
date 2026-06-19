import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { name: string; icon: string; targetTime: string }) => Promise<void>;
}

const POPULAR_EMOJIS = ['🎯', '💧', '🏃‍♂️', '📖', '🧘‍♂️', '🍎', '💻', '🏋️‍♂️', '🛌', '🧹', '🎨', '🎸', '🥦', '☕'];

export default function AddHabitModal({ visible, onClose, onSave }: AddHabitModalProps) {
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎯');
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Habit name is required');
      return;
    }

    const hr = parseInt(hour, 10);
    const min = parseInt(minute, 10);

    if (isNaN(hr) || hr < 0 || hr > 23) {
      setError('Hour must be between 00 and 23');
      return;
    }

    if (isNaN(min) || min < 0 || min > 59) {
      setError('Minute must be between 00 and 59');
      return;
    }

    const formattedHour = String(hr).padStart(2, '0');
    const formattedMinute = String(min).padStart(2, '0');
    const targetTime = `${formattedHour}:${formattedMinute}`;

    setError('');
    await onSave({
      name: name.trim(),
      icon: selectedEmoji,
      targetTime,
    });

    setName('');
    setSelectedEmoji('🎯');
    setHour('09');
    setMinute('00');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>New Habit</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Habit Name</Text>
            <TextInput
              data-testid="habit-name-input"
              testID="habit-name-input"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError('');
              }}
              placeholder="e.g. Drink Water, Morning Yoga"
              placeholderTextColor="#64748B"
              style={styles.input}
            />

            <Text style={styles.label}>Choose an Icon</Text>
            <View style={styles.emojiContainer}>
              {POPULAR_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => setSelectedEmoji(emoji)}
                  style={[
                    styles.emojiButton,
                    selectedEmoji === emoji && styles.emojiButtonSelected,
                  ]}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Target Reminder Time</Text>
            <View style={styles.timePickerContainer}>
              <View style={styles.timeInputWrapper}>
                <TextInput
                  value={hour}
                  onChangeText={(text) => setHour(text.replace(/[^0-9]/g, '').slice(0, 2))}
                  keyboardType="number-pad"
                  placeholder="08"
                  placeholderTextColor="#64748B"
                  maxLength={2}
                  style={styles.timeInput}
                />
                <Text style={styles.timeLabel}>Hour (00-23)</Text>
              </View>

              <Text style={styles.timeColon}>:</Text>

              <View style={styles.timeInputWrapper}>
                <TextInput
                  value={minute}
                  onChangeText={(text) => setMinute(text.replace(/[^0-9]/g, '').slice(0, 2))}
                  keyboardType="number-pad"
                  placeholder="30"
                  placeholderTextColor="#64748B"
                  maxLength={2}
                  style={styles.timeInput}
                />
                <Text style={styles.timeLabel}>Minute (00-59)</Text>
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.actionsContainer}>
              <TouchableOpacity onPress={onClose} style={[styles.actionBtn, styles.cancelBtn]}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                data-testid="save-habit-button"
                testID="save-habit-button"
                onPress={handleSave}
                style={[styles.actionBtn, styles.saveBtn]}
              >
                <Text style={styles.saveBtnText}>Save Habit</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    color: '#94A3B8',
    fontSize: 18,
  },
  form: {
    padding: 20,
    marginBottom: 10,
  },
  label: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    color: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  emojiButtonSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderColor: '#6366F1',
  },
  emojiText: {
    fontSize: 22,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    gap: 12,
  },
  timeInputWrapper: {
    alignItems: 'center',
  },
  timeInput: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    color: '#F8FAFC',
    width: 70,
    height: 60,
    fontSize: 28,
    textAlign: 'center',
    fontWeight: '700',
  },
  timeLabel: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
  },
  timeColon: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '700',
    marginTop: -20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
    marginBottom: 40,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#6366F1',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
