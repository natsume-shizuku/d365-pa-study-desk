# D365/PA Study Desk

An implemented local study app with three separate packs:

- **Dynamics 365 Contact Center:** 250 cards (150 recall, 100 multiple choice), 40 reference notes, and nine practical implementation topics.
- **AB-250: Contact Center AI Engineer:** 264 cards, 46 notes, and the six official skills-measured domains. It reclassifies the sourced implementation material for certification study and adds an exam-blueprint layer for weighting and AI-focused objectives.
- **AB-250: Original Practice:** 36 original cards (18 recall, 18 multiple choice), six notes, and 19 Microsoft Learn sources reviewed on **2026-10-19**. Each of the six domains has six cards. This is supplemental practice with explanations for every option, rather than a weighted mock exam or complete blueprint coverage. Its progress is tracked separately.

Original study material, not an official Microsoft exam simulator or a certification guarantee. General-pack sources record verification on **2026-10-09**; the AB-250 guide and certification pages were checked on **2026-10-13**. Documentation, exam objectives, licensing, availability, and deprecations can change. Recheck the linked sources before an exam or real deployment. Source updates are manual.

## Install and launch on Windows

1. Install **Node.js 22.12+**, including npm, and use a current Edge or Chrome browser.
2. Open a terminal in this project folder and run `npm install` once to install dependencies. With the supplied lockfile, `npm ci` is an alternative for a clean, reproducible initial installation.
3. Double-click [start-study.cmd](start-study.cmd). It checks Node/npm and dependencies, runs `npm run build`, then `npm start`, opening **http://localhost:4173**. Keep its terminal open while studying; press Ctrl+C to stop the server.

The launcher does not install dependencies on every launch. Missing dependencies prompt you to install them first. Failures pause with a nonzero exit code. If port 4173 is occupied, stop the conflicting process and retry: the server uses **localhost and a strict port**, never silently switching addresses. It is local only, not a LAN/public deployment.

Initial dependency installation needs internet access. Studying uses bundled content without a cloud backend, account, synchronization, telemetry, or AI service. Opening reference links uses the internet.

## Study

- **Adaptive mix:** targets 50% due, 30% weak/uncertain, and 20% unseen cards; deduplicates and refills from available pools. Sessions may be shorter than requested.
- **Due for review:** previously studied cards that are due, including changed card revisions.
- **Topic study:** randomized study of the selected topic and filters.
- **Practice quiz:** multiple choice only; feedback and committed results appear after completion. An unfinished quiz can resume; ending it early discards its pending answers.
- **Practice all:** includes cards that are not due. Session sizes are 10, 20, or 40, with topic, difficulty, format, and tag filters.

Recall uses **Again (1)** and **Good (2)** after revealing the answer. Press **Space** to reveal, **1** for Again, **2** for Good, and **Enter** to advance after rating. You can also click the buttons. Shortcuts are inactive while typing annotations or using other form controls. The active study card is centered in a wide study area that expands for long answers.

Wrong MCQs count as Again; correct guesses as Hard (uncertain, **not a miss**); confident correct answers as Good. Good progresses through 1, 3, 7, 14, 30, and 60 days; Again schedules review in ten minutes. Historical Hard/Easy ratings and their schedules remain compatible with backups. Start a later Due or Adaptive session to revisit a card.

Mistakes has All mistakes, Guessed, Repeat offenders, and Resolved views. The default repeat rule is five misses in the last ten eligible first attempts; threshold/window are configurable in Settings. Flags automatically resolve after **three consecutive confident Good/Easy successes in separate sessions**. History is retained; cards are **never suspended**. Recent performance is study feedback, not exam readiness.

Card/notes browsing does not score attempts. Personal annotations autosave separately from reference content after a short delay or on blur; wait for **Saved locally** before closing. Check and retry visible save errors. Answer progress and the active session persist for resuming. Only one tab can write; another tab shows a read-only snapshot.

## Storage and backups

