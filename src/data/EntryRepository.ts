import type { SqlDriver, SqlValue } from './driver';
import { migrate } from './schema';
import {
  type EntryPatch,
  type Intensity,
  type NewEntryInput,
  type SmellEntry,
  ValidationError,
} from './types';

interface EntryRow {
  id: string;
  timestamp: number;
  photo_uri: string | null;
  smell_description: string;
  tags: string;
  intensity: number | null;
}

export interface ListOptions {
  limit?: number;
  offset?: number;
}

export interface RepositoryOptions {
  /** Returns a new unique id. Defaults to a UUID v4. */
  generateId?: () => string;
  /** Returns the current time in epoch ms. Defaults to Date.now. */
  now?: () => number;
}

export const MAX_DESCRIPTION_LENGTH = 2000;

const SELECT_ENTRY =
  'SELECT id, timestamp, photo_uri, smell_description, tags, intensity FROM entries';

/**
 * All reads and writes for smell entries and app settings.
 * The repository owns the SQL; screens never touch the driver directly.
 */
export class EntryRepository {
  private readonly generateId: () => string;
  private readonly now: () => number;

  constructor(
    private readonly driver: SqlDriver,
    options: RepositoryOptions = {},
  ) {
    this.generateId = options.generateId ?? defaultId;
    this.now = options.now ?? (() => Date.now());
  }

  /** Create tables and apply migrations. Call once before any other method. */
  async init(): Promise<void> {
    await migrate(this.driver);
  }

