# Optimal Window Algorithm Documentation

The core intelligence of the Personalized Habit Coach lies in the **Optimal Window Algorithm**. It dynamically shifts habit notification times from the user's initial target time to a personalized slot calculated from their actual completion patterns.

## Algorithm Overview

The purpose of the algorithm is to identify the user's typical completion window and schedule reminders just before that window begins, increasing user follow-through and reducing notification fatigue.

- **Cold Start (< 5 completions)**: Use the user's manual target time.
- **Normal Operation (≥ 5 completions)**: Calculate the mathematical standard deviation and mean of the completion hours, and schedule the notification at the start of the typical completions window (i.e. `mean - standard deviation`).

---

## Pseudocode

```typescript
function calculateOptimalWindow(timestamps: number[], targetTime: string): number {
  // 1. Cold Start Fallback
  if (timestamps.length < 5) {
    return targetTimeToMinutes(targetTime);
  }

  // 2. Convert raw timestamps to minutes past midnight in local timezone
  const minutesValues = timestamps.map((ts) => {
    const date = new Date(ts);
    return date.getHours() * 60 + date.getMinutes();
  });

  // 3. Calculate Mean (μ)
  const sum = minutesValues.reduce((acc, val) => acc + val, 0);
  const mean = sum / minutesValues.length;

  // 4. Calculate Standard Deviation (σ)
  const squaredDiffs = minutesValues.map((val) => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / minutesValues.length;
  const stdDev = Math.sqrt(variance);

  // 5. Calculate notification time at start of completion window
  // Clamp the result to [0, 1439] (minutes in a day)
  const optimalTime = Math.max(0, Math.floor(mean - stdDev));
  return Math.min(optimalTime, 1439);
}
```

---

## Design Rationale & Fallbacks

### 1. The Cold Start Choice
Predicting behaviors with very few data points leads to highly unstable averages and standard deviations. For example, if a user logs two completions at 08:00 and 17:00, the mean is 12:30 with a massive standard deviation. This would schedule reminders at 06:30, which may be inappropriate.
We set a threshold of **5 completions** before transitioning away from the user's preferred target time. This ensures a more consistent behavioral baseline has been established.

### 2. Standard Deviation Window (`mean - std_dev`)
In statistics, for a normal distribution, approximately 68% of data points fall within one standard deviation of the mean (`mean ± std_dev`).
By scheduling the push notification at `mean - std_dev`, we nudge the user exactly at the *beginning* of their most active completion window. This maximizes the probability that they are in the appropriate context to complete the habit when the notification arrives.

---

## Edge Cases Handled

### 1. Midnight Wrap / Circular Time
Completions close to midnight (e.g., 23:50 and 00:10) can cause simple linear averages to fail (returning ~12:00, which is afternoon).
*Current Mitigation*: Clamping the output between 00:00 (`0` minutes) and 23:59 (`1439` minutes). For an advanced habit coach, circular statistics (converting times to angles on a 24-hour circle) would be used. The current standard deviation subtraction is bounded gracefully to prevent out-of-range notifications.

### 2. Timezone Adjustment
If a user travels, a UTC-based completion calculation would shift relative to their local day.
*Mitigation*: The raw timestamps are stored as Unix millisecond epoch values (UTC). When processing `new Date(timestamp)`, JS environment uses the **local timezone** of the device to extract `getHours()` and `getMinutes()`. This guarantees that the calculated window matches the local day of the user's current environment.
