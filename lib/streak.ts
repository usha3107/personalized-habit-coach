

export function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isCompletedToday(completions: number[]): boolean {
  if (completions.length === 0) return false;
  const todayStr = getLocalDateString(new Date());
  return completions.some((timestamp) => getLocalDateString(new Date(timestamp)) === todayStr);
}

export function calculateStreak(completions: number[]): number {
  if (completions.length === 0) return 0;

  const uniqueDates = Array.from(
    new Set(
      completions.map((timestamp) => getLocalDateString(new Date(timestamp)))
    )
  ).sort().reverse(); // Sort descending (newest first)

  if (uniqueDates.length === 0) return 0;

  const todayStr = getLocalDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  const newestCompletion = uniqueDates[0];
  if (newestCompletion !== todayStr && newestCompletion !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  const checkDate = newestCompletion === todayStr ? new Date() : yesterday;

  while (true) {
    const expectedStr = getLocalDateString(checkDate);
    if (uniqueDates.includes(expectedStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function getCompletionRate(completions: number[], createdAt: number): number {
  if (completions.length === 0) return 0;

  const createdDate = new Date(createdAt);
  const today = new Date();

  createdDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(today.getTime() - createdDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include creation day

  const uniqueDaysCompleted = new Set(
    completions.map((timestamp) => getLocalDateString(new Date(timestamp)))
  ).size;

  const rate = Math.round((uniqueDaysCompleted / diffDays) * 100);
  return Math.min(100, Math.max(0, rate));
}
