import Database from 'better-sqlite3';
import type { SqlDriver, SqlRunResult, SqlValue } from '../driver';

/**
 * Test-only driver backed by better-sqlite3 so the repository's SQL runs
 * against a real SQLite engine in plain Node.
 */
export class BetterSqliteDriver implements SqlDriver {
  private readonly db: Database.Database;

  constructor(filename = ':memory:') {
    this.db = new Database(filename);
  }

  async execAsync(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async runAsync(sql: string, params: SqlValue[]): Promise<SqlRunResult> {
    const result = this.db.prepare(sql).run(...params.map(toBind));
    return { changes: result.changes, lastInsertRowId: Number(result.lastInsertRowid) };
  }

  async getAllAsync<T>(sql: string, params: SqlValue[]): Promise<T[]> {
    return this.db.prepare(sql).all(...params.map(toBind)) as T[];
  }

  async getFirstAsync<T>(sql: string, params: SqlValue[]): Promise<T | null> {
    const row = this.db.prepare(sql).get(...params.map(toBind)) as T | undefined;
    return row ?? null;
  }

  close(): void {
    this.db.close();
  }
}

/** better-sqlite3 does not accept booleans; SQLite stores them as 0/1. */
function toBind(value: SqlValue): string | number | null | Uint8Array {
  if (typeof value === 'boolean') return value ? 1 : 0;
  return value;
}
