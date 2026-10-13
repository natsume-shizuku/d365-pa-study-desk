import { z } from 'zod';
import type { LearnerState, Pack } from './domain';

const requiredString = z.string().refine(value => value.trim().length > 0, 'Must not be blank');
const positiveInteger = z.number().int().positive();
// Valid, nonnegative UTC instants representable by JavaScript Date; never coerce strings.
const timestamp = z.number().finite().min(0).max(8_640_000_000_000_000);
const kind = z.enum(['recall', 'mcq']);

const eventSchema = z.strictObject({
  id: requiredString, packId: requiredString, cardId: requiredString,
  revision: positiveInteger, sessionId: requiredString, at: timestamp,
  rating: z.enum(['again', 'hard', 'good', 'easy']), kind,
  guessed: z.boolean(), selectedOptionId: requiredString.optional(), eligible: z.boolean(),
}).superRefine((event, ctx) => {
  if (event.kind === 'recall' && event.selectedOptionId !== undefined) {
    ctx.addIssue({ code: 'custom', path: ['selectedOptionId'], message: 'Recall events cannot have an MCQ selection' });
  }
  // Older MCQ history can be rating-only (see topicStats). If supplied, a choice
  // must be a nonblank string; never resolve it against today's mutable catalog.
});

const scheduleSchema = z.strictObject({
  cardId: requiredString, packId: requiredString,
  stage: z.number().int().min(-1).max(5), due: timestamp, revision: positiveInteger,
});
const annotationSchema = z.strictObject({
  id: requiredString, packId: requiredString,
  // Empty personal text is valid: clearing a note must be persistable.
  text: z.string(), updatedAt: timestamp,
});
const settingsSchema = z.strictObject({
  threshold: positiveInteger, window: positiveInteger, sessionSize: positiveInteger,
}).refine(settings => settings.threshold <= settings.window, {
  path: ['threshold'], message: 'Threshold must not exceed the review window',
});
const sessionSchema = z.strictObject({
  id: requiredString, packId: requiredString,
  mode: z.enum(['adaptive', 'due', 'topic', 'quiz', 'practice']),
  cardIds: z.array(requiredString), index: z.number().int().nonnegative(),
  startedAt: timestamp, finished: z.boolean(), pending: z.array(eventSchema),
}).superRefine((session, ctx) => {
  const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message });
  if (session.index > session.cardIds.length
    || (session.finished && session.index !== session.cardIds.length)
    || (!session.finished && session.index === session.cardIds.length)) {
    issue(['index'], 'Session index must point to the next card, or the end of a finished session');
  }
  if (session.mode !== 'quiz' || session.finished) {
    if (session.pending.length) issue(['pending'], 'Only an unfinished quiz may hold pending reviews');
  } else if (session.pending.length !== session.index) {
    issue(['pending'], 'Quiz pending reviews must match the completed prefix of the session');
  }
  session.pending.forEach((event, index) => {
    if (event.sessionId !== session.id) issue(['pending', index, 'sessionId'], 'Pending review belongs to another session');
    if (event.packId !== session.packId) issue(['pending', index, 'packId'], 'Pending review belongs to another pack');
    if (event.cardId !== session.cardIds[index]) issue(['pending', index, 'cardId'], 'Pending review does not match the session card order');
    if (event.kind !== 'mcq') issue(['pending', index, 'kind'], 'Quiz reviews must be MCQs');
    if (event.selectedOptionId === undefined) issue(['pending', index, 'selectedOptionId'], 'Pending MCQ reviews require a selection');
    if (event.at < session.startedAt) issue(['pending', index, 'at'], 'Pending review predates the session');
    if (index > 0 && event.at < session.pending[index - 1].at) issue(['pending', index, 'at'], 'Pending reviews must be chronological');
  });
});

function checkDuplicates<T>(
  items: T[], key: (item: T) => string, path: (string | number)[], ctx: z.RefinementCtx,
): void {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    const id = key(item);
    if (seen.has(id)) ctx.addIssue({ code: 'custom', path: [...path, index], message: `Duplicate ID: ${id}` });
    seen.add(id);
  });
}

const stateSchema = z.strictObject({
  events: z.array(eventSchema), schedules: z.array(scheduleSchema),
  annotations: z.array(annotationSchema), settings: settingsSchema, session: sessionSchema.nullable(),
}).superRefine((state, ctx) => {
  checkDuplicates(state.events, event => event.id, ['events'], ctx);
  // A tuple, not concatenation, avoids collisions when IDs themselves contain delimiters.
  checkDuplicates(state.schedules, schedule => JSON.stringify([schedule.packId, schedule.cardId]), ['schedules'], ctx);
  checkDuplicates(state.annotations, annotation => JSON.stringify([annotation.packId, annotation.id]), ['annotations'], ctx);
  if (state.session) {
    checkDuplicates(state.session.pending, event => event.id, ['session', 'pending'], ctx);
    const committedIds = new Set(state.events.map(event => event.id));
    state.session.pending.forEach((event, index) => {
      if (committedIds.has(event.id)) ctx.addIssue({
        code: 'custom', path: ['session', 'pending', index, 'id'], message: 'Pending review is already committed',
      });
    });
  }
});

