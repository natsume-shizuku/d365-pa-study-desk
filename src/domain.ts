export type Rating = 'again' | 'hard' | 'good' | 'easy';
export type Difficulty = 'Foundation' | 'Applied' | 'Advanced';
export interface Source { id: string; title: string; url: string; verified: string; publisher: string }
export interface Topic { id: string; title: string; description: string }
export interface Option { id: string; text: string; rationale: string }
export interface Card {
  id: string; topicId: string; revision: number; kind: 'recall' | 'mcq';
  difficulty: Difficulty; prompt: string; answer: string; checkpoints: string[];
  tags: string[]; sourceIds: string[]; noteIds: string[];
  options?: Option[]; correctOptionId?: string;
}
export interface Note {
  id: string; topicId: string; title: string; summary: string;
  sections: { heading: string; bullets: string[] }[];
  tags: string[]; sourceIds: string[];
}
export interface Pack {
  id: string; title: string; description: string; version: string;
  topics: Topic[]; cards: Card[]; notes: Note[]; sources: Source[];
}
export interface ReviewEvent {
  id: string; packId: string; cardId: string; revision: number; sessionId: string;
  at: number; rating: Rating; kind: 'recall' | 'mcq'; guessed: boolean;
  selectedOptionId?: string; eligible: boolean;
}
export interface Schedule { cardId: string; packId: string; stage: number; due: number; revision: number }
export interface Annotation { id: string; packId: string; text: string; updatedAt: number }
export interface Settings { threshold: number; window: number; sessionSize: number }
export interface StudySession {
  id: string; packId: string; mode: 'adaptive' | 'due' | 'topic' | 'quiz' | 'practice';
  cardIds: string[]; index: number; startedAt: number; finished: boolean;
  pending: ReviewEvent[];
}
export interface LearnerState {
  events: ReviewEvent[]; schedules: Schedule[]; annotations: Annotation[];
  settings: Settings; session: StudySession | null;
}
export const defaults: LearnerState = {
  events: [], schedules: [], annotations: [],
  settings: { threshold: 5, window: 10, sessionSize: 20 }, session: null,
};