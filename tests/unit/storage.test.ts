import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaults, type LearnerState, type ReviewEvent } from '../../src/domain';
import { makeBackup, mergePackState, parseBackup, parseBackupEnvelope } from '../../src/validation';

const NAME = 'd365-pa-study-desk';
const NOW = Date.UTC(2026, 9, 9, 12);
const review = (id: string, overrides: Partial<ReviewEvent> = {}): ReviewEvent => ({
  id, packId: 'removed-pack', cardId: 'unknown-card', revision: 2, sessionId: 'past-session',
  at: NOW, rating: 'good', kind: 'mcq', guessed: false, selectedOptionId: 'old-option', eligible: true,
  ...overrides,
});
function stateFixture(): LearnerState {
  return {
    events: [review('committed')],
    schedules: [{ packId: 'removed-pack', cardId: 'unknown-card', stage: 2, due: NOW + 1000, revision: 2 }],
    annotations: [{ id: 'removed-pack:unknown-card', packId: 'removed-pack', text: 'Personal note', updatedAt: NOW }],
    settings: { threshold: 5, window: 10, sessionSize: 20 },
    session: {
      id: 'current-session', packId: 'removed-pack', mode: 'quiz',
      cardIds: ['unknown-card', 'another-unknown-card'], index: 1, startedAt: NOW - 1000, finished: false,
      pending: [review('pending', { sessionId: 'current-session' })],
    },
  };
}

function change(input: unknown, path: string, value: unknown, remove = false): void {
  const parts = path.split('.');
  let parent = input as Record<string, unknown>;
  for (const part of parts.slice(0, -1)) parent = parent[part] as Record<string, unknown>;
  if (remove) delete parent[parts[parts.length - 1]];
  else parent[parts[parts.length - 1]] = value;
}