const allPacksScopeSchema = z.strictObject({ kind: z.literal('all') });
const onePackScopeSchema = z.strictObject({ kind: z.literal('pack'), packId: requiredString });
const backupScopeSchema = z.union([allPacksScopeSchema, onePackScopeSchema]);
const legacyBackupSchema = z.strictObject({
  format: z.literal('d365-pa-study-desk'), version: z.literal(1),
  exportedAt: z.iso.datetime({ offset: true }), state: z.unknown(),
});
const backupSchema = z.strictObject({
  format: z.literal('d365-pa-study-desk'), version: z.literal(2),
  exportedAt: z.iso.datetime({ offset: true }), scope: backupScopeSchema, state: z.unknown(),
});

export type BackupScope = z.infer<typeof backupScopeSchema>;
export interface ParsedBackup { state: LearnerState; scope: BackupScope }

function migrateLegacyAnnotations(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const state = structuredClone(input) as Record<string, unknown>;
  if (!Array.isArray(state.annotations)) return state;
  const knownPackIds = new Set<string>();
  for (const key of ['events', 'schedules'] as const) {
    if (Array.isArray(state[key])) for (const item of state[key]) {
      if (item && typeof item === 'object' && typeof (item as Record<string, unknown>).packId === 'string') {
        knownPackIds.add((item as Record<string, unknown>).packId as string);
      }
    }
  }
  if (state.session && typeof state.session === 'object' && typeof (state.session as Record<string, unknown>).packId === 'string') {
    knownPackIds.add((state.session as Record<string, unknown>).packId as string);
  }
  state.annotations = state.annotations.map(annotation => {
    if (!annotation || typeof annotation !== 'object' || Array.isArray(annotation)) return annotation;
    const item = annotation as Record<string, unknown>;
    if (typeof item.packId === 'string') return item;
    const id = typeof item.id === 'string' ? item.id : '';
    const packId = [...knownPackIds].find(value => id.startsWith(`${value}:`))
      ?? (knownPackIds.size === 1 ? [...knownPackIds][0] : undefined);
    return packId ? { ...item, packId } : item;
  });
  return state;
}

/** Validate and clone persisted state without depending on installed card IDs. */
export function validateState(input: unknown): LearnerState {
  return stateSchema.parse(migrateLegacyAnnotations(input));
}

/** Expects a parsed JSON object, not a JSON string. Throws before any storage write. */
export function parseBackup(input: unknown): LearnerState {
  return parseBackupEnvelope(input).state;
}

export function parseBackupEnvelope(input: unknown): ParsedBackup {
  const legacy = legacyBackupSchema.safeParse(input);
  const envelope = legacy.success ? legacy.data : backupSchema.parse(input);
  const scope: BackupScope = envelope.version === 1 ? { kind: 'all' } : envelope.scope;
  const state = validateState(envelope.state);
  if (scope.kind === 'pack') {
    const wrongPack = state.events.some(item => item.packId !== scope.packId)
      || state.schedules.some(item => item.packId !== scope.packId)
      || state.annotations.some(item => item.packId !== scope.packId)
      || (state.session !== null && state.session.packId !== scope.packId);
    if (wrongPack) throw new Error(`Pack backup contains data outside ${scope.packId}`);
  }
  return { state, scope };
}

export function stateForPack(state: LearnerState, packId: string): LearnerState {
  const valid = validateState(state);
  return validateState({
    ...valid,
    events: valid.events.filter(item => item.packId === packId),
    schedules: valid.schedules.filter(item => item.packId === packId),
    annotations: valid.annotations.filter(item => item.packId === packId),
    session: valid.session?.packId === packId ? valid.session : null,
  });
}

export function mergePackState(current: LearnerState, imported: LearnerState, packId: string): LearnerState {
  const base = validateState(current);
  const incoming = stateForPack(imported, packId);
  return validateState({
    ...base,
    settings: incoming.settings,
    events: [...base.events.filter(item => item.packId !== packId), ...incoming.events],
    schedules: [...base.schedules.filter(item => item.packId !== packId), ...incoming.schedules],
    annotations: [...base.annotations.filter(item => item.packId !== packId), ...incoming.annotations],
    session: incoming.session ?? (base.session?.packId === packId ? null : base.session),
  });
}

