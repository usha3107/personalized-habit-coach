/**
 * API client for the Hono backend
 *
 * Handles anonymized data sync for social proof features.
 */
import { HabitStatsResponse } from './types';

// Default to localhost for development
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

/**
 * Track a habit completion on the backend (anonymized).
 * Sends only the habit name and completion hour.
 */
export async function trackCompletion(
  habitName: string,
  completionHour: number
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        habitName,
        completionHour,
      }),
    });

    if (!response.ok) {
      console.warn('Failed to track completion:', response.status);
    }
  } catch (error) {
    // Silently fail — backend sync is non-critical
    console.warn('Backend sync failed:', error);
  }
}

/**
 * Get aggregate stats for a habit from the backend.
 */
export async function getStats(
  habitName: string
): Promise<HabitStatsResponse | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/stats/${encodeURIComponent(habitName)}`
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch stats:', error);
    return null;
  }
}
