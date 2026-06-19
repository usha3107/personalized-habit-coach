import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { HabitProvider, useHabits } from './context/HabitContext';
import { setupNotifications } from './lib/notifications';
import { calculateStreak, isCompletedToday } from './lib/streak';
import { calculateOptimalWindow } from './lib/algorithm';
import AddHabitModal from './components/AddHabitModal';
import AnalyticsModal from './components/AnalyticsModal';
import DebuggerPanel from './components/DebuggerPanel';

function Dashboard() {
  const { habits, addHabit, completeHabit, deleteHabit } = useHabits();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedHabitForAnalytics, setSelectedHabitForAnalytics] = useState<any | null>(null);

  useEffect(() => {
    setupNotifications().then((granted) => {
      if (!granted) {
        console.log('Push notifications permissions denied or unavailable');
      }
    });
  }, []);

  const totalHabits = habits.length;
  const completedTodayCount = habits.filter((h) => isCompletedToday(h.completions)).length;

  const maxStreak = habits.reduce((max, h) => {
    const s = calculateStreak(h.completions);
    return s > max ? s : max;
  }, 0);

  const completionRateToday = totalHabits > 0 ? Math.round((completedTodayCount / totalHabits) * 100) : 0;

  const formatMinutes = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const handleCompleteHabit = async (id: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await completeHabit(id);
    } catch (e) {
      console.warn('Completion failed:', e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        {}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>Habit Coach</Text>
            <Text style={styles.headerSubtitle}>Optimize your daily rhythms</Text>
          </View>
          <TouchableOpacity
            data-testid="add-habit-button"
            testID="add-habit-button"
            onPress={() => setAddModalVisible(true)}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Today's Target</Text>
              <Text style={styles.statVal}>
                {completedTodayCount}/{totalHabits}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Highest Streak</Text>
              <Text style={styles.statVal}>🔥 {maxStreak}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Completion</Text>
              <Text style={styles.statVal}>{completionRateToday}%</Text>
            </View>
          </View>
        </View>

        {}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Your Habits</Text>

          {habits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🎯</Text>
              <Text style={styles.emptyStateTitle}>No habits yet</Text>
              <Text style={styles.emptyStateText}>
                Tap the "+ Add" button at the top to configure your first habit.
              </Text>
            </View>
          ) : (
            <View data-testid="habit-list" testID="habit-list" style={styles.habitList}>
              {habits.map((habit) => {
                const doneToday = isCompletedToday(habit.completions);
                const optimalMin = calculateOptimalWindow(habit.completions, habit.targetTime);
                const optimalFormatted = formatMinutes(optimalMin);
                const habitStreak = calculateStreak(habit.completions);

                return (
                  <TouchableOpacity
                    key={habit.id}
                    data-testid={`habit-item-${habit.id}`}
                    testID={`habit-item-${habit.id}`}
                    onPress={() => setSelectedHabitForAnalytics(habit)}
                    style={[styles.habitItem, doneToday && styles.habitItemDone]}
                  >
                    <View style={styles.habitMeta}>
                      <Text style={styles.habitIcon}>{habit.icon}</Text>
                      <View style={styles.habitDetails}>
                        <Text style={styles.habitName}>{habit.name}</Text>
                        <View style={styles.habitSubDetails}>
                          <Text style={styles.habitTarget}>⏰ Target: {habit.targetTime}</Text>
                          <Text style={styles.habitOptimal}>• Smart Nudge: {optimalFormatted}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.habitActions}>
                      {habitStreak > 0 ? (
                        <Text style={styles.habitStreakText}>🔥 {habitStreak}</Text>
                      ) : null}

                      <TouchableOpacity
                        onPress={() => !doneToday && handleCompleteHabit(habit.id)}
                        disabled={doneToday}
                        style={[styles.checkButton, doneToday && styles.checkButtonCompleted]}
                      >
                        <Text style={styles.checkButtonText}>{doneToday ? '✓' : ''}</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {}
        <AddHabitModal
          visible={addModalVisible}
          onClose={() => setAddModalVisible(false)}
          onSave={addHabit}
        />

        {}
        <AnalyticsModal
          visible={selectedHabitForAnalytics !== null}
          habit={selectedHabitForAnalytics}
          onClose={() => setSelectedHabitForAnalytics(null)}
          onDelete={deleteHabit}
        />

        {}
        <DebuggerPanel />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <HabitProvider>
      <Dashboard />
    </HabitProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090D16', // Sleek deep space/dark background
  },
  container: {
    flex: 1,
    paddingTop: RNStatusBar.currentHeight || 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerGreeting: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#6366F1', // Premium indigo accent
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  statsCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)', // Transparent glass style
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginVertical: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: 'rgba(30, 41, 59, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyStateIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyStateTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyStateText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 30,
    marginTop: 6,
    lineHeight: 18,
  },
  habitList: {
    gap: 12,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 14,
  },
  habitItemDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  habitIcon: {
    fontSize: 26,
  },
  habitDetails: {
    flex: 1,
  },
  habitName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  habitSubDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  habitTarget: {
    color: '#94A3B8',
    fontSize: 12,
  },
  habitOptimal: {
    color: '#6366F1',
    fontSize: 11,
    fontWeight: '500',
  },
  habitActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  habitStreakText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '700',
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkButtonCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
