import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Habit } from '../lib/types';
import { calculateStreak, getCompletionRate } from '../lib/streak';
import { calculateOptimalWindow } from '../lib/algorithm';
import { getStats } from '../lib/api';
import StreakCalendar from './StreakCalendar';

interface AnalyticsModalProps {
  visible: boolean;
  habit: Habit | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

export default function AnalyticsModal({ visible, habit, onClose, onDelete }: AnalyticsModalProps) {
  const [communityStats, setCommunityStats] = useState<{
    totalCompletions: number;
    completionsByHour: Record<string, number>;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (visible && habit) {
      setLoadingStats(true);
      getStats(habit.name)
        .then((res) => {
          if (res) {
            setCommunityStats({
              totalCompletions: res.totalCompletions,
              completionsByHour: res.completionsByHour,
            });
          } else {
            setCommunityStats(null);
          }
        })
        .catch(() => {
          setCommunityStats(null);
        })
        .finally(() => {
          setLoadingStats(false);
        });
    }
  }, [visible, habit]);

  if (!habit) return null;

  const streak = calculateStreak(habit.completions);
  const completionRate = getCompletionRate(habit.completions, habit.createdAt);
  const optimalMinutes = calculateOptimalWindow(habit.completions, habit.targetTime);

  const formatMinutes = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const optimalTimeFormatted = formatMinutes(optimalMinutes);

  const userHourlyCounts: Record<number, number> = {};
  for (let i = 0; i < 24; i++) userHourlyCounts[i] = 0;
  habit.completions.forEach((ts) => {
    const hour = new Date(ts).getHours();
    userHourlyCounts[hour] = (userHourlyCounts[hour] || 0) + 1;
  });

  const totalUserCompletions = habit.completions.length;

  const activeHours: number[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const userCount = userHourlyCounts[hour] || 0;
    const communityCount = communityStats ? Number(communityStats.completionsByHour[String(hour)] || 0) : 0;
    if (userCount > 0 || communityCount > 0) {
      activeHours.push(hour);
    }
  }

  activeHours.sort((a, b) => {
    const aUser = userHourlyCounts[a] || 0;
    const bUser = userHourlyCounts[b] || 0;
    if (bUser !== aUser) return bUser - aUser;
    return a - b;
  });

  const chartHours = activeHours.slice(0, 5);

  const maxVal = Math.max(
    ...chartHours.map((h) => {
      const uVal = totalUserCompletions > 0 ? ((userHourlyCounts[h] || 0) / totalUserCompletions) * 100 : 0;
      const cVal =
        communityStats && communityStats.totalCompletions > 0
          ? (Number(communityStats.completionsByHour[String(h)] || 0) / communityStats.totalCompletions) * 100
          : 0;
      return Math.max(uVal, cVal);
    }),
    1 // avoid division by zero
  );

  const handleDelete = async () => {
    await onDelete(habit.id);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleWrapper}>
              <Text style={styles.icon}>{habit.icon}</Text>
              <View>
                <Text style={styles.name}>{habit.name}</Text>
                <Text style={styles.targetTime}>Target: {habit.targetTime}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Current Streak</Text>
                <Text style={styles.metricValue}>🔥 {streak} {streak === 1 ? 'day' : 'days'}</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Completion Rate</Text>
                <Text style={styles.metricValue}>📈 {completionRate}%</Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Check-ins</Text>
                <Text style={styles.metricValue}>✅ {totalUserCompletions}</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Optimal Window</Text>
                <Text style={styles.metricValue}>⏰ {optimalTimeFormatted}</Text>
                <Text style={styles.metricSubtext}>
                  {habit.completions.length < 5 ? 'Cold Start (Target)' : 'Auto-calculated'}
                </Text>
              </View>
            </View>

            {}
            <StreakCalendar completions={habit.completions} />

            {}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Completion Hours vs. Community</Text>
              <Text style={styles.chartSubtitle}>
                Comparing the hours you complete this habit versus the aggregate peak hours.
              </Text>

              {loadingStats ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="small" color="#6366F1" />
                </View>
              ) : chartHours.length === 0 ? (
                <View style={styles.noChartData}>
                  <Text style={styles.noChartDataText}>
                    No completion history yet. Complete this habit to train stats.
                  </Text>
                </View>
              ) : (
                <View style={styles.chartBody}>
                  {}
                  <View style={styles.legend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendIndicator, { backgroundColor: '#6366F1' }]} />
                      <Text style={styles.legendLabel}>You</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendIndicator, { backgroundColor: '#10B981' }]} />
                      <Text style={styles.legendLabel}>Community</Text>
                    </View>
                  </View>

                  {}
                  {chartHours.map((h) => {
                    const userPct = totalUserCompletions > 0 ? ((userHourlyCounts[h] || 0) / totalUserCompletions) * 100 : 0;
                    const commPct =
                      communityStats && communityStats.totalCompletions > 0
                        ? (Number(communityStats.completionsByHour[String(h)] || 0) / communityStats.totalCompletions) * 100
                        : 0;

                    const userBarWidth = `${(userPct / maxVal) * 80}%`;
                    const commBarWidth = `${(commPct / maxVal) * 80}%`;

                    const hourStr = `${String(h).padStart(2, '0')}:00`;

                    return (
                      <View key={h} style={styles.chartRow}>
                        <Text style={styles.rowHourLabel}>{hourStr}</Text>
                        <View style={styles.rowBarsContainer}>
                          {}
                          <View style={styles.barWrapper}>
                            <View style={[styles.bar, styles.userBar, { width: userBarWidth as any }]} />
                            <Text style={styles.barPctText}>{Math.round(userPct)}%</Text>
                          </View>
                          {}
                          <View style={styles.barWrapper}>
                            <View style={[styles.bar, styles.commBar, { width: commBarWidth as any }]} />
                            <Text style={styles.barPctText}>{Math.round(commPct)}%</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {}
            <TouchableOpacity
              data-testid="delete-habit-button"
              testID="delete-habit-button"
              onPress={handleDelete}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>Delete Habit</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 32,
  },
  name: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
  },
  targetTime: {
    color: '#94A3B8',
    fontSize: 12,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 18,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  metricSubtext: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 12,
  },
  chartTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  chartSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  loaderContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noChartData: {
    padding: 20,
    alignItems: 'center',
  },
  noChartDataText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
  chartBody: {
    gap: 12,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowHourLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    width: 45,
  },
  rowBarsContainer: {
    flex: 1,
    gap: 4,
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    height: 8,
    borderRadius: 4,
  },
  userBar: {
    backgroundColor: '#6366F1',
  },
  commBar: {
    backgroundColor: '#10B981',
  },
  barPctText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
