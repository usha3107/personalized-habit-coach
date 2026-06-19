/**
 * Optimal Window Algorithm
 *
 * Calculates the best time to send a habit reminder notification
 * based on the user's historical completion patterns.
 *
 * Strategy:
 * - Cold Start (< 5 data points): Use the user's manually set target time
 * - Normal (≥ 5 data points): Calculate mean - stdDev of completion times
 *   to schedule notifications just before the user's typical completion window
 */

/**
 * Convert a Unix timestamp (ms) to minutes past midnight in local timezone.
 */
function timestampToMinutesPastMidnight(timestamp: number): number {
  const date = new Date(timestamp);
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Parse a target time string (HH:MM) to minutes past midnight.
 */
function targetTimeToMinutes(targetTime: string): number {
  const parts = targetTime.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

/**
 * Calculate the mean of an array of numbers.
 */
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculate the standard deviation of an array of numbers.
 */
function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const squaredDiffs = values.map((val) => (val - mean) ** 2);
  const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculate the optimal notification window for a habit.
 *
 * @param timestamps - Array of Unix timestamps (milliseconds) of past completions
 * @param targetTime - User's preferred target time in HH:MM format (e.g., '08:30')
 * @returns The optimal notification time as minutes past midnight
 *
 * Logic:
 * - If fewer than 5 timestamps: returns targetTime as minutes past midnight (cold start)
 * - If 5 or more timestamps:
 *   1. Convert each timestamp to minutes past midnight
 *   2. Calculate the mean (μ) completion time
 *   3. Calculate the standard deviation (σ)
 *   4. Return max(0, floor(μ - σ)) as the notification time
 *      This schedules the notification at the start of the user's
 *      typical completion window
 */
export function calculateOptimalWindow(
  timestamps: number[],
  targetTime: string
): number {
  // Cold start: fewer than 5 data points
  if (timestamps.length < 5) {
    return targetTimeToMinutes(targetTime);
  }

  // Convert timestamps to minutes past midnight
  const minutesValues = timestamps.map(timestampToMinutesPastMidnight);

  // Calculate mean
  const mean = calculateMean(minutesValues);

  // Calculate standard deviation
  const stdDev = calculateStdDev(minutesValues, mean);

  // Return mean - stdDev, clamped to [0, 1439]
  const optimalTime = Math.max(0, Math.floor(mean - stdDev));
  return Math.min(optimalTime, 1439); // 1439 = 23*60+59
}

// Expose test hook globally
const g = (typeof globalThis !== 'undefined'
  ? globalThis
  : typeof window !== 'undefined'
  ? window
  : {}) as any;

g.calculateOptimalWindow = calculateOptimalWindow;
g.window = g.window || g; // Ensure window is accessible even in node tests

