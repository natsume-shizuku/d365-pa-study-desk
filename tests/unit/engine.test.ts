import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Card, Rating, ReviewEvent, Schedule, Settings, StudySession } from '../../src/domain';
import { cardStatus, eligibleEvents, nextSchedule, selectCards, topicStats } from '../../src/engine';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 9, 12);
const settings: Settings = { threshold: 2, window: 5, sessionSize: 10 };
const card = (id = 'a', overrides: Partial<Card> = {}): Card => ({
  id, topicId: 'topic', revision: 1, kind: 'recall', difficulty: 'Foundation',
  prompt: 'Question', answer: 'Answer', checkpoints: [], tags: [], sourceIds: [], noteIds: [],
  ...overrides,
});
const event = (index: number, overrides: Partial<ReviewEvent> = {}): ReviewEvent => ({
  id: `event-${index}`, packId: 'pack', cardId: 'a', revision: 1, sessionId: `session-${index}`,
  at: NOW + index * 1000, rating: 'good', kind: 'recall', guessed: false, eligible: true,
  ...overrides,
});
const schedule = (cardId = 'a', overrides: Partial<Schedule> = {}): Schedule => ({
  cardId, packId: 'pack', stage: 0, due: NOW + DAY, revision: 1, ...overrides,
});
const history = (ratings: Rating[]): ReviewEvent[] => ratings.map((rating, i) => event(i, { rating }));
function seeded(seed = 42): () => number {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

describe('nextSchedule', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
  afterEach(() => vi.useRealTimers());

  it.each<{ rating: Rating; stage: number; delay: number }>([
    { rating: 'again', stage: -1, delay: 600_000 },
    { rating: 'hard', stage: -1, delay: DAY },
    { rating: 'good', stage: 0, delay: DAY },
    { rating: 'easy', stage: 1, delay: 3 * DAY },
  ])('schedules new $rating using the event timestamp', ({ rating, stage, delay }) => {
    const review = event(0, { rating, at: Date.now(), revision: 7 });
    vi.setSystemTime(NOW + 99 * DAY);
    expect(nextSchedule(undefined, review)).toEqual({ cardId: 'a', packId: 'pack', stage, due: NOW + delay, revision: 7 });
  });

  it('advances Good through all intervals and caps at 60 days', () => {
    let previous: Schedule | undefined;
    for (const [stage, days] of [1, 3, 7, 14, 30, 60, 60].entries()) {
      previous = nextSchedule(previous, event(stage, { at: Date.now() }));
      expect(previous.stage).toBe(Math.min(stage, 5));
      expect(previous.due).toBe(Date.now() + days * DAY);
    }
  });

  it('advances Easy two stages and bounds the result', () => {
    expect(nextSchedule(schedule('a', { stage: 1 }), event(0, { rating: 'easy' })).stage).toBe(3);
    expect(nextSchedule(schedule('a', { stage: 4 }), event(0, { rating: 'easy' }))).toMatchObject({ stage: 5, due: NOW + 60 * DAY });
  });

  it.each([-1, 0, 1, 2, 3, 4, 5])('keeps stage %i on Hard with a one-day minimum', stage => {
    const interval = [1, 3, 7, 14, 30, 60][Math.max(0, stage)];
    expect(nextSchedule(schedule('a', { stage }), event(0, { rating: 'hard' }))).toMatchObject({ stage, due: NOW + Math.max(1, interval / 2) * DAY });
  });

  it('resets Again and restarts Good from stage -1, including ineligible relearning', () => {
    const reset = nextSchedule(schedule('a', { stage: 5 }), event(0, { rating: 'again', eligible: false }));
    expect(reset).toMatchObject({ stage: -1, due: NOW + 600_000 });
    expect(nextSchedule(reset, event(1))).toMatchObject({ stage: 0, due: NOW + 1000 + DAY });
  });

  it('does not borrow another card or pack schedule or mutate its inputs', () => {
    const previous = Object.freeze(schedule('other', { stage: 5 }));
    const review = Object.freeze(event(0));
    expect(nextSchedule(previous, review).stage).toBe(0);
    expect(nextSchedule(schedule('a', { packId: 'other', stage: 5 }), review).stage).toBe(0);
    expect(previous.stage).toBe(5);
  });
});

