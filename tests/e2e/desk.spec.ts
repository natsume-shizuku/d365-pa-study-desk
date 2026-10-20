import { Buffer } from 'node:buffer';
import { test as base, expect, type Locator, type Page } from '@playwright/test';
import { packs } from '../../src/content/catalog';
import { defaults, type Card, type LearnerState, type Pack } from '../../src/domain';

const origin = 'http://localhost:4174';
const pack = packs.find(item => item.id === 'd365-contact-center')!;
const practicePack = packs.find(item => item.id === 'ab-250-original-practice')!;
const firstNote = pack.notes[0];
const annotationLabel = 'Your personal annotation';
const guessedLabel = 'I guessed / I’m not confident';

// Playwright's page/context fixtures create a fresh, nonpersistent context per test.
// The only shared-context pages are the two tabs in the single-writer test.
const test = base.extend<{ localOnly: void }>({
  localOnly: [async ({ context }, use) => {
    const blocked: string[] = [];
    await context.route('**/*', async route => {
      if (new URL(route.request().url()).origin === origin) await route.continue();
      else {
        blocked.push(route.request().url());
        await route.abort('blockedbyclient');
      }
    });
    await use();
    expect(blocked, 'Runtime requests must stay on the isolated localhost origin').toEqual([]);
  }, { auto: true }],
});

async function ready(page: Page) {
  await expect(page.getByText('Saved on this device', { exact: false })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
}

async function navigate(page: Page, name: 'Dashboard' | 'Study' | 'Notes' | 'Mistakes' | 'Card Library' | 'Topics') {
  await page.getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name, exact: true }).click();
}

async function settings(page: Page) {
  await page.getByRole('button', { name: 'Settings & backup', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
}

// These stat containers have no accessible region names in the current UI.
function stat(page: Page, label: string) {
  return page.locator('.stat-card').filter({ has: page.getByText(label, { exact: true }) }).locator('.stat-value');
}

// Read-only persistence inspection supplements UI assertions. Never seed or mutate
// IndexedDB/localStorage: all state changes go through real application controls.
async function stateOf(page: Page): Promise<LearnerState> {
  return page.evaluate((empty) => new Promise<LearnerState>((resolve, reject) => {
    const request = indexedDB.open('d365-pa-study-desk');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('learnerState', 'readonly');
      const get = transaction.objectStore('learnerState').get('singleton');
      let snapshot: LearnerState = empty;
      get.onsuccess = () => { snapshot = get.result?.state ?? empty; };
      transaction.oncomplete = () => { db.close(); resolve(snapshot); };
      transaction.onabort = () => { db.close(); reject(transaction.error); };
      transaction.onerror = () => { db.close(); reject(transaction.error); };
    };
  }), defaults);
}

async function start(page: Page, format: 'Recall' | 'Multiple choice', quiz = false) {
  await page.getByRole('button', { name: 'Start studying', exact: true }).click();
  await page.getByRole('combobox', { name: 'Study mode', exact: true }).selectOption({
    label: quiz ? 'Practice quiz (multiple choice)' : 'Adaptive mix',
  });
  await page.getByRole('combobox', { name: 'Topic', exact: true }).selectOption({ label: 'All topics' });
  await page.getByRole('combobox', { name: 'Session length', exact: true }).selectOption({ label: '10 cards' });
  await page.getByRole('combobox', { name: 'Format', exact: true }).selectOption({ label: format });
  await page.getByRole('button', { name: 'Start session', exact: true }).click();
  await expect(page.getByText('1 / 10 cards', { exact: true })).toBeVisible();
}

async function activeCard(page: Page, installedPack: Pack = pack): Promise<Card> {
  const heading = page.locator('.study-card').getByRole('heading', { level: 2 });
  await expect(heading).toBeVisible();
  const prompt = (await heading.innerText()).trim();
  const matches = installedPack.cards.filter(card => card.prompt === prompt);
  expect(matches, `The rendered prompt must uniquely identify a catalog card: ${prompt}`).toHaveLength(1);
  return matches[0];
}

async function choose(page: Page, card: Card, correct = true) {
  expect(card.kind).toBe('mcq');
  const option = card.options?.find(item => correct
    ? item.id === card.correctOptionId : item.id !== card.correctOptionId);
  if (!option) throw new Error(`No ${correct ? 'correct' : 'incorrect'} option for ${card.id}`);
  const radio = page.getByRole('radiogroup', { name: 'Answer choices' })
    .getByRole('radio', { name: `${String.fromCharCode(65 + card.options!.indexOf(option))}. ${option.text}`, exact: true });
  await radio.click();
  await expect(radio).toBeChecked();
  return option.id;
}

async function annotate(page: Page, text: string) {
  await page.getByLabel(annotationLabel, { exact: true }).fill(text);
  // Wait for debounce and completed persistence, not an arbitrary sleep.
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
}

async function openFirstNote(page: Page) {
  await navigate(page, 'Notes');
  await expect(page.getByRole('heading', { name: firstNote.title, exact: true })).toBeVisible();
}

async function downloadBytes(page: Page, button: Locator): Promise<Buffer> {
  const downloadPromise = page.waitForEvent('download');
  await button.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.json$/);
  const stream = await download.createReadStream();
  if (!stream) throw new Error('Backup download did not provide a readable stream');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  expect(await download.failure()).toBeNull();
  return Buffer.concat(chunks);
}

async function uploadBackup(page: Page, buffer: Buffer) {
  const input = page.getByLabel('Choose backup', { exact: true });
  await input.setInputFiles({
    name: 'desk-backup.json', mimeType: 'application/json', buffer,
  });
  // The handler resets the input only after reading and validating the file.
  // This also avoids matching a previous rejection message on repeated imports.
  await expect(input).toHaveValue('');
}