  async create(input: NewEntryInput): Promise<SmellEntry> {
    const entry: SmellEntry = {
      id: this.generateId(),
      timestamp: input.timestamp ?? this.now(),
      photoUri: normalizePhotoUri(input.photoUri),
      smellDescription: normalizeDescription(input.smellDescription),
      tags: normalizeTags(input.tags),
      intensity: normalizeIntensity(input.intensity),
    };
    validateEntry(entry);

    await this.driver.runAsync(
      `INSERT INTO entries (id, timestamp, photo_uri, smell_description, tags, intensity, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.timestamp,
        entry.photoUri,
        entry.smellDescription,
        JSON.stringify(entry.tags),
        entry.intensity,
        this.now(),
      ],
    );
    return entry;
  }

  async getById(id: string): Promise<SmellEntry | null> {
    const row = await this.driver.getFirstAsync<EntryRow>(`${SELECT_ENTRY} WHERE id = ?`, [id]);
    return row ? rowToEntry(row) : null;
  }

  /** Newest entries first. */
  async list(options: ListOptions = {}): Promise<SmellEntry[]> {
    const { sql, params } = paginate(`${SELECT_ENTRY} ORDER BY timestamp DESC, id DESC`, options);
    const rows = await this.driver.getAllAsync<EntryRow>(sql, params);
    return rows.map(rowToEntry);
  }

  /**
   * Keyword search over the description and tags. Every whitespace-separated
   * word must match (case-insensitive substring). An empty query lists all.
   */
  async search(query: string, options: ListOptions = {}): Promise<SmellEntry[]> {
    const words = query.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return this.list(options);

    const clauses = words.map(
      () => `(smell_description LIKE ? ESCAPE '\\' OR tags LIKE ? ESCAPE '\\')`,
    );
    const params: SqlValue[] = [];
    for (const word of words) {
      const pattern = `%${escapeLike(word)}%`;
      params.push(pattern, pattern);
    }

    const { sql, params: pagedParams } = paginate(
      `${SELECT_ENTRY} WHERE ${clauses.join(' AND ')} ORDER BY timestamp DESC, id DESC`,
      options,
      params,
    );
    const rows = await this.driver.getAllAsync<EntryRow>(sql, pagedParams);
    return rows.map(rowToEntry);
  }

  async update(id: string, patch: EntryPatch): Promise<SmellEntry | null> {
    const current = await this.getById(id);
    if (!current) return null;

    const next: SmellEntry = {
      ...current,
      photoUri: patch.photoUri === undefined ? current.photoUri : normalizePhotoUri(patch.photoUri),
      smellDescription:
        patch.smellDescription === undefined
          ? current.smellDescription
          : normalizeDescription(patch.smellDescription),
      tags: patch.tags === undefined ? current.tags : normalizeTags(patch.tags),
      intensity: patch.intensity === undefined ? current.intensity : normalizeIntensity(patch.intensity),
    };
    validateEntry(next);

    await this.driver.runAsync(
      `UPDATE entries SET photo_uri = ?, smell_description = ?, tags = ?, intensity = ? WHERE id = ?`,
      [next.photoUri, next.smellDescription, JSON.stringify(next.tags), next.intensity, id],
    );
    return next;
  }

  /** Returns true when an entry was removed. */
  async delete(id: string): Promise<boolean> {
    const result = await this.driver.runAsync('DELETE FROM entries WHERE id = ?', [id]);
    return result.changes > 0;
  }

  async count(): Promise<number> {
    const row = await this.driver.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM entries', []);
    return row?.n ?? 0;
  }

  /** All entry timestamps, newest first. Used for streak calculation. */
  async listTimestamps(): Promise<number[]> {
    const rows = await this.driver.getAllAsync<{ timestamp: number }>(
      'SELECT timestamp FROM entries ORDER BY timestamp DESC',
      [],
    );
    return rows.map((r) => r.timestamp);
  }

  // --- Settings (small key/value store) ---------------------------------

  async getSetting(key: string): Promise<string | null> {
    const row = await this.driver.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      [key],
    );
    return row?.value ?? null;
  }

  async setSetting(key: string, value: string | null): Promise<void> {
    if (value === null) {
      await this.driver.runAsync('DELETE FROM settings WHERE key = ?', [key]);
      return;
    }
    await this.driver.runAsync(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value],
    );
  }
}

// --- helpers -------------------------------------------------------------

function rowToEntry(row: EntryRow): SmellEntry {
  return {
    id: row.id,
    timestamp: row.timestamp,
    photoUri: row.photo_uri,
    smellDescription: row.smell_description,
    tags: parseTags(row.tags),
    intensity: normalizeIntensity(row.intensity),
  };
}

function parseTags(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

function normalizeDescription(value: string): string {
  return (value ?? '').trim();
}

function normalizePhotoUri(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    const clean = tag.trim().toLowerCase();
    if (clean.length > 0 && !seen.has(clean)) {
      seen.add(clean);
      out.push(clean);
    }
  }
  return out;
}

function normalizeIntensity(value: number | null | undefined): Intensity | null {
  if (value === null || value === undefined) return null;
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new ValidationError('Intensity must be a whole number from 1 to 5.');
  }
  return value as Intensity;
}

function validateEntry(entry: SmellEntry): void {
  if (entry.smellDescription.length === 0 && entry.tags.length === 0) {
    throw new ValidationError('Write a few words about the smell, or pick a tag.');
  }
  if (entry.smellDescription.length > MAX_DESCRIPTION_LENGTH) {
    throw new ValidationError(`Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.`);
  }
  if (!Number.isFinite(entry.timestamp)) {
    throw new ValidationError('Timestamp must be a number.');
  }
}

function paginate(
  sql: string,
  options: ListOptions,
  params: SqlValue[] = [],
): { sql: string; params: SqlValue[] } {
  const out = [...params];
  let text = sql;
  if (options.limit !== undefined) {
    text += ' LIMIT ?';
    out.push(options.limit);
    if (options.offset !== undefined) {
      text += ' OFFSET ?';
      out.push(options.offset);
    }
  }
  return { sql: text, params: out };
}

function escapeLike(word: string): string {
  return word.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

/** UUID v4. Uses the platform's crypto when present, else Math.random. */
function defaultId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
