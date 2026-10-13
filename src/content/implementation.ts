import type { Card, Note, Source, Topic } from '../domain';

const topic: Topic = {
  id: 'cc-implementation', title: 'Implementation, ALM, testing, and service readiness',
  description: 'Process-led delivery, controlled configuration migration, acceptance, cutover, and incident diagnosis. Delivery recommendations are not universal product requirements. Reviewed 2026-10-09.',
};
const sourceId = (key: string) => `${topic.id}-source-${key}`;
const noteId = (key: string) => `${topic.id}-note-${key}`;
const sources: Source[] = [
  { id: sourceId('process'), title: 'Base the implementation lifecycle on your business processes', url: 'https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/process-focused-solution-implementation-lifecycle', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('alm'), title: 'Bring successful solutions to customers with application lifecycle management strategies', url: 'https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/application-lifecycle-management', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('solutions'), title: 'Solution concepts', url: 'https://learn.microsoft.com/en-us/power-platform/alm/solution-concepts-alm', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('migration'), title: 'Migrate configurations for channels using solutions', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/migrate-channel-config-using-solutions', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('readiness'), title: 'Use the go-live checklist to make sure your solution is ready for go-live', url: 'https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/prepare-go-live-checklist', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('service'), title: 'Monitor and service the health of your Dynamics 365 solution implementation', url: 'https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/service-solution', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('diagnostics'), title: 'Configure conversation diagnostics', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-conversation-diagnostics', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('diagnose'), title: 'Diagnose contact center health using Application Insights dashboard', url: 'https://learn.microsoft.com/en-us/dynamics365/contact-center/use/diagnose-dashboard', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('twilio'), title: 'Configure an SMS channel for Twilio', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-sms-channel-twilio', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('auth'), title: 'Configure authentication settings', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-chat-auth-settings', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('cs-deprecations'), title: 'Deprecations in Customer Service', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/implement/deprecations-customer-service', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('cc-deprecations'), title: 'Deprecations in Dynamics 365 Contact Center', url: 'https://learn.microsoft.com/en-us/dynamics365/contact-center/implement/deprecations-contact-center', verified: '2026-10-09', publisher: 'Microsoft Learn' },
];
const notes: Note[] = [
  {
    id: noteId('requirements'), topicId: topic.id, title: 'Begin with an observable business outcome',
    summary: 'Recommended implementation practice: describe the customer journey, people, data, integrations, and desired outcomes before selecting settings. Link requirements to design and test evidence.',
    sections: [
      { heading: 'Checklist', bullets: ['Map as-is and to-be processes, including arrival, identification, routing, handling, and resolution.', 'Define scope, owners, acceptance criteria, and both normal and exception scenarios.', 'Agree measurable nonfunctional expectations for load, responsiveness, security, and operational readiness using representative deployment conditions.', 'Use the process map during design, build, test, role-based training, cutover, and support rather than keeping it as a one-off discovery document.'] },
      { heading: 'Gotchas', bullets: ['A list of desired screens is not an end-to-end process or an acceptance test.', 'Delivery practices here are recommendations adapted from Microsoft implementation guidance, not mandatory Contact Center licensing or platform limits.', 'Check both product deprecation pages before accepting an old feature requirement. A searchable article can describe an outgoing or removed capability.', 'Do not promise that every standalone, embedded, and Customer Service experience has the same features or entitlements. Validate the selected product scope.'] },
    ],
    tags: ['requirements', 'process', 'recommended-practice'], sourceIds: ['process', 'alm', 'readiness', 'cs-deprecations', 'cc-deprecations'].map(sourceId),
  },
  {
    id: noteId('alm'), topicId: topic.id, title: 'Transport configuration with explicit dependencies',
    summary: 'Use controlled ALM for both code and configuration. General solution practices do not mean every Contact Center setting, account, credential, or external dependency moves in a single solution.',
    sections: [
      { heading: 'Checklist', bullets: ['Recommended ALM pattern: maintain unmanaged source in development/source control and deploy managed build artifacts to downstream environments.', 'For channel migration, follow the documented order: session/notification templates, skill rulesets, new capacity profiles, queues, then workstreams and channel settings; verify afterward.', 'Use solutions and Configuration Migration where the channel guide specifies each. New capacity profiles need the documented initial migration treatment.', 'Create required custom schema and referenced lookup values in the target; review included components and environment-specific external configurations.'] },
      { heading: 'Gotchas', bullets: ['The guide excludes migration of account, channel provider, agent configuration, and AI/analytics settings. Track these as separate target-environment tasks.', 'Shared capacity-profile dependencies can pull other workstreams and channels into an export; review the manifest.', 'An unmanaged solution deletion removes its container, not its customizations. A managed uninstall can remove custom tables/columns and their data; neither is a generic safe rollback button.', 'The migration article includes historical channel tables. This is migration mechanics documentation, not a current support matrix; cross-check deprecations.'] },
    ],
    tags: ['alm', 'migration', 'dependencies'], sourceIds: ['alm', 'solutions', 'migration', 'cs-deprecations', 'cc-deprecations'].map(sourceId),
  },
  {
    id: noteId('testing-cutover'), topicId: topic.id, title: 'Acceptance and cutover are evidence-based decisions',
    summary: 'Recommended delivery practice: prove complete business journeys and failure handling, then rehearse a sequenced cutover with accountable owners and an explicit go/no-go decision.',
    sections: [
      { heading: 'Checklist', bullets: ['Complete integration testing before UAT; exercise external dependency outages as well as successful paths.', 'Run UAT with representative data and actual security roles, and obtain business acceptance against agreed criteria.', 'Test expected peak load and relevant devices, browsers, and integrations; repeat data migration rehearsals and validate timing and quality.', 'Document dependencies, owners, timings, verification steps, communications, and decision checkpoints. Recommended extension: agree a rehearsed recovery or rollback path appropriate to each system.'] },
      { heading: 'Gotchas', bullets: ['A channel account validation or successful solution import is not end-to-end acceptance.', 'System Administrator-only UAT can hide the access failures that real users will encounter.', 'Do not invent a universal acceptable response time, concurrency limit, or cutover duration; agree requirements for this deployment.', 'Provider numbers/callbacks and other external services have their own readiness. Coordinate them explicitly rather than assuming a solution import provisions everything.'] },
    ],
    tags: ['testing', 'cutover', 'recommended-practice'], sourceIds: ['readiness', 'process', 'migration', 'twilio'].map(sourceId),
  },
  {
    id: noteId('support'), topicId: topic.id, title: 'Operate the solution, not only the platform',
    summary: 'Microsoft maintains the cloud platform; the customer still needs a support model for the configured solution and its external dependencies. Recommended troubleshooting starts with impact and evidence, then isolates the failed layer.',
    sections: [
      { heading: 'Checklist', bullets: ['Before go-live, establish monitoring, support contacts, ticket ownership, trained support access, and elevated post-launch support.', 'For an incident, capture impact, affected channel, time range, environment, reproduction steps, and conversation IDs where available; keep sensitive content out of broadly shared tickets.', 'Separate provider transport, chat authentication, conversation creation, route-to-queue, assignment eligibility, and representative experience when forming hypotheses.', 'Use current Application Insights conversation diagnostics and event-time eligibility evidence where supported. Reproduce the process and verify the fix with regression tests.'] },
      { heading: 'Gotchas', bullets: ['No conversation in Dynamics points to a different investigation from a created conversation waiting in a queue.', 'A representative who is Available now might have lacked skills or capacity at the assignment attempt.', 'Legacy unified-routing diagnostics and effort estimation are not the recommended incident tools.', 'Recommended practice: feed incident findings into maintained runbooks and regression coverage, and coordinate service and provider updates rather than treating launch as the end of ALM.'] },
    ],
    tags: ['support', 'incidents', 'recommended-practice'], sourceIds: ['service', 'readiness', 'process', 'alm', 'diagnostics', 'diagnose', 'twilio', 'auth', 'cs-deprecations'].map(sourceId),
  },
];

const drafts: Omit<Card, 'topicId' | 'revision'>[] = [
  {
    id: 'recall-outcome-requirement', kind: 'recall', difficulty: 'Foundation',
    prompt: 'As recommended implementation practice, how should “we need digital support” become a testable requirement?',
    answer: 'Describe the target customer journey, actors, data and integrations, expected outcome, and exception behavior, then agree acceptance criteria and an owner. For example, a customer inquiry should reach the intended team with the required context and allow a verified response. Trace the requirement to configuration and test evidence instead of merely listing channel screens.',
    checkpoints: ['Journey and measurable outcome.', 'Owner, normal path, and exceptions.', 'Trace to design and tests.'],
    tags: ['requirements', 'recommended-practice'], sourceIds: ['process', 'alm', 'readiness'], noteIds: ['requirements'],
  },
  {
    id: 'recall-process-lifecycle', kind: 'recall', difficulty: 'Foundation',
    prompt: 'How does Microsoft recommend reusing process maps across an implementation lifecycle?',
    answer: 'Use as-is and to-be processes to define scope, then guide design, configuration, development, and end-to-end testing with the same process structure. Reuse it for role-based training, cutover dependencies, and post-launch issue reproduction. The map connects delivery stages to business outcomes rather than being only a discovery artifact.',
    checkpoints: ['Scope and design.', 'Build, test, and train.', 'Cutover and support.'],
    tags: ['lifecycle', 'process', 'recommended-practice'], sourceIds: ['process'], noteIds: ['requirements'],
  },
  {
    id: 'recall-alm-scope', kind: 'recall', difficulty: 'Foundation',
    prompt: 'Why does a mostly configuration-based Contact Center project still need ALM?',
    answer: 'ALM covers governance, requirements, architecture, configuration, testing, release, maintenance, and change management, not just source-code builds. Even a low-code or configuration-only solution changes over time and needs documented decisions, traceability, validation, and controlled releases. This is Microsoft implementation guidance rather than a special Contact Center feature switch.',
    checkpoints: ['ALM is broader than development.', 'Track configuration and decisions.', 'Continue through operation.'],
    tags: ['alm', 'configuration', 'recommended-practice'], sourceIds: ['alm'], noteIds: ['alm'],
  },
  {
    id: 'recall-solution-pattern', kind: 'recall', difficulty: 'Applied',
    prompt: 'What general managed/unmanaged solution pattern does Power Platform recommend for ALM?',
    answer: 'Develop in unmanaged solutions, retain exported unmanaged source in source control, and generate managed exports as build artifacts for downstream test and production environments. Test the managed artifact in a separate environment from its originating unmanaged solution. This pattern governs supported solution components; it does not imply that all channel configuration data or provider setup is solution-aware.',
    checkpoints: ['Unmanaged development/source.', 'Managed downstream artifact.', 'Separate environment and migration boundaries.'],
    tags: ['alm', 'solutions'], sourceIds: ['solutions', 'migration'], noteIds: ['alm'],
  },
  {
    id: 'recall-channel-migration-order', kind: 'recall', difficulty: 'Applied',
    prompt: 'What dependency sequence does the channel configuration migration guide prescribe?',
    answer: 'Migrate session and notification templates, skill-based routing rulesets, new capacity profiles, queues, then channel workstreams and settings, and verify the migration. Use solutions and Configuration Migration as specified, and ensure referenced custom schema and lookup values exist in the target. The sequence is product guidance, not an arbitrary preferred checklist.',
    checkpoints: ['Templates → skills → new capacity profiles → queues → workstreams/settings.', 'Verify the result.', 'Required target schema and referenced values.'],
    tags: ['migration', 'dependencies'], sourceIds: ['migration'], noteIds: ['alm'],
  },
  {
    id: 'recall-migration-boundary', kind: 'recall', difficulty: 'Advanced',
    prompt: 'What must an implementation team not assume is covered by channel configuration migration?',
    answer: 'The guide explicitly excludes account, channel provider, agent configuration, and AI and analytics settings. Track those as separate target-environment tasks and review external component dependencies. Also review the export contents: shared capacity profiles can include additional workstreams or channels. A successful import does not establish a complete working provider connection.',
    checkpoints: ['Documented exclusions.', 'Separate environment-specific tasks.', 'Inspect shared dependencies and verify end to end.'],
    tags: ['migration', 'scope', 'providers'], sourceIds: ['migration'], noteIds: ['alm'],
  },
  {
    id: 'recall-sit-uat', kind: 'recall', difficulty: 'Foundation',
    prompt: 'How should system integration testing and user acceptance testing differ in a recommended delivery plan?',
    answer: 'SIT verifies interactions with other applications and external systems, including peak volumes and dependency outages. UAT verifies that the business processes meet user needs with realistic data and roles. The go-live guidance recommends SIT before UAT and business sign-off on the relevant test outcomes; passing one is not a substitute for the other.',
    checkpoints: ['SIT: system boundaries and failures.', 'UAT: business acceptance with realistic roles/data.', 'SIT precedes UAT in the guidance.'],
    tags: ['testing', 'uat', 'recommended-practice'], sourceIds: ['readiness'], noteIds: ['testing-cutover'],
  },
  {
    id: 'recall-nonfunctional-validation', kind: 'recall', difficulty: 'Applied',
    prompt: 'What should a recommended nonfunctional acceptance plan validate instead of relying on a single successful demo?',
    answer: 'Validate agreed performance at expected peak volumes, search and end-to-end process responsiveness, integrations, relevant devices/browsers, and representative environments and data. Test using intended security roles rather than universal administrator access. Define project-specific measurable targets and evidence; do not invent a product-wide performance promise.',
    checkpoints: ['Representative load and environments.', 'Realistic roles and integration conditions.', 'Agreed measurable targets.'],
    tags: ['testing', 'performance', 'recommended-practice'], sourceIds: ['readiness'], noteIds: ['requirements', 'testing-cutover'],
  },
  {
    id: 'recall-cutover-runbook', kind: 'recall', difficulty: 'Applied',
    prompt: 'What belongs in a recommended Contact Center cutover runbook?',
    answer: 'Sequence dependent tasks with owners, timing, instructions, verification evidence, communications, and a go/no-go checkpoint. Align external provider readiness and rehearse migration within the planned window. As a recommended extension, agree recovery and rollback actions for each component; do not assume that uninstalling a solution reverses provider changes or preserves data.',
    checkpoints: ['Sequenced owned tasks and checks.', 'External dependency readiness and rehearsal.', 'Explicit safe recovery plan.'],
    tags: ['cutover', 'recommended-practice'], sourceIds: ['readiness', 'process', 'solutions'], noteIds: ['testing-cutover'],
  },
  {
    id: 'recall-go-no-go', kind: 'recall', difficulty: 'Applied',
    prompt: 'Which evidence should inform a recommended go/no-go decision beyond “the solution imported successfully”?',
    answer: 'Use agreed test exit criteria and business sign-off, migration validation, production and external-service readiness, trained users, operational monitoring, and support ownership. Evaluate unresolved issues and mitigations against those criteria. Import success establishes a deployment step, not that the complete customer journey is safe and accepted.',
    checkpoints: ['Business acceptance and test evidence.', 'Migration and external dependencies.', 'Operational and user readiness.'],
    tags: ['readiness', 'cutover', 'recommended-practice'], sourceIds: ['readiness', 'migration'], noteIds: ['testing-cutover'],
  },
  {
    id: 'recall-hypercare', kind: 'recall', difficulty: 'Foundation',
    prompt: 'Why should hypercare and support ownership be planned before go-live?',
    answer: 'The implementation guidance recommends elevated support immediately after launch and a planned transition to trained support teams with monitoring, ticket processes, access, and contacts. Microsoft operates the cloud platform, but customers still maintain the health of their configured solution and external dependencies. Launch is not the end of application lifecycle management.',
    checkpoints: ['Elevated initial support.', 'Trained owners, monitoring, and tickets.', 'Customer solution responsibility continues.'],
    tags: ['support', 'hypercare', 'recommended-practice'], sourceIds: ['readiness', 'service', 'alm'], noteIds: ['support'],
  },
  {
    id: 'recall-layered-incident', kind: 'recall', difficulty: 'Advanced',
    prompt: 'What is a recommended evidence-first triage sequence for “the customer cannot reach a representative”?',
    answer: 'Capture the affected journey, channel, time, environment, and reproducible steps. Determine whether the provider/widget reached Dynamics and whether a conversation exists. If it exists, inspect route-to-queue and assignment events and eligibility at the attempt time; for authenticated chat also inspect the token flow. Use current Application Insights diagnostics where configured and supported rather than changing all routing settings at once.',
    checkpoints: ['Impact and reproduction evidence.', 'Transport/authentication versus routing/assignment.', 'Event-time eligibility and current diagnostics.'],
    tags: ['incidents', 'diagnostics', 'recommended-practice'], sourceIds: ['process', 'twilio', 'auth', 'diagnostics', 'diagnose'], noteIds: ['support'],
  },
  {
    id: 'mcq-traceability', kind: 'mcq', difficulty: 'Applied',
    prompt: 'A project has a long list of configuration changes but cannot show which business need or test covers each change. What recommended ALM improvement addresses the gap?',
    answer: 'Link requirements and process outcomes to configuration/development work and test evidence. Traceability allows reviewers to assess coverage and intent; more screenshots or larger releases do not establish that connection.',
    checkpoints: ['Requirement-to-change traceability.', 'Tests prove the intended outcome.'],
    tags: ['alm', 'requirements', 'recommended-practice'], sourceIds: ['alm', 'process'], noteIds: ['requirements', 'alm'],
    options: [
      { id: 'a', text: 'Combine all changes into one release with no separate work items.', rationale: 'A larger release makes individual intent and coverage harder to trace.' },
      { id: 'b', text: 'Record only the final configuration screenshots.', rationale: 'Screenshots can help documentation but do not establish requirement/test relationships.' },
      { id: 'c', text: 'Link each change to a business requirement and its acceptance tests.', rationale: 'Correct: Microsoft ALM guidance recommends this traceability.' },
      { id: 'd', text: 'Treat all successfully saved settings as accepted requirements.', rationale: 'Saving configuration does not prove the business need is met.' },
    ], correctOptionId: 'c',
  },
  {
    id: 'mcq-migration-provider', kind: 'mcq', difficulty: 'Applied',
    prompt: 'Channel workstreams import successfully, but provider/account and AI settings are missing in the target. Which response best matches the migration guide?',
    answer: 'Review and complete the target-environment tasks outside the migration scope. The guide excludes account, channel provider, agent configuration, and AI/analytics settings, so success of the workstream import is not proof those settings should already exist.',
    checkpoints: ['Respect migration exclusions.', 'Complete target-specific setup and validation.'],
    tags: ['migration', 'providers'], sourceIds: ['migration'], noteIds: ['alm'],
    options: [
      { id: 'a', text: 'Assume every missing account is caused by a corrupt workstream import.', rationale: 'The missing configuration can be explicitly outside the documented migration scope.' },
      { id: 'b', text: 'Repeat the same solution import until every external account is provisioned.', rationale: 'Repeating an import does not extend what that migration procedure covers.' },
      { id: 'c', text: 'Remove target security because it is the only possible cause.', rationale: 'This ignores scope exclusions and weakens access without evidence.' },
      { id: 'd', text: 'Complete the separately tracked account/provider and AI/analytics setup.', rationale: 'Correct: these are documented migration exclusions requiring target-environment attention.' },
    ], correctOptionId: 'd',
  },
  {
    id: 'mcq-uninstall-risk', kind: 'mcq', difficulty: 'Advanced',
    prompt: 'A proposed rollback says “uninstall the managed solution; all production data will remain.” What is the critical correction?',
    answer: 'Managed solution uninstall can delete custom tables and custom columns supplied by the solution and the data stored in them. A rollback plan must account for dependencies and data preservation instead of claiming every uninstall is nondestructive.',
    checkpoints: ['Managed uninstall can remove data.', 'Plan dependencies and preservation.'],
    tags: ['alm', 'rollback', 'data'], sourceIds: ['solutions'], noteIds: ['alm', 'testing-cutover'],
    options: [
      { id: 'a', text: 'Managed uninstall can remove solution-owned custom tables/columns and their data.', rationale: 'Correct: the solution concepts documentation explicitly warns about this data loss.' },
      { id: 'b', text: 'Managed uninstall only removes a container, like an unmanaged solution deletion.', rationale: 'That confuses unmanaged container deletion with managed component removal.' },
      { id: 'c', text: 'Managed uninstall automatically reverses every external provider change.', rationale: 'External services are not universally reverted by a Power Platform uninstall.' },
      { id: 'd', text: 'The managed artifact can always be exported again from production as the original source.', rationale: 'Managed solutions cannot be exported as source; retain the unmanaged source separately.' },
    ], correctOptionId: 'a',
  },
  {
    id: 'mcq-integration-outage', kind: 'mcq', difficulty: 'Applied',
    prompt: 'The SMS happy path passes. Which additional recommended test best validates behavior when the messaging dependency fails?',
    answer: 'In an appropriate test environment, simulate the external dependency outage and validate the effect on the user journey, operational visibility, and recovery behavior. Microsoft go-live guidance explicitly includes external-system-down scenarios in SIT.',
    checkpoints: ['Negative integration path.', 'Observe user impact and operational handling.', 'Test safely before production.'],
    tags: ['testing', 'integration', 'recommended-practice'], sourceIds: ['readiness', 'twilio'], noteIds: ['testing-cutover'],
    options: [
      { id: 'a', text: 'Rerun the successful SMS test with different message wording only.', rationale: 'That does not exercise dependency failure.' },
      { id: 'b', text: 'Simulate provider unavailability and verify the resulting process and recovery.', rationale: 'Correct: SIT should cover unavailable external systems and the effect on user experience.' },
      { id: 'c', text: 'Replace representative roles with System Administrator during testing.', rationale: 'Elevated permissions do not simulate a transport outage and can hide real access issues.' },
      { id: 'd', text: 'Skip failure testing because the provider validated the account credentials.', rationale: 'Credential validity does not demonstrate resilience to an unavailable service.' },
    ], correctOptionId: 'b',
  },
  {
    id: 'mcq-uat-role', kind: 'mcq', difficulty: 'Applied',
    prompt: 'UAT passed only with System Administrator users; representatives fail to access required records. What was missing from the recommended acceptance approach?',
    answer: 'UAT should use correct representative security roles and realistic data in a production-like environment. Administrator-only testing can mask permission gaps. Retest the intended business processes with the target roles rather than solving acceptance failures through universal elevation.',
    checkpoints: ['Actual target roles.', 'Realistic data and environment.', 'Retest instead of blanket elevation.'],
    tags: ['uat', 'security', 'recommended-practice'], sourceIds: ['readiness'], noteIds: ['testing-cutover'],
    options: [
      { id: 'a', text: 'A wider browser window for every tester.', rationale: 'This does not address masked data-access failures.' },
      { id: 'b', text: 'A guarantee that every representative receives permanent administrator rights.', rationale: 'The guidance says not to use System Administrator as the general UAT role.' },
      { id: 'c', text: 'Testing with the actual security roles and representative data.', rationale: 'Correct: the go-live checklist explicitly calls for correct user roles and realistic data.' },
      { id: 'd', text: 'Skipping access tests because functional steps already passed once.', rationale: 'A process must work for its intended users, not only an administrator.' },
    ], correctOptionId: 'c',
  },
  {
    id: 'mcq-cutover-gate', kind: 'mcq', difficulty: 'Applied',
    prompt: 'The deployment imported successfully, but the provider callback is not verified and support ownership is unresolved. What is the recommended go-live response?',
    answer: 'Evaluate these gaps against the agreed go/no-go criteria and resolve or formally assess the risks before proceeding. Provider readiness and operational support are explicit parts of Microsoft go-live guidance; import success alone is insufficient acceptance evidence.',
    checkpoints: ['Use the agreed gate.', 'External and support readiness matter.', 'Document decisions and risks.'],
    tags: ['cutover', 'readiness', 'recommended-practice'], sourceIds: ['readiness', 'twilio'], noteIds: ['testing-cutover', 'support'],
    options: [
      { id: 'a', text: 'Proceed automatically because the deployment command succeeded.', rationale: 'Technical import success does not establish service or support readiness.' },
      { id: 'b', text: 'Assume the provider owns all support issues after launch.', rationale: 'The organization must establish its own support model and dependency ownership.' },
      { id: 'c', text: 'Hide the open items until the first production incident.', rationale: 'Concealing known gaps undermines an evidence-based go/no-go decision.' },
      { id: 'd', text: 'Review the gaps at the go/no-go gate and obtain an accountable readiness decision.', rationale: 'Correct: the checklist requires dependency, support, and stakeholder readiness.' },
    ], correctOptionId: 'd',
  },
  {
    id: 'mcq-assignment-incident', kind: 'mcq', difficulty: 'Advanced',
    prompt: 'An SMS conversation exists in the expected queue but remains unassigned. What evidence is most useful before changing the provider callback?',
    answer: 'Inspect the assignment attempt and compare required presence, skills, and capacity with eligible representatives at that time. Conversation creation and arrival in the expected queue show that this is not simply a missing inbound callback. Use supported diagnostic scope and avoid assuming current presence proves past eligibility.',
    checkpoints: ['Separate transport from assignment.', 'Inspect event-time eligibility.', 'Change only the evidenced layer.'],
    tags: ['incidents', 'routing', 'recommended-practice'], sourceIds: ['diagnose', 'twilio'], noteIds: ['support'],
    options: [
      { id: 'a', text: 'Assignment-event requirements and representative eligibility at the attempt time.', rationale: 'Correct: this tests the remaining assignment-stage hypothesis.' },
      { id: 'b', text: 'Only whether the representative is Available now.', rationale: 'Current state does not establish capacity, skills, or earlier presence.' },
      { id: 'c', text: 'Only whether the website chat widget displays correctly.', rationale: 'This SMS conversation is already in Dynamics; website chat rendering is unrelated.' },
      { id: 'd', text: 'Delete and rebuild the provider account without examining the conversation.', rationale: 'That disrupts a transport path that already delivered the conversation and lacks evidence.' },
    ], correctOptionId: 'a',
  },
  {
    id: 'mcq-stale-design', kind: 'mcq', difficulty: 'Advanced',
    prompt: 'An inherited design recommends effort estimation, legacy routing diagnostics, and older volume forecasting for a November 2026 launch. What review action is appropriate on October 9?',
    answer: 'Check both product deprecation pages, replace retired capabilities, and avoid a launch dependency on forecasting whose support ends October 30. Use supported conversation diagnostics and evaluate the recommended workforce engagement management forecast scenarios without assuming automatic migration or entitlement.',
    checkpoints: ['Both deprecation notices.', 'Removed versus scheduled support end.', 'Supported replacements and validation.'],
    tags: ['deprecations', 'architecture', 'recommended-practice'], sourceIds: ['cs-deprecations', 'cc-deprecations', 'diagnostics'], noteIds: ['requirements', 'support'],
    options: [
      { id: 'a', text: 'Approve the design because all three features appeared in historical training.', rationale: 'Historical availability does not establish support for the planned launch date.' },
      { id: 'b', text: 'Rework the design against both current deprecation notices and supported alternatives.', rationale: 'Correct: the listed features include retired and imminently unsupported capabilities.' },
      { id: 'c', text: 'Check only the Contact Center notice and ignore shared Customer Service features.', rationale: 'Shared features such as effort estimation and legacy diagnostics are covered in the Customer Service notice.' },
      { id: 'd', text: 'Keep the features but hide their names in the implementation documentation.', rationale: 'Renaming or hiding a dependency does not restore product support.' },
    ], correctOptionId: 'b',
  },
];

export const implementation: { topic: Topic; cards: Card[]; notes: Note[]; sources: Source[] } = {
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