export function makeBackup(state: LearnerState, scope: BackupScope = { kind: 'all' }): object {
  const snapshot = scope.kind === 'pack' ? stateForPack(state, scope.packId) : validateState(state);
  return {
    format: 'd365-pa-study-desk', version: 2, exportedAt: new Date().toISOString(),
    scope, state: snapshot,
  };
}

const strings = z.array(requiredString);
const sourceSchema = z.strictObject({
  id: requiredString, title: requiredString, publisher: requiredString,
  url: requiredString.refine(value => {
    try {
      const url = new URL(value);
      return value === value.trim() && /^https:\/\//i.test(value)
        && url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
    } catch { return false; }
  }, 'Source URL must be absolute HTTPS without credentials'),
  verified: z.iso.date(),
});
const topicSchema = z.strictObject({ id: requiredString, title: requiredString, description: requiredString });
const optionSchema = z.strictObject({ id: requiredString, text: requiredString, rationale: requiredString });
const cardSchema = z.strictObject({
  id: requiredString, topicId: requiredString, revision: positiveInteger, kind,
  difficulty: z.enum(['Foundation', 'Applied', 'Advanced']), prompt: requiredString, answer: requiredString,
  checkpoints: strings.min(1), tags: strings, sourceIds: strings.min(1), noteIds: strings.min(1),
  options: z.array(optionSchema).optional(), correctOptionId: requiredString.optional(),
}).superRefine((card, ctx) => {
  if (card.kind === 'recall') {
    if (card.options !== undefined || card.correctOptionId !== undefined) ctx.addIssue({
      code: 'custom', path: ['options'], message: 'Recall cards cannot have MCQ fields',
    });
    return;
  }
  if (card.options?.length !== 4) ctx.addIssue({ code: 'custom', path: ['options'], message: 'MCQ requires exactly four options' });
  const options = card.options ?? [];
  checkDuplicates(options, option => option.id, ['options'], ctx);
  checkDuplicates(options, option => option.text.trim().replace(/\s+/g, ' ').toLowerCase(), ['options'], ctx);
  if (!options.some(option => option.id === card.correctOptionId)) ctx.addIssue({
    code: 'custom', path: ['correctOptionId'], message: 'Correct option must reference an option on this MCQ',
  });
});
const noteSchema = z.strictObject({
  id: requiredString, topicId: requiredString, title: requiredString, summary: requiredString,
  sections: z.array(z.strictObject({ heading: requiredString, bullets: strings.min(1) })).min(1),
  tags: strings, sourceIds: strings.min(1),
});
const packSchema = z.strictObject({
  id: requiredString, title: requiredString, description: requiredString, version: requiredString,
  topics: z.array(topicSchema).min(1), cards: z.array(cardSchema).min(1),
  notes: z.array(noteSchema).min(1), sources: z.array(sourceSchema).min(1),
}).superRefine((pack, ctx) => {
  const ids = new Set([pack.id]);
  for (const collection of ['topics', 'cards', 'notes', 'sources'] as const) {
    pack[collection].forEach((item, index) => {
      if (ids.has(item.id)) ctx.addIssue({ code: 'custom', path: [collection, index, 'id'], message: `Duplicate ID: ${item.id}` });
      ids.add(item.id);
    });
  }
  const topics = new Set(pack.topics.map(topic => topic.id));
  const sources = new Set(pack.sources.map(source => source.id));
  const notes = new Set(pack.notes.map(note => note.id));
  const references = (refs: string[], targets: Set<string>, path: (string | number)[]) => {
    checkDuplicates(refs, ref => ref, path, ctx);
    refs.forEach((ref, index) => {
      if (!targets.has(ref)) ctx.addIssue({ code: 'custom', path: [...path, index], message: `Unknown reference: ${ref}` });
    });
  };
  for (const collection of ['cards', 'notes'] as const) {
    pack[collection].forEach((item, index) => {
      if (!topics.has(item.topicId)) ctx.addIssue({ code: 'custom', path: [collection, index, 'topicId'], message: `Unknown topic: ${item.topicId}` });
      references(item.sourceIds, sources, [collection, index, 'sourceIds']);
      checkDuplicates(item.tags, tag => tag, [collection, index, 'tags'], ctx);
    });
  }
  pack.cards.forEach((card, index) => references(card.noteIds, notes, ['cards', index, 'noteIds']));
});

/** Structural/reference checks only; does not claim remote links or facts were verified. */
export function validatePack(pack: Pack): string[] {
  const result = packSchema.safeParse(pack);
  return result.success ? [] : result.error.issues.map(issue => `${issue.path.join('.') || 'pack'}: ${issue.message}`);
}