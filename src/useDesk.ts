import { useCallback, useEffect, useRef, useState } from 'react';
import { defaults, type LearnerState } from './domain';
import { loadState, saveState } from './storage';

export function useDesk() {
  const [state, setState] = useState<LearnerState>(structuredClone(defaults));
  const [ready, setReady] = useState(false);
  const [writable, setWritable] = useState(false);
  const [error, setError] = useState('');
  const latest = useRef(state);
  const canWrite = useRef(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  useEffect(() => {
    let alive = true;
    let release: (() => void) | undefined;
    if (!navigator.locks) {
      setError('This browser cannot protect your study data across tabs. Open the app in a current version of Edge or Chrome.');
      return;
    }
    void navigator.locks.request('d365-pa-study-desk-writer', { ifAvailable: true }, async lock => {
      try {
        const loaded = await loadState();
        if (!alive) return;
        latest.current = loaded;
        setState(loaded);
        setReady(true);
        canWrite.current = Boolean(lock);
        setWritable(Boolean(lock));
        if (lock) await new Promise<void>(resolve => { release = resolve; if (!alive) resolve(); });
      } catch (cause) {
        if (alive) setError(`Cannot open local storage: ${String(cause)}. Your existing data has not been reset.`);
      }
    }).catch(cause => setError(String(cause)));
    return () => { alive = false; canWrite.current = false; release?.(); };
  }, []);

  const update = useCallback((change: (state: LearnerState) => LearnerState): Promise<void> => {
    const operation = queue.current.catch(() => undefined).then(async () => {
      if (!canWrite.current) throw new Error('This tab is read-only. Close the other Study Desk tab and reload.');
      const next = change(structuredClone(latest.current));
      await saveState(next);
      latest.current = next;
      setState(next);
      setError('');
    });
    queue.current = operation;
    return operation.catch(cause => {
      setError(`Not saved: ${String(cause)}. Keep this page open and retry; do not clear browser data.`);
      throw cause;
    });
  }, []);
  return { state, ready, writable, error, update };
}