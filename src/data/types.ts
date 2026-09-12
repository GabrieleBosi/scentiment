/**
 * Core data model for Scentiment.
 *
 * One entry = one meal, one photo, and the user's own words about its smell.
 * Nothing here is about nutrition or calories on purpose.
 */

/** Intensity of the smell on a 1 (faint) to 5 (strong) scale. */
export type Intensity = 1 | 2 | 3 | 4 | 5;

export const INTENSITY_VALUES: readonly Intensity[] = [1, 2, 3, 4, 5];

/**
 * Suggested descriptor chips shown on the capture screen.
 * They are only suggestions: tags are stored as free strings.
 */
export const SUGGESTED_TAGS: readonly string[] = [
  'sweet',
  'savory',
  'sour',
  'smoky',
  'spicy',
  'fresh',
  'earthy',
  'faint',
  'nothing',
];

export interface SmellEntry {
  /** UUID v4 */
  id: string;
  /** Unix epoch milliseconds when the meal was logged. */
  timestamp: number;
  /** Local file URI of the meal photo, or null when no photo was attached. */
  photoUri: string | null;
  /** The user's free-text description of the smell. */
  smellDescription: string;
  /** Optional descriptor tags, for example "sweet" or "faint". */
  tags: string[];
  /** Optional 1-5 intensity. */
  intensity: Intensity | null;
}

export interface NewEntryInput {
  smellDescription: string;
  photoUri?: string | null;
  tags?: string[];
  intensity?: Intensity | null;
  /** Defaults to "now". */
  timestamp?: number;
}

export type EntryPatch = Partial<Omit<NewEntryInput, 'timestamp'>>;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
