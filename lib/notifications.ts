/**
 * Dynamic Push Notification Scheduling
 *
 * Manages scheduling, cancelling, and rescheduling habit reminder
 * notifications based on the optimal window algorithm output.
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Habit } from './types';
import { calculateOptimalWindow } from './algorithm';
import { updateNotificationId } from './storage';

// Store a mapping of habitId -> scheduled notification identifier
const scheduledNotifications = new Map<string, string>();

/**
 * Set up notification channel (Android) and request permissions.
 */
export async function setupNotifications(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habit-reminders', {
      name: 'Habit Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C63FF',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  // On simulators/emulators, just return true
  return true;
}

/**
 * Schedule a notification for a habit based on the optimal window.
 */
export async function scheduleHabitNotification(habit: Habit): Promise<string | null> {
  try {
    // Calculate optimal time
    const optimalMinutes = calculateOptimalWindow(habit.completions, habit.targetTime);

    const hour = Math.floor(optimalMinutes / 60);
    const minute = optimalMinutes % 60;

    // Schedule a daily notification at the optimal time
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${habit.icon} Time for ${habit.name}!`,
        body: `Your optimal window is now. Let's keep the streak going!`,
        data: { habitId: habit.id },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    // Track the notification
    scheduledNotifications.set(habit.id, identifier);

    // Update storage
    await updateNotificationId(habit.id, identifier);

    return identifier;
  } catch (error) {
    console.warn('Failed to schedule notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification for a habit.
 */
export async function cancelHabitNotification(habit: Habit): Promise<void> {
  try {
    // Check internal map first
    const storedId = scheduledNotifications.get(habit.id);
    const idToCancel = storedId || habit.notificationId;

    if (idToCancel) {
      await Notifications.cancelScheduledNotificationAsync(idToCancel);
      scheduledNotifications.delete(habit.id);
      await updateNotificationId(habit.id, null);
    }
  } catch (error) {
    console.warn('Failed to cancel notification:', error);
  }
}

/**
 * Reschedule a notification for a habit (cancel old, schedule new).
 * Called after each habit completion to update the optimal window.
 */
export async function rescheduleHabitNotification(habit: Habit): Promise<string | null> {
  await cancelHabitNotification(habit);
  return await scheduleHabitNotification(habit);
}

/**
 * Get the currently scheduled notification for a habit.
 * Exposed as a test hook.
 */
export async function getScheduledNotification(
  habitId: string
): Promise<{ identifier: string; content: object; trigger: any } | null> {
  const scheduledId = scheduledNotifications.get(habitId);

  if (!scheduledId) {
    return null;
  }

  const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
  const found = allScheduled.find((n) => n.identifier === scheduledId);

  if (found) {
    return {
      identifier: found.identifier,
      content: found.content,
      trigger: found.trigger,
    };
  }

  return null;
}

// Expose test hook globally
const g = (typeof globalThis !== 'undefined'
  ? globalThis
  : typeof window !== 'undefined'
  ? window
  : {}) as any;

g.getScheduledNotification = getScheduledNotification;
g.window = g.window || g; // Ensure window is accessible even in node tests

