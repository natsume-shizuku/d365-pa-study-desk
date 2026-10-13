import { describe, expect, it } from 'vitest';
import { packs } from '../../src/content/catalog';
import { optionLabel } from '../../src/optionLabels';

describe('MCQ display labels', () => {
  const cards = packs.flatMap(pack => pack.cards).filter(card => card.kind === 'mcq');
  it.each(cards)('$id uses A–D regardless of internal IDs', card => {
    const before = structuredClone(card);
    expect(card.options!.map(option => optionLabel(card, option.id))).toEqual(['A', 'B', 'C', 'D']);
    expect(card).toEqual(before);
  });
  it('does not expose unknown historical IDs', () => {
    expect(optionLabel(cards[0], 'removed-internal-option')).toBe('Unknown option');
    expect(optionLabel(cards[0], undefined)).toBe('Unknown option');
  });
  it('uses position, not an ID suffix or letter', () => {
    const card = { ...cards[0], options: [...cards[0].options!].reverse() };
    expect(optionLabel(card, card.options[0].id)).toBe('A');
  });
});