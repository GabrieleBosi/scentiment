import { computeStreak, localDayNumber, streakMessage } from '../streak';

const DAY = 86_400_000;
// Noon on a fixed day, so local/UTC day boundaries never matter in tests.
const NOW = new Date(2026, 8, 12, 12, 0, 0).getTime();
const daysAgo = (n: number, hour = 12) => new Date(2026, 8, 12 - n, hour, 0, 0).getTime();

describe('computeStreak', () => {
  it('handles an empty diary', () => {
    expect(computeStreak([], NOW)).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      totalEntries: 0,
      daysLogged: 0,
      loggedToday: false,
    });
  });

  it('counts consecutive days ending today', () => {
    const s = computeStreak([daysAgo(0), daysAgo(1), daysAgo(2)], NOW);
    expect(s.currentStreak).toBe(3);
    expect(s.longestStreak).toBe(3);
    expect(s.loggedToday).toBe(true);
  });

  it('keeps the streak alive when the last entry was yesterday', () => {
    const s = computeStreak([daysAgo(1), daysAgo(2)], NOW);
    expect(s.currentStreak).toBe(2);
    expect(s.loggedToday).toBe(false);
  });

  it('resets the current streak after a gap, but keeps the longest', () => {
    const s = computeStreak([daysAgo(3), daysAgo(4), daysAgo(5), daysAgo(6)], NOW);
    expect(s.currentStreak).toBe(0);
    expect(s.longestStreak).toBe(4);
  });

  it('counts several entries on one day as one day', () => {
    const s = computeStreak([daysAgo(0, 8), daysAgo(0, 13), daysAgo(0, 20), daysAgo(1)], NOW);
    expect(s.totalEntries).toBe(4);
    expect(s.daysLogged).toBe(2);
    expect(s.currentStreak).toBe(2);
  });

  it('uses local calendar days', () => {
    const lateNight = new Date(2026, 8, 11, 23, 30).getTime();
    const earlyMorning = new Date(2026, 8, 12, 0, 30).getTime();
    expect(localDayNumber(earlyMorning) - localDayNumber(lateNight)).toBe(1);
    expect(localDayNumber(NOW + DAY) - localDayNumber(NOW)).toBe(1);
  });
});

describe('streakMessage', () => {
  it('stays gentle in every state', () => {
    expect(streakMessage(computeStreak([], NOW))).toMatch(/next meal/);
    expect(streakMessage(computeStreak([daysAgo(0)], NOW))).toMatch(/Today is noted/);
    expect(streakMessage(computeStreak([daysAgo(0), daysAgo(1)], NOW))).toMatch(/2 days in a row/);
    expect(streakMessage(computeStreak([daysAgo(1)], NOW))).toMatch(/Yesterday counted/);
    expect(streakMessage(computeStreak([daysAgo(9)], NOW))).toMatch(/Welcome back/);
  });
});
