import type { Card, Note, Source, Topic } from '../domain';

const topic: Topic = {
  id: 'cc-operations', title: 'Supervisor operations, analytics, and privacy',
  description: 'Operational reporting, recording and transcription governance, and Application Insights diagnostics. Dashboard/viewer lessons use standalone Contact Center scope. Reviewed 2026-10-09.',
};
const sourceId = (key: string) => `${topic.id}-source-${key}`;
const noteId = (key: string) => `${topic.id}-note-${key}`;
const sources: Source[] = [
  { id: sourceId('realtime'), title: 'Overview of Omnichannel real-time analytics dashboard', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/use/intro-realtime-analytics-dashboard', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('historical'), title: 'Omnichannel for Customer Service dashboards', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/use/omnichannel-analytics-insights', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('recording'), title: 'Configure call recording, transcription, and real-time translation', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/voice-channel-configure-transcripts', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('viewer'), title: 'View conversation transcripts and call recordings', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/use/voice-channel-call-recordings-transcripts', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('delete'), title: 'Delete call recordings', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/voice-channel-delete-calls', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('diagnostics'), title: 'Configure conversation diagnostics', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-conversation-diagnostics', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('diagnose'), title: 'Diagnose contact center health using Application Insights dashboard', url: 'https://learn.microsoft.com/en-us/dynamics365/contact-center/use/diagnose-dashboard', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('cs-deprecations'), title: 'Deprecations in Customer Service', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/implement/deprecations-customer-service', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('cc-deprecations'), title: 'Deprecations in Dynamics 365 Contact Center', url: 'https://learn.microsoft.com/en-us/dynamics365/contact-center/implement/deprecations-contact-center', verified: '2026-10-09', publisher: 'Microsoft Learn' },
];
const notes: Note[] = [
  {
    id: noteId('analytics'), topicId: topic.id, title: 'Choose reports for the operational question',
    summary: 'Use Omnichannel real-time analytics for current operational intervention and Omnichannel historical analytics for trends. Neither is the retired historical unified-routing dashboard.',
    sections: [
      { heading: 'Checklist', bullets: ['Define the operational question, then select the report and time range.', 'Align time zone, channel, queue, and status filters before comparing figures. Check Dataverse access and assigned queue scope.', 'For ongoing work, review eligible representative skills and capacity before assigning or transferring conversations.', 'Interpret reporting as near-real-time, not an instantaneous event ledger; the Ongoing conversation report requires manual refresh.'] },
      { heading: 'Gotchas', bullets: ['Different permissions can legitimately produce different metrics. A business-unit filter does not grant access.', 'The documented Omnichannel reports exclude Entity Record-channel work items; record-routing reporting is separate.', 'The real-time overview has an older blanket exclusion for AI-agent-resolved conversations alongside a newer Bot report listing. Check each report definition; do not assume all tabs have identical population coverage.', 'Microsoft says these analytics must not be used to make employment decisions, including pay or entitlements. Use them for service operations and improvement.'] },
    ],
    tags: ['analytics', 'supervisor', 'scope'], sourceIds: ['realtime', 'historical', 'cs-deprecations'].map(sourceId),
  },
  {
    id: noteId('recording-privacy'), topicId: topic.id, title: 'Recording and transcription require deliberate governance',
    summary: 'Audio recording, transcription, and translation are distinct capabilities. Enabling them does not itself establish lawful consent, appropriate access, or a complete retention policy.',
    sections: [
      { heading: 'Checklist', bullets: ['Determine applicable participant consent obligations with the organization responsible for compliance; inform customers and representatives appropriately.', 'Check tenant audio controls and the workstream transcription/recording mode, start mode, and pause/resume behavior.', 'Validate permissions to closed-conversation records and survey data using realistic roles.', 'Recommended practice: inventory recordings, transcripts, Copilot Studio transcripts, exports, and third-party copies; define retention, access, and deletion ownership for each.'] },
      { heading: 'Gotchas', bullets: ['Disabling tenant audio recording prevents it even when the workstream requests recording.', 'A manual-start Resume recording and transcript button does not prove that recording ran earlier.', 'Disabling voice recording/transcription does not guarantee no Copilot Studio transcript: AI-agent conversations can produce a separate transcript. DTMF-only agents capture keypad entries rather than spoken input in that transcript.', 'Deleting a Recording table record is not documented as deleting every transcript or exported copy. No universal retention period is asserted here.', 'The recording article contains legacy infrastructure setup and geography detail. These notes do not prescribe standalone ACS provisioning or generalize that diagram into a modern end-to-end residency guarantee.'] },
    ],
    tags: ['recording', 'privacy', 'retention'], sourceIds: ['recording', 'viewer', 'delete', 'realtime'].map(sourceId),
  },
  {
    id: noteId('diagnostics'), topicId: topic.id, title: 'Diagnose with conversation lifecycle evidence',
    summary: 'Current conversation diagnostics exports lifecycle telemetry to Application Insights. Use a conversation identifier and event-time evidence to distinguish routing decisions from later changes in representative state.',
    sections: [
      { heading: 'Checklist', bullets: ['Confirm a Managed Environment, export setup privileges, an Application Insights connection, and query access. The export documentation excludes sovereign clouds.', 'Budget for telemetry ingestion; enable collection before expecting diagnostic evidence.', 'Correlate the conversation ID and time range, then inspect classification, route-to-queue, and assignment events.', 'For assignment, compare required presence, skills, and capacity with the representative state at the actual assignment attempt.'] },
      { heading: 'Gotchas', bullets: ['The Diagnose dashboard requires its own setup, reporting prerequisites, and access. It is not simply the retired unified-routing diagnostics screen renamed.', 'The dashboard documentation limits diagnostic insights to out-of-box assignment methods and does not support transfer/consult diagnostics.', 'Synchronization and dashboard latency mean missing immediate data is not proof that no event occurred.', 'Presence now does not prove eligibility at the earlier assignment attempt. Multiple non-assignment reasons can apply across attempts.'] },
    ],
    tags: ['diagnostics', 'application-insights', 'routing'], sourceIds: ['diagnostics', 'diagnose', 'cs-deprecations'].map(sourceId),
  },
  {
    id: noteId('lifecycle'), topicId: topic.id, title: 'Operations feature lifecycle checkpoint — 2026-10-09',
    summary: 'Check both Contact Center and Customer Service notices because the products share features and documentation. Distinguish removed features from announced future removal.',
    sections: [
      { heading: 'Checklist', bullets: ['Replace legacy unified-routing diagnostics with conversation diagnostics in Application Insights; the legacy feature was scheduled for removal on 2026-03-31.', 'Do not recommend historical unified-routing analytics dashboards or effort estimation: their support ended in 2025; effort estimation was explicitly removed.', 'Move off deprecated Omnichannel agent/supervisor dashboard experiences toward inbox and Omnichannel real-time analytics; their support ends 2026-12-01.', 'Plan away from the older case/conversation and representative-volume forecasting feature: support ends 2026-10-30. The notices recommend forecast scenarios in workforce engagement management; assess availability for the intended deployment.'] },
      { heading: 'Gotchas', bullets: ['On this review date, October 30 is still in the future. Do not label that forecasting feature already removed or recommend it for a new rollout.', 'Retirement of historical unified-routing analytics does not retire every historical report.', 'Do not re-enable retired features merely because an older article or screenshot remains searchable.', 'The replacement recommendation is not a claim about automatic data migration, license inclusion, or exact UI parity.'] },
    ],
    tags: ['deprecations', 'forecasting', 'operations'], sourceIds: ['cs-deprecations', 'cc-deprecations', 'historical'].map(sourceId),
  },
];

const drafts: Omit<Card, 'topicId' | 'revision'>[] = [
  {
    id: 'recall-report-purpose', kind: 'recall', difficulty: 'Foundation',
    prompt: 'How should a supervisor distinguish real-time analytics, historical analytics, and diagnostic telemetry?',
    answer: 'Real-time analytics supports near-current operational decisions such as queue and representative allocation. Historical analytics shows trends across conversations, queues, and representatives. Diagnostic telemetry explains individual conversation lifecycle and routing events. Use each for its question rather than treating aggregate KPIs as a complete technical trace.',
    checkpoints: ['Current operations versus historical trends.', 'Diagnostics explains event-level behavior.', 'Do not confuse these with retired routing dashboards.'],
    tags: ['analytics', 'diagnostics'], sourceIds: ['realtime', 'historical', 'diagnostics'], noteIds: ['analytics', 'diagnostics'],
  },
  {
    id: 'recall-metric-scope', kind: 'recall', difficulty: 'Applied',
    prompt: 'What should be reconciled before declaring a defect because two supervisors see different real-time metrics?',
    answer: 'Compare report filters, time range and zone, assigned queue scope, and Dataverse permissions. Business-unit-level access can restrict the underlying data used for metrics. A filter narrows the visible data; it cannot grant access to data that the role does not authorize.',
    checkpoints: ['Same filters and time zone.', 'Same queue scope.', 'Compare permissions, not only report settings.'],
    tags: ['analytics', 'security', 'filters'], sourceIds: ['realtime'], noteIds: ['analytics'],
  },
  {
    id: 'recall-supervisor-response', kind: 'recall', difficulty: 'Applied',
    prompt: 'A queue backlog is rising. How can the real-time analytics experience support a responsible supervisor intervention?',
    answer: 'Drill into the affected channel, queue, and ongoing conversations, review representative skills and capacity, and use the supported assignment or transfer actions where appropriate. Check report freshness, especially the manually refreshed Ongoing conversation report. Investigate the operational bottleneck rather than reallocating solely from one aggregate number.',
    checkpoints: ['Drill into affected work.', 'Review skills and capacity.', 'Refresh and validate before intervening.'],
    tags: ['supervisor', 'analytics', 'capacity'], sourceIds: ['realtime'], noteIds: ['analytics'],
  },
  {
    id: 'recall-monitoring-boundary', kind: 'recall', difficulty: 'Foundation',
    prompt: 'What privacy and employment-use boundaries does Microsoft state for supervisor analytics and recording?',
    answer: 'Organizations remain responsible for legal compliance, appropriate notification, and participant consent where required for monitoring, recording, and storing communications. Microsoft states that the analytics feature is not intended for, and should not be used to make, employment decisions such as compensation or entitlements. Feature availability does not supply consent or legal authorization.',
    checkpoints: ['Organization responsible for compliance.', 'Notify and obtain required consent.', 'Not for employment decisions.'],
    tags: ['privacy', 'consent', 'analytics'], sourceIds: ['realtime', 'recording'], noteIds: ['analytics', 'recording-privacy'],
  },
  {
    id: 'recall-recording-transcript', kind: 'recall', difficulty: 'Foundation',
    prompt: 'What is the difference between voice recording, transcription, and real-time translation?',
    answer: 'Recording captures call audio, transcription creates text of the call, and real-time translation provides translated conversation text. The configuration offers transcription or transcription with recording, and translation has additional enablement requirements. Do not assume enabling one proves every other capability, language, or compliance obligation is satisfied.',
    checkpoints: ['Audio versus text versus translated text.', 'Distinct configuration choices.', 'Validate needed capabilities.'],
    tags: ['recording', 'transcription', 'translation'], sourceIds: ['recording'], noteIds: ['recording-privacy'],
  },
  {
    id: 'recall-recording-controls', kind: 'recall', difficulty: 'Applied',
    prompt: 'Which control layers should be reviewed when a workstream is configured for recording but the expected audio is absent?',
    answer: 'Check tenant-level audio recording first: disabling it prevents recording regardless of workstream settings. Then review the workstream mode, automatic versus manual start, and permitted pause/resume or hold behavior. In manual mode, Resume recording and transcript is the documented initial button label, not evidence of a prior recording segment.',
    checkpoints: ['Tenant control can block recording.', 'Workstream mode and start mode.', 'Pause/resume and manual-label semantics.'],
    tags: ['recording', 'troubleshooting'], sourceIds: ['recording'], noteIds: ['recording-privacy'],
  },
  {
    id: 'recall-bot-transcript', kind: 'recall', difficulty: 'Advanced',
    prompt: 'Does switching off voice recording and transcription guarantee that a Copilot Studio voice AI agent stores no conversation transcript?',
    answer: 'No. The voice configuration documentation warns that Copilot Studio generates its own conversation transcript independently of those voice settings. For a DTMF-only AI agent, that transcript captures keypad entries while spoken input is ignored. Review the AI-agent data flow separately instead of treating a voice toggle as a system-wide data prohibition.',
    checkpoints: ['Separate Copilot Studio transcript.', 'DTMF-only exception concerns spoken input.', 'Review all data paths.'],
    tags: ['privacy', 'copilot-studio', 'transcription'], sourceIds: ['recording'], noteIds: ['recording-privacy'],
  },
  {
    id: 'recall-viewer-access', kind: 'recall', difficulty: 'Applied',
    prompt: 'In the standalone closed-conversation viewer, why might recordings or post-conversation survey details be unavailable to a user?',
    answer: 'Recording/transcript capture must have been enabled, and the user needs appropriate access. The viewer documentation lists Omnichannel agent or supervisor roles and at least Activity read access for other roles. Survey display additionally depends on the configured display setting and Customer feedback survey read access; missing or uncompleted survey values are not displayed.',
    checkpoints: ['Capture and role access.', 'Additional survey display and table-access conditions.', 'Missing survey data is not automatically an outage.'],
    tags: ['recordings', 'permissions', 'surveys'], sourceIds: ['viewer'], noteIds: ['recording-privacy'],
  },
  {
    id: 'recall-retention-scope', kind: 'recall', difficulty: 'Advanced',
    prompt: 'What should a recording retention runbook specify beyond deleting a call recording?',
    answer: 'As a recommended governance practice, identify each retained artifact, its owner, authorized access, required retention, and deletion or preservation process. The documented recording deletion path includes the Recording table and bulk deletion, but does not promise deletion of transcripts, Copilot Studio data, or downloaded copies. Validate those separate data stores and legal obligations rather than assuming a universal cascade.',
    checkpoints: ['Inventory and ownership per artifact.', 'Recording deletion has a defined scope.', 'Validate transcripts and exported copies separately.'],
    tags: ['retention', 'privacy', 'recommended-practice'], sourceIds: ['delete', 'viewer', 'recording'], noteIds: ['recording-privacy'],
  },
  {
    id: 'recall-diagnostic-setup', kind: 'recall', difficulty: 'Applied',
    prompt: 'What are the principal prerequisites and costs for the documented conversation diagnostics export to Application Insights?',
    answer: 'The environment must be a Managed Environment. Setup requires the documented Azure Contributor-or-higher access and Power Platform administrator or System Administrator permissions for export; querying needs at least read access. Connect the environment to Application Insights and account for ingestion charges. The documentation excludes data export in sovereign clouds such as GCC, GCC High, and DoD.',
    checkpoints: ['Managed Environment and export connection.', 'Separate setup and query permissions.', 'Ingestion costs and sovereign-cloud restriction.'],
    tags: ['diagnostics', 'application-insights', 'prerequisites'], sourceIds: ['diagnostics'], noteIds: ['diagnostics'],
  },
  {
    id: 'recall-assignment-evidence', kind: 'recall', difficulty: 'Advanced',
    prompt: 'What evidence should Diagnose use when a representative says they were available but were not assigned a conversation?',
    answer: 'Inspect the particular conversation and assignment attempt, comparing required presence, skills, capacity, and capacity profile with the representative state at that event. Current presence alone is insufficient. The documented diagnostic insights support out-of-box assignment methods and do not support transfer/consult diagnostics, so do not claim that view explains every custom or transfer scenario.',
    checkpoints: ['Conversation and assignment-event correlation.', 'Compare eligibility at the event time.', 'Respect assignment-method and transfer/consult limitations.'],
    tags: ['diagnostics', 'routing', 'eligibility'], sourceIds: ['diagnose'], noteIds: ['diagnostics'],
  },
  {
    id: 'recall-retirement-review', kind: 'recall', difficulty: 'Advanced',
    prompt: 'What should an October 9, 2026 operations modernization review say about legacy routing dashboards, effort estimation, diagnostics, and forecasting?',
    answer: 'Do not recommend the old historical unified-routing dashboards, removed effort estimation, or legacy unified-routing diagnostics. Use supported analytics and Application Insights conversation diagnostics. The older case/conversation and representative-volume forecasting feature is scheduled to lose support on October 30, 2026; plan toward the recommended workforce engagement management forecast scenarios, not a fresh dependency on the outgoing feature.',
    checkpoints: ['Retired routing-specific features are not recommended.', 'Current diagnostics uses Application Insights.', 'Forecasting end-of-support is upcoming on the review date.'],
    tags: ['deprecations', 'forecasting', 'diagnostics'], sourceIds: ['cs-deprecations', 'cc-deprecations'], noteIds: ['lifecycle'],
  },
  {
    id: 'mcq-live-backlog', kind: 'mcq', difficulty: 'Applied',
    prompt: 'A supervisor needs to reallocate work during a queue spike now. Which report family best supports that immediate operational decision?',
    answer: 'Use Omnichannel real-time analytics and drill into the affected queue and ongoing conversations, checking freshness and eligibility before intervening. Historical trends and event traces are useful for different questions.',
    checkpoints: ['Use current operational reporting.', 'Verify queue and representative context.'],
    tags: ['supervisor', 'analytics'], sourceIds: ['realtime', 'historical', 'diagnostics', 'cs-deprecations'], noteIds: ['analytics'],
    options: [
      { id: 'a', text: 'An annual historical queue trend alone.', rationale: 'Historical trends do not show enough current work detail for immediate allocation.' },
      { id: 'b', text: 'The retired historical unified-routing dashboard.', rationale: 'This is a deprecated and removed routing-specific dashboard, not the current tool.' },
      { id: 'c', text: 'Raw export ingestion totals alone.', rationale: 'Telemetry volume is not a live operational queue-and-capacity view.' },
      { id: 'd', text: 'Omnichannel real-time analytics, scoped to the affected queue.', rationale: 'Correct: it supports near-current operational oversight and intervention.' },
    ], correctOptionId: 'd',
  },
  {
    id: 'mcq-permission-filter', kind: 'mcq', difficulty: 'Applied',
    prompt: 'A supervisor selects another business unit in a report filter but cannot see its data. What explains this?',
    answer: 'Filters do not elevate Dataverse access. The user needs authorized access to the underlying business-unit data; choosing it as a filter only narrows data that is already permitted.',
    checkpoints: ['Security before filtering.', 'No permission elevation through report controls.'],
    tags: ['analytics', 'security'], sourceIds: ['realtime'], noteIds: ['analytics'],
    options: [
      { id: 'a', text: 'The filter cannot grant permissions the supervisor does not hold.', rationale: 'Correct: analytics respects Dataverse access scope.' },
      { id: 'b', text: 'A business-unit filter automatically grants cross-unit read access after refresh.', rationale: 'Refreshing does not alter security privileges.' },
      { id: 'c', text: 'Every supervisor always sees organization-wide data regardless of role scope.', rationale: 'The report explicitly respects configured security boundaries.' },
      { id: 'd', text: 'Changing the report time zone grants access to the missing business unit.', rationale: 'Time-zone selection affects reporting interpretation, not authorization.' },
    ], correctOptionId: 'a',
  },
  {
    id: 'mcq-tenant-recording', kind: 'mcq', difficulty: 'Applied',
    prompt: 'Workstream recording is enabled, but tenant audio recording is disabled. What behavior is documented?',
    answer: 'Tenant-level disablement prevents audio recording regardless of the workstream setting. Resolve the governing policy and authorization before changing that control; a workstream cannot override it.',
    checkpoints: ['Tenant-level gate wins.', 'Workstream configuration alone is insufficient.'],
    tags: ['recording', 'policy'], sourceIds: ['recording'], noteIds: ['recording-privacy'],
    options: [
      { id: 'a', text: 'The workstream automatically overrides the tenant setting.', rationale: 'The documentation explicitly states the opposite.' },
      { id: 'b', text: 'Recording starts if the representative changes their presence.', rationale: 'Presence does not override tenant recording controls.' },
      { id: 'c', text: 'Audio recording is prevented by the tenant-level setting.', rationale: 'Correct: tenant disablement takes precedence over workstream configuration.' },
      { id: 'd', text: 'Recording starts only after transferring to another queue.', rationale: 'A queue transfer is not a way around the tenant recording policy.' },
    ], correctOptionId: 'c',
  },
  {
    id: 'mcq-manual-record-label', kind: 'mcq', difficulty: 'Foundation',
    prompt: 'A call uses Manual start, and the initial button says Resume recording and transcript. What does that label establish?',
    answer: 'It is the documented initial label in manual-start mode and does not establish that recording previously started and paused. Use actual recording state and evidence rather than inferring history from the word Resume.',
    checkpoints: ['Expected manual-mode label.', 'Not proof of prior recording.'],
    tags: ['recording', 'workspace'], sourceIds: ['recording'], noteIds: ['recording-privacy'],
    options: [
      { id: 'a', text: 'The whole call has already been recorded automatically.', rationale: 'The label does not establish any earlier recording segment.' },
      { id: 'b', text: 'It can be the normal initial label for Manual start.', rationale: 'Correct: the documentation specifically explains this behavior.' },
      { id: 'c', text: 'The customer must have pressed pause.', rationale: 'The label does not identify any such customer action.' },
      { id: 'd', text: 'The workstream has necessarily switched to Automatic start.', rationale: 'The label is explicitly documented under Manual start.' },
    ], correctOptionId: 'b',
  },
  {
    id: 'mcq-no-diagnostic-data', kind: 'mcq', difficulty: 'Applied',
    prompt: 'A newly configured Diagnose dashboard initially shows no useful conversation data. What is the best first investigation?',
    answer: 'Verify the Application Insights export connection, the correct resource, required roles, filters, and documented synchronization delay. Do not interpret an empty early dashboard as proof that routing events never happened or restore legacy diagnostics.',
    checkpoints: ['Collection, resource, access, and filters.', 'Allow for documented synchronization.', 'Do not revive retired diagnostics.'],
    tags: ['diagnostics', 'troubleshooting'], sourceIds: ['diagnostics', 'diagnose', 'cs-deprecations'], noteIds: ['diagnostics'],
    options: [
      { id: 'a', text: 'Verify export, resource, access, filters, and synchronization readiness.', rationale: 'Correct: each is a prerequisite to interpreting the dashboard data.' },
      { id: 'b', text: 'Conclude no customer interaction occurred.', rationale: 'No displayed data may reflect collection or display readiness, not absence of events.' },
      { id: 'c', text: 'Re-enable the removed unified-routing diagnostics feature.', rationale: 'The supported replacement is conversation diagnostics in Application Insights.' },
      { id: 'd', text: 'Change all assignment rules before checking telemetry collection.', rationale: 'This changes behavior without establishing the cause or even the availability of evidence.' },
    ], correctOptionId: 'a',
  },
  {
    id: 'mcq-diagnose-limits', kind: 'mcq', difficulty: 'Advanced',
    prompt: 'Can the documented Diagnose insights be promised as a complete explanation of custom assignment and transfer/consult behavior?',
    answer: 'No. The documented insights support out-of-box assignment methods and explicitly do not support transfer/consult diagnostics. Use supported telemetry and additional investigation appropriate to the scenario rather than claiming dashboard coverage that is not documented.',
    checkpoints: ['Out-of-box assignment scope.', 'Transfer/consult limitation.', 'Plan additional evidence where necessary.'],
    tags: ['diagnostics', 'limitations'], sourceIds: ['diagnose'], noteIds: ['diagnostics'],
    options: [
      { id: 'a', text: 'Yes, because every conversation has a unique ID.', rationale: 'A correlation identifier does not make every scenario supported in the insights UI.' },
      { id: 'b', text: 'Yes, increasing dashboard permissions enables every assignment method.', rationale: 'Access rights do not change documented feature scope.' },
      { id: 'c', text: 'Yes, once Application Insights ingestion charges are paid.', rationale: 'Paying for telemetry does not remove dashboard scenario limitations.' },
      { id: 'd', text: 'No; respect the documented assignment-method and transfer/consult limits.', rationale: 'Correct: the article explicitly narrows these diagnostic insights.' },
    ], correctOptionId: 'd',
  },
  {
    id: 'mcq-forecasting-cutoff', kind: 'mcq', difficulty: 'Advanced',
    prompt: 'On 2026-10-09, a new rollout proposes the older case/conversation volume and representative forecasting feature. What should the design review recommend?',
    answer: 'Avoid a new dependency on that outgoing feature and assess the recommended workforce engagement management forecast scenarios. Its documented support end is October 30, 2026, so it is retiring on the review date, not already removed then.',
    checkpoints: ['October 30 remains upcoming.', 'Avoid new outgoing-feature dependency.', 'Assess recommended replacement availability.'],
    tags: ['forecasting', 'deprecations'], sourceIds: ['cc-deprecations', 'cs-deprecations'], noteIds: ['lifecycle'],
    options: [
      { id: 'a', text: 'Adopt it as the long-term default because it still appears in documentation.', rationale: 'The announced imminent support end makes that a poor new-design choice.' },
      { id: 'b', text: 'Assess workforce engagement management forecasts instead of adding the outgoing dependency.', rationale: 'Correct: both notices recommend that direction.' },
      { id: 'c', text: 'Tell users it was already removed before October 9, 2026.', rationale: 'The cited end-of-support date is October 30, later than this review date.' },
      { id: 'd', text: 'Replace it with the removed unified-routing effort estimation model.', rationale: 'Effort estimation is also retired and is not the recommended forecasting replacement.' },
    ], correctOptionId: 'b',
  },
  {
    id: 'mcq-deletion-claim', kind: 'mcq', difficulty: 'Advanced',
    prompt: 'A runbook claims deleting a Recording table record proves all copies of the interaction are erased. What is the appropriate correction?',
    answer: 'Limit the claim to the documented recording deletion operation and separately verify transcript, AI-agent, download, and other retention paths. The cited documents describe multiple artifacts and do not promise a universal deletion cascade.',
    checkpoints: ['Respect deletion scope.', 'Inventory separate artifacts.', 'Verify instead of promising universal erasure.'],
    tags: ['retention', 'privacy', 'recommended-practice'], sourceIds: ['delete', 'viewer', 'recording'], noteIds: ['recording-privacy'],
    options: [
      { id: 'a', text: 'Keep the claim because all artifacts share a customer.', rationale: 'A common customer association does not establish a deletion cascade.' },
      { id: 'b', text: 'Replace deletion with hiding the conversation from the report.', rationale: 'Hiding data in a view is not deletion or retention enforcement.' },
      { id: 'c', text: 'Document recording deletion separately and verify all other retained artifacts.', rationale: 'Correct: this is a bounded, evidence-based retention practice.' },
      { id: 'd', text: 'Assume exported recordings disappear when the source record is deleted.', rationale: 'The documentation does not promise revocation of downloaded copies.' },
    ], correctOptionId: 'c',
  },
];

export const operations: { topic: Topic; cards: Card[]; notes: Note[]; sources: Source[] } = {
  topic, notes, sources,
  cards: drafts.map((card): Card => ({
    ...card, id: `${topic.id}-${card.id}`, topicId: topic.id, revision: 1,
    sourceIds: card.sourceIds.map(sourceId), noteIds: card.noteIds.map(noteId),
    ...(card.options ? {
      options: card.options.map(option => ({ ...option, id: `${topic.id}-${card.id}-${option.id}` })),
      correctOptionId: `${topic.id}-${card.id}-${card.correctOptionId}`,
    } : {}),
  })),
};