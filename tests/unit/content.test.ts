import { describe, expect, it } from 'vitest';
import type { Pack } from '../../src/domain';
import { packs } from '../../src/content/catalog';
import { validatePack } from '../../src/validation';

const pack = packs.find(item => item.id === 'd365-contact-center')!;
const certificationPack = packs.find(item => item.id === 'ab-250-contact-center-ai-engineer')!;
const practicePack = packs.find(item => item.id === 'ab-250-original-practice')!;
const clone = () => structuredClone(pack);

describe('content catalog', () => {
  it('keeps the original general pack and installs a separate AB-250 certification pack', () => {
    expect(packs).toHaveLength(3);
    expect(pack.id).toBe('d365-contact-center');
    expect(pack.topics).toHaveLength(9);
    expect(pack.cards).toHaveLength(250);
    expect(pack.notes).toHaveLength(40);
    expect(pack.cards.filter(card => card.kind === 'recall')).toHaveLength(150);
    expect(pack.cards.filter(card => card.kind === 'mcq')).toHaveLength(100);
    expect(certificationPack.id).toBe('ab-250-contact-center-ai-engineer');
    expect(certificationPack.topics).toHaveLength(6);
    expect(certificationPack.cards).toHaveLength(264);
    expect(certificationPack.notes).toHaveLength(46);
    expect(certificationPack.cards.filter(card => card.kind === 'recall')).toHaveLength(157);
    expect(certificationPack.cards.filter(card => card.kind === 'mcq')).toHaveLength(107);
  });

  it('adds original practice with balanced recall and MCQ coverage in every AB-250 domain', () => {
    expect(practicePack.topics).toHaveLength(6);
    expect(practicePack.cards).toHaveLength(36);
    expect(practicePack.notes).toHaveLength(6);
    const existingPrompts = new Set([...pack.cards, ...certificationPack.cards].map(card => card.prompt));
    const existingIds = new Set([...pack.cards, ...certificationPack.cards].map(card => card.id));
    for (const topic of practicePack.topics) {
      const cards = practicePack.cards.filter(card => card.topicId === topic.id);
      expect(cards.filter(card => card.kind === 'recall')).toHaveLength(3);
      expect(cards.filter(card => card.kind === 'mcq')).toHaveLength(3);
      expect(practicePack.notes.filter(note => note.topicId === topic.id)).toHaveLength(1);
    }
    for (const card of practicePack.cards) {
      expect(existingPrompts.has(card.prompt)).toBe(false);
      expect(existingIds.has(card.id)).toBe(false);
    }
  });

  it.each([
    ['cc-foundations', 20, 3], ['cc-setup', 25, 4], ['cc-routing', 40, 6],
    ['cc-voice', 35, 5], ['cc-telephony', 50, 8], ['cc-digital', 20, 3],
    ['cc-experience', 20, 3], ['cc-operations', 20, 4], ['cc-implementation', 20, 4],
  ])('has the expected %s allocation', (topicId, cards, notes) => {
    expect(pack.cards.filter(card => card.topicId === topicId)).toHaveLength(cards as number);
    expect(pack.notes.filter(note => note.topicId === topicId)).toHaveLength(notes as number);
  });

  it.each([
    ['ab250-deploy', 67, 12], ['ab250-channels', 107, 17], ['ab250-ai', 4, 1],
    ['ab250-routing', 42, 7], ['ab250-representative', 22, 4], ['ab250-analytics', 22, 5],
  ])('aligns AB-250 domain %s to its expected card and note allocation', (topicId, cards, notes) => {
    expect(certificationPack.cards.filter(card => card.topicId === topicId)).toHaveLength(cards as number);
    expect(certificationPack.notes.filter(note => note.topicId === topicId)).toHaveLength(notes as number);
  });

  it('validates every installed pack without mutation', () => {
    for (const item of packs) {
      const original = structuredClone(item);
      expect(validatePack(item)).toEqual([]);
      expect(item).toEqual(original);
    }
    expect(new Set(packs.map(item => item.id)).size).toBe(packs.length);
  });

  it('has HTTPS citations with real calendar verification dates and complete source metadata', () => {
    for (const installedPack of packs) {
      for (const source of installedPack.sources) {
        expect(new URL(source.url).protocol).toBe('https:');
        expect(source.title.trim()).not.toBe('');
        expect(source.publisher.trim()).not.toBe('');
        expect(source.verified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(new Date(`${source.verified}T00:00:00Z`).toISOString().slice(0, 10)).toBe(source.verified);
      }
    }
  });
});

describe('pack validation', () => {
  it.each<[string, (pack: Pack) => void]>([
    ['blank pack title', p => { p.title = ' '; }],
    ['blank version', p => { p.version = ''; }],
    ['blank topic description', p => { p.topics[0].description = ''; }],
    ['duplicate topic', p => { p.topics.push(p.topics[0]); }],
    ['duplicate card', p => { p.cards.push(p.cards[0]); }],
    ['duplicate note', p => { p.notes.push(p.notes[0]); }],
    ['duplicate source', p => { p.sources.push(p.sources[0]); }],
    ['cross-entity ID collision', p => { p.notes[0].id = p.cards[0].id; }],
    ['unknown card topic', p => { p.cards[0].topicId = 'missing'; }],
    ['unknown note topic', p => { p.notes[0].topicId = 'missing'; }],
    ['unknown card source', p => { p.cards[0].sourceIds = ['missing']; }],
    ['unknown note source', p => { p.notes[0].sourceIds = ['missing']; }],
    ['unknown related note', p => { p.cards[0].noteIds = ['missing']; }],
    ['duplicate reference', p => { p.cards[0].sourceIds.push(p.cards[0].sourceIds[0]); }],
    ['duplicate note reference', p => { p.cards[0].noteIds.push(p.cards[0].noteIds[0]); }],
    ['missing card source', p => { p.cards[0].sourceIds = []; }],
    ['missing note source', p => { p.notes[0].sourceIds = []; }],
    ['missing related note', p => { p.cards[0].noteIds = []; }],
    ['blank prompt', p => { p.cards[0].prompt = ' '; }],
    ['blank answer', p => { p.cards[0].answer = ''; }],
    ['invalid revision', p => { p.cards[0].revision = 0; }],
    ['blank checkpoint', p => { p.cards[0].checkpoints = ['']; }],
    ['blank tag', p => { p.cards[0].tags = [' ']; }],
    ['blank note summary', p => { p.notes[0].summary = ''; }],
    ['missing sections', p => { p.notes[0].sections = []; }],
    ['blank section heading', p => { p.notes[0].sections[0].heading = ''; }],
    ['blank bullet', p => { p.notes[0].sections[0].bullets = ['']; }],
    ['missing source title', p => { p.sources[0].title = ''; }],
    ['missing source publisher', p => { p.sources[0].publisher = ' '; }],
    ['recall MCQ fields', p => { p.cards.find(card => card.kind === 'recall')!.correctOptionId = 'a'; }],
  ])('rejects %s', (_label, mutate) => {
    const edited = clone();
    mutate(edited);
    expect(validatePack(edited).length).toBeGreaterThan(0);
  });

  it.each(['http://example.com', 'javascript:alert(1)', '/relative', 'https://', 'https://user:pass@example.com', ' https://example.com'])('rejects unsafe source URL %s', url => {
    const edited = clone();
    edited.sources[0].url = url;
    expect(validatePack(edited).join('\n')).toMatch(/sources.*url/);
  });

  it.each(['', 'not-a-date', '2026-02-29', '2026-02-30', '2026-13-01', '2026-10-09T00:00:00Z'])('rejects invalid verification date %s', date => {
    const edited = clone();
    edited.sources[0].verified = date;
    expect(validatePack(edited).join('\n')).toMatch(/verified/);
  });

  it.each(['missing-options', 'three-options', 'five-options', 'duplicate-id', 'duplicate-text', 'blank-rationale', 'missing-correct', 'wrong-correct'])('rejects malformed MCQ: %s', problem => {
    const edited = clone();
    const card = edited.cards.find(item => item.kind === 'mcq')!;
    switch (problem) {
      case 'missing-options': delete card.options; break;
      case 'three-options': card.options!.pop(); break;
      case 'five-options': card.options!.push({ id: 'fifth', text: 'Another option', rationale: 'An explanation' }); break;
      case 'duplicate-id': card.options![1].id = card.options![0].id; break;
      case 'duplicate-text': card.options![1].text = ` ${card.options![0].text.toUpperCase()} `; break;
      case 'blank-rationale': card.options![2].rationale = ' '; break;
      case 'missing-correct': delete card.correctOptionId; break;
      case 'wrong-correct': card.correctOptionId = 'missing'; break;
    }
    expect(validatePack(edited).length).toBeGreaterThan(0);
  });

  it('returns actionable paths for runtime shape errors, rather than crashing', () => {
    expect(validatePack(null as unknown as Pack)).not.toHaveLength(0);
    const edited = clone();
    (edited.cards[0] as unknown as Record<string, unknown>).difficulty = 'Impossible';
    expect(validatePack(edited).join('\n')).toMatch(/cards\.0\.difficulty/);
  });
});