async function expectSources(container: Locator, ids: string[], installedPack: Pack = pack) {
  expect(ids.length).toBeGreaterThan(0);
  await expect(container.getByRole('heading', { name: 'Reference sources', exact: true })).toBeVisible();
  for (const id of ids) {
    const source = installedPack.sources.find(item => item.id === id);
    if (!source) throw new Error(`Missing source ${id}`);
    const link = container.getByRole('link').filter({ hasText: source.title });
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', source.url);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /\bnoopener\b/);
    await expect(link).toHaveAttribute('rel', /\bnoreferrer\b/);
    expect(new URL(source.url).protocol).toBe('https:');
    // Inspect references only; never navigate to external documentation.
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await ready(page);
});

test('empty dashboard has no invented performance or history', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Welcome to your study desk.', exact: true })).toBeVisible();
  await expect(stat(page, 'Due for review')).toHaveText('0');
  await expect(stat(page, 'Study coverage')).toHaveText(`0 / ${pack.cards.length}`);
  await expect(stat(page, 'Recent performance')).toHaveText('—');
  await expect(stat(page, 'Needs another look')).toHaveText('0');
  await expect(page.getByText('Not studied', { exact: true })).toHaveCount(pack.topics.length);
  await expect(page.getByText('MCQ accuracy: — · Separate from self-rated recall.', { exact: true })).toBeVisible();
  await navigate(page, 'Mistakes');
  await expect(page.getByRole('heading', { name: 'Nothing in this view yet.', exact: true })).toBeVisible();
  expect(await stateOf(page)).toEqual(defaults);
});

for (const certificationPack of [packs.find(item => item.id === 'ab-250-contact-center-ai-engineer')!, practicePack]) {
test(`${certificationPack.title} has isolated annotations and scoped export`, async ({ page }) => {
  const packSelect = page.getByRole('combobox', { name: 'Study pack', exact: true });
  await packSelect.selectOption(certificationPack.id);
  await expect(page.getByText(`${certificationPack.cards.length} cards · ${certificationPack.notes.length} field notes`, { exact: true })).toBeVisible();
  await navigate(page, 'Topics');
  for (const topic of certificationPack.topics) {
    await expect(page.getByRole('heading', { name: topic.title, exact: true })).toBeVisible();
  }

  await navigate(page, 'Notes');
  const certificationNote = certificationPack.notes[0];
  await expect(page.getByRole('heading', { name: certificationNote.title, exact: true })).toBeVisible();
  await annotate(page, 'Certification-pack-only annotation.');
  expect((await stateOf(page)).annotations).toEqual([
    expect.objectContaining({ packId: certificationPack.id, id: `${certificationPack.id}:${certificationNote.id}` }),
  ]);

  await packSelect.selectOption(pack.id);
  await expect(page.getByLabel(annotationLabel, { exact: true })).toHaveValue('');
  await packSelect.selectOption(certificationPack.id);
  await expect(page.getByLabel(annotationLabel, { exact: true })).toHaveValue('Certification-pack-only annotation.');

  await settings(page);
  await expect(page.getByRole('combobox', { name: 'Backup scope', exact: true })).toHaveValue(certificationPack.id);
  const backup = JSON.parse((await downloadBytes(page, page.getByRole('button', { name: 'Export backup', exact: true }))).toString('utf8'));
  expect(backup).toMatchObject({ format: 'd365-pa-study-desk', version: 2, scope: { kind: 'pack', packId: certificationPack.id } });
  expect(backup.state.annotations).toEqual([
    expect.objectContaining({ packId: certificationPack.id, text: 'Certification-pack-only annotation.' }),
  ]);
  expect(backup.state.events).toEqual([]);
  expect(backup.state.schedules).toEqual([]);
});
}

test('original practice answers show explanations and its restore preserves another pack’s learning and session', async ({ page }) => {
  const packSelect = page.getByRole('combobox', { name: 'Study pack', exact: true });
  await packSelect.selectOption(practicePack.id);
  await start(page, 'Multiple choice');
  const card = await activeCard(page, practicePack);
  await choose(page, card);
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Correct — nicely done. Saved locally.');
  const answer = page.locator('.study-card .card-answer');
  await expect(answer.getByText(card.answer, { exact: true })).toBeVisible();
  for (const option of card.options!) await expect(answer.getByText(option.rationale, { exact: true })).toBeVisible();
  await expectSources(answer, card.sourceIds, practicePack);
  await annotate(page, 'Original practice reminder.');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'End session early', exact: true }).click();
  await settings(page);
  const original = await stateOf(page);
  const backup = await downloadBytes(page, page.getByRole('button', { name: 'Export backup', exact: true }));
  expect(original.events[0]).toMatchObject({ packId: practicePack.id, cardId: card.id, rating: 'good' });
  expect(original.session).toBeNull();

  await packSelect.selectOption(pack.id);
  await navigate(page, 'Dashboard');
  await expect(stat(page, 'Study coverage')).toHaveText(`0 / ${pack.cards.length}`);
  await start(page, 'Recall');
  await page.getByRole('button', { name: 'Reveal answer', exact: true }).click();
  await page.getByRole('button', { name: '1 · Again Forgot / incorrect', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Recorded: again. Saved locally.');
  await annotate(page, 'Keep this general-pack reminder.');
  const before = await stateOf(page);
  await settings(page);
  await uploadBackup(page, backup);
  const dialog = page.getByRole('dialog', { name: 'Restore a backup', exact: true });
  await downloadBytes(page, dialog.getByRole('button', { name: 'Download safety backup', exact: true }));
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Replace with backup', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Backup restored successfully.');
  const after = await stateOf(page);
  for (const key of ['events', 'schedules', 'annotations'] as const) {
    expect(after[key].filter(item => item.packId === pack.id)).toEqual(before[key].filter(item => item.packId === pack.id));
    expect(after[key].filter(item => item.packId === practicePack.id)).toEqual(original[key]);
  }
  expect(after.session).toEqual(before.session);
});

