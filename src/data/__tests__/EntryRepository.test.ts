import { EntryRepository } from '../EntryRepository';
import { getSchemaVersion, MIGRATIONS } from '../schema';
import { ValidationError } from '../types';
import { BetterSqliteDriver } from './betterSqliteDriver';

describe('EntryRepository', () => {
  let driver: BetterSqliteDriver;
  let repo: EntryRepository;
  let clock: number;
  let nextId: number;

  beforeEach(async () => {
    driver = new BetterSqliteDriver();
    clock = Date.UTC(2026, 8, 12, 12, 0, 0); // 2026-09-12 12:00 UTC
    nextId = 1;
    repo = new EntryRepository(driver, {
      now: () => clock,
      generateId: () => `id-${nextId++}`,
    });
    await repo.init();
  });

  afterEach(() => {
    driver.close();
  });

  describe('init', () => {
    it('applies all migrations and is idempotent', async () => {
      expect(await getSchemaVersion(driver)).toBe(MIGRATIONS.length);
      await repo.init();
      expect(await getSchemaVersion(driver)).toBe(MIGRATIONS.length);
      expect(await repo.count()).toBe(0);
    });
  });

  describe('create / read', () => {
    it('stores a full entry and reads it back unchanged', async () => {
      const created = await repo.create({
        smellDescription: 'Warm bread, a little sour, like a bakery in the morning.',
        photoUri: 'file:///photos/bread.jpg',
        tags: ['sour', 'fresh'],
        intensity: 4,
      });

      expect(created).toEqual({
        id: 'id-1',
        timestamp: clock,
        photoUri: 'file:///photos/bread.jpg',
        smellDescription: 'Warm bread, a little sour, like a bakery in the morning.',
        tags: ['sour', 'fresh'],
        intensity: 4,
      });

      const read = await repo.getById('id-1');
      expect(read).toEqual(created);
      expect(await repo.count()).toBe(1);
    });

    it('accepts a minimal entry with only a description', async () => {
      const created = await repo.create({ smellDescription: 'faint garlic' });
      expect(created.photoUri).toBeNull();
      expect(created.tags).toEqual([]);
      expect(created.intensity).toBeNull();
      expect(await repo.getById(created.id)).toEqual(created);
    });

    it('accepts an entry with tags but no description', async () => {
      const created = await repo.create({ smellDescription: '   ', tags: ['nothing'] });
      expect(created.smellDescription).toBe('');
      expect(created.tags).toEqual(['nothing']);
    });

    it('normalizes tags: trims, lowercases, removes empties and duplicates', async () => {
      const created = await repo.create({
        smellDescription: 'x',
        tags: [' Sweet ', 'sweet', '', 'SMOKY'],
      });
      expect(created.tags).toEqual(['sweet', 'smoky']);
    });

    it('uses an explicit timestamp when given', async () => {
      const ts = Date.UTC(2026, 0, 1);
      const created = await repo.create({ smellDescription: 'x', timestamp: ts });
      expect((await repo.getById(created.id))?.timestamp).toBe(ts);
    });

    it('returns null for an unknown id', async () => {
      expect(await repo.getById('nope')).toBeNull();
    });
  });

  describe('validation', () => {
    it('rejects an entry with no description and no tags', async () => {
      await expect(repo.create({ smellDescription: '  ' })).rejects.toBeInstanceOf(ValidationError);
      expect(await repo.count()).toBe(0);
    });

    it('rejects an intensity outside 1-5', async () => {
      await expect(
        repo.create({ smellDescription: 'x', intensity: 0 as unknown as 1 }),
      ).rejects.toBeInstanceOf(ValidationError);
      await expect(
        repo.create({ smellDescription: 'x', intensity: 6 as unknown as 5 }),
      ).rejects.toBeInstanceOf(ValidationError);
      await expect(
        repo.create({ smellDescription: 'x', intensity: 2.5 as unknown as 2 }),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('list', () => {
    it('returns entries newest first with pagination', async () => {
      for (let i = 0; i < 5; i++) {
        clock += 60_000;
        await repo.create({ smellDescription: `entry ${i}` });
      }

      const all = await repo.list();
      expect(all.map((e) => e.smellDescription)).toEqual([
        'entry 4',
        'entry 3',
        'entry 2',
        'entry 1',
        'entry 0',
      ]);

      const page = await repo.list({ limit: 2, offset: 1 });
      expect(page.map((e) => e.smellDescription)).toEqual(['entry 3', 'entry 2']);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await repo.create({ smellDescription: 'Smoky grilled peppers', tags: ['smoky'] });
      clock += 1000;
      await repo.create({ smellDescription: 'Sweet ripe mango', tags: ['sweet', 'fresh'] });
      clock += 1000;
      await repo.create({ smellDescription: 'Almost nothing today, 100% flat', tags: ['nothing'] });
    });

    it('matches keywords in the description, case-insensitively', async () => {
      const hits = await repo.search('MANGO');
      expect(hits.map((e) => e.smellDescription)).toEqual(['Sweet ripe mango']);
    });

    it('matches keywords in tags', async () => {
      const hits = await repo.search('fresh');
      expect(hits.map((e) => e.smellDescription)).toEqual(['Sweet ripe mango']);
    });

    it('requires every word to match', async () => {
      expect((await repo.search('sweet mango')).length).toBe(1);
      expect((await repo.search('sweet peppers')).length).toBe(0);
    });

    it('treats LIKE wildcards as plain text', async () => {
      expect((await repo.search('100%')).length).toBe(1);
      expect((await repo.search('%')).length).toBe(1);
      expect((await repo.search('_')).length).toBe(0);
    });

    it('lists everything for a blank query', async () => {
      expect((await repo.search('   ')).length).toBe(3);
    });
  });

  describe('update / delete', () => {
    it('updates only the given fields', async () => {
      const created = await repo.create({
        smellDescription: 'before',
        tags: ['sweet'],
        intensity: 2,
        photoUri: 'file:///a.jpg',
      });

      const updated = await repo.update(created.id, { smellDescription: 'after', intensity: 5 });
      expect(updated).toEqual({ ...created, smellDescription: 'after', intensity: 5 });
      expect(await repo.getById(created.id)).toEqual(updated);
    });

    it('can clear the photo and intensity with null', async () => {
      const created = await repo.create({
        smellDescription: 'x',
        intensity: 3,
        photoUri: 'file:///a.jpg',
      });
      const updated = await repo.update(created.id, { photoUri: null, intensity: null });
      expect(updated?.photoUri).toBeNull();
      expect(updated?.intensity).toBeNull();
    });

    it('returns null when updating an unknown id', async () => {
      expect(await repo.update('nope', { smellDescription: 'x' })).toBeNull();
    });

    it('deletes an entry and reports whether it existed', async () => {
      const created = await repo.create({ smellDescription: 'x' });
      expect(await repo.delete(created.id)).toBe(true);
      expect(await repo.delete(created.id)).toBe(false);
      expect(await repo.getById(created.id)).toBeNull();
      expect(await repo.count()).toBe(0);
    });
  });

  describe('timestamps', () => {
    it('lists timestamps newest first', async () => {
      const a = await repo.create({ smellDescription: 'a' });
      clock += 5000;
      const b = await repo.create({ smellDescription: 'b' });
      expect(await repo.listTimestamps()).toEqual([b.timestamp, a.timestamp]);
    });
  });

  describe('settings', () => {
    it('stores, overwrites and clears a value', async () => {
      expect(await repo.getSetting('reminder.hour')).toBeNull();
      await repo.setSetting('reminder.hour', '12');
      expect(await repo.getSetting('reminder.hour')).toBe('12');
      await repo.setSetting('reminder.hour', '19');
      expect(await repo.getSetting('reminder.hour')).toBe('19');
      await repo.setSetting('reminder.hour', null);
      expect(await repo.getSetting('reminder.hour')).toBeNull();
    });
  });
});
