import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, BookOpen, Brain, Check, ChevronRight, CircleHelp, Download, ExternalLink, Flag, Layers, LayoutDashboard, Moon, Play, Search, Settings as SettingsIcon, Sparkles, Sun, Target, Upload, X } from 'lucide-react';
import { packs } from './content/catalog';
import { cardStatus, eligibleEvents, nextSchedule, selectCards, topicStats } from './engine';
import { makeBackup, mergePackState, parseBackupEnvelope, type BackupScope, type ParsedBackup } from './validation';
import { useDesk } from './useDesk';
import { optionLabel } from './optionLabels';
import type { Card, LearnerState, Note, Pack, Rating, ReviewEvent, StudySession } from './domain';

type Page = 'Dashboard' | 'Study' | 'Card Library' | 'Mistakes' | 'Notes' | 'Topics' | 'Settings';
type Update = (change: (state: LearnerState) => LearnerState) => Promise<void>;
const nav = [
  ['Dashboard', LayoutDashboard], ['Study', Brain], ['Card Library', Layers],
  ['Mistakes', Flag], ['Notes', BookOpen], ['Topics', Target],
] as const;
const percent = (value: number | null) => value === null ? '—' : `${Math.round(value * 100)}%`;
const noopCatch = () => undefined;
const recallRatings = [
  { rating: 'again', key: '1', label: 'Again', description: 'Forgot / incorrect' },
  { rating: 'good', key: '2', label: 'Good', description: 'Knew the essentials' },
] as const;

function Sources({ ids, pack }: { ids: string[]; pack: Pack }) {
  return <div className="source-list"><h4>Reference sources</h4>{ids.map(id => {
    const source = pack.sources.find(item => item.id === id);
    return source && <a key={id} href={source.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /><span>{source.title}<small>{source.publisher} · Verified {source.verified}</small></span></a>;
  })}</div>;
}

function Annotation({ id, packId, state, update, writable }: { id: string; packId: string; state: LearnerState; update: Update; writable: boolean }) {
  const saved = state.annotations.find(item => item.id === id && item.packId === packId)?.text ?? '';
  const [text, setText] = useState(saved);
  const [status, setStatus] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef(saved);
  const lastSaved = useRef(saved);
  const persist = (value: string) => {
    if (value === lastSaved.current || !writable) return;
    setStatus('Saving…');
    void update(current => ({ ...current, annotations: [
      ...current.annotations.filter(item => item.id !== id || item.packId !== packId), { id, packId, text: value, updatedAt: Date.now() },
    ] })).then(() => { lastSaved.current = value; setStatus('Saved locally'); }).catch(() => setStatus('Not saved — retry below'));
  };
  const persistRef = useRef(persist);
  persistRef.current = persist;
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    persistRef.current(pending.current);
  }, []);
  return <div className="annotation"><label htmlFor={`annotation-${id}`}>Your personal annotation</label><p>Private to this browser. Your words—not verified reference material.</p>
    <textarea id={`annotation-${id}`} rows={4} value={text} disabled={!writable} placeholder="What helped this click? Add a reminder or your own example…" onChange={event => {
      const value = event.target.value; pending.current = value; setText(value); setStatus('Unsaved changes');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => persistRef.current(value), 500);
    }} onBlur={() => { if (timer.current) clearTimeout(timer.current); persist(text); }} />
    <div className="save-status" aria-live="polite">{status}{status.startsWith('Not saved') && <button onClick={() => persist(text)}>Retry save</button>}</div>
  </div>;
}

function CardAnswer({ card, pack, onNote }: { card: Card; pack: Pack; onNote: (id: string) => void }) {
  return <div className="card-answer"><h3>What to remember</h3><p>{card.answer}</p>
    <ul className="checkpoints">{card.checkpoints.map(point => <li key={point}><Check size={16} /><span>{point}</span></li>)}</ul>
    {card.kind === 'mcq' && <div className="options">{card.options?.map(option => <div key={option.id} className={`option ${option.id === card.correctOptionId ? 'correct' : ''}`}><strong>{optionLabel(card, option.id)}. {option.text}</strong><p>{option.rationale}</p></div>)}</div>}
    <div className="related-notes">{card.noteIds.map(id => <button className="button ghost small" key={id} onClick={() => onNote(id)}><BookOpen size={15} />{pack.notes.find(note => note.id === id)?.title}</button>)}</div>
    <Sources ids={card.sourceIds} pack={pack} />
  </div>;
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = before; previous?.focus(); };
  }, []);
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div className="modal" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} onKeyDown={e => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Tab') {
      const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], textarea:not(:disabled), input:not(:disabled), select:not(:disabled)') ?? []);
      const first = items[0]; const last = items.at(-1);
      if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  }}><div className="section-heading"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20} /></button></div>{children}</div></div>;
}

function appendEvent(state: LearnerState, event: ReviewEvent): LearnerState {
  if (state.events.some(item => item.id === event.id)) return state;
  const prior = state.schedules.find(item => item.cardId === event.cardId && item.packId === event.packId);
  return { ...state, events: [...state.events, event], schedules: [
    ...state.schedules.filter(item => !(item.cardId === event.cardId && item.packId === event.packId)), nextSchedule(prior, event),
  ] };
}

