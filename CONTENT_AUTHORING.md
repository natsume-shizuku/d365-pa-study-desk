# Content authoring

Content is authored in TypeScript modules, not through a browser editor or imported backups. Read [src/domain.ts](src/domain.ts), [src/validation.ts](src/validation.ts), [src/content/catalog.ts](src/content/catalog.ts), and a representative module such as [src/content/foundations.ts](src/content/foundations.ts) before editing.

## Add a topic or pack

1. Create a topic module under the content directory following the existing pattern: export an object with `topic`, `cards`, `notes`, and `sources`. Use typed `Topic`, `Card`, `Note`, and `Source` objects. Helper functions are optional; their output must satisfy the schema below.
2. For another topic in the existing pack, import the module in [src/content/catalog.ts](src/content/catalog.ts) and add it to that pack's `modules` list. Update the intended pack version and coverage tests rather than silently violating its quotas.
3. For a **new generic pack**, assemble its own module list into a `Pack` and append it to the exported `packs` array. Do not accidentally flatten its modules into the Contact Center pack. Supply a unique, permanent pack ID, title, description, version, topics, cards, notes, and sources.
4. Keep all references within the owning pack. Catalog assembly intentionally does not deduplicate sources: fix duplicate IDs instead of hiding authoring errors. A shared source can be registered once at pack level and referenced from multiple modules.
5. Run the checks below, rebuild, and use the global **Study pack** selector. The pack selector, topic lists, notes, and study screens derive from the catalog; **adding a generic pack does not require a UI edit**.

The dashboard's featured note comes from the selected pack, with a fallback to its first note. Progress and sources are scoped to the pack. Keep IDs stable and avoid hardcoding topic IDs into new UI components.

## Schema checklist

The strict runtime schema rejects unknown properties as well as malformed content. `validatePack()` returns diagnostic paths; it checks structure and references, not factual accuracy or remote link availability.

| Entity | Required content |
| --- | --- |
| Pack | Nonblank `id`, `title`, `description`, `version`; nonempty `topics`, `cards`, `notes`, `sources` |
| Topic | Nonblank `id`, `title`, `description` |
| Card | `id`, existing `topicId`, positive integer `revision`, `kind` (`recall` or `mcq`), `difficulty` (`Foundation`, `Applied`, `Advanced`), nonblank `prompt` and `answer`, at least one nonblank `checkpoint` in `checkpoints`, `tags`, at least one valid `sourceId` in `sourceIds` and `noteId` in `noteIds` |
| MCQ fields | Exactly four `options`, each with nonblank `id`, `text`, `rationale`; `correctOptionId` must match one option. Option IDs and normalized option text must be unique within the card. Explain every option, not only the correct one. |
| Recall fields | Omit `options` and `correctOptionId` entirely |
| Note | `id`, existing `topicId`, nonblank `title`, `summary`, one or more `sections` (nonblank `heading` and nonempty `bullets`), `tags`, nonempty valid `sourceIds` |
| Source | Nonblank `id`, `title`, `publisher`; absolute HTTPS `url` without credentials; real calendar `verified` date in YYYY-MM-DD format |

Tags may be empty arrays, but entries must be nonblank and nonduplicated. Source/note reference arrays cannot contain duplicate or dangling references. Each pack's ID and all topic/card/note/source IDs must be distinct within that pack; pack IDs must also be unique across the catalog.

Use original prompts, concise explanations, concrete checkpoints, and plausible single-best-answer distractors. Notes should give context, configuration checks, and gotchas. Personal annotations are learner-authored data; do not put them into the curated pack or treat them as verified sources.

## Stable IDs and revisions