for (const width of [1920, 768, 320]) {
  test(`active study card is centered and stays readable at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await start(page, 'Recall');
    const geometry = await page.locator('.study-stage').evaluate(stage => {
      const area = stage.getBoundingClientRect();
      const card = stage.querySelector('.study-card')!.getBoundingClientRect();
      return { topGap: card.top - area.top, bottomGap: area.bottom - card.bottom,
        left: card.left, right: card.right, width: card.width, viewport: document.documentElement.clientWidth };
    });
    expect(Math.abs(geometry.topGap - geometry.bottomGap)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.left - (geometry.viewport - geometry.right))).toBeLessThanOrEqual(1);
    expect(geometry.width).toBeGreaterThanOrEqual(width * 0.7);
    expect(geometry.left).toBeGreaterThanOrEqual(0);
    expect(geometry.right).toBeLessThanOrEqual(geometry.viewport);
    if (width === 1920) await page.screenshot({ path: testInfo.outputPath('centered-study-card.png') });
    await page.getByRole('button', { name: 'Reveal answer', exact: true }).click();
    await expect(page.locator('.rating-grid button')).toHaveCount(2);
    for (const button of await page.locator('.rating-grid button').all()) {
      await button.scrollIntoViewIfNeeded();
      const box = await button.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      await button.click({ trial: true });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect((await stateOf(page)).events).toEqual([]);
  });
}

test('recall Again updates history, reload resumes the answered card, and Next advances once', async ({ page }) => {
  await start(page, 'Recall');
  const card = await activeCard(page);
  expect(card.kind).toBe('recall');
  await page.getByRole('button', { name: 'Reveal answer', exact: true }).click();
  await expect(page.getByText(card.answer, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '1 · Again Forgot / incorrect', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Recorded: again. Saved locally.');
  const saved = await stateOf(page);
  expect(saved.events).toHaveLength(1);
  expect(saved.events[0]).toMatchObject({ cardId: card.id, rating: 'again', guessed: false, kind: 'recall' });
  expect(saved.session).toMatchObject({ mode: 'adaptive', finished: false, index: 0, pending: [] });
  expect(saved.schedules).toHaveLength(1);
  expect(saved.schedules[0].due - saved.events[0].at).toBe(10 * 60_000);

  await navigate(page, 'Mistakes');
  const historyCard = page.getByRole('article').filter({ has: page.getByRole('heading', { name: card.prompt, exact: true }) });
  await expect(historyCard.getByText('1 recent misses · 0 guesses', { exact: true })).toBeVisible();
  await expect(historyCard.getByLabel('Recent outcomes').locator('[title^="again"]')).toHaveCount(1);
  await navigate(page, 'Dashboard');
  await expect(stat(page, 'Study coverage')).toHaveText(`1 / ${pack.cards.length}`);
  await expect(stat(page, 'Needs another look')).toHaveText('1');

  await page.reload();
  await ready(page);
  await page.getByRole('button', { name: 'Resume your session', exact: true }).click();
  expect((await activeCard(page)).id).toBe(card.id);
  await expect(page.getByRole('status')).toHaveText('Recorded: again. Saved locally.');
  await expect(page.getByRole('button', { name: 'Reveal answer', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Next card', exact: true }).click();
  await expect(page.getByText('2 / 10 cards', { exact: true })).toBeVisible();
  expect((await activeCard(page)).id).not.toBe(card.id);
  expect((await stateOf(page)).events).toEqual(saved.events);
});

test('routing option IDs stay internal in choices, feedback, and explanations', async ({ page }) => {
  const card = pack.cards.find(item => item.id === 'cc-routing-039')!;
  expect(card.options![0].id).toBe('cc-routing-039-option-1');
  const now = Date.now();
  const fixture: LearnerState = { ...structuredClone(defaults), session: {
    id: 'label-regression', packId: pack.id, mode: 'practice', cardIds: [card.id],
    index: 0, startedAt: now, finished: false, pending: [],
  } };
  await settings(page);
  await uploadBackup(page, Buffer.from(JSON.stringify({
    format: 'd365-pa-study-desk', version: 1, exportedAt: new Date(now).toISOString(), state: fixture,
  })));
  const dialog = page.getByRole('dialog', { name: 'Restore a backup', exact: true });
  await downloadBytes(page, dialog.getByRole('button', { name: 'Download safety backup', exact: true }));
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Replace with backup', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await navigate(page, 'Study');
  await page.setViewportSize({ width: 390, height: 844 });
  const choices = page.getByRole('radiogroup', { name: 'Answer choices' });
  await expect(choices.locator('strong')).toHaveText(['A.', 'B.', 'C.', 'D.']);
  await expect(choices).not.toContainText('CC-ROUTING');
  const wrong = card.options!.find(option => option.id !== card.correctOptionId)!;
  await choose(page, card, false);
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  const letter = String.fromCharCode(65 + card.options!.indexOf(wrong));
  await expect(page.getByRole('status').first()).toContainText(`You chose ${letter}.`);
  await expect(page.locator('.card-answer .options strong')).toHaveText(card.options!.map((option, i) => `${String.fromCharCode(65 + i)}. ${option.text}`));
  expect((await stateOf(page)).events[0]).toMatchObject({ selectedOptionId: wrong.id, rating: 'again' });
  await page.reload();
  await ready(page);
  await navigate(page, 'Study');
  await expect(page.getByRole('status').first()).toContainText(`You chose ${letter}.`);
});

test('repeated misses persist as a tag without suspending the card, even after one good review', async ({ page }) => {
  const card = pack.cards.find(item => item.kind === 'recall');
  if (!card) throw new Error('The catalog must contain a recall card');
  const now = Date.now();
  const fixture: LearnerState = {
    ...defaults,
    events: Array.from({ length: 5 }, (_, index) => ({
      id: `repeat-miss-${index}`, sessionId: `repeat-session-${index}`,
      packId: pack.id, cardId: card.id, revision: card.revision,
      at: now - (4 - index) * 24 * 60 * 60_000 - 10 * 60_000,
      rating: 'again', kind: 'recall', guessed: false, eligible: true,
    })),
    // Only this card has a schedule; its last Again becomes due now.
    schedules: [{ packId: pack.id, cardId: card.id, revision: card.revision, stage: -1, due: now }],
  };
  await settings(page);
  await uploadBackup(page, Buffer.from(JSON.stringify({
    format: 'd365-pa-study-desk', version: 1, exportedAt: new Date(now).toISOString(), state: fixture,
  })));
  const dialog = page.getByRole('dialog', { name: 'Restore a backup', exact: true });
  await expect(dialog).toBeVisible();
  const safety = await downloadBytes(page, dialog.getByRole('button', { name: 'Download safety backup', exact: true }));
  expect(JSON.parse(safety.toString('utf8')).state).toEqual(defaults);
  await dialog.getByRole('checkbox', { name: 'I have kept my safety backup and understand this replaces current data.', exact: true }).check();
  await dialog.getByRole('button', { name: 'Replace with backup', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('Backup restored successfully.');
  await page.reload();
  await ready(page);
  expect(await stateOf(page)).toEqual(fixture);

  await navigate(page, 'Mistakes');
  await page.getByRole('button', { name: 'Repeat offenders', exact: true }).click();
  const article = page.getByRole('article').filter({ has: page.getByRole('heading', { name: card.prompt, exact: true }) });
  await expect(article).toHaveCount(1);
  await expect(article).toBeVisible();
  await expect(article.getByText('repeat-offender', { exact: true })).toBeVisible();
  await expect(article.getByText('5 recent misses · 0 guesses', { exact: true })).toBeVisible();

  await navigate(page, 'Card Library');
  await page.getByLabel('Search cards or notes', { exact: true }).fill(card.prompt);
  await expect(article).toHaveCount(1);
  await expect(article).toBeVisible();
  await expect(article.getByText('repeat-offender', { exact: true })).toBeVisible();

  await navigate(page, 'Study');
  await page.getByRole('combobox', { name: 'Study mode', exact: true }).selectOption({ label: 'Due for review' });
  await page.getByRole('combobox', { name: 'Topic', exact: true }).selectOption({ label: 'All topics' });
  await page.getByRole('combobox', { name: 'Format', exact: true }).selectOption({ label: 'Recall' });
  // Due mode includes only the one scheduled card, not unseen cards, regardless of the session cap.
  await page.getByRole('combobox', { name: 'Session length', exact: true }).selectOption({ label: '10 cards' });
  await page.getByRole('button', { name: 'Start session', exact: true }).click();
  await expect(page.getByText('1 / 1 cards', { exact: true })).toBeVisible();
  expect((await activeCard(page)).id).toBe(card.id);
  await page.getByRole('button', { name: 'Reveal answer', exact: true }).click();
  await expect(page.getByText(card.answer, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '2 · Good Knew the essentials', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Recorded: good. Saved locally.');
  await page.getByRole('button', { name: 'Finish session', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Session complete', exact: true })).toBeVisible();
  const saved = await stateOf(page);
  expect(saved.events).toHaveLength(6);
  expect(saved.events.slice(0, 5)).toEqual(fixture.events);
  expect(saved.events[5]).toMatchObject({ cardId: card.id, rating: 'good', guessed: false, eligible: true });
  expect(new Set(saved.events.map(event => event.sessionId)).size).toBe(6);
  expect(saved.session).toMatchObject({ mode: 'due', cardIds: [card.id], index: 1, finished: true });

  await page.reload();
  await ready(page);
  expect(await stateOf(page)).toEqual(saved);
  await navigate(page, 'Mistakes');
  await page.getByRole('button', { name: 'Repeat offenders', exact: true }).click();
  await expect(article).toBeVisible();
  await expect(article.getByText('repeat-offender', { exact: true })).toBeVisible();
  await expect(article.getByText('Resolved', { exact: true })).toHaveCount(0);
  await expect(article.getByText('5 recent misses · 0 guesses', { exact: true })).toBeVisible();
});

test('personal note annotation persists across reload without scoring a review', async ({ page }) => {
  await openFirstNote(page);
  const text = 'My implementation reminder: verify the prerequisites before configuration.';
  await annotate(page, text);
  const saved = await stateOf(page);
  expect(saved.annotations).toEqual([expect.objectContaining({ id: `${pack.id}:${firstNote.id}`, text })]);
  expect(saved.events).toEqual([]);
  await page.reload();
  await ready(page);
  await openFirstNote(page);
  await expect(page.getByLabel(annotationLabel, { exact: true })).toHaveValue(text);
  expect(await stateOf(page)).toEqual(saved);
});

test('correct guessed MCQ counts as correct accuracy but uncertain performance, not a miss', async ({ page }) => {
  await start(page, 'Multiple choice');
  const card = await activeCard(page);
  await expect(page.getByRole('button', { name: 'Check answer', exact: true })).toBeDisabled();
  const selectedOptionId = await choose(page, card);
  await page.getByLabel(guessedLabel, { exact: true }).check();
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Correct, but guessed — scheduled for an earlier review. Saved locally.');
  const saved = await stateOf(page);
  expect(saved.events).toHaveLength(1);
  expect(saved.events[0]).toMatchObject({ cardId: card.id, rating: 'hard', guessed: true, selectedOptionId });
  expect(saved.session).toMatchObject({ mode: 'adaptive', finished: false, index: 0, pending: [] });
  await navigate(page, 'Dashboard');
  await expect(stat(page, 'Recent performance')).toHaveText('50%');
  await expect(page.getByText('MCQ accuracy: 100% · Separate from self-rated recall.', { exact: true })).toBeVisible();
  await navigate(page, 'Mistakes');
  await expect(page.getByRole('heading', { name: 'Nothing in this view yet.', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Guessed', exact: true }).click();
  await expect(page.getByRole('heading', { name: card.prompt, exact: true })).toBeVisible();
  await expect(page.getByText('0 recent misses · 1 guesses', { exact: true })).toBeVisible();
});

test('ten-question quiz with a guess and a wrong answer commits and grades only at the end', async ({ page }) => {
  await start(page, 'Multiple choice', true);
  const answers: { cardId: string; selectedOptionId: string; rating: string; guessed: boolean }[] = [];
  for (let index = 0; index < 10; index++) {
    await expect(page.getByText(`${index + 1} / 10 cards`, { exact: true })).toBeVisible();
    const card = await activeCard(page);
    await expect(page.getByRole('heading', { name: 'What to remember', exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Session complete', exact: true })).toHaveCount(0);
    const selectedOptionId = await choose(page, card, index !== 1);
    if (index === 0) await page.getByLabel(guessedLabel, { exact: true }).check();
    else await expect(page.getByLabel(guessedLabel, { exact: true })).not.toBeChecked();
    answers.push({ cardId: card.id, selectedOptionId, rating: index === 1 ? 'again' : index === 0 ? 'hard' : 'good', guessed: index === 0 });
    await page.getByRole('button', { name: 'Save answer & continue', exact: true }).click();
    if (index < 9) {
      await expect(page.getByText(`${index + 2} / 10 cards`, { exact: true })).toBeVisible();
      const interim = await stateOf(page);
      expect(interim.events).toEqual([]);
      expect(interim.schedules).toEqual([]);
      expect(interim.session?.pending).toHaveLength(index + 1);
      expect(interim.session).toMatchObject({ mode: 'quiz', finished: false, index: index + 1 });
      expect(interim.session?.pending).toEqual(answers.map(answer => expect.objectContaining(answer)));
      await expect(page.getByRole('status')).toHaveCount(0);
    }
    if (index === 3) {
      await navigate(page, 'Dashboard');
      await expect(stat(page, 'Study coverage')).toHaveText(`0 / ${pack.cards.length}`);
      await expect(stat(page, 'Recent performance')).toHaveText('—');
      await page.reload();
      await ready(page);
      await page.getByRole('button', { name: 'Resume your session', exact: true }).click();
      await expect(page.getByText('5 / 10 cards', { exact: true })).toBeVisible();
    }
  }
  await expect(page.getByRole('heading', { name: 'Session complete', exact: true })).toBeVisible();
  await expect(page.getByText('10 answers recorded. 9 correct (including guesses).', { exact: true })).toBeVisible();
  const saved = await stateOf(page);
  expect(saved.events).toHaveLength(10);
  expect(new Set(saved.events.map(event => event.id)).size).toBe(10);
  expect(saved.events).toEqual(answers.map(answer => expect.objectContaining(answer)));
  expect(saved.schedules).toHaveLength(10);
  expect(saved.session).toMatchObject({ mode: 'quiz', finished: true, index: 10, pending: [] });
  const results = page.locator('details.result-item');
  await expect(results).toHaveCount(10);
  await results.first().locator('summary').click();
  await expect(results.first().getByRole('heading', { name: 'What to remember', exact: true })).toBeVisible();
  await page.reload();
  await ready(page);
  await expect(stat(page, 'Study coverage')).toHaveText(`10 / ${pack.cards.length}`);
  await expect(page.getByText('MCQ accuracy: 90% · Separate from self-rated recall.', { exact: true })).toBeVisible();
  expect((await stateOf(page)).events).toEqual(saved.events);
});

test('invalid preferences and invalid backups leave existing state unchanged', async ({ page }) => {
  await openFirstNote(page);
  await annotate(page, 'Keep this existing annotation.');
  const before = await stateOf(page);
  await settings(page);
  await page.getByLabel('Misses to flag', { exact: true }).fill('1');
  await expect(page.getByRole('button', { name: 'Save preferences', exact: true })).toBeDisabled();
  await expect(page.getByText('Use whole numbers: at least 2 misses, with a window between the threshold and 100.', { exact: true })).toBeVisible();
  expect(await stateOf(page)).toEqual(before);

  const envelope = { format: 'd365-pa-study-desk', version: 1, exportedAt: new Date().toISOString(), state: before };
  const invalid = [
    '{not JSON',
    JSON.stringify({}),
    JSON.stringify({ ...envelope, version: 999 }),
    JSON.stringify({ ...envelope, state: { ...before, settings: { threshold: 20, window: 10, sessionSize: 20 } } }),
  ];
  for (const content of invalid) {
    await uploadBackup(page, Buffer.from(content));
    await expect(page.getByRole('status')).toContainText('Import rejected:');
    await expect(page.getByRole('status')).toContainText('Existing data was not changed.');
    await expect(page.getByRole('dialog', { name: 'Restore a backup', exact: true })).toHaveCount(0);
    expect(await stateOf(page)).toEqual(before);
  }
  await page.reload();
  await ready(page);
  expect(await stateOf(page)).toEqual(before);
});

test('export and confirmed restore round-trip annotations, preferences, and a paused session', async ({ page }) => {
  await start(page, 'Recall');
  const card = await activeCard(page);
  await annotate(page, 'Original card annotation in the backup.');
  await settings(page);
  const original = await stateOf(page);
  const backup = await downloadBytes(page, page.getByRole('button', { name: 'Export backup', exact: true }));
  expect(JSON.parse(backup.toString('utf8'))).toMatchObject({ format: 'd365-pa-study-desk', version: 2, scope: { kind: 'pack', packId: pack.id }, state: original });

  await page.getByLabel('Misses to flag', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Save preferences', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Study preferences saved.');
  await navigate(page, 'Study');
  await annotate(page, 'Newer text to be replaced.');
  await settings(page);
  const changed = await stateOf(page);
  expect(changed).not.toEqual(original);
  await uploadBackup(page, backup);
  const dialog = page.getByRole('dialog', { name: 'Restore a backup', exact: true });
  await expect(dialog).toBeVisible();
  expect(await stateOf(page)).toEqual(changed);
  const confirm = dialog.getByRole('button', { name: 'Replace with backup', exact: true });
  const checkbox = dialog.getByRole('checkbox', { name: 'I have kept my safety backup and understand this replaces current data.', exact: true });
  await expect(confirm).toBeDisabled();
  await expect(checkbox).toBeDisabled();
  const safety = await downloadBytes(page, dialog.getByRole('button', { name: 'Download safety backup', exact: true }));
  expect(JSON.parse(safety.toString('utf8')).state).toEqual(changed);
  await expect(confirm).toBeDisabled();
  await checkbox.check();
  await confirm.click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('Backup restored successfully.');
  expect(await stateOf(page)).toEqual(original);
  await page.reload();
  await ready(page);
  await page.getByRole('button', { name: 'Resume your session', exact: true }).click();
  expect((await activeCard(page)).id).toBe(card.id);
  await expect(page.getByLabel(annotationLabel, { exact: true })).toHaveValue('Original card annotation in the backup.');
  expect(await stateOf(page)).toEqual(original);
});

test('keyboard shortcuts reveal, rate, and advance but do not fire while typing annotations', async ({ page }) => {
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await start(page, 'Recall');
  const annotation = page.getByLabel(annotationLabel, { exact: true });
  await annotation.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Reveal answer', exact: true })).toBeVisible();
  await page.getByRole('main').focus();
  await page.keyboard.press('1');
  await page.keyboard.press('2');
  expect((await stateOf(page)).events).toEqual([]);
  await page.keyboard.press('Space');
  await expect(page.getByRole('heading', { name: 'What to remember', exact: true })).toBeVisible();
  await expect(page.locator('.rating-grid button')).toHaveCount(2);
  await expect(page.getByRole('button', { name: '2 · Good Knew the essentials', exact: true })).toHaveAttribute('aria-keyshortcuts', '2');
  await annotation.focus();
  await page.keyboard.type('1234');
  expect((await stateOf(page)).events).toEqual([]);
  await expect(page.getByRole('button', { name: 'Next card', exact: true })).toHaveCount(0);
  await page.getByRole('main').focus();
  await page.keyboard.press('3');
  await page.keyboard.press('4');
  expect((await stateOf(page)).events).toEqual([]);
  await page.keyboard.press('1');
  await expect(page.getByRole('status')).toHaveText('Recorded: again. Saved locally.');
  await page.keyboard.press('2');
  expect((await stateOf(page)).events).toHaveLength(1);
  await page.keyboard.press('Enter');
  await expect(page.getByText('2 / 10 cards', { exact: true })).toBeVisible();
  expect((await stateOf(page)).events).toHaveLength(1);
  await page.getByRole('button', { name: 'Reveal answer', exact: true }).click();
  await page.getByRole('button', { name: '1 · Again Forgot / incorrect', exact: true }).focus();
  await page.keyboard.press('2');
  await expect(page.getByRole('status')).toHaveText('Recorded: good. Saved locally.');
  const saved = await stateOf(page);
  expect(saved.events.map(event => event.rating)).toEqual(['again', 'good']);
  const good = saved.events[1];
  expect(saved.schedules.find(item => item.cardId === good.cardId)!.due - good.at).toBe(24 * 60 * 60_000);
  await page.getByRole('button', { name: 'Next card', exact: true }).click();
  await page.getByRole('button', { name: 'Reveal answer', exact: true }).click();
  await page.getByRole('button', { name: '1 · Again Forgot / incorrect', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('status')).toHaveText('Recorded: again. Saved locally.');
  expect((await stateOf(page)).events.map(event => event.rating)).toEqual(['again', 'good', 'again']);
});

test('source links are safe and card dialog traps focus, closes on Escape, and restores focus', async ({ page }) => {
  await openFirstNote(page);
  await expectSources(page.locator('.note-detail'), firstNote.sourceIds);
  await navigate(page, 'Card Library');
  const card = pack.cards[0];
  await page.getByLabel('Search cards or notes', { exact: true }).fill(card.prompt);
  const article = page.getByRole('article').filter({ has: page.getByRole('heading', { name: card.prompt, exact: true }) });
  const explore = article.getByRole('button', { name: 'Explore answer', exact: true });
  await explore.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Card detail', exact: true });
  await expect(dialog).toBeFocused();
  await expectSources(dialog, card.sourceIds);
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByLabel(annotationLabel, { exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close dialog', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(explore).toBeFocused();
  expect((await stateOf(page)).events).toEqual([]);
});

test('mobile layout keeps navigation, study controls, notes, and settings within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const fits = async () => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  };
  await fits();
  await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to light theme', exact: true }).click();
  await start(page, 'Recall');
  await fits();
  await page.getByRole('button', { name: 'Reveal answer', exact: true }).click();
  await expect(page.getByRole('button', { name: '1 · Again Forgot / incorrect', exact: true })).toBeVisible();
  await fits();
  await openFirstNote(page);
  await expectSources(page.locator('.note-detail'), firstNote.sourceIds);
  await fits();
  await settings(page);
  await expect(page.getByRole('button', { name: 'Export backup', exact: true })).toBeVisible();
  await fits();
});

// Measure border boxes, including padding, against the actual layout viewport.
// A one-pixel tolerance accommodates fractional layout and scrollbar rounding.
async function expectResponsiveShell(page: Page, desktop: boolean) {
  await expect(page.locator('header.sidebar')).toBeVisible();
  await expect(page.locator('.topbar')).toHaveCount(0);
  await expect(page.locator('.hero-orbit')).toHaveCount(0);
  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Missing layout element: ${selector}`);
      const { left, right, top, bottom, width, height } = element.getBoundingClientRect();
      return { left, right, top, bottom, width, height };
    };
    return {
      viewport: document.documentElement.clientWidth,
      viewportHeight: window.innerHeight,
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
        - document.documentElement.clientWidth,
      header: rect('header.sidebar'),
      page: rect('.page'),
      nav: Array.from(document.querySelectorAll('header.sidebar .nav-item'), element => {
        const { left, right, top, bottom, height } = element.getBoundingClientRect();
        return { name: element.textContent, left, right, top, bottom, height };
      }),
    };
  });
  expect(geometry.overflow, 'No horizontal document overflow').toBeLessThanOrEqual(1);
  expect(geometry.header.left).toBeGreaterThanOrEqual(-1);
  expect(geometry.header.right).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.header.top).toBeGreaterThanOrEqual(-1);
  expect(geometry.header.bottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);
  expect(geometry.header.width).toBeGreaterThanOrEqual(geometry.viewport * 0.95);
  expect(geometry.page.top, 'Content starts below the horizontal header').toBeGreaterThanOrEqual(geometry.header.bottom - 1);
  expect(geometry.page.left).toBeGreaterThanOrEqual(-1);
  expect(geometry.page.right).toBeLessThanOrEqual(geometry.viewport + 1);
  if (desktop) expect(geometry.page.width).toBeGreaterThanOrEqual(geometry.viewport * 0.95);
  expect(geometry.nav).toHaveLength(7); // Six destinations plus Settings & backup.
  for (const item of geometry.nav) {
    expect(item.height, `${item.name}: minimum navigation target height`).toBeGreaterThanOrEqual(44);
    expect(item.left, item.name ?? '').toBeGreaterThanOrEqual(-1);
    expect(item.right, item.name ?? '').toBeLessThanOrEqual(geometry.viewport + 1);
    expect(item.top, item.name ?? '').toBeGreaterThanOrEqual(geometry.header.top - 1);
    expect(item.bottom, item.name ?? '').toBeLessThanOrEqual(geometry.header.bottom + 1);
  }
}

