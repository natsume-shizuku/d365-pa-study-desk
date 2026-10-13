import Dexie, { type Table } from 'dexie';
import { defaults, type LearnerState } from './domain';
import { validateState } from './validation';

interface StateRecord { id: 'singleton'; state: LearnerState }

const database = new Dexie('d365-pa-study-desk');
database.version(1).stores({ learnerState: 'id' });
const records: Table<StateRecord, string> = database.table('learnerState');

/** Missing data gets a fresh copy; corrupt/unavailable storage is never silently reset. */
export async function loadState(): Promise<LearnerState> {
  const record = await records.get('singleton');
  return validateState(record === undefined ? defaults : record.state);
}

/** Whole-state replacement in one transaction. The UI owns the single-writer web lock. */
export async function saveState(state: LearnerState): Promise<void> {
  // Parsing also snapshots nested input before the first await, preventing caller mutation
  // during asynchronous IndexedDB work from splitting a logical learner-state update.
  const snapshot = validateState(state);
  await database.transaction('rw', records, async () => {
    await records.put({ id: 'singleton', state: snapshot });
  });
}