Progress lives in **IndexedDB in this browser profile and origin**. For the local app, always use **http://localhost:4173**. A hosted HTTPS site has its own storage, separate from localhost. Another browser/profile, hostname (including 127.0.0.1), scheme, or port has separate data. Clearing site data, private browsing, or browser storage eviction can lose progress; local storage is not a backup.

In **Settings & backup**, choose **All study packs** or one named pack before using **Export backup**. To restore: choose the JSON backup, review its scope and counts, download and check the all-packs safety backup, acknowledge replacement, then select **Replace with backup**. An all-packs restore replaces all learning data. A one-pack restore replaces only that pack's reviews, schedules, annotations, and paused session while preserving other packs. Invalid imports leave current data unchanged. Older v1 all-packs JSON backups remain importable.

Backups contain learner progress only: review events, schedules, personal annotations, shared preferences, and the saved session (including pending quiz answers). Pack backups explicitly identify their pack and contain only learning records owned by it. They contain **no card or note content snapshots** and do not replace installed study material. Keep the project/content version separately if needed. History for unavailable IDs is preserved, but missing content cannot be studied until reinstalled. Backup files include your personal notes; keep them private.

## Public hosting with GitHub Pages

The included [deployment workflow](.github/workflows/deploy-pages.yml) checks TypeScript, runs unit/content tests, builds the app, and publishes `dist` to GitHub Pages on pushes to `main`. In the repository's **Settings > Pages**, select **GitHub Actions** as the build source. GitHub must support Pages for the repository's visibility and account plan.

Hosting makes the bundled cards and notes available to visitors. Reviews, statistics, personal annotations, preferences, and paused sessions remain in each visitor's browser. They are not uploaded to GitHub or shared with other visitors. There is no account or cloud sync.

To move existing progress to the hosted site, export **All study packs** from **Settings & backup** at `http://localhost:4173`, open the hosted HTTPS site, and import that JSON using the existing restore flow. Keep the original backup private and retain the local data until you have checked the imported progress. Use the same hosted URL and browser profile for subsequent study; changing to a custom domain creates another storage origin and requires another export/import.

## Architecture and development

| Area | Implementation |
| --- | --- |
| UI and persistence coordination | React/TypeScript: [src/App.tsx](src/App.tsx), [src/useDesk.ts](src/useDesk.ts); single-writer browser lock and serialized saves |
| Contracts and engine | [src/domain.ts](src/domain.ts), [src/engine.ts](src/engine.ts): scheduling, selection, repeat flags, analytics |
| Storage and validation | [src/storage.ts](src/storage.ts), [src/validation.ts](src/validation.ts): Dexie/IndexedDB, Zod schemas, transactional state replacement |
| Content | [src/content/catalog.ts](src/content/catalog.ts) assembles topic modules; see [CONTENT_AUTHORING.md](CONTENT_AUTHORING.md) |
| Build and tests | Vite, Vitest, Playwright; scripts in [package.json](package.json) |

- `npm run dev`: **http://localhost:5173**, strict port; **different learner data** from production.
- `npm test`: unit tests, including content quotas and structural validation.
- `npm run lint`: TypeScript checking.
- `npm run build`: type-check and bundle production; it does not run the test suite.
- `npm run test:e2e`: run **after building**, with **Microsoft Edge installed**. Playwright uses isolated browser contexts and **http://localhost:4174**, not production storage on 4173. See [playwright.config.ts](playwright.config.ts).

The build emits [dist/index.html](dist/index.html) as a single artifact with JavaScript/CSS bundled inline. **Serving via localhost is recommended**: opening through `file://` has no guarantees of browser storage persistence or support for the APIs this app needs. Keep the source project for rebuilding/authoring.

## First-version limits

No manual repeat-flag resolution, immediate same-session retry, card suspension, pack snapshots in backups, or Anki import/export. No cloud sync or automatic source refresh. Generic packs are supported by the catalog and study screens; see the authoring guide to extend the content.