async function expectReachableButtons(page: Page) {
  const buttons = page.getByRole('button');
  expect(await buttons.count()).toBeGreaterThan(0);
  for (const button of await buttons.all()) {
    await expect(button).toHaveAccessibleName(/\S/);
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
    // Trial clicks scroll nested lists as needed and check hit targets without
    // navigating, starting a session, exporting data, or changing preferences.
    if (await button.getAttribute('type') === 'file') {
      // The native file input is visually hidden behind its clickable label.
      // Verify that visible target without opening an OS file chooser.
      await button.locator('..').click({ trial: true });
    } else {
      await button.click({ trial: true });
    }
    await button.focus();
    await expect(button).toBeFocused();
  }
}

async function expectNotesGeometry(page: Page, desktop: boolean, narrow: boolean) {
  const geometry = await page.evaluate(() => {
    const box = (element: Element | null) => {
      if (!element) throw new Error('Missing notes geometry target');
      const { left, right, top, bottom, width, height } = element.getBoundingClientRect();
      return { left, right, top, bottom, width, height };
    };
    const list = document.querySelector('.notes-list');
    if (!list) throw new Error('Missing notes list');
    return {
      list: box(list),
      detail: box(document.querySelector('article.note-detail')),
      filters: box(document.querySelector('.page > .filter-bar')),
      maxHeight: getComputedStyle(list).maxHeight,
      overflowY: getComputedStyle(list).overflowY,
      clientHeight: list.clientHeight,
      scrollHeight: list.scrollHeight,
      // Inspect every rendered row, including those outside the scrollport.
      // Do not confuse a bounded list with a smaller number of available notes.
      items: Array.from(list.querySelectorAll('.note-item'), item => ({
        icon: box(item.querySelector('svg')),
        title: box(item.querySelector('strong')),
      })),
    };
  });
  expect(geometry.items.length).toBeGreaterThan(0);
  for (const { icon, title } of geometry.items) {
    expect(icon.width).toBeGreaterThan(0);
    expect(title.width).toBeGreaterThan(0);
    expect(title.left - icon.right, 'Icon and title have a real 8px gap, not overlapping boxes').toBeGreaterThanOrEqual(8);
  }
  if (desktop) {
    expect(geometry.detail.left).toBeGreaterThanOrEqual(geometry.list.right);
    expect(geometry.detail.left - geometry.list.right).toBeLessThanOrEqual(32);
    expect(Math.abs(geometry.detail.top - geometry.list.top)).toBeLessThanOrEqual(1);
  } else {
    // Tablet may use either side-by-side or stacked notes, depending on its
    // actual available width. Both must keep the article next to the list.
    const sideBySide = geometry.detail.left >= geometry.list.right;
    if (sideBySide) {
      expect(geometry.detail.left - geometry.list.right).toBeLessThanOrEqual(32);
      expect(Math.abs(geometry.detail.top - geometry.list.top)).toBeLessThanOrEqual(1);
    } else {
      expect(geometry.detail.top).toBeGreaterThanOrEqual(geometry.list.bottom - 1);
      expect(geometry.detail.top - geometry.list.bottom).toBeLessThanOrEqual(32);
    }
  }
  if (narrow) {
    expect(geometry.list.height, 'List must not push all notes ahead of the article').toBeLessThanOrEqual(261);
    expect(Number.parseFloat(geometry.maxHeight)).toBeLessThanOrEqual(260);
    expect(geometry.overflowY).toMatch(/^(auto|scroll)$/);
    expect(geometry.scrollHeight).toBeGreaterThan(geometry.clientHeight);
    expect(geometry.list.top - geometry.filters.bottom).toBeLessThanOrEqual(32);
    expect(geometry.detail.top - geometry.list.top).toBeLessThanOrEqual(293);
    expect(geometry.detail.top - geometry.filters.bottom).toBeLessThanOrEqual(325);
  }
}

