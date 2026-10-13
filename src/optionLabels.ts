import type { Card } from './domain';

/** Display position is independent of the stable option ID used in saved reviews. */
export function optionLabel(card: Card, optionId: string | undefined): string {
  const index = card.options?.findIndex(option => option.id === optionId) ?? -1;
  return index >= 0 && index < 26 ? String.fromCharCode(65 + index) : 'Unknown option';
}