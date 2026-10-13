import { defaults } from './domain';
import type { Card, ReviewEvent, Schedule, Settings, StudySession } from './domain';

const DAY = 24 * 60 * 60 * 1000;
const INTERVALS = [1, 3, 7, 14, 30, 60] as const;

export function nextSchedule(previous: Schedule | undefined, event: ReviewEvent): Schedule {
  const matches = previous?.cardId === event.cardId && previous.packId === event.packId;
  let stage = matches ? Math.max(-1, Math.min(INTERVALS.length - 1, previous.stage)) : -1;
  let delay: number;
  if (event.rating === 'again') {
    stage = -1;
    delay = 10 * 60 * 1000;
  } else if (event.rating === 'hard') {
    delay = Math.max(1, INTERVALS[Math.max(0, stage)] / 2) * DAY;
  } else {
    stage = Math.min(INTERVALS.length - 1, stage + (event.rating === 'easy' ? 2 : 1));
    delay = INTERVALS[stage] * DAY;
  }
  return { cardId: event.cardId, packId: event.packId, stage, due: event.at + delay, revision: event.revision };
}

/** Chronological first eligible attempts; ties retain input order. Never mutates input. */
export function eligibleEvents(events: ReviewEvent[]): ReviewEvent[] {
  const seen = new Set<string>();
  return events.filter(event => event.eligible).sort((a, b) => a.at - b.at).filter(event => {
    const key = JSON.stringify([event.cardId, event.packId, event.sessionId]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function cardStatus(events: ReviewEvent[], settings: Settings): {
  misses: number; guesses: number; repeat: boolean; resolved: boolean; recent: ReviewEvent[];
} {
  const attempts = eligibleEvents(events);
  const window = Math.max(1, Math.floor(settings.window));
  const threshold = Math.max(1, Math.floor(settings.threshold));
  const recent = attempts.slice(-window);
  let episode: ReviewEvent[] = [];
  let repeat = false;
  let resolved = false;
  const successfulSessions = new Set<string>();

  for (const event of attempts) {
    episode.push(event);
    if (episode.length > window) episode.shift();
    if (!repeat && episode.filter(attempt => attempt.rating === 'again').length >= threshold) {
      repeat = true;
      resolved = false;
      successfulSessions.clear();
    }
    if (!repeat) continue;
    if (!event.guessed && (event.rating === 'good' || event.rating === 'easy')) {
      successfulSessions.add(JSON.stringify([event.packId, event.sessionId]));
      if (successfulSessions.size === 3) {
        repeat = false;
        resolved = true;
        // A resolved episode must not lend its failures to the next episode.
        episode = [];
        successfulSessions.clear();
      }
    } else {
      successfulSessions.clear();
    }
  }
  return {
    misses: recent.filter(event => event.rating === 'again').length,
    guesses: recent.filter(event => event.guessed).length,
    repeat, resolved, recent,
  };
}

export function topicStats(cards: Card[], events: ReviewEvent[]): {
  attempts: number; seen: number; score: number | null; label: string; mcqAccuracy: number | null;
} {
  const byId = new Map(cards.map(card => [card.id, card]));
  const recent = eligibleEvents(events.filter(event => byId.has(event.cardId))).slice(-20);
  const attempts = recent.length;
  const seen = new Set(recent.map(event => event.cardId)).size;
  const score = attempts === 0 ? null : recent.reduce((sum, event) =>
    sum + (event.rating === 'again' ? 0 : event.rating === 'hard' ? 0.5 : 1), 0) / attempts;
  const mcqs = recent.filter(event => event.kind === 'mcq');
  // Ratings store the outcome at review time. A later content revision must not
  // silently regrade historical answers against today's correct option.
  const correct = mcqs.filter(event => event.rating !== 'again').length;
  const label = score === null ? 'Not studied'
    : attempts < 5 || seen < 3 ? 'Not enough history'
      : score < 0.6 ? 'Needs review' : score < 0.85 ? 'Learning' : 'Strong';
  return { attempts, seen, score, label, mcqAccuracy: mcqs.length ? correct / mcqs.length : null };
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function selectCards(
  cards: Card[], events: ReviewEvent[], schedules: Schedule[], mode: StudySession['mode'],
  limit: number, now: number, random: () => number = Math.random, settings: Settings = defaults.settings,
): Card[] {
  if (Number.isNaN(limit) || limit <= 0) return [];
  // Card has no packId: callers scope cards/schedules to the active pack.
  const unique = [...new Map(cards.map(card => [card.id, card])).values()];
  const size = Math.min(unique.length, Math.floor(limit));
  if (mode === 'topic' || mode === 'practice' || mode === 'quiz') {
    return shuffled(mode === 'quiz' ? unique.filter(card => card.kind === 'mcq') : unique, random).slice(0, size);
  }
  const bySchedule = new Map(schedules.map(schedule => [schedule.cardId, schedule]));
  const due = unique.filter(card => {
    const schedule = bySchedule.get(card.id);
    return schedule !== undefined && (schedule.due <= now || schedule.revision !== card.revision);
  });
  if (mode === 'due') return shuffled(due, random).slice(0, size);

  const byCard = new Map<string, ReviewEvent[]>();
  for (const event of eligibleEvents(events)) {
    const history = byCard.get(event.cardId) ?? [];
    history.push(event);
    byCard.set(event.cardId, history);
  }
  const weak = unique.filter(card => {
    const history = byCard.get(card.id);
    if (!history?.length) return false;
    const last = history[history.length - 1];
    return last.guessed || last.rating === 'again' || last.rating === 'hard'
      || cardStatus(history, settings).repeat;
  });
  // A schedule itself is evidence that a card has been studied, even if its log is absent.
  const unseen = unique.filter(card => !byCard.has(card.id) && !bySchedule.has(card.id));
  const pools = [shuffled(due, random), shuffled(weak, random), shuffled(unseen, random)];
  const quotas = [Math.floor(size * 0.5), Math.floor(size * 0.3)];
  quotas.push(size - quotas[0] - quotas[1]);
  const selected: Card[] = [];
  const ids = new Set<string>();
  const take = (pool: Card[], count: number): void => {
    let taken = 0;
    for (const card of pool) {
      if (taken >= count || selected.length >= size) break;
      if (ids.has(card.id)) continue;
      ids.add(card.id);
      selected.push(card);
      taken++;
    }
  };
  pools.forEach((pool, index) => take(pool, quotas[index]));
  // Refill exclusively from these pools, never from healthy future-due cards.
  take(shuffled(pools.flat(), random), size - selected.length);
  return shuffled(selected, random);
}