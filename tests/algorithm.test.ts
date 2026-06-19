import { calculateOptimalWindow } from '../lib/algorithm';

function makeTimestamp(hour: number, minute: number, daysAgo: number = 0): number {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
}

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
  } catch (error) {
    console.error(`❌ FAIL: ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

console.log('--- Running Algorithm Unit Tests ---');

runTest('Cold start with empty timestamps array', () => {
  const result = calculateOptimalWindow([], '08:30');
  const expected = 8 * 60 + 30; // 510 minutes
  if (result !== expected) {
    throw new Error(`Expected ${expected}, but got ${result}`);
  }
});

runTest('Cold start with 4 timestamps (should still fallback)', () => {
  const completions = [
    makeTimestamp(8, 0, 1),
    makeTimestamp(8, 15, 2),
    makeTimestamp(7, 45, 3),
    makeTimestamp(8, 10, 4),
  ];
  const result = calculateOptimalWindow(completions, '09:00');
  const expected = 9 * 60; // 540 minutes
  if (result !== expected) {
    throw new Error(`Expected ${expected}, but got ${result}`);
  }
});

runTest('Consistent completions (5 timestamps at exactly 08:00)', () => {
  const completions = [
    makeTimestamp(8, 0, 1),
    makeTimestamp(8, 0, 2),
    makeTimestamp(8, 0, 3),
    makeTimestamp(8, 0, 4),
    makeTimestamp(8, 0, 5),
  ];
  const result = calculateOptimalWindow(completions, '12:00');
  const expected = 8 * 60; // 480 minutes
  if (result !== expected) {
    throw new Error(`Expected ${expected}, but got ${result}`);
  }
});

runTest('Varied completions (completions spreading from 08:00 to 12:00)', () => {
  const completions = [
    makeTimestamp(8, 0, 1), // 480 min
    makeTimestamp(9, 0, 2), // 540 min
    makeTimestamp(10, 0, 3), // 600 min
    makeTimestamp(11, 0, 4), // 660 min
    makeTimestamp(12, 0, 5), // 720 min
  ];
  const result = calculateOptimalWindow(completions, '15:00');
  const expected = 515;
  if (result !== expected) {
    throw new Error(`Expected ${expected}, but got ${result}`);
  }
});

runTest('Clamping boundary (mean - stdDev goes negative)', () => {
  const completions = [
    makeTimestamp(0, 5, 1),  // 5 min
    makeTimestamp(0, 30, 2), // 30 min
    makeTimestamp(1, 0, 3),  // 60 min
    makeTimestamp(1, 30, 4), // 90 min
    makeTimestamp(2, 0, 5),  // 120 min
  ];
  const completionsWide = [
    makeTimestamp(0, 5, 1),  // 5 min
    makeTimestamp(0, 10, 2), // 10 min
    makeTimestamp(0, 15, 3), // 15 min
    makeTimestamp(4, 0, 4),  // 240 min
    makeTimestamp(5, 0, 5),  // 300 min
  ];
  const result = calculateOptimalWindow(completionsWide, '10:00');
  if (result < 0 || result > 1439) {
    throw new Error(`Expected result to be within [0, 1439], but got ${result}`);
  }
});

console.log('------------------------------------');
