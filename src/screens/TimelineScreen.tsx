import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EntryCard } from '../components/EntryCard';
import { StreakBadge } from '../components/StreakBadge';
import type { SmellEntry } from '../data';
import type { RootStackParamList } from '../navigation/types';
import { useDiary } from '../state/DiaryProvider';
import { colors, fonts, radius, shadow, spacing } from '../theme';

const SEARCH_DEBOUNCE_MS = 200;

interface SearchResult {
  query: string;
  hits: SmellEntry[];
}

export function TimelineScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { repo, entries, streak } = useDiary();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const q = query.trim();
  const searching = q.length > 0;

  // Keyword search runs in SQLite so the list and the DB never disagree.
  useEffect(() => {
    if (q.length === 0) return;
    let cancelled = false;
    const handle = setTimeout(() => {
      repo
        .search(q)
        .then((hits) => {
          if (!cancelled) setResults({ query: q, hits });
        })
        .catch(() => {
          if (!cancelled) setResults({ query: q, hits: [] });
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [q, repo, entries]);

  // While a new search is pending, keep showing the previous hits.
  const data = searching ? (results?.hits ?? []) : entries;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Scentiment</Text>
            <StreakBadge streak={streak} />
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={18} color={colors.inkFaint} />
              <TextInput
                accessibilityLabel="Search entries"
                value={query}
                onChangeText={setQuery}
                placeholder="Search your smells…"
                placeholderTextColor={colors.inkFaint}
                style={styles.search}
                returnKeyType="search"
              />
              {query.length > 0 ? (
                <Pressable
                  accessibilityLabel="Clear search"
                  onPress={() => setQuery('')}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={18} color={colors.inkFaint} />
                </Pressable>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{searching ? 'No matches' : 'An empty page'}</Text>
            <Text style={styles.emptyBody}>
              {searching
                ? 'Try another word. Tags count too.'
                : 'Before your next meal, take a photo and write what it smells like. Any words are the right words.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <EntryCard
            entry={item}
            onPress={() => navigation.navigate('EntryDetail', { entryId: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="New entry"
        onPress={() => navigation.navigate('Capture')}
        style={({ pressed }) => [
          styles.fab,
          { bottom: spacing.lg + insets.bottom },
          pressed && styles.fabPressed,
        ]}
      >
        <Ionicons name="add" size={30} color={colors.card} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: 120 },
  header: { gap: spacing.md, marginBottom: spacing.lg },
  title: { fontFamily: fonts.heading, fontSize: 32, color: colors.ink },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  search: { flex: 1, fontFamily: fonts.body, fontSize: 16, color: colors.ink, padding: 0 },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 22, color: colors.ink },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  fabPressed: { opacity: 0.85 },
});