describe('eligibleEvents', () => {
  it('filters flags, sorts chronologically, and keeps the first eligible card/pack/session attempt', () => {
    const first = event(1, { sessionId: 'same', rating: 'again' });
    const input = [event(5, { sessionId: 'same' }), event(0, { eligible: false, sessionId: 'same' }), first,
      event(2, { sessionId: 'same', cardId: 'b' }), event(3, { sessionId: 'same', packId: 'other' }), event(4)];
    const original = [...input];
    expect(eligibleEvents(input)).toEqual([first, input[3], input[4], input[5]]);
    expect(input).toEqual(original);
  });

  it('handles repeated submissions, tied timestamps, and delimiter-containing IDs', () => {
    const first = event(0, { cardId: 'a:b', packId: 'c' });
    const other = event(0, { cardId: 'a', packId: 'b:c' });
    expect(eligibleEvents([first, first, other])).toEqual([first, other]);
    expect(eligibleEvents([])).toEqual([]);
  });
});

describe('cardStatus', () => {
  it('has an empty initial state', () => {
    expect(cardStatus([], settings)).toEqual({ misses: 0, guesses: 0, repeat: false, resolved: false, recent: [] });
  });

  it('counts actual Again separately from guessed correct answers', () => {
    const input = [event(0, { guessed: true, rating: 'hard' }), event(1, { rating: 'again' }), event(2, { guessed: true })];
    expect(cardStatus(input, settings)).toMatchObject({ misses: 1, guesses: 2, repeat: false });
    expect(cardStatus([event(0, { rating: 'again', guessed: true })], settings)).toMatchObject({ misses: 1, guesses: 1 });
  });

  it('requires threshold within the rolling first-attempt window', () => {
    expect(cardStatus(history(['again', 'hard', 'hard', 'hard', 'hard', 'again']), settings).repeat).toBe(false);
    expect(cardStatus(history(['again', 'hard', 'again']), settings).repeat).toBe(true);
    const duplicate = event(1, { rating: 'again', sessionId: 'session-0' });
    expect(cardStatus([event(0, { rating: 'again' }), duplicate, event(2, { eligible: false, rating: 'again' })], settings).repeat).toBe(false);
  });

  it('persists after failures age out without three confident consecutive successes', () => {
    const input = history(['again', 'again', 'good', 'hard', 'easy', 'hard', 'good', 'hard']);
    expect(cardStatus(input, settings)).toMatchObject({ misses: 0, repeat: true, resolved: false });
  });

  it('resolves only after three confident successes across distinct sessions', () => {
    const input = history(['again', 'again', 'good', 'easy']);
    expect(cardStatus(input, settings).repeat).toBe(true);
    expect(cardStatus([...input, event(4, { sessionId: 'session-3' })], settings).repeat).toBe(true);
    expect(cardStatus([...input, event(4, { eligible: false })], settings).repeat).toBe(true);
    expect(cardStatus([...input, event(4)], settings)).toMatchObject({ repeat: false, resolved: true });
  });

  it('a guessed Good or Easy interrupts recovery, without becoming a miss', () => {
    for (const rating of ['good', 'easy'] as const) {
      const input = [...history(['again', 'again', 'good']), event(3, { rating, guessed: true }), event(4), event(5)];
      expect(cardStatus(input, settings)).toMatchObject({ repeat: true, guesses: 1 });
      expect(cardStatus([...input, event(6)], settings)).toMatchObject({ repeat: false, resolved: true });
    }
  });

  it('starts a fresh episode after resolution even while old failures remain in the window', () => {
    const wide: Settings = { ...settings, window: 20 };
    const resolved = history(['again', 'again', 'good', 'easy', 'good']);
    expect(cardStatus([...resolved, event(5)], wide)).toMatchObject({ repeat: false, resolved: true });
    const oneNewMiss = [...resolved, event(5, { rating: 'again' })];
    expect(cardStatus(oneNewMiss, wide)).toMatchObject({ misses: 3, repeat: false, resolved: true });
    const recurrence = [...oneNewMiss, event(6, { rating: 'again' })];
    expect(cardStatus(recurrence, wide)).toMatchObject({ repeat: true, resolved: false });
    expect(cardStatus([...recurrence, event(7), event(8), event(9)], wide)).toMatchObject({ repeat: false, resolved: true });
  });

  it('returns only the recent window without mutating the log', () => {
    const input = history(['again', 'again', 'hard', 'good', 'easy', 'hard']);
    const copy = structuredClone(input);
    expect(cardStatus(input, settings).recent).toEqual(input.slice(-5));
    expect(input).toEqual(copy);
  });
});

