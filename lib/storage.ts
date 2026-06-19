/**
 * Local Data Persistence with expo-sqlite
 *
 * Manages habits and completion timestamps using SQLite for
 * structured, persistent on-device storage.
 */
import * as SQLite from 'expo-sqlite';
import { Habit } from './types';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the database and create tables if they don't exist.
 */
export async function initDB(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('habitcoach.db');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '🎯',
      frequency TEXT NOT NULL DEFAULT 'daily',
      targetTime TEXT NOT NULL DEFAULT '09:00',
      notificationId TEXT,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habitId TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (habitId) REFERENCES habits(id) ON DELETE CASCADE
    );
  `);

  return db;
}

/**
 * Get all habits with their completions from the database.
 */
export async function getAllHabits(): Promise<Habit[]> {
  const database = await initDB();

  const habits = await database.getAllAsync<{
    id: string;
    name: string;
    icon: string;
    frequency: string;
    targetTime: string;
    notificationId: string | null;
    createdAt: number;
  }>('SELECT * FROM habits ORDER BY createdAt DESC');

  const result: Habit[] = [];

  for (const habit of habits) {
    const completions = await database.getAllAsync<{ timestamp: number }>(
      'SELECT timestamp FROM completions WHERE habitId = ? ORDER BY timestamp ASC',
      [habit.id]
    );

    result.push({
      id: habit.id,
      name: habit.name,
      icon: habit.icon,
      frequency: habit.frequency as 'daily',
      targetTime: habit.targetTime,
      notificationId: habit.notificationId,
      createdAt: habit.createdAt,
      completions: completions.map((c) => c.timestamp),
    });
  }

  return result;
}

/**
 * Save a new habit to the database.
 */
export async function saveHabit(habit: Habit): Promise<void> {
  const database = await initDB();
  await database.runAsync(
    'INSERT INTO habits (id, name, icon, frequency, targetTime, notificationId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      habit.id,
      habit.name,
      habit.icon,
      habit.frequency,
      habit.targetTime,
      habit.notificationId,
      habit.createdAt,
    ]
  );
}

/**
 * Delete a habit and its completions from the database.
 */
export async function deleteHabitFromDB(habitId: string): Promise<void> {
  const database = await initDB();
  await database.runAsync('DELETE FROM completions WHERE habitId = ?', [habitId]);
  await database.runAsync('DELETE FROM habits WHERE id = ?', [habitId]);
}

/**
 * Add a completion timestamp for a habit.
 */
export async function addCompletion(
  habitId: string,
  timestamp: number
): Promise<void> {
  const database = await initDB();
  await database.runAsync(
    'INSERT INTO completions (habitId, timestamp) VALUES (?, ?)',
    [habitId, timestamp]
  );
}

/**
 * Get all completion timestamps for a specific habit.
 */
export async function getCompletions(habitId: string): Promise<number[]> {
  const database = await initDB();
  const results = await database.getAllAsync<{ timestamp: number }>(
    'SELECT timestamp FROM completions WHERE habitId = ? ORDER BY timestamp ASC',
    [habitId]
  );
  return results.map((r) => r.timestamp);
}

/**
 * Update the notification ID for a habit.
 */
export async function updateNotificationId(
  habitId: string,
  notificationId: string | null
): Promise<void> {
  const database = await initDB();
  await database.runAsync(
    'UPDATE habits SET notificationId = ? WHERE id = ?',
    [notificationId, habitId]
  );
}

// Expose test hook globally
const g = (typeof globalThis !== 'undefined'
  ? globalThis
  : typeof window !== 'undefined'
  ? window
  : {}) as any;

g.getHabitCompletions = async (habitId: string): Promise<number[]> => {
  return await getCompletions(habitId);
};
g.window = g.window || g; // Ensure window is accessible even in node tests

