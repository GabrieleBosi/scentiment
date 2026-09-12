import * as Crypto from 'expo-crypto';
import { openDatabaseAsync } from 'expo-sqlite';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { EntryRepository, type NewEntryInput, type SmellEntry } from '../data';
import { deletePhoto } from '../lib/photos';
import { computeStreak, type StreakSummary } from '../lib/streak';
import { colors, fonts, spacing } from '../theme';

export const DATABASE_NAME = 'scentiment.db';

interface DiaryContextValue {
  repo: EntryRepository;
  /** All entries, newest first. Small enough to keep in memory for v1. */
  entries: SmellEntry[];
  streak: StreakSummary;
  refresh: () => Promise<void>;
  addEntry: (input: NewEntryInput) => Promise<SmellEntry>;
  removeEntry: (id: string) => Promise<void>;
}

const DiaryContext = createContext<DiaryContextValue | null>(null);

/**
 * Opens the local SQLite database, runs migrations, and shares the entry
 * list with every screen. Renders a small loading view until ready.
 */
export function DiaryProvider({ children }: { children: React.ReactNode }) {
  const [repo, setRepo] = useState<EntryRepository | null>(null);
  const [entries, setEntries] = useState<SmellEntry[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const db = await openDatabaseAsync(DATABASE_NAME);
      await db.execAsync('PRAGMA journal_mode = WAL');
      const r = new EntryRepository(db, { generateId: () => Crypto.randomUUID() });
      await r.init();
      const initial = await r.list();
      if (cancelled) return;
      setEntries(initial);
      setRepo(r);
    })().catch((e: unknown) => {
      if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!repo) return;
    setEntries(await repo.list());
  }, [repo]);

  const addEntry = useCallback(
    async (input: NewEntryInput) => {
      if (!repo) throw new Error('Database is not ready yet.');
      const created = await repo.create(input);
      await refresh();
      return created;
    },
    [repo, refresh],
  );

  const removeEntry = useCallback(
    async (id: string) => {
      if (!repo) return;
      const existing = await repo.getById(id);
      await repo.delete(id);
      deletePhoto(existing?.photoUri ?? null);
      await refresh();
    },
    [repo, refresh],
  );

  const streak = useMemo(() => computeStreak(entries.map((e) => e.timestamp)), [entries]);

  const value = useMemo<DiaryContextValue | null>(
    () => (repo ? { repo, entries, streak, refresh, addEntry, removeEntry } : null),
    [repo, entries, streak, refresh, addEntry, removeEntry],
  );

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>{error.message}</Text>
      </View>
    );
  }

  if (!value) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.body}>Opening your diary…</Text>
      </View>
    );
  }

  return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>;
}

export function useDiary(): DiaryContextValue {
  const ctx = useContext(DiaryContext);
  if (!ctx) throw new Error('useDiary must be used inside DiaryProvider');
  return ctx;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { fontFamily: fonts.heading, fontSize: 22, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 15, color: colors.inkSoft, textAlign: 'center' },
});
