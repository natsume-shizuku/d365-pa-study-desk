# AI Model Project Instructions

This file is for future Claude, GPT, Codex, or similar coding agents working on this personal project. Read it before changing code or study content. User-facing setup and behavior are documented in [README.md](README.md); content rules are in [CONTENT_AUTHORING.md](CONTENT_AUTHORING.md).

## Project Purpose

D365/PA Study Desk is a local-first React study application. It provides sourced notes, recall cards, multiple-choice practice, spaced review, missed-card tracking, annotations, and JSON backup/restore.

This is a personal project, not a Microsoft product, official exam simulator, certification guarantee, Power Apps code app, or tenant-connected application.

## Current Study Packs

The catalog is assembled in [src/content/catalog.ts](src/content/catalog.ts).

- `d365-contact-center`: practical Dynamics 365 Contact Center implementation pack with 9 topics, 250 cards (150 recall and 100 MCQ), and 40 notes.
- `ab-250-contact-center-ai-engineer`: certification-focused pack with the 6 official AB-250 weighted domains, 264 cards (157 recall and 107 MCQ), and 46 notes. [src/content/ab250.ts](src/content/ab250.ts) reclassifies the sourced general material and adds 14 blueprint cards plus 6 blueprint notes.
- `ab-250-original-practice`: supplemental original practice with 36 cards (18 recall and 18 MCQ), 6 notes, and 19 Microsoft Learn sources reviewed on 2026-10-19. [src/content/ab250Practice.ts](src/content/ab250Practice.ts) gives equal practice to all six domains; it is not a weighted mock exam or complete blueprint coverage.

Keep these packs separate. Do not flatten their topics or learner histories together. The AB-250 taxonomy comes from Microsoft's official certification and study-guide pages; it is not a model-invented exam outline.

## Architecture

- React 19, TypeScript, and Vite.
- [src/domain.ts](src/domain.ts): data contracts.
- [src/engine.ts](src/engine.ts): pure scheduling, selection, repeat flags, and statistics.
- [src/storage.ts](src/storage.ts): Dexie/IndexedDB singleton state and transactional replacement.
- [src/validation.ts](src/validation.ts): strict Zod validation, backup migration, and pack-scoped restore.
- [src/useDesk.ts](src/useDesk.ts): serialized persistence and single-writer Web Lock.
- [src/App.tsx](src/App.tsx): UI and workflow coordination.
- [src/content](src/content): curated packs, cards, notes, and source metadata.

The production build is a self-contained [dist/index.html](dist/index.html). Do not edit generated `dist` output manually.

## Non-Negotiable Data Contracts

- Pack, topic, card, note, option, and source IDs are permanent identities. Never renumber, recycle, or change them merely to improve naming.
- Review events, schedules, sessions, and annotations are explicitly scoped by `packId`.
- An annotation identity is the tuple `packId + id`; do not treat annotation IDs as globally unique without the pack.
- Only one active study session exists globally. Starting another pack can replace a paused session after the existing UI warning.
- `StudySession.pending` contains only the answered prefix of an unfinished quiz. Recall answers and completed quiz answers belong in committed events.
- Quiz answers commit atomically at completion. Do not partially score an unfinished quiz.
- Historical MCQ performance uses the recorded rating. Do not regrade old attempts against a changed current answer key.
- Increment a card's `revision` when its answer, correct option, or tested meaning changes. Pack version alone does not trigger re-review.
- Personal annotations are learner data, not verified source material.

## Backup Compatibility

Current exports use backup format version 2:

- `{ "kind": "all" }` contains all learning data.
- `{ "kind": "pack", "packId": "..." }` contains one pack's events, schedules, annotations, and eligible paused session.
- Study preferences are shared across the desk and are included in either scope.
- Restoring one pack replaces only that pack's learning records and preserves other packs.
- Restoring all packs replaces all learner state.
- Version 1 all-pack JSON backups must remain importable. Legacy annotation ownership is inferred during validation.
- Backups contain learner state only. They do not contain installed cards, notes, sources, or pack snapshots.

