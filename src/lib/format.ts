import { localDayNumber } from './streak';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Today", "Yesterday", "Tuesday", or "3 Sep 2026". */
export function formatDayLabel(ms: number, now: number = Date.now()): string {
  const diff = localDayNumber(now) - localDayNumber(ms);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  const d = new Date(ms);
  if (diff > 1 && diff < 7) return DAY_LABELS[d.getDay()];
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "08:05" in 24-hour local time. */
export function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function formatClock(ms: number): string {
  const d = new Date(ms);
  return formatTime(d.getHours(), d.getMinutes());
}

export const INTENSITY_LABELS: Record<number, string> = {
  1: 'faint',
  2: 'soft',
  3: 'clear',
  4: 'strong',
  5: 'intense',
};
