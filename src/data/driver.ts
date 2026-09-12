/**
 * Minimal SQL driver contract.
 *
 * It mirrors the async subset of `expo-sqlite`'s `SQLiteDatabase`, so the
 * real database object satisfies it without an adapter. Tests supply a
 * `better-sqlite3` implementation so the same SQL runs in plain Node.
 */

export type SqlValue = string | number | null | boolean | Uint8Array;

export interface SqlRunResult {
  changes: number;
  lastInsertRowId: number;
}

export interface SqlDriver {
  /** Run one or more statements with no parameters and no result. */
  execAsync(sql: string): Promise<void>;
  /** Run one statement with parameters and return the change count. */
  runAsync(sql: string, params: SqlValue[]): Promise<SqlRunResult>;
  /** Run one query and return all rows. */
  getAllAsync<T>(sql: string, params: SqlValue[]): Promise<T[]>;
  /** Run one query and return the first row or null. */
  getFirstAsync<T>(sql: string, params: SqlValue[]): Promise<T | null>;
}
