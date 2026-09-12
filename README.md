# Scentiment

A personal smell diary. Before a meal, take a photo of the food and write, in your own words, what it smells like. Over time this builds a private record of how you perceive smell. The app is a journal, not a clinic: no calories, no scores, no accounts.

Everything stays on the phone. There is no backend in v1.

## Why React Native with Expo

The app must do three things well: open the camera, store data on the device, and send a reminder at a set time. A phone app does all three natively. A browser app cannot schedule reliable reminders and makes the camera flow slower.

Expo was chosen over bare React Native because:

- `expo-image-picker`, `expo-sqlite`, `expo-notifications`, and `expo-file-system` cover the whole v1 scope with no native code to write.
- You can run the app on a real phone with the Expo Go app in a few minutes. No Xcode or Android Studio is needed for the first test.
- A development build (`npx expo run:ios` / `run:android`) is available later when a feature needs it.
- Cloud sync can be added later without a rewrite, because the data layer is one class behind one SQL interface.

## Requirements

- Node.js 20 or newer (tested with Node 22)
- npm
- A phone with the [Expo Go](https://expo.dev/go) app installed, or an iOS Simulator / Android Emulator

## Run it locally

```bash
npm install
npm start
```

Then:

- **Phone**: open Expo Go and scan the QR code shown in the terminal. The phone and the computer must be on the same network.
- **Simulator / emulator**: press `i` (iOS) or `a` (Android) in the terminal.

The web target (`npm run web`) is not supported in v1. `expo-sqlite` on web needs extra Metro setup, and reminders do not work in a browser.

### Reminders in Expo Go

Local scheduled notifications work in Expo Go on iOS. On Android, Expo Go has limited notification support since SDK 53. If reminders do not fire on Android in Expo Go, make a development build:

```bash
npx expo run:android
```

## Checks

```bash
npm run typecheck   # TypeScript, strict mode
npm test            # Jest: data layer and streak logic
```

The data-layer tests run against a real SQLite engine (`better-sqlite3`) in plain Node, so they do not need a phone, a simulator, or the React Native test environment. The repository class runs the same SQL on the device through `expo-sqlite`.

## What v1 does

1. **Capture**: take or choose a photo, then answer "What does it smell like?" in free text. Optional descriptor chips (sweet, smoky, faint, nothing, …) and an optional 1–5 intensity.
2. **Diary**: a scrollable timeline of entries (photo, words, date). Keyword search over descriptions and tags.
3. **Local storage**: SQLite on the device. Photos are copied into the app's document folder so they outlive the camera cache.
4. **A soft streak**: a count of entries and a "days in a row" note. A streak stays alive if the last entry was yesterday, and there is no loss message when it ends.
5. **Settings**: one daily reminder at a time you choose.

Out of scope for v1: anomaly detection, nutrition data, sharing, accounts, cloud sync.

## Project layout

```
App.tsx                         Root: providers, navigation, notification handler
app.json                        Expo config and native permission strings
src/
  data/                         Data layer (no React, no Expo imports)
    types.ts                    SmellEntry, NewEntryInput, tags, intensity
    driver.ts                   SqlDriver interface (subset of expo-sqlite's API)
    schema.ts                   Versioned migrations
    EntryRepository.ts          create / read / search / update / delete / settings
    __tests__/                  Jest tests + better-sqlite3 test driver
  lib/
    streak.ts                   Pure streak and count calculation (+ tests)
    photos.ts                   Pick a photo, copy it into app storage
    notifications.ts            Schedule / cancel the daily reminder
    settings.ts                 Reminder settings stored in the settings table
    format.ts                   Date and label formatting
  state/DiaryProvider.tsx       Opens the DB, shares entries and streak via context
  navigation/                   Stack (Capture modal, Entry detail) + tabs (Diary, Settings)
  screens/                      TimelineScreen, CaptureScreen, EntryDetailScreen, SettingsScreen
  components/                   EntryCard, Chip, IntensityPicker, StreakBadge, Button
  theme.ts                      Colors, spacing, fonts
```

## Data model

One row per entry in the `entries` table:

| Column              | Type    | Notes                                  |
| ------------------- | ------- | -------------------------------------- |
| `id`                | TEXT    | UUID v4                                |
| `timestamp`         | INTEGER | Epoch milliseconds                     |
| `photo_uri`         | TEXT    | Local file URI, nullable               |
| `smell_description` | TEXT    | Free text, up to 2000 characters       |
| `tags`              | TEXT    | JSON array of lowercase strings        |
| `intensity`         | INTEGER | 1–5 or NULL                            |
| `created_at`        | INTEGER | Epoch milliseconds                     |

An entry needs at least a description or one tag. A `settings` table holds key/value pairs for the reminder.

Schema changes go in `src/data/schema.ts` as a new migration; the app applies pending migrations on start.

## Next steps (not in v1)

- Optional cloud sync. The repository interface is the seam: add an export/import or a sync adapter behind it.
- Edit an existing entry from the detail screen.
- More than one reminder per day (breakfast, lunch, dinner).
- Data export (JSON or CSV) so the user owns their diary.
