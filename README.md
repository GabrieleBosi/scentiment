# Scentiment

**A personal smell diary.** Before a meal, take a photo of the food and write, in your own words, what it smells like. That is the whole habit. Over months it becomes a private record of how your sense of smell behaves, one that no clinic collects.

Scentiment is a journal, not a medical device. It does not count calories, score you, or diagnose anything. Everything you write stays on your phone.

## Why smell is worth tracking

Smell is the sense people notice last. Most of us would spot a change in eyesight or hearing within days. A slow fade in smell can go unnoticed for years, because there is no daily task that tests it. Yet according to studies retrieved from PubMed, smell is one of the earliest and most sensitive signals the body gives:

- **Smell loss can precede Parkinson's disease by years.** In the Honolulu-Asia Aging Study, men with the poorest odor identification were about five times more likely to be diagnosed with Parkinson's disease within the next four years than men with normal smell. Ross et al., _Annals of Neurology_, 2008. [DOI](https://doi.org/10.1002/ana.21291)
- **Smell predicts cognitive decline better than a memory test.** In a community cohort of 1,037 adults without dementia, a lower score on a smell identification test predicted later cognitive decline and Alzheimer's dementia, and did so better than a verbal memory test in people who were cognitively intact at the start. Devanand et al., _Neurology_, 2015. [DOI](https://doi.org/10.1212/WNL.0000000000001132)
- **Smell is a whole-body health marker.** In a nationally representative sample of 3,005 older US adults, people with no sense of smell had over three times the odds of dying within five years compared with people with normal smell, independent of the usual leading causes of death. Pinto et al., _PLoS ONE_, 2014. [DOI](https://doi.org/10.1371/journal.pone.0107541)
- **People usually do not notice their own smell loss.** When smell was tested objectively, 86% of middle-aged adults and 78% of older adults with a measurable deficit were unaware of it. Wehling et al., _Archives of Clinical Neuropsychology_, 2011. [DOI](https://doi.org/10.1093/arclin/acr019)

Smell also matters day to day. It is most of what we call flavour, it warns of smoke, gas, and spoiled food, and it is tied to appetite and mood. Sudden loss of smell was one of the most specific early symptoms of COVID-19.

The last point above is the reason this app exists. Clinical smell tests are rare, one-off, and use standard odors. A meal diary is the opposite: frequent, personal, and in your own words. If the notes drift from "sharp, garlicky, makes my eyes water" toward "fine" and "not much", you have a record you can act on and show to a doctor. Scentiment only builds that record. Any interpretation is yours, and any medical question belongs with a clinician.

## Quick start

```bash
git clone https://github.com/GabrieleBosi/scentiment.git
cd scentiment
npm install
npm start
```

Then open the app on a phone or a simulator:

- **Phone**: install [Expo Go](https://expo.dev/go), then scan the QR code shown in the terminal. The phone and the computer must be on the same Wi-Fi network.
- **iOS Simulator**: press `i` in the terminal (macOS with Xcode).
- **Android Emulator**: press `a` in the terminal (Android Studio).

Requirements: Node.js 20 or newer (`.nvmrc` pins 22) and npm.

### Reminders

Local scheduled notifications work in Expo Go on iOS. On Android, Expo Go has limited notification support. If the daily reminder does not fire on Android in Expo Go, make a development build once:

```bash
npx expo run:android
```

The web target (`npm run web`) is not supported. SQLite on web needs extra setup and reminders do not work in a browser.

## What the app does

1. **Capture**: take or choose a photo, then answer "What does it smell like?" in free text. Optional descriptor chips (sweet, smoky, faint, nothing, …) and an optional 1 to 5 intensity.
2. **Diary**: a timeline of entries with photo, words, and date. Keyword search over descriptions and tags. Tap an entry to see it in full or delete it.
3. **Local storage**: SQLite on the device. Photos are copied into the app's own folder so they outlive the camera cache.
4. **A soft streak**: an entry count and a "days in a row" note. A streak stays alive if the last entry was yesterday, and nothing scolds you when it ends.
5. **Settings**: one daily reminder at a time you choose.

Not in this version: anomaly detection, nutrition data, sharing, accounts, cloud sync.

## Why React Native with Expo

The app must open the camera, store data on the device, and send a reminder at a set time. A phone app does all three natively. A browser app cannot schedule reliable reminders and makes the camera flow slower.

Expo was chosen over bare React Native because `expo-image-picker`, `expo-sqlite`, `expo-notifications`, and `expo-file-system` cover the whole scope with no native code, and because Expo Go lets you test on a real phone in minutes. A development build is available later when a feature needs it. Cloud sync can be added without a rewrite: the data layer is one class behind one SQL interface.

## Development

```bash
npm run check       # lint + typecheck + tests, in one go
npm run lint        # ESLint (eslint-config-expo)
npm run typecheck   # TypeScript, strict mode
npm test            # Jest
npm run format      # Prettier, writes changes
```

The same checks run in GitHub Actions on every push and pull request.

The data-layer tests run against a real SQLite engine (`better-sqlite3`) in plain Node, so they need no phone, simulator, or React Native test environment. The repository class runs the same SQL on the device through `expo-sqlite`.

### Project layout

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
  screens/                      Timeline, Capture, EntryDetail, Settings
  components/                   EntryCard, Chip, IntensityPicker, StreakBadge, Button
  theme.ts                      Colors, spacing, fonts
```

### Data model

One row per entry in the `entries` table:

| Column              | Type    | Notes                            |
| ------------------- | ------- | -------------------------------- |
| `id`                | TEXT    | UUID v4                          |
| `timestamp`         | INTEGER | Epoch milliseconds               |
| `photo_uri`         | TEXT    | Local file URI, nullable         |
| `smell_description` | TEXT    | Free text, up to 2000 characters |
| `tags`              | TEXT    | JSON array of lowercase strings  |
| `intensity`         | INTEGER | 1 to 5, or NULL                  |
| `created_at`        | INTEGER | Epoch milliseconds               |

An entry needs at least a description or one tag. A `settings` table holds key/value pairs for the reminder.

Schema changes go in `src/data/schema.ts` as a new migration. The app applies pending migrations on start.

## Roadmap

- Export the diary as JSON or CSV, so the data is always yours.
- Edit an existing entry.
- More than one reminder per day (breakfast, lunch, dinner).
- Optional cloud sync, behind the same repository interface.
- Only after the logging habit is proven: gentle, on-device trend views.