for (const width of [1920, 1440, 768, 390, 320]) {
  for (const theme of ['dark', 'light'] as const) {
    test(`responsive ${width}px ${theme}: full-width layout, reachable controls, bounded notes, unchanged scores`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.setViewportSize({ width, height: 1000 });
      const before = await stateOf(page);
      const html = page.locator('html');
      const opposite = theme === 'dark' ? 'light' : 'dark';
      // Exercise the toggle for BOTH themes even when light is the default.
      if (await html.getAttribute('data-theme') !== opposite) {
        await page.getByRole('button', { name: `Switch to ${opposite} theme`, exact: true }).click();
      }
      await expect(html).toHaveAttribute('data-theme', opposite);
      await page.getByRole('button', { name: `Switch to ${theme} theme`, exact: true }).click();
      await expect(html).toHaveAttribute('data-theme', theme);
      await expect(page.getByRole('button', { name: `Switch to ${opposite} theme`, exact: true })).toBeVisible();

      for (const destination of ['Dashboard', 'Study', 'Card Library', 'Mistakes', 'Notes', 'Topics', 'Settings'] as const) {
        if (destination === 'Settings') await settings(page);
        else await navigate(page, destination);
        await expect(page.getByRole('heading', {
          name: destination === 'Dashboard' ? 'Welcome to your study desk.' : destination, exact: true, level: 1,
        })).toBeVisible();
        await expectResponsiveShell(page, width >= 1440);
        if (destination === 'Dashboard') {
          const dashboard = await page.evaluate(() => ({
            viewport: document.documentElement.clientWidth,
            statsWidth: document.querySelector('.stat-grid4')!.getBoundingClientRect().width,
            heroHeight: document.querySelector('.hero')!.getBoundingClientRect().height,
          }));
          if (width >= 1440) {
            expect(dashboard.statsWidth).toBeGreaterThanOrEqual(dashboard.viewport * 0.9);
            expect(dashboard.heroHeight).toBeLessThanOrEqual(150);
          }
        }
        if (destination === 'Notes') {
          await expect(page.locator('article.note-detail').getByRole('heading', { name: firstNote.title, exact: true })).toBeVisible();
          await expectNotesGeometry(page, width >= 1440, width <= 390);
        }
        await expectReachableButtons(page);
        await expect(html).toHaveAttribute('data-theme', theme);
        // Navigation, theme changes, and trial clicks must not score reviews,
        // change schedules, create sessions, or otherwise mutate learner data.
        expect(await stateOf(page)).toEqual(before);
      }
    });
  }
}

