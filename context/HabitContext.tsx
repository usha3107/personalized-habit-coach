/**
 * Habit Context — Global State Management
 *
 * Uses React Context + useReducer for state management.
 * Auto-syncs all mutations to SQLite and triggers notification rescheduling.
 */
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Habit, HabitAction, HabitContextType, HabitFormData } from '../lib/types';
import {
  initDB,
  getAllHabits,
  saveHabit,
  deleteHabitFromDB,
  addCompletion,
} from '../lib/storage';
import {
  scheduleHabitNotification,
  cancelHabitNotification,
  rescheduleHabitNotification,
} from '../lib/notifications';
import { trackCompletion } from '../lib/api';

function generateId(): string {
  return 'habit-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

function habitReducer(state: Habit[], action: HabitAction): Habit[] {
  switch (action.type) {
    case 'LOAD_HABITS':
      return action.habits;

    case 'ADD_HABIT':
      return [action.habit, ...state];

    case 'DELETE_HABIT':
      return state.filter((h) => h.id !== action.id);

    case 'COMPLETE_HABIT':
      return state.map((h) =>
        h.id === action.id
          ? { ...h, completions: [...h.completions, action.timestamp] }
          : h
      );

    case 'UPDATE_NOTIFICATION_ID':
      return state.map((h) =>
        h.id === action.id
          ? { ...h, notificationId: action.notificationId }
          : h
      );

    default:
      return state;
  }
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export function HabitProvider({ children }: { children: React.ReactNode }) {
  const [habits, dispatch] = useReducer(habitReducer, []);

  // Load habits from database on mount
  useEffect(() => {
    async function loadHabits() {
      try {
        await initDB();
        const storedHabits = await getAllHabits();
        dispatch({ type: 'LOAD_HABITS', habits: storedHabits });
      } catch (error) {
        console.error('Failed to load habits:', error);
      }
    }
    loadHabits();
  }, []);

  const addHabitFn = useCallback(async (data: HabitFormData) => {
    const newHabit: Habit = {
      id: generateId(),
      name: data.name,
      icon: data.icon || '🎯',
      frequency: 'daily',
      targetTime: data.targetTime || '09:00',
      completions: [],
      notificationId: null,
      createdAt: Date.now(),
    };

    // Save to database
    await saveHabit(newHabit);

    // Schedule notification
    const notifId = await scheduleHabitNotification(newHabit);
    newHabit.notificationId = notifId;

    // Update state
    dispatch({ type: 'ADD_HABIT', habit: newHabit });
  }, []);

  const deleteHabitFn = useCallback(async (id: string) => {
    // Find the habit to cancel its notification
    const habit = habits.find((h) => h.id === id);
    if (habit) {
      await cancelHabitNotification(habit);
    }

    // Delete from database
    await deleteHabitFromDB(id);

    // Update state
    dispatch({ type: 'DELETE_HABIT', id });
  }, [habits]);

  const completeHabitFn = useCallback(async (id: string) => {
    const timestamp = Date.now();

    // Save completion to database
    await addCompletion(id, timestamp);

    // Update state
    dispatch({ type: 'COMPLETE_HABIT', id, timestamp });

    // Find the updated habit for rescheduling
    const habit = habits.find((h) => h.id === id);
    if (habit) {
      const updatedHabit = {
        ...habit,
        completions: [...habit.completions, timestamp],
      };

      // Reschedule notification with new data
      const newNotifId = await rescheduleHabitNotification(updatedHabit);
      if (newNotifId) {
        dispatch({ type: 'UPDATE_NOTIFICATION_ID', id, notificationId: newNotifId });
      }

      // Track anonymized completion on backend
      const completionHour = new Date(timestamp).getHours();
      trackCompletion(habit.name, completionHour).catch(() => {});
    }
  }, [habits]);

  const getHabitCompletions = useCallback((habitId: string): number[] => {
    const habit = habits.find((h) => h.id === habitId);
    return habit ? habit.completions : [];
  }, [habits]);

  return (
    <HabitContext.Provider
      value={{
        habits,
        addHabit: addHabitFn,
        deleteHabit: deleteHabitFn,
        completeHabit: completeHabitFn,
        getHabitCompletions,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits(): HabitContextType {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
}