describe('topicStats', () => {
  const cards = [card('a'), card('b'), card('c')];
  const attempts = (ratings: Rating[]): ReviewEvent[] => ratings.map((rating, i) => event(i, { rating, cardId: cards[i % 3].id }));

  it('does not invent a zero score for unstudied cards or unrelated history', () => {
    expect(topicStats(cards, [event(0, { cardId: 'other' }), event(1, { eligible: false })])).toEqual({
      attempts: 0, seen: 0, score: null, label: 'Not studied', mcqAccuracy: null,
    });
  });

  it('requires both five attempts and three distinct cards', () => {
    expect(topicStats(cards, attempts(['good', 'good', 'good', 'good'])).label).toBe('Not enough history');
    expect(topicStats(cards, history(['good', 'good', 'good', 'good', 'good'])).label).toBe('Not enough history');
    expect(topicStats(cards, attempts(['good', 'good', 'good', 'good', 'good'])).label).toBe('Strong');
  });

  it.each<{ ratings: Rating[]; score: number; label: string }>([
    { ratings: ['again', 'hard', 'good', 'easy', 'again'], score: 0.5, label: 'Needs review' },
    { ratings: ['again', 'again', 'good', 'good', 'easy'], score: 0.6, label: 'Learning' },
    { ratings: ['hard', 'hard', 'good', 'good', 'easy'], score: 0.8, label: 'Learning' },
    { ratings: ['again', 'hard', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], score: 0.85, label: 'Strong' },
  ])('scores $score as $label', ({ ratings, score, label }) => {
    expect(topicStats(cards, attempts(ratings))).toMatchObject({ score, label });
  });

  it('uses the latest 20 eligible attempts after filtering, sorting, and deduplicating', () => {
    const input = attempts(Array<Rating>(23).fill('good'));
    input[0].rating = 'again';
    const duplicate = { ...input[22], id: 'duplicate', at: NOW + 100_000, rating: 'again' as const };
    const noise = Array.from({ length: 30 }, (_, i) => event(100 + i, { cardId: 'other' }));
    expect(topicStats(cards, [...noise, duplicate, ...input].reverse())).toMatchObject({ attempts: 20, seen: 3, score: 1, label: 'Strong' });
  });

  it('reports raw MCQ correctness, including guesses, independently of weighted ratings', () => {
    const quizCards = [card('a', { kind: 'mcq', correctOptionId: 'yes' }), card('b')];
    const input = [event(0, { kind: 'mcq', selectedOptionId: 'yes', rating: 'hard', guessed: true }),
      event(1, { kind: 'mcq', selectedOptionId: 'no', rating: 'again' }),
      event(2, { cardId: 'b', rating: 'easy' })];
    expect(topicStats(quizCards, input)).toMatchObject({ attempts: 3, score: 0.5, mcqAccuracy: 0.5 });
    expect(topicStats(quizCards, [event(3, { kind: 'mcq', rating: 'hard', guessed: true })]).mcqAccuracy).toBe(1);
    // Historical outcomes remain correct even if the current answer changes.
    expect(topicStats(quizCards, [event(4, { kind: 'mcq', selectedOptionId: 'no', rating: 'good' })]).mcqAccuracy).toBe(1);
  });
});

