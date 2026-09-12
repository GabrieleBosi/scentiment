import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { SmellEntry } from '../data';
import { formatClock, formatDayLabel, INTENSITY_LABELS } from '../lib/format';
import { colors, fonts, radius, shadow, spacing } from '../theme';
import { Chip } from './Chip';

interface EntryCardProps {
  entry: SmellEntry;
  onPress?: () => void;
}

export function EntryCard({ entry, onPress }: EntryCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {entry.photoUri ? (
        <Image source={{ uri: entry.photoUri }} style={styles.photo} accessibilityIgnoresInvertColors />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={styles.placeholderText}>no photo</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.date}>
          {formatDayLabel(entry.timestamp)} · {formatClock(entry.timestamp)}
          {entry.intensity ? ` · ${INTENSITY_LABELS[entry.intensity]}` : ''}
        </Text>
        {entry.smellDescription.length > 0 ? (
          <Text style={styles.description} numberOfLines={3}>
            {entry.smellDescription}
          </Text>
        ) : null}
        {entry.tags.length > 0 ? (
          <View style={styles.tags}>
            {entry.tags.map((tag) => (
              <Chip key={tag} label={tag} small />
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadow,
  },
  pressed: { opacity: 0.85 },
  photo: { width: 96, minHeight: 96, backgroundColor: colors.line },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontFamily: fonts.body, fontSize: 12, color: colors.inkFaint },
  body: { flex: 1, padding: spacing.md, gap: spacing.xs + 2 },
  date: { fontFamily: fonts.body, fontSize: 12, color: colors.inkFaint },
  description: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22, color: colors.ink },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2, marginTop: spacing.xs },
});
