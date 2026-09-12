import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatTime } from '../lib/format';
import {
  cancelReminder,
  ensureNotificationPermission,
  scheduleDailyReminder,
} from '../lib/notifications';
import {
  DEFAULT_REMINDER,
  loadReminderSettings,
  type ReminderSettings,
  saveReminderSettings,
} from '../lib/settings';
import { useDiary } from '../state/DiaryProvider';
import { colors, fonts, radius, shadow, spacing } from '../theme';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { repo, streak } = useDiary();
  const [reminder, setReminder] = useState<ReminderSettings>(DEFAULT_REMINDER);
  const [loaded, setLoaded] = useState(false);
  const [showIosPicker, setShowIosPicker] = useState(false);

  useEffect(() => {
    loadReminderSettings(repo)
      .then(setReminder)
      .finally(() => setLoaded(true));
  }, [repo]);

  /**
   * Apply a reminder change: cancel the old notification, schedule a new
   * one when enabled, then persist. Everything stays on the device.
   */
  const applyReminder = useCallback(
    async (next: Omit<ReminderSettings, 'notificationId'>) => {
      await cancelReminder(reminder.notificationId);
      let notificationId: string | null = null;
      let enabled = next.enabled;

      if (enabled) {
        const allowed = await ensureNotificationPermission();
        if (!allowed) {
          enabled = false;
          Alert.alert(
            'Notifications are off',
            'Allow notifications for Scentiment in your phone settings to get a meal reminder.',
          );
        } else {
          notificationId = await scheduleDailyReminder(next.hour, next.minute);
        }
      }

      const saved: ReminderSettings = { ...next, enabled, notificationId };
      await saveReminderSettings(repo, saved);
      setReminder(saved);
    },
    [repo, reminder.notificationId],
  );

  function onTimeChange(event: DateTimePickerEvent, date?: Date) {
    setShowIosPicker(false);
    if (event.type !== 'set' || !date) return;
    void applyReminder({ enabled: reminder.enabled, hour: date.getHours(), minute: date.getMinutes() });
  }

  function openTimePicker() {
    const value = new Date();
    value.setHours(reminder.hour, reminder.minute, 0, 0);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value, mode: 'time', is24Hour: true, onChange: onTimeChange });
    } else {
      setShowIosPicker((v) => !v);
    }
  }

  const pickerValue = new Date();
  pickerValue.setHours(reminder.hour, reminder.minute, 0, 0);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
    >
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.sectionLabel}>Meal reminder</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Daily reminder</Text>
            <Text style={styles.rowHint}>A gentle nudge before a meal. One a day.</Text>
          </View>
          <Switch
            accessibilityLabel="Daily reminder"
            value={reminder.enabled}
            disabled={!loaded}
            onValueChange={(enabled) =>
              applyReminder({ enabled, hour: reminder.hour, minute: reminder.minute })
            }
            trackColor={{ true: colors.accent, false: colors.line }}
            thumbColor={colors.card}
          />
        </View>
        <View style={styles.divider} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Reminder time, ${formatTime(reminder.hour, reminder.minute)}`}
          onPress={openTimePicker}
          disabled={!loaded}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Time</Text>
            <Text style={styles.rowHint}>Pick the meal you most often forget.</Text>
          </View>
          <Text style={styles.time}>{formatTime(reminder.hour, reminder.minute)}</Text>
        </Pressable>
        {Platform.OS === 'ios' && showIosPicker ? (
          <DateTimePicker
            value={pickerValue}
            mode="time"
            display="spinner"
            onChange={onTimeChange}
            accentColor={colors.accent}
          />
        ) : null}
      </View>

      <Text style={styles.sectionLabel}>Your diary</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowTitle}>Entries</Text>
          <Text style={styles.value}>{streak.totalEntries}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowTitle}>Days with an entry</Text>
          <Text style={styles.value}>{streak.daysLogged}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowTitle}>Longest run</Text>
          <Text style={styles.value}>
            {streak.longestStreak} {streak.longestStreak === 1 ? 'day' : 'days'}
          </Text>
        </View>
      </View>

      <Text style={styles.footer}>
        Everything you write stays on this phone. There is no account and nothing is uploaded.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  title: { fontFamily: fonts.heading, fontSize: 32, color: colors.ink, marginBottom: spacing.md },
  sectionLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkFaint,
    marginTop: spacing.md,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  card: { backgroundColor: colors.card, borderRadius: radius.md, ...shadow },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: fonts.body, fontSize: 16, color: colors.ink },
  rowHint: { fontFamily: fonts.body, fontSize: 13, color: colors.inkFaint },
  time: { fontFamily: fonts.body, fontSize: 18, color: colors.accent, fontWeight: '600' },
  value: { fontFamily: fonts.body, fontSize: 16, color: colors.inkSoft },
  divider: { height: 1, backgroundColor: colors.line, marginLeft: spacing.md },
  pressed: { opacity: 0.7 },
  footer: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkFaint,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
});
