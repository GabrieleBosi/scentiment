import type { EntryRepository } from '../data';

/** One daily reminder. Stored in the settings table of the local database. */
export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
  /** Identifier of the scheduled notification, when one exists. */
  notificationId: string | null;
}

export const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  hour: 12,
  minute: 30,
  notificationId: null,
};

const KEYS = {
  enabled: 'reminder.enabled',
  hour: 'reminder.hour',
  minute: 'reminder.minute',
  notificationId: 'reminder.notificationId',
} as const;

export async function loadReminderSettings(repo: EntryRepository): Promise<ReminderSettings> {
  const [enabled, hour, minute, notificationId] = await Promise.all([
    repo.getSetting(KEYS.enabled),
    repo.getSetting(KEYS.hour),
    repo.getSetting(KEYS.minute),
    repo.getSetting(KEYS.notificationId),
  ]);
  return {
    enabled: enabled === 'true',
    hour: clampInt(hour, 0, 23, DEFAULT_REMINDER.hour),
    minute: clampInt(minute, 0, 59, DEFAULT_REMINDER.minute),
    notificationId,
  };
}

export async function saveReminderSettings(
  repo: EntryRepository,
  settings: ReminderSettings,
): Promise<void> {
  await Promise.all([
    repo.setSetting(KEYS.enabled, settings.enabled ? 'true' : 'false'),
    repo.setSetting(KEYS.hour, String(settings.hour)),
    repo.setSetting(KEYS.minute, String(settings.minute)),
    repo.setSetting(KEYS.notificationId, settings.notificationId),
  ]);
}

function clampInt(raw: string | null, min: number, max: number, fallback: number): number {
  const n = raw === null ? NaN : Number.parseInt(raw, 10);
  if (!Number.isInteger(n) || n < min || n > max) return fallback;
  return n;
}