Do not remove migration behavior or change backup semantics without adding unit and browser regression coverage.

## Content and Sources

- Use authoritative Microsoft Learn documentation wherever possible.
- Every card and note must cite at least one registered HTTPS source.
- Source verification dates record an actual manual review date; never mass-update them without reviewing the claims.
- Do not fabricate product behavior, exam coverage, licensing, regional availability, preview status, or deprecation claims.
- The AB-250 measured domains and weightings can change. Recheck the official study guide before revising certification coverage.
- Automated schema and link tests do not prove factual accuracy.
- Preserve the telephony and voice caveats documented in [CONTENT_AUTHORING.md](CONTENT_AUTHORING.md), especially Teams Phone Extensibility versus standalone ACS, Direct Routing distinctions, DTMF behavior, secure transfer overrides, and capacity behavior.

## UI and Styling

- Preserve the exact Clawpilot `--cp-*` light/dark theme tokens in [src/styles.css](src/styles.css).
- Component colors must use the theme variables rather than new hardcoded colors.
- Keep the global study-pack selector available across pages.
- Maintain keyboard access, visible focus, 44px touch targets, reduced-motion handling, and no horizontal overflow from 320px mobile through wide desktop.
- Do not display internal option IDs. [src/optionLabels.ts](src/optionLabels.ts) derives visible A-D labels from option order.
- Do not constrain study questions or note prose to an unnecessarily narrow text column; the user prefers efficient use of wide screens.
- Center active study cards in the available study area, keeping room for long answers. Recall ratings are Again (1) and Good (2); preserve legacy Hard/Easy data and MCQ guessed-answer behavior.

## Persistence and Runtime Boundaries

- The app is local-only. Do not add cloud sync, Google Drive, Supabase, authentication, telemetry, or tenant integrations unless the user explicitly reopens that decision.
- Production learner data is stored under `http://localhost:4173`.
- Development on port 5173 and E2E tests on port 4174 use separate browser storage.
- Never seed, clear, or mutate the user's production data on port 4173 while testing.
- Keep invalid imports and failed writes non-destructive. Never silently reset corrupt or unavailable storage.
- Preserve the single-writer tab behavior; secondary tabs must remain read-only until the writer closes and the page reloads.

## Change Discipline

- Read the owning implementation and a nearby test before editing.
- Make the smallest compatible change; avoid unrelated refactors and dependency churn.
- Keep the original Contact Center pack stable when extending the AB-250 pack.
- Add focused tests for changed behavior, especially pack isolation, migrations, session invariants, content references, and responsive layout.
- Update [README.md](README.md) or [CONTENT_AUTHORING.md](CONTENT_AUTHORING.md) when user-visible behavior or authoring contracts change.
- Do not deploy, publish to GitHub Pages, commit, or push unless the user explicitly asks.

## Commands

Run commands from this directory on Windows:

```powershell
npm run lint
npm test
npm run build
npm run test:e2e
```

- `npm run lint`: TypeScript no-emit check.
- `npm test`: Vitest unit and content validation.
- `npm run build`: typecheck and production bundle.
- `npm run test:e2e`: Playwright with Microsoft Edge on isolated port 4174.
- `npm start`: preview on strict localhost port 4173.

For a behavioral or shared-contract change, run the full sequence in order. As of 2026-10-13, the verified baseline is 458 unit tests and 24 E2E tests passing. Build warnings about misplaced Zod purity comments are third-party Rollup warnings and have not affected output.

## Completion Checklist

Before reporting completion:

1. Confirm installed packs pass `validatePack()` and retain unique stable pack IDs.
2. Confirm existing v1 backups still import if backup code changed.
3. Confirm one-pack restore cannot alter another pack's events, schedules, annotations, or session.
4. Confirm the production build succeeds.
5. Run focused E2E coverage, or the full E2E suite when shared navigation, persistence, backup, or responsive behavior changed.
6. State exactly which checks ran and disclose any check that could not be run.
