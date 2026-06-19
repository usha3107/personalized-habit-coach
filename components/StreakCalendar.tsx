import React from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { getLocalDateString } from '../lib/streak';

interface StreakCalendarProps {
  completions: number[];
}

interface CalendarDay {
  id: string; // unique identifier
  date: Date | null;
  dayNumber: number | null;
  dateString: string | null;
  isCompleted: boolean;
  isToday: boolean;
}

export default function StreakCalendar({ completions }: StreakCalendarProps) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed

  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const totalDays = new Date(year, month + 1, 0).getDate();

  const calendarDays: CalendarDay[] = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push({
      id: `pad-${i}`,
      date: null,
      dayNumber: null,
      dateString: null,
      isCompleted: false,
      isToday: false,
    });
  }

  const completionDates = new Set(
    completions.map((timestamp) => getLocalDateString(new Date(timestamp)))
  );

  const todayStr = getLocalDateString(today);

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month, day);
    const dateStr = getLocalDateString(date);
    const isCompleted = completionDates.has(dateStr);
    const isToday = dateStr === todayStr;

    calendarDays.push({
      id: `day-${dateStr}`,
      date,
      dayNumber: day,
      dateString: dateStr,
      isCompleted,
      isToday,
    });
  }

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const renderDay = ({ item }: { item: CalendarDay }) => {
    if (!item.dateString) {
      return <View style={styles.dayCellEmpty} />;
    }

    const cellTestId = `day-cell-${item.dateString}`;

    return (
      <View
        data-testid={cellTestId}
        testID={cellTestId}
        style={[
          styles.dayCell,
          item.isCompleted && styles.dayCellCompleted,
          item.isToday && styles.dayCellToday,
        ]}
      >
        <Text
          style={[
            styles.dayText,
            item.isCompleted && styles.dayTextCompleted,
            item.isToday && styles.dayTextToday,
          ]}
        >
          {item.dayNumber}
        </Text>
        {item.isCompleted && <View style={styles.completedIndicator} />}
      </View>
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <View data-testid="calendar-heatmap-container" testID="calendar-heatmap-container" style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.monthTitle}>{monthNames[month]} {year}</Text>
        <Text style={styles.subtitle}>Completion History</Text>
      </View>

      {}
      <View style={styles.weekdaysContainer}>
        {weekdays.map((day, idx) => (
          <Text key={idx} style={styles.weekdayText}>
            {day}
          </Text>
        ))}
      </View>

      <FlatList
        data={calendarDays}
        renderItem={renderDay}
        keyExtractor={(item) => item.id}
        numColumns={7}
        scrollEnabled={false}
        contentContainerStyle={styles.grid}
      />
    </View>
  );
}

const { width } = Dimensions.get('window');
const cellWidth = Math.floor((width - 48 - 28) / 7); // Calculate cell size responsively

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginVertical: 12,
  },
  header: {
    marginBottom: 12,
  },
  monthTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 4,
  },
  weekdayText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    width: cellWidth,
    textAlign: 'center',
  },
  grid: {
    alignItems: 'center',
  },
  dayCell: {
    width: cellWidth,
    height: cellWidth,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  dayCellEmpty: {
    width: cellWidth,
    height: cellWidth,
    margin: 2,
    backgroundColor: 'transparent',
  },
  dayCellCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)', // Vibrant light green tint
    borderColor: '#10B981', // Solid green border
  },
  dayCellToday: {
    borderColor: '#6366F1', // Indigo border for today
    borderWidth: 1.5,
  },
  dayText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  dayTextCompleted: {
    color: '#34D399',
    fontWeight: '700',
  },
  dayTextToday: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  completedIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
    position: 'absolute',
    bottom: 4,
  },
});
