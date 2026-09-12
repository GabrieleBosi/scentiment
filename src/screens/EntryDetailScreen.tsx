import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { formatClock, formatDayLabel, INTENSITY_LABELS } from '../lib/format';
import type { RootScreenProps } from '../navigation/types';
import { useDiary } from '../state/DiaryProvider';
import { colors, fonts, radius, spacing } from '../theme';

export function EntryDetailScreen({ route, navigation }: RootScreenProps<'EntryDetail'>) {
  const { entries, removeEntry } = useDiary();
  const entry = entries.find((e) => e.id === route.params.entryId);

  if (!entry) {
    return (
      <View style={styles.missing}>
        <Text style={styles.body}>This entry is no longer here.</Text>
      </View>
    );
  }

  function confirmDelete() {
    Alert.alert('Delete this entry?', 'The photo and the description will be removed from this phone.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeEntry(route.params.entryId);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {entry.photoUri ? (
        <Image source={{ uri: entry.photoUri }} style={styles.photo} accessibilityIgnoresInvertColors />
      ) : null}
      <Text style={styles.date}>
        {formatDayLabel(entry.timestamp)} · {formatClock(entry.timestamp)}
      </Text>
      {entry.smellDescription.length > 0 ? (
        <Text style={styles.description}>{entry.smellDescription}</Text>
      ) : null}
      {entry.tags.length > 0 ? (
        <View style={styles.tags}>
          {entry.tags.map((tag) => (
            <Chip key={tag} label={tag} />
          ))}
        </View>
      ) : null}
      {entry.intensity ? (
        <Text style={styles.meta}>
          Intensity {entry.intensity} of 5 · {INTENSITY_LABELS[entry.intensity]}
        </Text>
      ) : null}
      <Button label="Delete entry" variant="danger" onPress={confirmDelete} style={styles.delete} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: colors.line },
  date: { fontFamily: fonts.body, fontSize: 13, color: colors.inkFaint },
  description: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 32, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 15, color: colors.inkSoft },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  meta: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft },
  delete: { marginTop: spacing.lg },
});