describe('backup validation', () => {
  it('round-trips all nested state and preserves unknown pack/card/option IDs without shared references', () => {
    const state = stateFixture();
    const backup = makeBackup(state);
    expect(backup).toMatchObject({ format: NAME, version: 2, scope: { kind: 'all' }, exportedAt: expect.any(String) });
    const restored = parseBackup(JSON.parse(JSON.stringify(backup)));
    expect(restored).toEqual(state);
    restored.session!.pending[0].rating = 'again';
    restored.annotations[0].text = 'Edited';
    expect(parseBackup(backup)).toEqual(state);
    state.events[0].cardId = 'changed-after-export';
    expect(parseBackup(backup).events[0].cardId).toBe('unknown-card');
  });

  it.each([null, [], 'json', 1, {}, { state: defaults }])('rejects an invalid backup envelope: %j', input => {
    expect(() => parseBackup(input)).toThrow();
  });

  it.each<[string, unknown]>([
    ['format', 'other-app'], ['version', 3], ['version', '2'], ['scope', null],
    ['exportedAt', '2026-02-30T12:00:00Z'], ['exportedAt', '2026-10-09'],
    ['exportedAt', 'not a date'], ['state', null], ['state.events', {}],
    ['state.schedules', null], ['state.annotations', 'notes'], ['state.session', []],
    ['state.events.0.id', ' '], ['state.events.0.packId', ''], ['state.events.0.cardId', 12],
    ['state.events.0.sessionId', null], ['state.events.0.revision', 0], ['state.events.0.revision', 1.5],
    ['state.events.0.at', NaN], ['state.events.0.at', Infinity], ['state.events.0.at', -1],
    ['state.events.0.at', 8_640_000_000_000_001], ['state.events.0.at', '123'],
    ['state.events.0.rating', 'excellent'], ['state.events.0.kind', 'essay'],
    ['state.events.0.guessed', 'false'], ['state.events.0.eligible', 1],
    ['state.events.0.selectedOptionId', 4], ['state.events.0.selectedOptionId', ' '],
    ['state.events.0.selectedOptionId', null], ['state.events.0.kind', 'recall'],
    ['state.schedules.0.packId', ''], ['state.schedules.0.cardId', null],
    ['state.schedules.0.stage', -2], ['state.schedules.0.stage', 6], ['state.schedules.0.stage', 1.5],
    ['state.schedules.0.due', Infinity], ['state.schedules.0.revision', 0],
    ['state.annotations.0.id', ''], ['state.annotations.0.packId', ''], ['state.annotations.0.text', 1], ['state.annotations.0.updatedAt', NaN],
    ['state.settings.threshold', 0], ['state.settings.threshold', 11], ['state.settings.window', 0],
    ['state.settings.window', '10'], ['state.settings.sessionSize', 0], ['state.settings.sessionSize', 1.5],
    ['state.settings.sessionSize', Number.MAX_SAFE_INTEGER + 1],
    ['state.session.id', ''], ['state.session.packId', ''], ['state.session.mode', 'test'],
    ['state.session.cardIds', null], ['state.session.cardIds.0', ' '],
    ['state.session.index', -1], ['state.session.index', 0.5], ['state.session.index', 3],
    ['state.session.index', 2], ['state.session.startedAt', Infinity], ['state.session.finished', 'false'],
    ['state.session.finished', true], ['state.session.pending', {}], ['state.session.pending', []],
    ['state.session.pending.0.packId', 'other'], ['state.session.pending.0.sessionId', 'other'],
    ['state.session.pending.0.cardId', 'other'], ['state.session.pending.0.kind', 'recall'],
    ['state.session.pending.0.rating', 'wrong'], ['state.session.pending.0.guessed', null],
    ['state.session.pending.0.eligible', 'true'], ['state.session.pending.0.at', NOW - 2000],
    ['state.session.pending.0.selectedOptionId', undefined], ['state.session.mode', 'practice'],
    ['unexpected', true], ['state.settings.unexpected', true],
  ])('rejects malformed field %s = %j', (path, value) => {
    const backup = makeBackup(stateFixture());
    change(backup, path, value);
    expect(() => parseBackup(backup)).toThrow();
  });

  it.each([
    'state.events', 'state.schedules', 'state.annotations', 'state.settings', 'state.session',
    ...['id', 'packId', 'cardId', 'revision', 'sessionId', 'at', 'rating', 'kind', 'guessed', 'eligible'].map(key => `state.events.0.${key}`),
    ...['cardId', 'packId', 'stage', 'due', 'revision'].map(key => `state.schedules.0.${key}`),
    ...['id', 'text', 'updatedAt'].map(key => `state.annotations.0.${key}`),
    ...['threshold', 'window', 'sessionSize'].map(key => `state.settings.${key}`),
    ...['id', 'packId', 'mode', 'cardIds', 'index', 'startedAt', 'finished', 'pending'].map(key => `state.session.${key}`),
  ])('rejects missing required field %s', path => {
    const backup = makeBackup(stateFixture());
    change(backup, path, undefined, true);
    expect(() => parseBackup(backup)).toThrow();
  });

  it('accepts historical rating-only MCQs, empty annotation text, and all rating enum values', () => {
    const state = stateFixture();
    delete state.events[0].selectedOptionId;
    state.annotations[0].text = '';
    state.events = (['again', 'hard', 'good', 'easy'] as const).map(rating => ({ ...state.events[0], id: rating, rating }));
    expect(parseBackup(makeBackup(state))).toEqual(state);
  });

  it('imports legacy v1 backups and infers annotation ownership without changing stable IDs', () => {
    const legacy = makeBackup(stateFixture()) as Record<string, unknown>;
    legacy.version = 1;
    delete legacy.scope;
    const legacyState = legacy.state as LearnerState;
    delete (legacyState.annotations[0] as Partial<LearnerState['annotations'][number]>).packId;
    const restored = parseBackupEnvelope(legacy);
    expect(restored.scope).toEqual({ kind: 'all' });
    expect(restored.state.annotations[0]).toMatchObject({ id: 'removed-pack:unknown-card', packId: 'removed-pack' });
  });

  it('exports and merges one pack without replacing another pack', () => {
    const current = stateFixture();
    current.events.push(review('other-event', { packId: 'other-pack', cardId: 'other-card' }));
    current.schedules.push({ packId: 'other-pack', cardId: 'other-card', stage: 1, due: NOW, revision: 1 });
    current.annotations.push({ id: 'other-pack:other-card', packId: 'other-pack', text: 'Keep me', updatedAt: NOW });
    const scoped = parseBackupEnvelope(makeBackup(current, { kind: 'pack', packId: 'removed-pack' }));
    expect(scoped.scope).toEqual({ kind: 'pack', packId: 'removed-pack' });
    expect(new Set(scoped.state.events.map(item => item.packId))).toEqual(new Set(['removed-pack']));
    scoped.state.annotations[0].text = 'Imported change';
    const merged = mergePackState(current, scoped.state, 'removed-pack');
    expect(merged.annotations.find(item => item.packId === 'removed-pack')?.text).toBe('Imported change');
    expect(merged.annotations.find(item => item.packId === 'other-pack')?.text).toBe('Keep me');
    expect(merged.events.some(item => item.packId === 'other-pack')).toBe(true);
  });

  it.each(['events', 'annotations', 'schedules'] as const)('rejects duplicate %s identities', key => {
    const state = stateFixture();
    const backup = makeBackup(state);
    change(backup, `state.${key}`, [state[key][0], state[key][0]]);
    expect(() => parseBackup(backup)).toThrow(/Duplicate/);
  });

  it('uses collision-safe pack/card tuples for schedule identity', () => {
    const state = stateFixture();
    const base = state.schedules[0];
    state.schedules = [
      { ...base, packId: 'a:b', cardId: 'c' }, { ...base, packId: 'a', cardId: 'b:c' },
      { ...base, packId: 'other', cardId: 'c' },
    ];
    expect(parseBackup(makeBackup(state)).schedules).toEqual(state.schedules);
  });

  it('rejects duplicate pending IDs, committed/pending overlap, and reversed pending times', () => {
    const state = stateFixture();
    state.session!.cardIds.push('third');
    state.session!.index = 2;
    state.session!.pending.push(review('pending', { sessionId: 'current-session', cardId: 'another-unknown-card' }));
    expect(() => makeBackup(state)).toThrow(/Duplicate/);
    state.session!.pending[1].id = 'committed';
    expect(() => makeBackup(state)).toThrow(/already committed/);
    state.session!.pending[1].id = 'second-pending';
    state.session!.pending[1].at = NOW - 1;
    expect(() => makeBackup(state)).toThrow(/chronological/);
  });

  it('accepts fresh/resumed sessions and completed sessions with drained pending reviews', () => {
    for (const mode of ['adaptive', 'due', 'topic', 'quiz', 'practice'] as const) {
      const state = stateFixture();
      state.session!.mode = mode;
      state.session!.index = 0;
      state.session!.pending = [];
      expect(parseBackup(makeBackup(state))).toEqual(state);
      state.session!.finished = true;
      state.session!.index = state.session!.cardIds.length;
      expect(parseBackup(makeBackup(state))).toEqual(state);
    }
  });
});

