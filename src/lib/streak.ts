/**
 * Streak and count summary. Pure functions, no I/O.
 *
 * The tone is deliberately gentle: a streak is a small "nice" not a chain
 * to protect. A streak is still alive when the last entry was yesterday,
 * so a late lunch never "breaks" anything.
 */

export interface StreakSummary {
  /** Consecutive days ending today or yesterday. 0 when the diary is idle. */
  currentStreak: number;
  /** Longest run of consecutive days ever. */
  longestStreak: number;
  /** Total number of entries. */
  totalEntries: number;
  /** Number of distinct days with at least one entry. */
  daysLogged: number;
  /** True when there is at least one entry today. */
  loggedToday: boolean;
}

/** Local-calendar day number (days since the epoch in the device time zone). */
export function localDayNumber(ms: number): number {
  const d = new Date(ms);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

export function computeStreak(
  timestamps: readonly number[],
  now: number = Date.now(),
): StreakSummary {
  const days = Array.from(new Set(timestamps.map(localDayNumber))).sort((a, b) => b - a);
  const today = localDayNumber(now);

  let longest = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i - 1] - days[i] === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  let current = 0;
  if (days.length > 0 && today - days[0] <= 1) {
    current = 1;
    for (let i = 1; i < days.length && days[i - 1] - days[i] === 1; i++) current += 1;
  }

  return {
    currentStreak: current,
    longestStreak: longest,
    totalEntries: timestamps.length,
    daysLogged: days.length,
    loggedToday: days.length > 0 && days[0] === today,
  };
}

/** A short, friendly line for the diary header. */
export function streakMessage(s: StreakSummary): string {
  if (s.totalEntries === 0) return 'Nothing here yet. Your next meal is a good place to start.';
  if (s.loggedToday && s.currentStreak >= 2)
    return `${s.currentStreak} days in a row of paying attention.`;
  if (s.loggedToday) return 'Today is noted. Nice.';
  if (s.currentStreak >= 1) return `Yesterday counted. Today's meal is waiting.`;
  return 'Welcome back. No catching up needed.';
}