test('second tab is read-only until the writer closes and the reader reloads', async ({ page, context }) => {
  await start(page, 'Multiple choice');
  const original = await stateOf(page);
  const second = await context.newPage();
  await second.goto('/');
  await expect(second.getByText('Read-only tab', { exact: false })).toBeVisible();
  await expect(second.getByRole('status')).toContainText('Another Study Desk tab owns local storage. This tab is read-only and shows a snapshot.');
  await second.getByRole('button', { name: 'Resume your session', exact: true }).click();
  await expect(second.getByRole('radio')).toHaveCount(4);
  for (const radio of await second.getByRole('radio').all()) await expect(radio).toBeDisabled();
  await expect(second.getByLabel(guessedLabel, { exact: true })).toBeDisabled();
  await expect(second.getByLabel(annotationLabel, { exact: true })).toBeDisabled();
  await expect(second.getByRole('button', { name: 'Check answer', exact: true })).toBeDisabled();
  await expect(second.getByRole('button', { name: 'End session early', exact: true })).toBeDisabled();
  await settings(second);
  await expect(second.getByRole('button', { name: 'Save preferences', exact: true })).toBeDisabled();
  await expect(second.getByLabel('Choose backup', { exact: true })).toBeDisabled();
  expect(await stateOf(second)).toEqual(original);
  await page.close();
  await second.reload();
  await ready(second);
  await second.getByRole('button', { name: 'Resume your session', exact: true }).click();
  await expect(second.getByLabel(annotationLabel, { exact: true })).toBeEnabled();
  await annotate(second, 'The second tab now owns the writer lock.');
  expect((await stateOf(second)).annotations).toEqual([
    expect.objectContaining({ text: 'The second tab now owns the writer lock.' }),
  ]);
});