describe('IndexedDB singleton storage', () => {
  let storage: typeof import('../../src/storage');
  // Dexie's runtime registry is test-only introspection; it is not in its public typings.
  const connections = () => (Dexie as typeof Dexie & { connections: Dexie[] }).connections;
  const connection = () => connections().find(db => db.name === NAME)!;

  beforeEach(async () => {
    vi.resetModules();
    storage = await import('../../src/storage');
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    for (const db of [...connections()]) if (db.name === NAME) db.close();
    await Dexie.delete(NAME);
  });

  it('returns independently cloned defaults for each empty load', async () => {
    const first = await storage.loadState();
    first.settings.threshold = 1;
    first.events.push(review('changed'));
    expect(await storage.loadState()).toEqual(defaults);
    expect(defaults.settings.threshold).toBe(5);
    expect(defaults.events).toEqual([]);
  });

  it('reloads events, schedules, annotations and pending quiz after a fresh module/connection', async () => {
    const state = stateFixture();
    await storage.saveState(state);
    connection().close();
    vi.resetModules();
    const reloaded = await import('../../src/storage');
    expect(await reloaded.loadState()).toEqual(state);
    const loaded = await reloaded.loadState();
    loaded.session!.pending[0].rating = 'again';
    expect(await reloaded.loadState()).toEqual(state);
  });

  it('snapshots input immediately and replaces the entire state in the sole v1 record', async () => {
    const state = stateFixture();
    const expected = structuredClone(state);
    const saving = storage.saveState(state);
    state.events[0].cardId = 'mutated';
    state.session!.pending[0].rating = 'again';
    await saving;
    expect(await storage.loadState()).toEqual(expected);
    const replacement = structuredClone(defaults);
    replacement.annotations = [{ id: 'replacement', packId: 'replacement-pack', text: 'New', updatedAt: NOW }];
    await storage.saveState(replacement);
    expect(await storage.loadState()).toEqual(replacement);
    const db = connection();
    expect(db.verno).toBe(1);
    expect(db.tables.map(table => table.name)).toEqual(['learnerState']);
    expect(await db.table('learnerState').toArray()).toEqual([{ id: 'singleton', state: replacement }]);
  });

  it('leaves stored state unchanged when backup import or direct save validation fails', async () => {
    const state = stateFixture();
    await storage.saveState(state);
    const backup = makeBackup(state);
    change(backup, 'state.events.0.rating', 'bad');
    expect(() => parseBackup(backup)).toThrow();
    const invalid = structuredClone(state);
    invalid.schedules.push({ ...invalid.schedules[0] });
    await expect(storage.saveState(invalid)).rejects.toThrow();
    expect(await storage.loadState()).toEqual(state);
  });

  it('rolls back an aborted write and rejects instead of reporting success', async () => {
    const state = stateFixture();
    await storage.saveState(state);
    const table = connection().table('learnerState');
    table.hook('updating', function () {
      this.onsuccess = () => { Dexie.currentTransaction!.abort(); };
    });
    await expect(storage.saveState(structuredClone(defaults))).rejects.toThrow();
    expect(await storage.loadState()).toEqual(state);
  });

  it('propagates write errors and does not erase the previous state', async () => {
    const state = stateFixture();
    await storage.saveState(state);
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
      throw new DOMException('Storage quota exhausted', 'QuotaExceededError');
    });
    await expect(storage.saveState(structuredClone(defaults))).rejects.toThrow(/quota/i);
    expect(await storage.loadState()).toEqual(state);
  });

  it('rejects corrupt stored state rather than silently replacing it with defaults', async () => {
    await storage.loadState();
    await connection().table('learnerState').put({ id: 'singleton', state: { events: [] } });
    await expect(storage.loadState()).rejects.toThrow();
    expect((await connection().table('learnerState').get('singleton')).state).toEqual({ events: [] });
  });
});