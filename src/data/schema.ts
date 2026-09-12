import type { SqlDriver } from './driver';

/**
 * Ordered list of migrations. Index N is applied when `PRAGMA user_version`
 * equals N. Append new migrations; never edit an applied one.
 */
export const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE IF NOT EXISTS entries (
    id                TEXT PRIMARY KEY NOT NULL,
    timestamp         INTEGER NOT NULL,
    photo_uri         TEXT,
    smell_description TEXT NOT NULL,
    tags              TEXT NOT NULL DEFAULT '[]',
    intensity         INTEGER CHECK (intensity IS NULL OR intensity BETWEEN 1 AND 5),
    created_at        INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON entries (timestamp DESC);

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
];

export async function getSchemaVersion(driver: SqlDriver): Promise<number> {
  const row = await driver.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
  return row?.user_version ?? 0;
}

/** Apply all pending migrations. Safe to call on every app start. */
export async function migrate(driver: SqlDriver): Promise<void> {
  let version = await getSchemaVersion(driver);
  while (version < MIGRATIONS.length) {
    await driver.execAsync(MIGRATIONS[version]);
    version += 1;
    await driver.execAsync(`PRAGMA user_version = ${version}`);
  }
}
