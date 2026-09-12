import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { streakMessage, type StreakSummary } from '../lib/streak';
import { colors, fonts, radius, spacing } from '../theme';

/** A soft, non-nagging summary of how the diary is going. */
export function StreakBadge({ streak }: { streak: StreakSummary }) {
  const pills: string[] = [];
  if (streak.totalEntries > 0) {
    pills.push(`${streak.totalEntries} ${streak.totalEntries === 1 ? 'entry' : 'entries'}`);
  }
  if (streak.currentStreak >= 2) pills.push(`${streak.currentStreak}-day run`);

  return (
    <View style={styles.wrap}>
      <Text style={styles.message}>{streakMessage(streak)}</Text>
      {pills.length > 0 ? (
        <View style={styles.pills}>
          {pills.map((p) => (
            <View key={p} style={styles.pill}>
              <Text style={styles.pillText}>{p}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  message: { fontFamily: fonts.body, fontSize: 15, color: colors.inkSoft, lineHeight: 21 },
  pills: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    backgroundColor: colors.leafSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 4,
  },
  pillText: { fontFamily: fonts.body, fontSize: 13, color: colors.leaf, fontWeight: '600' },
});
