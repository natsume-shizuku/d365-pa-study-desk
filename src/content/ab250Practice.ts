import type { Card, Note, Pack, Source, Topic } from '../domain';

// Independently authored practice. These IDs are permanent; this is a separate
// learner history from the existing implementation and certification packs.
type Domain = 'deploy' | 'channels' | 'ai' | 'routing' | 'representative' | 'analytics';
const topicId = (domain: Domain) => `ab250-practice-${domain}`;
const noteId = (domain: Domain) => `${topicId(domain)}-note`;
const sourceId = (key: string) => `ab250-practice-source-${key}`;
const definitions = {
  guide: ['AB-250 study guide', 'credentials/certifications/resources/study-guides/ab-250'],
  solutions: ['Solution concepts', 'power-platform/alm/solution-concepts-alm'],
  roles: ['Manage personas and custom security roles', 'dynamics365/customer-service/administer/role-persona-mapping'],
  capacity: ['Create and manage capacity profiles', 'dynamics365/customer-service/administer/capacity-profiles'],
  survey: ['Configure a preconversation survey', 'dynamics365/customer-service/administer/configure-pre-chat-survey'],
  authentication: ['Configure authentication settings', 'dynamics365/customer-service/administer/create-chat-auth-settings'],
  recording: ['Configure call recording, transcription, and real-time translation', 'dynamics365/customer-service/administer/voice-channel-configure-transcripts'],
  summaries: ['Use Copilot to summarize conversations', 'dynamics365/contact-center/use/copilot-summarize-conversations'],
  ask: ['Ask a question', 'dynamics365/contact-center/use/use-ask-a-question'],
  variables: ['Work with variables in Copilot Studio', 'microsoft-copilot-studio/authoring-variables'],
  routing: ['Overview of unified routing', 'dynamics365/customer-service/administer/overview-unified-routing'],
  classification: ['Configure work classification rulesets', 'dynamics365/customer-service/administer/configure-work-classification'],
  skills: ['Understand how skill match algorithms work', 'dynamics365/customer-service/administer/set-up-skill-based-routing'],
  profiles: ['Create and use experience profiles', 'dynamics365/customer-service/administer/create-agent-experience-profile'],
  sessions: ['Manage session templates', 'dynamics365/customer-service/administer/session-templates'],
  macros: ['Configure macros to improve representative productivity', 'dynamics365/customer-service/administer/macros'],
  realtime: ['Overview of Omnichannel real-time analytics', 'dynamics365/customer-service/use/intro-realtime-analytics-dashboard'],
  historical: ['Omnichannel historical analytics dashboards', 'dynamics365/customer-service/use/omnichannel-analytics-insights'],
  diagnostics: ['Configure conversation diagnostics', 'dynamics365/customer-service/administer/configure-conversation-diagnostics'],
} as const;
type Reference = keyof typeof definitions;
const sources: Source[] = Object.entries(definitions).map(([key, [title, path]]) => ({
  id: sourceId(key), title, url: `https://learn.microsoft.com/en-us/${path}`,
  publisher: 'Microsoft Learn', verified: '2026-10-19',
}));

const topics: Topic[] = [
  { id: topicId('deploy'), title: 'Deploy Dynamics 365 Contact Center (15–20%)', description: 'Practice ALM, role access, and representative capacity decisions.' },
  { id: topicId('channels'), title: 'Implement channels (30–35%)', description: 'Practice survey, authenticated chat, and voice recording scenarios.' },
  { id: topicId('ai'), title: 'Configure agents and AI capabilities (10–15%)', description: 'Practice Copilot summaries, grounded answers, and conversational variables.' },
  { id: topicId('routing'), title: 'Configure work distribution (10–15%)', description: 'Practice classification, assignment, and skill matching.' },
  { id: topicId('representative'), title: 'Configure the representative experience (15–20%)', description: 'Practice experience profiles, session templates, and macros.' },
  { id: topicId('analytics'), title: 'Manage Contact Center analytics (10–15%)', description: 'Practice operational dashboards, historical analysis, and diagnostics.' },
];