describe('selectCards', () => {
  const choose = (cards: Card[], events: ReviewEvent[] = [], schedules: Schedule[] = [],
    mode: StudySession['mode'] = 'adaptive', limit = 10): Card[] =>
    selectCards(cards, events, schedules, mode, limit, NOW, seeded());

  it('Due includes only existing schedules due now or with a revision mismatch', () => {
    const cards = ['due', 'overdue', 'future', 'revised', 'new'].map(id => card(id));
    const schedules = [schedule('due', { due: NOW }), schedule('overdue', { due: NOW - 1 }),
      schedule('future', { due: NOW + 1 }), schedule('revised', { revision: 0 })];
    expect(choose(cards, [], schedules, 'due').map(c => c.id).sort()).toEqual(['due', 'overdue', 'revised']);
    expect(choose([card()], [], [schedule()], 'due')).toEqual([]);
    expect(choose([card()], [], [], 'due')).toEqual([]);
  });

  it('targets 50% due, 30% weak, and 20% unseen for disjoint pools', () => {
    const due = Array.from({ length: 10 }, (_, i) => card(`due-${i}`));
    const weak = Array.from({ length: 10 }, (_, i) => card(`weak-${i}`));
    const unseen = Array.from({ length: 10 }, (_, i) => card(`new-${i}`));
    const selected = choose([...due, ...weak, ...unseen], weak.map((c, i) => event(i, { cardId: c.id, rating: 'hard' })),
      due.map(c => schedule(c.id, { due: NOW })));
    expect(selected.filter(c => c.id.startsWith('due')).length).toBe(5);
    expect(selected.filter(c => c.id.startsWith('weak')).length).toBe(3);
    expect(selected.filter(c => c.id.startsWith('new')).length).toBe(2);
  });

  it('deduplicates overlapping buckets and input cards, refilling available slots', () => {
    const cards = Array.from({ length: 12 }, (_, i) => card(`c${i}`));
    const events = cards.slice(0, 8).map((c, i) => event(i, { cardId: c.id, rating: 'again' }));
    const schedules = cards.slice(0, 8).map(c => schedule(c.id, { due: NOW }));
    const selected = choose([...cards, ...cards], events, schedules);
    expect(selected).toHaveLength(10);
    expect(new Set(selected.map(c => c.id)).size).toBe(10);
  });

  it.each(['due', 'weak', 'unseen'] as const)('refills solely from the %s pool when others are empty', pool => {
    const cards = Array.from({ length: 12 }, (_, i) => card(`c${i}`));
    const events = pool === 'weak' ? cards.map((c, i) => event(i, { cardId: c.id, rating: 'hard' })) : [];
    const schedules = pool === 'due' ? cards.map(c => schedule(c.id, { due: NOW })) : [];
    expect(choose(cards, events, schedules)).toHaveLength(10);
  });

  it('never fills with healthy future cards, even without their event log', () => {
    const cards = [card('future'), card('logged'), card('unseen')];
    const events = [event(0, { cardId: 'logged' })];
    const schedules = [schedule('future'), schedule('logged')];
    expect(choose(cards, events, schedules).map(c => c.id)).toEqual(['unseen']);
    expect(choose(cards.slice(0, 2), events, schedules)).toEqual([]);
    expect(choose([card()], [event(0)])).toEqual([]);
  });

  it('includes guessed and persistent repeat cards without suspending them', () => {
    const repeats = history(['again', 'again', 'again', 'again', 'again', 'good']);
    expect(choose([card()], repeats, [schedule()])).toHaveLength(1);
    expect(choose([card()], [event(0, { guessed: true })], [schedule()])).toHaveLength(1);
    expect(choose([card()], [...repeats, event(6), event(7)], [schedule()])).toEqual([]);
  });

  it('Quiz selects only MCQs, while Topic and Practice include future cards', () => {
    const cards = [card('recall'), card('mcq', { kind: 'mcq' })];
    expect(choose(cards, [], [], 'quiz').map(c => c.id)).toEqual(['mcq']);
    for (const mode of ['topic', 'practice'] as const) {
      expect(choose(cards, [], cards.map(c => schedule(c.id)), mode)).toHaveLength(2);
    }
    expect(choose([card()], [], [], 'quiz')).toEqual([]);
  });

  it('uses seeded shuffling reproducibly and leaves all input arrays untouched', () => {
    const cards = Array.from({ length: 20 }, (_, i) => card(`c${i}`));
    const events = [event(0)];
    const schedules = [schedule()];
    const snapshot = structuredClone({ cards, events, schedules });
    const first = choose(cards, events, schedules, 'practice');
    expect(first).toEqual(choose(cards, events, schedules, 'practice'));
    expect(first).not.toEqual(selectCards(cards, events, schedules, 'practice', 10, NOW, seeded(99)));
    expect({ cards, events, schedules }).toEqual(snapshot);
  });

  it.each(['adaptive', 'due', 'topic', 'practice', 'quiz'] as const)('handles empty pools and limits in %s', mode => {
    expect(choose([], [], [], mode)).toEqual([]);
    expect(choose([card()], [], [], mode, 0)).toEqual([]);
    expect(choose([card()], [], [], mode, -1)).toEqual([]);
    expect(choose([card()], [], [], mode, Number.NaN)).toEqual([]);
    const cards = Array.from({ length: 3 }, (_, i) => card(`c${i}`, { kind: 'mcq' }));
    const schedules = mode === 'due' ? cards.map(c => schedule(c.id, { due: NOW })) : [];
    expect(choose(cards, [], schedules, mode, 1.8)).toHaveLength(1);
    expect(choose([...cards, ...cards], [], schedules, mode, 100)).toHaveLength(3);
  });
});