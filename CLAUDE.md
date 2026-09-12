# Scentiment

Personal smell diary. Expo SDK 57, React Native, TypeScript, local SQLite. See README.md for the product rationale and layout.

## Commands

- `npm run check` runs lint, format check, typecheck, and tests. Run it before every commit.
- `npm start` starts Metro for Expo Go.

## Rules

- `src/data/` must not import React or Expo. It is tested in plain Node against better-sqlite3.
- Schema changes are new entries in `src/data/schema.ts`. Never edit an applied migration.
- No nutrition, calorie, scoring, or diagnostic features. The app records; it does not interpret.
- Copy stays gentle. No loss framing around streaks.