function recall(domain: Domain, key: string, ref: Reference, prompt: string, answer: string, checkpoint: string): Card {
  return { id: `${topicId(domain)}-${key}`, topicId: topicId(domain), revision: 1,
    kind: 'recall', difficulty: 'Applied', prompt, answer, checkpoints: [checkpoint],
    tags: ['ab-250', 'original-practice', ref], sourceIds: [sourceId(ref)], noteIds: [noteId(domain)] };
}
type Choice = [text: string, rationale: string];
function mcq(domain: Domain, key: string, ref: Reference, prompt: string, choices: [Choice, Choice, Choice, Choice], correct: number, checkpoint: string): Card {
  const id = `${topicId(domain)}-${key}`;
  const options = choices.map(([text, rationale], i) => ({ id: `${id}-option-${i + 1}`, text, rationale }));
  return { id, topicId: topicId(domain), revision: 1, kind: 'mcq', difficulty: 'Applied', prompt,
    answer: `${choices[correct][0]} ${choices[correct][1]}`, checkpoints: [checkpoint],
    tags: ['ab-250', 'original-practice', ref], sourceIds: [sourceId(ref)], noteIds: [noteId(domain)],
    options, correctOptionId: options[correct].id };
}

const cards: Card[] = [
  recall('deploy', 'unmanaged-container', 'solutions',
    'A maker deletes an unmanaged solution container in development. What happens to its customizations?',
    'The customizations remain in the environment and become part of the default solution. Deleting the container is not a rollback.',
    'Distinguish an unmanaged container from an installed managed solution.'),
  mcq('deploy', 'release-artifact', 'solutions',
    'A team has completed its solution-aware app changes in development. Which artifact should its release pipeline import into a separate UAT environment?', [
      ['An unmanaged export for continued editing in UAT', 'Unmanaged solutions belong in development for this ALM approach.'],
      ['A managed export built from the development solution', 'A managed solution is the deployment artifact for downstream environments.'],
      ['A fresh export of the installed managed solution', 'An installed managed solution cannot be exported.'],
      ['Only the development solution container name', 'A name does not carry deployable components.'],
    ], 1, 'Build in development; validate the managed artifact in a separate environment.'),
  recall('deploy', 'persona-access', 'roles',
    'A custom role is mapped to the representative persona. Does that alone grant access to its apps, forms, and dashboards?',
    'No. Persona mapping and access to apps, forms, and dashboards must all be configured. Verify the underlying permissions as well.',
    'Test access with the intended user role.'),
  mcq('deploy', 'custom-role-assignment', 'roles',
    'A custom role has the required permissions and persona mapping, but a representative receives it only through a team. What should you check against the persona-mapping requirements?', [
      ['Whether the profile has a different display name', 'A display name does not change security-role assignment.'],
      ['Whether the user has a higher capacity limit', 'Capacity controls workload rather than persona-role assignment.'],
      ['Whether the mapped role is assigned directly to the user', 'The documented mapping requires direct role assignment, not team membership alone.'],
      ['Whether every user has the administrator persona', 'That broadens access without addressing the role-assignment requirement.'],
    ], 2, 'Verify direct assignment of the role used in persona mapping.'),
  recall('deploy', 'negative-capacity', 'capacity',
    'A representative shows negative remaining capacity after a manual assignment. Must this mean that automatic routing ignored its configured limits?',
    'No. Supervisor overrides and manual picking can exceed configured capacity and produce a negative balance.',
    'Inspect how the work was assigned before diagnosing automatic routing.'),
  mcq('deploy', 'cross-channel-blocking', 'capacity',
    'A phone capacity profile should stop additional automatic assignments, even from other profiles, once its work-item limit is reached. Which setting addresses this requirement?', [
      ['Assignment blocking on that capacity profile', 'It blocks additional automatic work when the profile limit is met.'],
      ['A larger work-item limit on all other profiles', 'Increasing limits permits more work rather than blocking it.'],
      ['A different name for the phone queue', 'Queue names do not impose cross-channel capacity blocking.'],
      ['End-of-day reset alone', 'Reset frequency controls when capacity is renewed, not this blocking behavior.'],
    ], 0, 'Manual overrides can still exceed configured capacity.'),

  recall('channels', 'survey-context', 'survey',
    'Where should you look for the workstream values created after adding questions to a chat preconversation survey?',
    'Look in the workstream’s advanced settings under context variables. Corresponding variables are created for the survey questions.',
    'Use the variable values as inputs to your subsequent configuration.'),
  mcq('channels', 'survey-validation', 'survey',
    'A chat survey includes an optional field. The team expects the survey’s validation to enforce a response. Which change aligns with documented survey validation?', [
      ['Move the question to the first position only', 'Question order does not make an optional field mandatory.'],
      ['Change its internal name only', 'The name does not enable mandatory validation.'],
      ['Add a second optional copy of the question', 'Duplicating an optional question does not require a response.'],
      ['Mark the question as required', 'Survey validation is supported for mandatory fields.'],
    ], 3, 'Check the Required setting, then test the customer-facing widget.'),
  recall('channels', 'identity-versus-authentication', 'authentication',
    'Why does matching a contact from an email typed into a chat survey not prove the customer’s identity?',
    'Identification links supplied information to a record. Authentication verifies the signed-in customer through a validated signed token.',
    'A record match is not proof of identity.'),
  mcq('channels', 'attach-chat-authentication', 'authentication',
    'A portal team has implemented its token provider and an administrator saved the chat authentication record. A particular widget still lacks that configuration. What connection should the administrator verify?', [
      ['That the authentication record is selected on the chat channel instance', 'The saved record must be associated with the widget in its workstream.'],
      ['That a survey asks customers to type their password', 'A survey is not the authenticated token integration.'],
      ['That the queue name matches the token issuer', 'Queue naming does not associate the authentication settings.'],
      ['That the private signing key is placed in the widget HTML', 'The integration validates signed tokens with the public key.'],
    ], 0, 'Check both token issuance and the channel’s authentication association.'),
  recall('channels', 'ai-agent-transcripts', 'recording',
    'Voice recording is disabled in Contact Center. Does that guarantee no Copilot Studio transcript exists for the AI-agent conversation?',
    'No. Copilot Studio generates its own transcript. With DTMF-only input, it captures keypad entries and ignores spoken input.',
    'Review transcript behavior separately from voice recording controls.'),
  mcq('channels', 'tenant-recording-control', 'recording',
    'A voice workstream enables recording, but the tenant-level audio-recording control is disabled. Which configuration takes precedence?', [
      ['The workstream always overrides the tenant setting', 'The documented tenant control can prevent recording across workstreams.'],
      ['The representative’s preferred language', 'Language selection does not override recording permission.'],
      ['The tenant-level disabled control prevents audio recording', 'Workstream recording settings cannot override that tenant-level restriction.'],
      ['The queue with the highest priority enables recording', 'Queue priority does not bypass recording controls.'],
    ], 2, 'Validate tenant prerequisites as well as workstream configuration.'),

  recall('ai', 'voice-summary-input', 'summaries',
    'In Contact Center standalone, which voice conversations can Copilot summarize, and what must an administrator enable?',
    'Copilot can summarize transcribed voice conversations. The conversation-summary feature must be enabled by the administrator.',
    'The documented feature also summarizes chat conversations.'),
  mcq('ai', 'handoff-summary', 'summaries',
    'A standalone Contact Center team wants a concise account of the conversation and actions taken when a representative consults a colleague. Which feature fits?', [
      ['A new capacity profile', 'Capacity describes workload rather than conversation context.'],
      ['Copilot conversation summaries configured for consultation', 'The summary can be generated during consultation, depending on administrator configuration.'],
      ['A higher queue priority', 'Priority affects work ordering, not handoff summarization.'],
      ['An additional preconversation survey', 'A starting survey cannot summarize the later representative interaction.'],
    ], 1, 'Check summarization settings in the supported representative experience.'),
  recall('ai', 'review-grounded-answer', 'ask',
    'Copilot’s Ask a question gives a confident answer with citations in Contact Center standalone. What should the representative do before using it with a customer?',
    'Review the answer, inspect its sources, and edit it for accuracy and relevance before sharing.',
    'Generated content is a suggestion that needs human review.'),
  mcq('ai', 'inspect-answer-source', 'ask',
    'A representative notices that a suggested refund answer appears inconsistent with the current policy. Which action most directly exposes the knowledge behind that answer?', [
      ['Raise the conversation’s capacity consumption', 'Capacity does not reveal the basis of a generated answer.'],
      ['Transfer the conversation without reviewing the response', 'A transfer does not identify the source of the discrepancy.'],
      ['Send the response because it has a confident tone', 'Confidence does not establish factual accuracy.'],
      ['Use Check sources and review the cited material', 'The citations expose the knowledge or website links behind the response.'],
    ], 3, 'Use the underlying material to assess the response before sharing it.'),
  recall('ai', 'capture-conversation-value', 'variables',
    'An AI agent asks for an order number and needs it later in the conversation. What stores the response, and how can a value be set explicitly?',
    'The Question node stores its output in a variable. A Set variable value node can explicitly assign a value.',
    'Use a meaningful variable name and an appropriate data type.'),
  mcq('ai', 'pass-topic-input', 'variables',
    'A Copilot Studio topic already collected an order number. It redirects to a returns topic that should reuse that number without asking again. What should you configure?', [
      ['A second mandatory question with no input mapping', 'That requires the customer to supply the same value again.'],
      ['Only a new display name for the returns topic', 'Renaming a topic does not transfer a variable value.'],
      ['A receiving topic variable and a mapped input on the redirect', 'Topic inputs allow the value already collected to be reused.'],
      ['A transcript export as the topic’s input variable', 'A transcript export is not the topic-variable handoff mechanism.'],
    ], 2, 'Enable the destination variable to receive values from other topics.'),

  recall('routing', 'routing-stages', 'routing',
    'How do classification and assignment contribute different parts of unified routing?',
    'Classification enriches a work item. Assignment prioritizes it and matches it to a representative using work requirements and workforce availability.',
    'Adding a skill or urgency attribute is not itself assignment.'),
  mcq('routing', 'assignment-investigation', 'routing',
    'A work item already has the correct urgency and required skills. It is still waiting for a representative. Which part of routing should you investigate next?', [
      ['Assignment conditions and the available workforce', 'Assignment considers requirements, workload, and representative availability.'],
      ['Only the wording of the preconversation survey', 'The scenario already confirms the required work-item attributes.'],
      ['Only the report’s historical date range', 'A reporting filter does not select a representative.'],
      ['Only the conversation-summary format', 'Summary format does not determine assignment eligibility.'],
    ], 0, 'Inspect workforce eligibility rather than assuming enrichment guarantees assignment.'),
  recall('routing', 'ruleset-dependencies', 'classification',
    'Ruleset B uses a value produced by ruleset A. What ordering is necessary, and when are route-to-queue rules evaluated?',
    'Place A before B. Work classification runs in configured order, followed by the route-to-queue ruleset.',
    'Later classification rulesets can consume earlier outputs.'),
  mcq('routing', 'deterministic-skill-attachment', 'classification',
    'A support team has an explicit rule: a selected product family requires a specified skill. It wants a maintainable condition-and-output rule, without training a prediction model. What should it configure?', [
      ['A machine-learning model as the only possible approach', 'Logical rules support explicit conditions without model training.'],
      ['A dashboard filter for the product family', 'A dashboard filter does not attach skills to incoming work.'],
      ['A session template for that product family', 'A session template controls the representative workspace.'],
      ['A logical work-classification rule that attaches the skill', 'Logical classification can attach defined skills when conditions match.'],
    ], 3, 'Keep the skill’s rating model consistent with representative configuration.'),
  recall('routing', 'exact-match-requirements', 'skills',
    'With an out-of-the-box assignment method and Exact Match, is the required skill alone enough for a representative to receive work?',
    'No. Required proficiency, available capacity, and allowed presence also matter. Without a qualified available representative, work can remain queued.',
    'Skill eligibility and current availability are separate checks.'),
  mcq('routing', 'minimum-proficiency', 'skills',
    'A workstream uses an out-of-the-box assignment method. Every required skill must meet its minimum proficiency, even if the item has to wait. Which skill-matching mode fits?', [
      ['Closest Match, accepting fewer skills when needed', 'Closest Match can select representatives below the full requirement.'],
      ['Exact Match', 'It requires the specified skills and sufficient proficiency.'],
      ['Queue ordering alone, with no skill attachment', 'Ordering alone does not define the required skills.'],
      ['A custom method that omits all skill conditions', 'A custom method needs its own rules for the required matching behavior.'],
    ], 1, 'Custom assignment does not simply inherit the workstream’s default algorithm.'),

  recall('representative', 'custom-experience', 'profiles',
    'A team needs different productivity tools from the out-of-the-box workspace profile. Should an administrator edit the default profile?',
    'Create and assign a custom experience profile. The out-of-the-box profiles cannot be modified or deleted.',
    'Configure the tools for the intended group of users.'),
  mcq('representative', 'group-productivity-tools', 'profiles',
    'Only the escalation team should see a particular combination of knowledge search and scripts in its productivity pane. Which configuration groups that experience for those users?', [
      ['A preconversation survey', 'That configures customer intake rather than representative tools.'],
      ['A work classification rule', 'Classification enriches incoming work rather than configuring the pane.'],
      ['A custom experience profile assigned to the team’s users', 'Profiles configure targeted workspace and productivity-pane experiences.'],
      ['A historical analytics bookmark', 'A bookmark saves a report view rather than workspace tools.'],
    ], 2, 'Verify the users receive the intended profile and enabled tools.'),
  recall('representative', 'anchor-tab', 'sessions',
    'Why can a representative not close the anchor tab of an active conversation session?',
    'The anchor application is the session’s persistent starting tab. The session template defines it, and it cannot be closed independently.',
    'Review the session template when the starting application is wrong.'),
  mcq('representative', 'session-startup', 'sessions',
    'When a conversation begins, the workspace should open a chosen anchor application and additional tabs. Which item defines that startup experience?', [
      ['A custom session template with application tab templates', 'It defines the anchor, additional tabs, and initial communication-panel mode.'],
      ['Only a notification template', 'A notification is the invitation to work, not the session’s tab configuration.'],
      ['Only a capacity profile', 'Capacity limits do not choose the applications opened in a session.'],
      ['An edited out-of-the-box session template', 'Create a custom template; the out-of-the-box templates cannot be customized.'],
    ], 0, 'Associate the custom template with the appropriate experience.'),
  recall('representative', 'macro-context', 'macros',
    'In Contact Center standalone, how can one macro work with the current customer in different sessions instead of a hardcoded customer ID?',
    'Pass dynamic session-context values, also called slugs, into the macro’s action parameters.',
    'Validate the context values used by the automation.'),
  mcq('representative', 'repeated-actions', 'macros',
    'Representatives in Contact Center standalone repeatedly open a record and populate the same contextual fields. Which productivity feature can execute this sequence?', [
      ['A quick reply containing instructions to click each field', 'That provides text rather than executing the sequence.'],
      ['A macro using the appropriate automation actions', 'Macros perform reusable sequential operations with session context.'],
      ['A new presence status', 'Presence indicates availability rather than performing record actions.'],
      ['A queue-priority setting', 'Priority controls work ordering rather than automating workspace steps.'],
    ], 1, 'Use supported macro actions and the required productivity-tool permissions.'),

  recall('analytics', 'dashboard-security', 'realtime',
    'Two supervisors see different real-time metrics for the same period. What access-related explanation should you investigate?',
    'Check their Dataverse permissions and queue scope. The dashboard reflects the data each supervisor is permitted to see.',
    'Different totals do not necessarily mean broken aggregation.'),
  mcq('analytics', 'live-bottleneck', 'realtime',
    'A supervisor in Contact Center standalone needs to react to queues building up during the current shift. Which reporting surface best supports that task?', [
      ['Only a monthly historical export', 'A monthly view is less suited to immediate operational intervention.'],
      ['Only the list of solution publishers', 'Publisher metadata does not show live workload.'],
      ['Only the macro designer', 'The designer configures actions rather than monitoring queue health.'],
      ['Omnichannel real-time analytics', 'It exposes near-real-time workload and operational metrics for supervisors.'],
    ], 3, 'Use queue or representative drilldowns to investigate the current bottleneck.'),
  recall('analytics', 'historical-comparison', 'historical',
    'Before comparing two exported historical dashboard views, which view settings should you align?',
    'Align the time period and time zone, plus relevant channel, queue, representative, and conversation-status filters.',
    'Compare equivalent populations and time boundaries.'),
  mcq('analytics', 'bot-performance-report', 'historical',
    'A standalone Contact Center supervisor is reviewing past AI-agent performance and its effect on customer conversations. Which historical dashboard is the closest fit?', [
      ['Voicemail dashboard', 'It focuses on voicemail status and volume.'],
      ['Voice dashboard alone', 'It covers voice-channel performance rather than specifically AI-agent performance.'],
      ['Bot dashboard', 'It provides charts and KPIs for AI-agent performance and conversation impact.'],
      ['Only the representative’s personal inbox', 'The inbox is a work-management view, not this historical analysis.'],
    ], 2, 'Choose the report that measures the population and outcome you need.'),
  recall('analytics', 'diagnostics-readiness', 'diagnostics',
    'What platform and access prerequisites should an engineer verify before setting up conversation diagnostics?',
    'Verify a Managed Environment, appropriate Power Platform administration rights, and the Azure permissions needed to configure and query Application Insights.',
    'Configuration access and telemetry-query access are distinct requirements.'),
  mcq('analytics', 'lifecycle-telemetry', 'diagnostics',
    'An engineering team needs conversation lifecycle events for investigating failures and combining telemetry in a custom dashboard. Which integration should it configure?', [
      ['Conversation diagnostics connected to Azure Application Insights', 'It collects conversation lifecycle logs for operational investigation and analysis.'],
      ['A preconversation survey export alone', 'Survey responses do not provide conversation lifecycle diagnostics.'],
      ['A new application tab title', 'A title change does not collect telemetry.'],
      ['A capacity-profile reset schedule alone', 'A capacity setting does not provide lifecycle-event logs.'],
    ], 0, 'Plan access and data-ingestion costs for the diagnostic resource.'),
];