function StudyView({ pack, state, update, writable, onNote, topic, setTopic }: {
  pack: Pack; state: LearnerState; update: Update; writable: boolean; onNote: (id: string) => void; topic: string; setTopic: (value: string) => void;
}) {
  const [mode, setMode] = useState<StudySession['mode']>('adaptive');
  const [difficulty, setDifficulty] = useState('all');
  const [format, setFormat] = useState('all');
  const [tag, setTag] = useState('');
  const [size, setSize] = useState(state.settings.sessionSize);
  const [message, setMessage] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [choice, setChoice] = useState('');
  const [guessed, setGuessed] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const session = state.session?.packId === pack.id ? state.session : null;
  const active = session && !session.finished ? session : null;
  const card = active ? pack.cards.find(item => item.id === active.cardIds[active.index]) : undefined;
  const result = active ? state.events.find(event => event.cardId === card?.id && event.id === `${active.id}:${active.index}`) : undefined;
  useEffect(() => { setRevealed(false); setChoice(''); setGuessed(false); }, [active?.id, active?.index]);
  const run = async (action: () => Promise<void>) => {
    if (submitting.current) return;
    submitting.current = true; setBusy(true);
    try { await action(); } catch { /* persisted error is shown globally */ }
    finally { submitting.current = false; setBusy(false); }
  };
  const start = () => run(async () => {
    const candidates = pack.cards.filter(item => (topic === 'all' || item.topicId === topic)
      && (difficulty === 'all' || item.difficulty === difficulty) && (format === 'all' || item.kind === format)
      && (!tag || item.tags.some(value => value.toLowerCase().includes(tag.toLowerCase()))));
    const selected = selectCards(candidates, state.events.filter(e => e.packId === pack.id), state.schedules.filter(s => s.packId === pack.id), mode, size, Date.now(), Math.random, state.settings);
    if (!selected.length) { setMessage('No cards match this session. Try another topic or use Practice all for cards that are not due yet.'); return; }
    setMessage('');
    await update(current => ({ ...current, session: { id: crypto.randomUUID(), packId: pack.id, mode, cardIds: selected.map(item => item.id), index: 0, startedAt: Date.now(), finished: false, pending: [] } }));
  });
  const rate = (rating: Rating) => run(async () => {
    if (!active || !card || result) return;
    const event: ReviewEvent = { id: `${active.id}:${active.index}`, sessionId: active.id, packId: pack.id, cardId: card.id, revision: card.revision, at: Date.now(), rating, kind: card.kind, guessed: card.kind === 'mcq' && guessed, eligible: true,
      ...(card.kind === 'mcq' ? { selectedOptionId: choice } : {}),
    };
    await update(current => {
      const currentSession = current.session;
      if (!currentSession || currentSession.id !== active.id || currentSession.index !== active.index || currentSession.pending.some(item => item.id === event.id) || current.events.some(item => item.id === event.id)) return current;
      event.eligible = !current.events.some(item => item.sessionId === event.sessionId && item.cardId === event.cardId && item.packId === event.packId);
      const nextSession = { ...currentSession, pending: [...currentSession.pending, event] };
      if (active.mode === 'quiz') {
        nextSession.index++;
        nextSession.finished = nextSession.index === nextSession.cardIds.length;
        let next: LearnerState = { ...current, session: nextSession };
        if (nextSession.finished) {
          for (const pending of nextSession.pending) next = appendEvent(next, pending);
          next.session = { ...nextSession, pending: [] };
        }
        return next;
      }
      return { ...appendEvent(current, event), session: { ...currentSession, pending: [] } };
    });
  });
  const next = () => run(async () => {
    if (!active || !result) return;
    await update(current => {
      if (!current.session || current.session.id !== active.id || current.session.index !== active.index) return current;
      const index = current.session.index + 1;
      return { ...current, session: { ...current.session, index, finished: index >= current.session.cardIds.length } };
    });
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!writable || busy || !card || e.repeat || e.defaultPrevented || e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.target instanceof Element && (e.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="dialog"]')
        || (e.target.closest('button,a') && !e.target.closest('[data-recall-control]')))) return;
      if (e.code === 'Space' && card.kind === 'recall' && !result && !(e.target instanceof Element && e.target.closest('button,a'))) { e.preventDefault(); setRevealed(true); }
      const recallRating = recallRatings.find(item => item.key === e.key);
      if (revealed && card.kind === 'recall' && !result && recallRating) { e.preventDefault(); void rate(recallRating.rating); }
      if (e.key === 'Enter' && result) void next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  if (active && card) return <div className="study-layout"><div className="study-toolbar"><span className="eyebrow">{active.mode} session</span><span>{active.index + 1} / {active.cardIds.length} cards</span></div>
    <div className="progress-track"><div className="progress-fill" style={{ width: `${active.index / active.cardIds.length * 100}%` }} /></div>
    <div className="study-stage"><article className="study-card"><div className="card-topline"><span className="badge">{pack.topics.find(t => t.id === card.topicId)?.title}</span><span>{card.difficulty} · {card.kind === 'recall' ? 'Recall' : 'Multiple choice'}</span></div>
      <h2 className="card-prompt">{card.prompt}</h2>
      {card.kind === 'recall' && !result && !revealed && <><p className="stat-detail">Say your answer out loud or think through the steps before revealing.</p><button className="button primary" data-recall-control aria-keyshortcuts="Space" onClick={() => setRevealed(true)}>Reveal answer <span aria-hidden="true">Space</span></button><p className="stat-detail">Space to reveal · 1 for Again · 2 for Good</p></>}
      {card.kind === 'mcq' && !result && <><div className="options" role="radiogroup" aria-label="Answer choices">{card.options?.map(option => <button role="radio" aria-checked={choice === option.id} className={`option ${choice === option.id ? 'selected' : ''}`} key={option.id} disabled={busy || !writable} onClick={() => setChoice(option.id)}><strong>{optionLabel(card, option.id)}.</strong> {option.text}</button>)}</div>
        <label className="field"><span><input type="checkbox" checked={guessed} onChange={e => setGuessed(e.target.checked)} disabled={busy || !writable} /> I guessed / I’m not confident</span></label>
        <button className="button primary" disabled={!choice || busy || !writable} onClick={() => void rate(choice !== card.correctOptionId ? 'again' : guessed ? 'hard' : 'good')}>{active.mode === 'quiz' ? 'Save answer & continue' : 'Check answer'} <ArrowRight size={16} /></button></>}
      {(result || (revealed && card.kind === 'recall')) && <>{result && <div className={`notice ${result.rating === 'again' ? 'error' : 'success'}`} role="status">{card.kind === 'mcq' ? result.rating === 'again' ? `Not quite. You chose ${optionLabel(card, result.selectedOptionId)}.` : result.guessed ? 'Correct, but guessed — scheduled for an earlier review.' : 'Correct — nicely done.' : `Recorded: ${result.rating}.`} Saved locally.</div>}
        <CardAnswer card={card} pack={pack} onNote={onNote} />
        {!result && <div className="rating-grid">{recallRatings.map(({ rating, key, label, description }) => <button key={rating} className={`button secondary ${rating}`} data-recall-control aria-keyshortcuts={key} disabled={busy || !writable} onClick={() => void rate(rating)}><strong>{key} · {label}</strong><small>{description}</small></button>)}</div>}
      </>}
    </article></div>
    <div className="study-footer"><span>Progress saves after each answer. Leave this tab to pause.</span>{result && <button className="button primary" disabled={busy || !writable} onClick={() => void next()}>{active.index + 1 === active.cardIds.length ? 'Finish session' : 'Next card'}<ArrowRight size={16} /></button>}</div>
    <Annotation key={`${pack.id}:${card.id}`} id={`${pack.id}:${card.id}`} packId={pack.id} state={state} update={update} writable={writable} />
    <button className="button ghost small" disabled={busy || !writable} onClick={() => { if (confirm(active.mode === 'quiz' ? 'End this quiz? Unfinished quiz answers will not count toward progress.' : 'End this session? Answers already recorded will be kept.')) void run(() => update(current => ({ ...current, session: null }))); }}>End session early</button>
  </div>;
  if (active && !card) return <div className="notice error">A card in your saved session is no longer installed. Your history is preserved. <button disabled={!writable} onClick={() => void update(current => ({ ...current, session: null })).catch(noopCatch)}>Clear this session</button></div>;
  const completed = session?.finished ? session : null;
  const completedEvents = completed ? state.events.filter(event => event.sessionId === completed.id && event.packId === pack.id) : [];
  return <>
    {completed && <section className="panel"><div className="section-heading"><h2>Session complete</h2><Check size={24} /></div><p>{completedEvents.length} answers recorded. {completed.mode === 'quiz' ? `${completedEvents.filter(e => e.rating !== 'again').length} correct (including guesses).` : 'Keep building understanding, not just a score.'}</p>
      <div className="quiz-results">{completedEvents.map(event => { const item = pack.cards.find(c => c.id === event.cardId); return item && <details className="result-item" key={event.id}><summary><span className={`badge ${event.rating === 'again' ? 'weak' : 'neutral'}`}>{event.rating}{event.guessed ? ' · guessed' : ''}</span> {item.prompt}</summary><CardAnswer card={item} pack={pack} onNote={onNote} /></details>; })}</div>
    </section>}
    <section className="panel"><div className="section-heading"><div><h2>Make room for a little progress.</h2><p>Choose a focused session. Twenty cards is a good place to start.</p></div><Brain size={32} /></div>
      <div className="study-toolbar"><label className="field">Study mode<select value={mode} onChange={e => setMode(e.target.value as StudySession['mode'])}><option value="adaptive">Adaptive mix</option><option value="due">Due for review</option><option value="topic">Topic study</option><option value="quiz">Practice quiz (multiple choice)</option><option value="practice">Practice all (including not due)</option></select></label>
        <label className="field">Topic<select value={topic} onChange={e => setTopic(e.target.value)}><option value="all">All topics</option>{pack.topics.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label className="field">Session length<select value={size} onChange={e => setSize(Number(e.target.value))}>{[10, 20, 40].map(n => <option key={n} value={n}>{n} cards</option>)}</select></label></div>
      <div className="filter-bar"><label className="field">Difficulty<select value={difficulty} onChange={e => setDifficulty(e.target.value)}>{['all', 'Foundation', 'Applied', 'Advanced'].map(item => <option key={item} value={item}>{item === 'all' ? 'All levels' : item}</option>)}</select></label><label className="field">Format<select value={format} onChange={e => setFormat(e.target.value)}><option value="all">Mixed formats</option><option value="recall">Recall</option><option value="mcq">Multiple choice</option></select></label><label className="field">Tag<input value={tag} onChange={e => setTag(e.target.value)} placeholder="e.g. operator-connect" /></label></div>
      <p className="stat-detail">Adaptive sessions prioritize due cards, uncertain answers, and new concepts. Quizzes reveal explanations at the end. Up to the selected number of matching cards will be included.</p>
      {message && <div className="notice" role="status">{message}</div>}
      {state.session && state.session.packId !== pack.id && !state.session.finished && <div className="notice">Another pack has a paused session. Starting here replaces that session.</div>}
      <button className="button primary" disabled={!writable || busy} onClick={() => void start()}><Play size={18} />Start session</button>
    </section>
  </>;
}

function SettingsView({ state, update, writable, activePack }: { state: LearnerState; update: Update; writable: boolean; activePack: Pack }) {
  const [threshold, setThreshold] = useState(state.settings.threshold);
  const [windowSize, setWindowSize] = useState(state.settings.window);
  const [size, setSize] = useState(state.settings.sessionSize);
  const [message, setMessage] = useState('');
  const [imported, setImported] = useState<ParsedBackup | null>(null);
  const [exportPackId, setExportPackId] = useState(activePack.id);
  const [busy, setBusy] = useState(false);
  useEffect(() => setExportPackId(activePack.id), [activePack.id]);
  const importedPackId = imported?.scope.kind === 'pack' ? imported.scope.packId : null;
  const importedScopeName = importedPackId ? `${packs.find(item => item.id === importedPackId)?.title ?? importedPackId} pack` : 'all-packs';
  const download = (data: LearnerState, scope: BackupScope, prefix = 'study-desk-backup') => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(makeBackup(data, scope), null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `${prefix}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const invalid = !Number.isInteger(threshold) || !Number.isInteger(windowSize) || threshold < 2 || windowSize < threshold || windowSize > 100;
  return <div className="settings-grid"><section className="panel"><h2>Study preferences</h2><p>Repeat offenders are tagged, never suspended.</p>
    <label className="field">Misses to flag<input type="number" min={2} max={100} value={threshold} onChange={e => setThreshold(Number(e.target.value))} /></label>
    <label className="field">Within the last … first attempts<input type="number" min={threshold} max={100} value={windowSize} onChange={e => setWindowSize(Number(e.target.value))} /></label>
    <label className="field">Default session length<select value={size} onChange={e => setSize(Number(e.target.value))}>{[10, 20, 40].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
    <p className="stat-detail">Three consecutive confident successes across separate sessions resolve a repeat flag. Guessed-correct answers are not mistakes. Changing the threshold re-evaluates your history.</p>
    {invalid && <p className="notice error">Use whole numbers: at least 2 misses, with a window between the threshold and 100.</p>}
    <button className="button primary" disabled={!writable || invalid || busy} onClick={() => { setBusy(true); void update(current => ({ ...current, settings: { threshold, window: windowSize, sessionSize: size } })).then(() => setMessage('Study preferences saved.')).catch(noopCatch).finally(() => setBusy(false)); }}>Save preferences</button>
  </section><section className="panel"><h2>Your data stays with you.</h2><p>Progress and annotations live in this browser, on this localhost address. They are not synced to another device. Clearing site data or using private browsing can lose them.</p>
    <label className="field">Backup scope<select value={exportPackId} onChange={event => setExportPackId(event.target.value)}><option value="all">All study packs</option>{packs.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    <p className="stat-detail">A pack backup contains only that pack’s reviews, schedules, annotations, and paused session. Study preferences remain shared across the desk.</p>
    <div className="quick-actions"><button className="button secondary" onClick={() => download(state, exportPackId === 'all' ? { kind: 'all' } : { kind: 'pack', packId: exportPackId })}><Download size={17} />Export backup</button><label className="button secondary"><Upload size={17} />Choose backup<input className="sr-only" aria-label="Choose backup" type="file" accept="application/json,.json" disabled={!writable || busy} onChange={async e => {
      const file = e.target.files?.[0]; if (!file) return;
      try { if (file.size > 50 * 1024 * 1024) throw new Error('Backup exceeds the 50 MB safety limit.'); const parsed = parseBackupEnvelope(JSON.parse(await file.text())); setImported(parsed); setMessage(''); }
      catch (error) { setImported(null); setMessage(`Import rejected: ${String(error)}. Existing data was not changed.`); }
      e.target.value = '';
    }} /></label></div>
    <h3>Keep the same address</h3><p>Use <strong>http://localhost:4173</strong> and the same browser profile. A different hostname or port has separate storage.</p><p className="stat-detail">Content updates preserve stable card IDs and your annotations. Download a backup regularly and before moving computers.</p>
  </section><section className="panel"><h2>How scheduling works</h2><p>Good moves through 1, 3, 7, 14, 30, and 60-day intervals. Easy advances two steps. Hard returns sooner. Again resets the card to a ten-minute review.</p><p>When it becomes due, start a Due or Adaptive session. There is no forced immediate retry. This is a transparent study scheduler, not Anki or an official exam predictor.</p><p>Cards with a changed content revision become due again without deleting history.</p></section>
    {message && <div className="notice" role="status">{message}</div>}
    {imported && <Modal title="Restore a backup" onClose={() => !busy && setImported(null)}><p>This {importedScopeName} backup contains <strong>{imported.state.events.length} review events</strong> and <strong>{imported.state.annotations.length} annotations</strong>. {imported.scope.kind === 'all' ? 'Restoring replaces all current learning data.' : 'Restoring replaces only this pack’s learning data; other packs remain intact.'} It does not replace installed cards or notes.</p><p>First download a safety copy. Review it in your Downloads before confirming replacement.</p><BackupConfirmation onBackup={() => download(state, { kind: 'all' }, 'before-restore')} disabled={busy || !writable} onConfirm={() => {
      setBusy(true); void update(current => imported.scope.kind === 'all' ? imported.state : mergePackState(current, imported.state, imported.scope.packId)).then(() => { setImported(null); setThreshold(imported.state.settings.threshold); setWindowSize(imported.state.settings.window); setSize(imported.state.settings.sessionSize); setMessage('Backup restored successfully.'); }).catch(noopCatch).finally(() => setBusy(false));
    }} /></Modal>}
  </div>;
}

function BackupConfirmation({ onBackup, onConfirm, disabled }: { onBackup: () => void; onConfirm: () => void; disabled: boolean }) {
  const [downloaded, setDownloaded] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  return <div className="modal-actions"><button className="button secondary" onClick={() => { onBackup(); setDownloaded(true); }}>Download safety backup</button><label><input type="checkbox" checked={confirmed} disabled={!downloaded} onChange={e => setConfirmed(e.target.checked)} /> I have kept my safety backup and understand this replaces current data.</label><button className="button danger" disabled={disabled || !downloaded || !confirmed} onClick={onConfirm}>Replace with backup</button></div>;
}

export default function App() {
  const { state, ready, writable, error, update } = useDesk();
  const [page, setPage] = useState<Page>('Dashboard');
  const [packId, setPackId] = useState(packs[0].id);
  const pack = packs.find(item => item.id === packId) ?? packs[0];
  const [topic, setTopic] = useState('all');
  const [search, setSearch] = useState('');
  const [mistakeFilter, setMistakeFilter] = useState('All mistakes');
  const [libraryLevel, setLibraryLevel] = useState('all');
  const [libraryFormat, setLibraryFormat] = useState('all');
  const [libraryLimit, setLibraryLimit] = useState(24);
  const [selectedNote, setSelectedNote] = useState(pack.notes[0]?.id);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [overlayNote, setOverlayNote] = useState<Note | null>(null);
  const [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark');
  const [now, setNow] = useState(Date.now());
  const switchPack = (nextId: string) => {
    const next = packs.find(item => item.id === nextId) ?? packs[0];
    setPackId(next.id); setTopic('all'); setSearch(''); setSelectedNote(next.notes[0]?.id);
    setSelectedCard(null); setOverlayNote(null); setLibraryLimit(24); window.scrollTo({ top: 0 });
  };
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(timer); }, []);
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, [dark]);
  const events = state.events.filter(event => event.packId === pack.id);
  const schedules = state.schedules.filter(item => item.packId === pack.id);
  const attempts = eligibleEvents(events);
  const seen = new Set(attempts.map(event => event.cardId));
  const stats = topicStats(pack.cards, events);
  const due = pack.cards.filter(card => schedules.some(item => item.cardId === card.id && (item.due <= now || item.revision !== card.revision))).length;
  const statuses = new Map(pack.cards.map(card => [card.id, cardStatus(events.filter(event => event.cardId === card.id), state.settings)]));
  const repeatCount = [...statuses.values()].filter(status => status.repeat).length;
  const weakCards = pack.cards.filter(card => { const status = statuses.get(card.id)!; const last = status.recent.at(-1); return status.repeat || last?.rating === 'again' || last?.rating === 'hard' || last?.guessed; });
  const navigate = (next: Page) => { setPage(next); setSearch(''); setLibraryLimit(24); window.scrollTo({ top: 0 }); };
  const studyTopic = (id: string) => { setTopic(id); navigate('Study'); };
  const onNote = (id: string) => { const note = pack.notes.find(item => item.id === id); if (note) setOverlayNote(note); };
  const matchingCards = pack.cards.filter(card => (topic === 'all' || card.topicId === topic)
    && (libraryLevel === 'all' || libraryLevel === card.difficulty) && (libraryFormat === 'all' || libraryFormat === card.kind)
    && `${card.prompt} ${card.answer} ${card.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const mistakeCards = matchingCards.filter(card => {
    const status = statuses.get(card.id)!;
    return mistakeFilter === 'Repeat offenders' ? status.repeat : mistakeFilter === 'Guessed' ? status.guesses > 0 : mistakeFilter === 'Resolved' ? status.resolved : status.misses > 0;
  });
  const matchingNotes = pack.notes.filter(note => (topic === 'all' || note.topicId === topic) && `${note.title} ${note.summary} ${note.tags.join(' ')} ${note.sections.flatMap(section => section.bullets).join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const note = matchingNotes.find(item => item.id === selectedNote) ?? matchingNotes[0];
  const featuredNote = pack.notes.find(item => item.tags.includes('operator-connect')) ?? pack.notes[0];
  const subtitle: Record<Page, string> = {
    Dashboard: 'Build understanding. Find your gaps. Come back a little stronger.',
    Study: 'A focused space to turn information into understanding.',
    'Card Library': 'Every concept, ready when you need it. Browsing does not change your score.',
    Mistakes: 'Useful signals, not setbacks. Difficult cards always stay in your rotation.',
    Notes: 'The short version, with the sources behind it.',
    Topics: 'One desk. Room for everything you want to learn.',
    Settings: 'Make this desk yours—and keep your progress safe.',
  };
  const filterBar = <div className="filter-bar"><label className="search-field"><Search size={18} /><input aria-label="Search cards or notes" placeholder={page === 'Notes' ? 'Search notes, checklists, tags…' : 'Search questions, explanations, tags…'} value={search} onChange={e => { setSearch(e.target.value); setLibraryLimit(24); }} /></label><label className="field">Topic<select value={topic} onChange={e => { setTopic(e.target.value); setLibraryLimit(24); }}><option value="all">All topics</option>{pack.topics.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    {page !== 'Notes' && <><label className="field">Level<select value={libraryLevel} onChange={e => setLibraryLevel(e.target.value)}><option value="all">All levels</option>{['Foundation', 'Applied', 'Advanced'].map(item => <option key={item}>{item}</option>)}</select></label><label className="field">Format<select value={libraryFormat} onChange={e => setLibraryFormat(e.target.value)}><option value="all">All formats</option><option value="recall">Recall</option><option value="mcq">Multiple choice</option></select></label></>}
  </div>;
  const noteBody = (item: Note) => <><span className="eyebrow">{pack.topics.find(t => t.id === item.topicId)?.title}</span><h2>{item.title}</h2><p>{item.summary}</p>{item.sections.map(section => <section className="note-section" key={section.heading}><h3>{section.heading}</h3><ul>{section.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul></section>)}<div className="card-tags">{item.tags.map(tag => <span className="tag" key={tag}>{tag}</span>)}</div><Sources ids={item.sourceIds} pack={pack} /><h3>Put it into practice</h3><div className="related-notes">{pack.cards.filter(card => card.noteIds.includes(item.id)).map(card => <button className="button ghost small" key={card.id} onClick={() => { setOverlayNote(null); setSelectedCard(card); }}>{card.prompt}<ChevronRight size={14} /></button>)}</div><Annotation key={`${pack.id}:${item.id}`} id={`${pack.id}:${item.id}`} packId={pack.id} state={state} update={update} writable={writable} /></>;
  return <div className="app-shell"><a className="skip-link" href="#main">Skip to content</a><header className="sidebar"><div className="brand"><div className="brand-mark"><BookOpen size={24} /></div><div><div className="brand-name">D365/PA Study Desk</div><span className="brand-caption">STUDY. RECALL. IMPROVE.</span></div></div>
    <nav aria-label="Main navigation">{nav.map(([name, Icon]) => <button aria-label={name} className={`nav-item ${page === name ? 'active' : ''}`} aria-current={page === name ? 'page' : undefined} key={name} onClick={() => navigate(name)}><Icon size={19} />{name}{name === 'Mistakes' && repeatCount > 0 && <span className="nav-count">{repeatCount}</span>}</button>)}</nav>
    <div className="sidebar-footer"><div className="topbar-actions"><span className="local-badge">{ready ? writable ? 'Saved on this device' : 'Read-only tab' : 'Opening local storage'}</span><button className="icon-button" aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => setDark(!dark)}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button></div><button className={`nav-item ${page === 'Settings' ? 'active' : ''}`} aria-current={page === 'Settings' ? 'page' : undefined} onClick={() => navigate('Settings')}><SettingsIcon size={18} />Settings & backup</button></div></header>
    <div className="main-shell">
      <main id="main" className="page" tabIndex={-1}><div className="page-heading"><div><span className="eyebrow">{pack.title}</span><h1>{page === 'Dashboard' ? 'Welcome to your study desk.' : page}</h1><p>{subtitle[page]}</p></div><div className="page-actions"><label className="pack-switcher">Study pack<select aria-label="Study pack" value={pack.id} onChange={event => switchPack(event.target.value)}>{packs.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>{page === 'Dashboard' && <button className="button secondary" onClick={() => navigate('Notes')}><BookOpen size={17} />Browse notes</button>}</div></div>
        {error && <div role="alert" className="notice error">{error}</div>}
        {ready && !writable && <div className="notice" role="status">Another Study Desk tab owns local storage. This tab is read-only and shows a snapshot. Close the other tab and reload here to study or edit.</div>}
        {!ready ? <div className="empty-state"><Brain size={40} /><h2>Opening your desk…</h2><p>No sign-in needed. Loading progress from this browser.</p></div> : <>
        {page === 'Dashboard' && <><section className="hero"><div className="hero-copy"><h2>Ready for your next study session?</h2><p>Practice a few cards, or pick a topic below to focus your review.</p></div><div className="hero-actions"><button className="button primary" onClick={() => navigate('Study')}><Play size={17} />{state.session && !state.session.finished && state.session.packId === pack.id ? 'Resume your session' : 'Start studying'}<ArrowRight size={17} /></button><span>{pack.cards.length} cards · {pack.notes.length} field notes</span></div></section>
          <div className="stat-grid4">{[
            ['Due for review', String(due), 'Previously studied cards ready to revisit', Brain],
            ['Study coverage', `${seen.size} / ${pack.cards.length}`, 'Unique cards you have answered', Layers],
            ['Recent performance', percent(stats.score), `${stats.attempts} recent first attempts · self-rated + MCQ`, Target],
            ['Needs another look', String(weakCards.length), `${repeatCount} repeat offenders · no cards suspended`, Flag],
          ].map(([label, value, detail, Icon]) => { const IconComponent = Icon as typeof Brain; return <div className="stat-card" key={String(label)}><div className="stat-label">{String(label)}<IconComponent size={18} /></div><div className="stat-value">{String(value)}</div><div className="stat-detail">{String(detail)}</div></div>; })}</div>
          <div className="dashboard-grid"><section className="panel"><div className="section-heading"><div><h2>Areas of improvement</h2><p>Know where your next study session will help most.</p></div><Target size={22} /></div><div className="topic-list">{pack.topics.map(item => {
            const cards = pack.cards.filter(card => card.topicId === item.id); const topicPerformance = topicStats(cards, events);
            return <button className="topic-row" key={item.id} onClick={() => studyTopic(item.id)}><div className="topic-title"><strong>{item.title}</strong><span className={`badge ${topicPerformance.label === 'Needs review' ? 'weak' : topicPerformance.label === 'Strong' ? 'strong' : 'neutral'}`}>{topicPerformance.label}</span></div><div className="topic-meta"><span>{cards.filter(card => seen.has(card.id)).length} / {cards.length} explored · {topicPerformance.attempts} recent attempts</span><span>{percent(topicPerformance.score)}</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${(topicPerformance.score ?? 0) * 100}%` }} /></div></button>;
          })}</div><p className="stat-detail">Performance reflects up to 20 recent first attempts per topic. At least 5 attempts across 3 cards are needed for a strength label. This is not an exam-readiness score.</p></section>
            <div><section className="panel"><div className="section-heading"><h2>Your next step</h2><Sparkles size={20} /></div>{weakCards.length ? <><span className="badge weak">Targeted review</span><h3>{pack.topics.find(t => t.id === weakCards[0].topicId)?.title}</h3><p>{weakCards[0].prompt}</p><div className="quick-actions"><button className="button primary" onClick={() => studyTopic(weakCards[0].topicId)}>Review this topic <ArrowRight size={16} /></button><button className="button ghost" onClick={() => onNote(weakCards[0].noteIds[0])}><BookOpen size={16} />Read the related note</button></div></> : <><h3>Start with curiosity.</h3><p>{seen.size ? 'Nothing is currently flagged as weak. Try a new topic or revisit cards when they become due.' : 'Answer a few cards and this desk will start finding patterns in what you know—and what needs practice.'}</p><button className="button secondary" onClick={() => navigate('Study')}>Build your first session <ArrowRight size={16} /></button></>}</section>
              <section className="panel"><h2>Keep the essentials close.</h2><p>Configuration checklists, gotchas, and sources—without the wall of documentation.</p>{featuredNote && <button className="quick-action" onClick={() => { setTopic(featuredNote.topicId); setSelectedNote(featuredNote.id); navigate('Notes'); }}><BookOpen size={22} /><span><strong>{featuredNote.title}</strong><small>{featuredNote.tags.slice(0, 3).join(' · ')}</small></span><ChevronRight size={18} /></button>}</section>
              <section className="panel"><span className="eyebrow">LEARN WITH CONFIDENCE</span><p>Original study material, grounded in official documentation. Verify licensing and regional availability before a real deployment.</p><p className="stat-detail">MCQ accuracy: {percent(stats.mcqAccuracy)} · Separate from self-rated recall.</p></section></div>
          </div></>}
        {page === 'Study' && <StudyView key={pack.id} pack={pack} state={state} update={update} writable={writable} onNote={onNote} topic={topic} setTopic={setTopic} />}
        {(page === 'Card Library' || page === 'Mistakes') && <>{page === 'Mistakes' && <><div className="segmented" aria-label="Mistake filter">{['All mistakes', 'Guessed', 'Repeat offenders', 'Resolved'].map(item => <button key={item} className={mistakeFilter === item ? 'active' : ''} aria-pressed={mistakeFilter === item} onClick={() => setMistakeFilter(item)}>{item}</button>)}</div><p className="stat-detail">Misses and guesses use the last {state.settings.window} qualifying attempts per card. Repeat tags remain until three confident successes in separate sessions. Resolved keeps the history.</p></>}{filterBar}
          <p className="stat-detail">{(page === 'Mistakes' ? mistakeCards : matchingCards).length} matching cards</p><div className="list-grid">{(page === 'Mistakes' ? mistakeCards : matchingCards).slice(0, libraryLimit).map(card => { const status = statuses.get(card.id)!; return <article className="library-card" key={card.id}><div className="card-topline"><span className="badge neutral">{card.difficulty}</span><span>{card.kind === 'recall' ? 'Recall' : 'Multiple choice'}</span></div><h3>{card.prompt}</h3><p>{pack.topics.find(item => item.id === card.topicId)?.title}</p><div className="card-tags">{status.repeat && <span className="badge weak">repeat-offender</span>}{status.resolved && <span className="badge strong">Resolved</span>}{card.tags.slice(0, 3).map(tag => <span className="tag" key={tag}>{tag}</span>)}</div>{page === 'Mistakes' && <><p className="stat-detail">{status.misses} recent misses · {status.guesses} guesses</p><div className="review-history" aria-label="Recent outcomes">{status.recent.map(event => <span className={`history-dot ${event.rating}`} key={event.id} title={`${event.rating}${event.guessed ? ' (guessed)' : ''} — ${new Date(event.at).toLocaleDateString()}`} />)}</div></>}<button className="button ghost" onClick={() => setSelectedCard(card)}>Explore answer <ArrowRight size={16} /></button></article>; })}</div>
          {!(page === 'Mistakes' ? mistakeCards : matchingCards).length && <div className="empty-state"><CircleHelp size={36} /><h2>{page === 'Mistakes' ? 'Nothing in this view yet.' : 'No matching cards.'}</h2><p>{page === 'Mistakes' ? 'Study a few cards, or adjust the filters. Mistakes will become a useful review list—not a penalty.' : 'Try clearing the search or choosing all topics.'}</p><button className="button secondary" onClick={() => navigate('Study')}>Go to Study</button></div>}
          {(page === 'Mistakes' ? mistakeCards : matchingCards).length > libraryLimit && <button className="button secondary" onClick={() => setLibraryLimit(libraryLimit + 24)}>Show more cards</button>}</>}
        {page === 'Notes' && <>{filterBar}<div className="notes-layout"><aside className="notes-list" aria-label="Reference notes">{matchingNotes.map(item => <button className={`note-item ${note?.id === item.id ? 'active' : ''}`} key={item.id} onClick={() => setSelectedNote(item.id)}><BookOpen size={17} /><span><strong>{item.title}</strong><small>{pack.topics.find(t => t.id === item.topicId)?.title}</small></span></button>)}</aside>{note ? <article className="note-detail" key={note.id}>{noteBody(note)}</article> : <div className="empty-state"><BookOpen size={36} /><h2>No notes match.</h2><p>Try a different search or topic.</p></div>}</div></>}
        {page === 'Topics' && <><section className="panel"><h2>{pack.title}</h2><p>{pack.description}</p><span className="badge">Version {pack.version} · {pack.cards.length} cards · {pack.notes.length} notes</span></section><div className="list-grid">{pack.topics.map(item => <section className="library-card" key={item.id}><Target size={24} /><h2>{item.title}</h2><p>{item.description}</p><p className="stat-detail">{pack.cards.filter(c => c.topicId === item.id).length} cards · {pack.notes.filter(n => n.topicId === item.id).length} notes</p><button className="button secondary" onClick={() => studyTopic(item.id)}>Study topic <ArrowRight size={16} /></button></section>)}</div><section className="panel"><h2>Room for your next subject.</h2><p>Future study packs can add their own topics, cards, notes, and references without changing the study screens. Your progress is separated by pack and preserved by stable card IDs.</p></section></>}
        {page === 'Settings' && <SettingsView state={state} update={update} writable={writable} activePack={pack} />}
        </>}
      </main>
    </div>
    {selectedCard && !overlayNote && <Modal title="Card detail" onClose={() => setSelectedCard(null)}><span className="badge">{selectedCard.difficulty} · {selectedCard.kind}</span><h2>{selectedCard.prompt}</h2><CardAnswer card={selectedCard} pack={pack} onNote={onNote} /><Annotation key={`${pack.id}:${selectedCard.id}`} id={`${pack.id}:${selectedCard.id}`} packId={pack.id} state={state} update={update} writable={writable} /></Modal>}
    {overlayNote && <Modal title="Reference note" onClose={() => setOverlayNote(null)}>{noteBody(overlayNote)}</Modal>}
  </div>;
}