- Namespace IDs by subject/topic and entity type. IDs identify content, **not array positions**. Existing numeric helpers use permanent numeric identifiers: reordering is safe only if identifiers stay unchanged.
- Never renumber existing cards/notes/options to fill gaps, reuse deleted IDs, or change pack IDs merely to rename a pack. Learner events and schedules use `packId` + `cardId`; annotations use the pack/entity identity.
- Keep option IDs associated with the same option meaning when reordering. Historical MCQ choices retain those IDs, and analytics can compare them with the current answer key.
- **Increment the card's `revision` when its material answer, answer key, or tested meaning changes.** Previously scheduled cards with a mismatched revision become due again; review history and annotations are not deleted. Cosmetic typo fixes need not imply a new answer revision.
- Update the pack's `version` for a content release. This is release metadata, not a substitute for individual card revisions. Notes and sources have no revision field; when their changes materially affect a linked card's answer, revise that card too.
- For a genuinely different concept, create a new ID instead of repurposing an old card. Backups preserve historical learner IDs/revisions, **not old pack snapshots**. Keep versioned source separately if historical wording must be recoverable.

## Source review and maintenance

The initial Contact Center material records **2026-10-09** as its verification date. The AB-250 certification and study-guide pages record **2026-10-13**. Updates are **manual**; the app does not scrape documentation or refresh answers automatically.

For each change:

1. Open authoritative documentation and confirm the final URL is reachable and supports the exact claim. A valid HTTPS URL alone is not verification. Prefer the specific article/section over a general hub.
2. Check applicability, prerequisites, licensing, region/language limitations, preview status, terminology, and deprecation/removal notices. Do not turn disputed or unverified details into scored questions.
3. For Contact Center, review both Contact Center and shared Customer Service applicability/deprecations. Distinguish Teams Phone Extensibility/Operator Connect from legacy standalone ACS offerings; do not generalize a retirement notice to unrelated supported components.
4. Read every affected answer, checkpoint, option rationale, and linked note together. Resolve contradictions and ambiguity, then set `verified` to the date the source was actually checked. Do not mass-bump dates without reviewing claims.
5. Increment affected card revisions for material answer changes, update release metadata, and rerun validation/tests. Automated tests do not establish that Microsoft endorses this material or that it predicts certification outcomes.

## Validation and coverage

From this project folder, run `npm test`, `npm run build`, then `npm run test:e2e`. End-to-end tests require **Microsoft Edge installed** and use localhost port **4174**. Production is **4173**; development is **5173** with separate browser-origin data. `npm run lint` is an additional type-only check. The build alone does not run content validation tests.

[tests/unit/content.test.ts](tests/unit/content.test.ts) validates all installed packs, tests schema failures, and checks unique pack IDs. It keeps stable quota assertions for both installed packs. `packs[0]` remains Contact Center with **nine topics**, **250 cards (150 recall / 100 MCQ)**, and **40 notes**:

| Contact Center topic ID | Cards | Notes |
| --- | ---: | ---: |
| `cc-foundations` | 20 | 3 |
| `cc-setup` | 25 | 4 |
| `cc-routing` | 40 | 6 |
| `cc-voice` | 35 | 5 |
| `cc-telephony` | 50 | 8 |
| `cc-digital` | 20 | 3 |
| `cc-experience` | 20 | 3 |
| `cc-operations` | 20 | 4 |
| `cc-implementation` | 20 | 4 |
| **Total** | **250** | **40** |

The AB-250 pack has six weighted exam domains, 264 cards (157 recall / 107 MCQ), and 46 notes. It is assembled in [src/content/ab250.ts](src/content/ab250.ts) from the existing sourced implementation material plus certification-blueprint cards and notes grounded in Microsoft's current study guide.

When adding a pack, select fixtures by stable ID, retain existing pack quotas, and add appropriate expectations for the new pack. Keep generic schema/reference validation running for every pack; do not force unrelated subjects to match Contact Center quotas or disable validation to pass. Review other tests for Contact Center-specific fixtures and add pack-switching/isolation coverage as needed.

Finally, inspect the new material in the UI: filters, answer reveal, all four MCQ rationales, related notes, source links, and annotations. Back up existing progress before testing content upgrades; check that unchanged IDs retain history and a changed revision is offered for review. No Anki import/export or pack installation through backup restore is implemented.