function note(domain: Domain, title: string, summary: string, bullets: string[], refs: Reference[]): Note {
  return { id: noteId(domain), topicId: topicId(domain), title, summary,
    sections: [{ heading: 'Decision checks', bullets }], tags: ['ab-250', 'original-practice'],
    sourceIds: [...refs, 'guide'].map(sourceId) };
}
const notes: Note[] = [
  note('deploy', 'Release and access decisions', 'Check the artifact, the user’s access, and workload rules independently.', [
    'Use unmanaged solutions for development and managed artifacts for downstream deployment. Deleting an unmanaged container leaves its customizations.',
    'Complete persona mapping and the required application, form, and dashboard permissions. Verify direct role assignment.',
    'Capacity profiles govern work limits and blocking. Manual assignment can still exceed them.',
  ], ['solutions', 'roles', 'capacity']),
  note('channels', 'Chat identity and voice data', 'Treat survey input, authentication, and recorded data as separate configuration decisions.', [
    'Survey questions create context variables; required fields support survey validation.',
    'A supplied email can identify a record. Authenticated chat requires a signed token and authentication settings associated with the channel.',
    'Tenant-level recording restrictions override workstream recording settings. Copilot Studio transcripts have their own behavior, including DTMF-only capture.',
  ], ['survey', 'authentication', 'recording']),
  note('ai', 'Use and review AI context', 'Practice these representative Copilot scenarios in Contact Center standalone; check applicability before using another experience.', [
    'Conversation summaries can help a consultation or transfer. Voice summaries require a transcribed conversation and administrator enablement.',
    'Inspect the sources behind Ask a question responses and review the wording before sharing.',
    'Question outputs preserve customer responses. Pass topic inputs explicitly when redirecting to reuse a value.',
  ], ['summaries', 'ask', 'variables']),
  note('routing', 'Follow the work item through routing', 'Separate information added to work from the later eligibility and assignment decision.', [
    'Classification adds context; assignment considers the work and available workforce.',
    'Order dependent classification rulesets deliberately. Route-to-queue rules run after classification.',
    'Exact Match enforces required skills and proficiency. With out-of-the-box assignment, capacity and presence still matter; custom methods require their own matching rules.',
  ], ['routing', 'classification', 'skills']),
  note('representative', 'Choose the right workspace configuration', 'Profiles target groups, templates define sessions, and macros automate operations.', [
    'Create a custom experience profile for a group’s productivity tools rather than editing an out-of-the-box profile.',
    'A session template defines its anchor and initial tabs. The anchor cannot be closed independently.',
    'In standalone Contact Center, macros can reuse session-context values to perform repeatable actions.',
  ], ['profiles', 'sessions', 'macros']),
  note('analytics', 'Match evidence to the operational question', 'These dashboard scenarios use Contact Center standalone. Confirm permissions and scope before interpreting results.', [
    'Use real-time analytics for current operations; visible metrics depend on access and queue scope.',
    'Use historical dashboards for prior performance. Align filters and time zones before making comparisons.',
    'Use Application Insights conversation diagnostics for lifecycle events. Check Managed Environment and access prerequisites.',
  ], ['realtime', 'historical', 'diagnostics']),
];

export const ab250PracticePack: Pack = {
  id: 'ab-250-original-practice', title: 'AB-250: Original Practice', version: '1.0.0',
  description: '36 original recall and scenario questions with explanations across six AB-250 domains. Equal practice per domain; not a weighted mock exam or complete blueprint coverage. Sources reviewed 2026-10-19.',
  topics, cards, notes, sources,
};
