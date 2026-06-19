import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useHabits } from '../context/HabitContext';
import { addCompletion, initDB } from '../lib/storage';
import { scheduleHabitNotification } from '../lib/notifications';
import * as Notifications from 'expo-notifications';

export default function DebuggerPanel() {
  const { habits, completeHabit } = useHabits();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [completionHour, setCompletionHour] = useState('08');
  const [daysAgo, setDaysAgo] = useState('0');

  const handleInjectCompletion = async () => {
    if (!selectedHabitId) {
      Alert.alert('Error', 'Please select a habit first');
      return;
    }

    const hr = parseInt(completionHour, 10);
    const ago = parseInt(daysAgo, 10);

    if (isNaN(hr) || hr < 0 || hr > 23) {
      Alert.alert('Error', 'Hour must be 0-23');
      return;
    }

    if (isNaN(ago) || ago < 0) {
      Alert.alert('Error', 'Days ago must be >= 0');
      return;
    }

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - ago);
    targetDate.setHours(hr, 0, 0, 0);
    const timestamp = targetDate.getTime();

    try {
      await addCompletion(selectedHabitId, timestamp);
      Alert.alert('Success', `Injected completion at ${completionHour}:00, ${daysAgo} days ago. Reload or complete another habit to sync state.`);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to inject completion');
    }
  };

  const handleTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Test Notification Successful!',
          body: 'Your notification system is working perfectly. Keep building habits!',
          sound: true,
        },
        trigger: null, // trigger immediately
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to trigger notification. Make sure permissions are granted.');
    }
  };

  const handleResetDB = async () => {
    Alert.alert(
      'Reset Database',
      'Are you sure you want to wipe all SQLite records? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await initDB();
              await db.execAsync(`
                DELETE FROM completions;
                DELETE FROM habits;
              `);
              Alert.alert('Success', 'Wiped database. Please reload the app.');
            } catch (e) {
              Alert.alert('Error', 'Failed to wipe database');
            }
          },
        },
      ]
    );
  };

  if (!isOpen) {
    return (
      <TouchableOpacity onPress={() => setIsOpen(true)} style={styles.collapsedBtn}>
        <Text style={styles.collapsedBtnText}>🛠️ Open Developer Debugger</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛠️ Developer Debug Panel</Text>
        <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>Collapse</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollBody} nestedScrollEnabled={true}>
        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Database Actions</Text>
          <TouchableOpacity onPress={handleResetDB} style={[styles.btn, styles.dangerBtn]}>
            <Text style={styles.btnText}>Wipe Database & Reset App</Text>
          </TouchableOpacity>
        </View>

        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          <TouchableOpacity onPress={handleTestNotification} style={[styles.btn, styles.successBtn]}>
            <Text style={styles.btnText}>Trigger Instant Test Notification</Text>
          </TouchableOpacity>
        </View>

        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inject Habit Completion (Simulate Stats)</Text>
          <Text style={styles.helpText}>
            Simulate completion events to train the optimal window algorithm (needs 5+ completions for non-cold-start calculation).
          </Text>

          {habits.length === 0 ? (
            <Text style={styles.warningText}>No habits found. Create a habit first.</Text>
          ) : (
            <View style={styles.form}>
              <Text style={styles.label}>Select Habit:</Text>
              <ScrollView horizontal={true} style={styles.habitSelector}>
                {habits.map((h) => (
                  <TouchableOpacity
                    key={h.id}
                    onPress={() => setSelectedHabitId(h.id)}
                    style={[
                      styles.selectorItem,
                      selectedHabitId === h.id && styles.selectorItemSelected,
                    ]}
                  >
                    <Text style={styles.selectorText}>{h.icon} {h.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.row}>
                <View style={styles.inputCol}>
                  <Text style={styles.label}>Hour (0-23):</Text>
                  <TextInput
                    value={completionHour}
                    onChangeText={setCompletionHour}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={styles.textInput}
                  />
                </View>
                <View style={styles.inputCol}>
                  <Text style={styles.label}>Days Ago:</Text>
                  <TextInput
                    value={daysAgo}
                    onChangeText={setDaysAgo}
                    keyboardType="number-pad"
                    style={styles.textInput}
                  />
                </View>
              </View>

              <TouchableOpacity onPress={handleInjectCompletion} style={[styles.btn, styles.primaryBtn]}>
                <Text style={styles.btnText}>Inject Completion</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  collapsedBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  collapsedBtnText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 14,
  },
  container: {
    backgroundColor: '#0F172A',
    borderTopWidth: 1.5,
    borderColor: '#6366F1',
    maxHeight: 350,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
  },
  closeBtnText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollBody: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 16,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  btn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: '#6366F1',
  },
  dangerBtn: {
    backgroundColor: '#EF4444',
  },
  successBtn: {
    backgroundColor: '#10B981',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  helpText: {
    color: '#64748B',
    fontSize: 11,
    marginBottom: 8,
  },
  warningText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  form: {
    marginTop: 8,
  },
  habitSelector: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  selectorItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectorItemSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  selectorText: {
    color: '#F8FAFC',
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputCol: {
    flex: 1,
  },
  label: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    color: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontSize: 14,
  },
});
