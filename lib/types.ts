/**
 * Core type definitions for the Personalized Habit Coach app
 */

export interface Habit {
  id: string;
  name: string;
  icon: string;
  frequency: 'daily';
  targetTime: string; // HH:MM format (e.g., '08:30')
  completions: number[]; // Array of Unix timestamps (milliseconds)
  notificationId: string | null;
  createdAt: number; // Unix timestamp (milliseconds)
}

export interface HabitFormData {
  name: string;
  icon: string;
  targetTime: string;
}

export type HabitAction =
  | { type: 'LOAD_HABITS'; habits: Habit[] }
  | { type: 'ADD_HABIT'; habit: Habit }
  | { type: 'DELETE_HABIT'; id: string }
  | { type: 'COMPLETE_HABIT'; id: string; timestamp: number }
  | { type: 'UPDATE_NOTIFICATION_ID'; id: string; notificationId: string | null };

export interface HabitContextType {
  habits: Habit[];
  addHabit: (data: HabitFormData) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  completeHabit: (id: string) => Promise<void>;
  getHabitCompletions: (habitId: string) => number[];
}

/** Stats response from the backend API */
export interface HabitStatsResponse {
  habitName: string;
  totalCompletions: number;
  completionsByHour: Record<string, number>;
}
