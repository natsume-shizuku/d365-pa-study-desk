import type { Card, Note, Source, Topic } from '../domain';

const topic: Topic = {
  id: 'cc-experience', title: 'Representative workspace, knowledge, and Copilot',
  description: 'Session context, productivity tools, knowledge retrieval, and responsible Copilot use. Workspace lessons use the standalone experience unless stated otherwise. Reviewed 2026-10-09.',
};
const sourceId = (key: string) => `${topic.id}-source-${key}`;
const noteId = (key: string) => `${topic.id}-note-${key}`;
const sources: Source[] = [
  { id: sourceId('workspace'), title: 'Use Copilot Service workspace', url: 'https://learn.microsoft.com/en-us/dynamics365/contact-center/use/ccw-overview', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('productivity'), title: 'Use the productivity pane to help resolve customer issues', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/use/csw-productivity-pane', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('quick-replies'), title: 'Create personal quick replies', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/use/create-personal-quick-replies', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('knowledge'), title: 'Search knowledge articles', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/use/search-knowledge-articles-csh', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('ask'), title: 'Ask a question', url: 'https://learn.microsoft.com/en-us/dynamics365/contact-center/use/use-ask-a-question', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('summaries'), title: 'Use Copilot to summarize conversations', url: 'https://learn.microsoft.com/en-us/dynamics365/contact-center/use/copilot-summarize-conversations', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('availability'), title: 'Compare Copilot feature availability', url: 'https://learn.microsoft.com/en-us/dynamics365/contact-center/use/copilot-feature-availability', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('cs-deprecations'), title: 'Deprecations in Customer Service', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/implement/deprecations-customer-service', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('cc-deprecations'), title: 'Deprecations in Dynamics 365 Contact Center', url: 'https://learn.microsoft.com/en-us/dynamics365/contact-center/implement/deprecations-contact-center', verified: '2026-10-09', publisher: 'Microsoft Learn' },
];
const notes: Note[] = [
  {
    id: noteId('workspace'), topicId: topic.id, title: 'Keep work context separate from productivity configuration',
    summary: 'Copilot Service workspace maintains multiple customer sessions. Within a case session, productivity-pane information is associated with its anchor tab, not simply whichever related tab is visible.',
    sections: [
      { heading: 'Checklist', bullets: ['Confirm the representative has the documented Omnichannel Agent role and appropriate access.', 'Use sessions for distinct work contexts and tabs for related records; verify the active session before taking an action.', 'Check the assigned experience profile when scripts or knowledge controls are unavailable.', 'Use scripts for guidance, macros for repeatable system actions, and quick replies for reusable message text.'] },
      { heading: 'Gotchas', bullets: ['A collapsed productivity pane can reflect missing controls for that table or profile, not an application failure.', 'In the out-of-box workspace, scripts require a custom profile before they can be enabled.', 'Personal quick replies are not automatically localized; create a separate record with the appropriate locale for each language.', 'The retired case/knowledge smart-assist suggestions still appear in some productivity prose. Do not reintroduce them as the recommended experience.'] },
    ],
    tags: ['workspace', 'productivity', 'profiles'], sourceIds: ['workspace', 'productivity', 'quick-replies', 'cs-deprecations'].map(sourceId),
  },
  {
    id: noteId('knowledge'), topicId: topic.id, title: 'Knowledge retrieval is not the same as a verified answer',
    summary: 'Knowledge search finds articles; Copilot can synthesize answers from configured organizational knowledge. Representatives remain responsible for checking relevance, wording, and suitability before sharing.',
    sections: [
      { heading: 'Checklist', bullets: ['For standalone workspace knowledge search, check Dataverse search configuration, searchable article fields, role access, and the experience-profile knowledge control.', 'Refine search terms and inspect article content and visibility rather than judging only by ranking.', 'For Copilot, use precise questions and follow-up questions; inspect citations with Check sources.', 'Review and edit generated text before sending it to a customer, and give feedback when the answer is unhelpful.'] },
      { heading: 'Gotchas', bullets: ['A source citation is a path to evidence, not a guarantee that the generated interpretation is accurate.', 'Do not assume a personal quick reply is a governed knowledge article or an approved external-channel template.', 'The availability matrix differs by product and experience. In particular, knowledge-article response filtering is not listed as available for standalone Contact Center.', 'Search documentation also contains older smart-assist wording; use the deprecation notice to distinguish current search from retired suggestions.'] },
    ],
    tags: ['knowledge', 'copilot', 'responsible-ai'], sourceIds: ['knowledge', 'ask', 'availability', 'quick-replies', 'cs-deprecations'].map(sourceId),
  },
  {
    id: noteId('copilot'), topicId: topic.id, title: 'Copilot: scope, handoff, and human review',
    summary: 'Conversation summaries help transfer context, while Ask a question helps find and explain configured knowledge. Availability is feature-specific: a Contact Center workspace does not imply every Customer Service case capability.',
    sections: [
      { heading: 'Checklist', bullets: ['Confirm administrator enablement and compare feature availability for Customer Service, standalone Contact Center, or embedded Contact Center.', 'For standalone conversation summarization, use chat or transcribed voice conversations; automatic generation at consult, transfer, or end depends on configuration.', 'Review the summary against the interaction before relying on it for handoff.', 'Treat Create case as conditional on case management and administrator configuration, not a guaranteed standalone Contact Center entitlement.'] },
      { heading: 'Gotchas', bullets: ['The availability matrix lists conversation summaries across experiences, but the detailed use article labels standalone and Customer Service only. Validate embedded behavior; these lessons do not assert identical UI.', 'Case-data questions are marked unavailable for standalone Contact Center in the matrix, despite broad wording in the Ask a question article.', 'The draft-a-chat-response preview, old ongoing auto-summarization, and built-in smart-assist case/knowledge suggestions are retired. Current Copilot conversation summaries are distinct.', 'Preview features such as prompt plugins or verbatim knowledge responses should not be silently treated as production guarantees.'] },
    ],
    tags: ['copilot', 'summaries', 'availability'], sourceIds: ['ask', 'summaries', 'availability', 'cs-deprecations', 'cc-deprecations'].map(sourceId),
  },
];

const drafts: Omit<Card, 'topicId' | 'revision'>[] = [
  {
    id: 'recall-sessions-tabs', kind: 'recall', difficulty: 'Foundation',
    prompt: 'What problem do sessions and tabs solve in Copilot Service workspace?',
    answer: 'Sessions let a representative work on multiple customer interactions without losing each interaction context. Tabs hold related pages within a session. Accepting an incoming conversation starts a new session, while opening a customer record from that session opens a tab in the same session.',
    checkpoints: ['Sessions separate interactions.', 'Tabs keep related records together.', 'Confirm active context before acting.'],
    tags: ['workspace', 'sessions'], sourceIds: ['workspace'], noteIds: ['workspace'],
  },
  {
    id: 'recall-workspace-access', kind: 'recall', difficulty: 'Foundation',
    prompt: 'Which role does the Contact Center workspace overview list as a representative prerequisite, and what is the workspace for?',
    answer: 'The overview lists the Omnichannel Agent role. Copilot Service workspace is the representative-facing multichannel desktop, connecting to organizational CRM information and knowledge so representatives can handle customer sessions in context. App presence alone is not a substitute for the required role and data access.',
    checkpoints: ['Omnichannel Agent role.', 'Representative-facing multichannel desktop.', 'CRM context and knowledge.'],
    tags: ['workspace', 'access'], sourceIds: ['workspace'], noteIds: ['workspace'],
  },
  {
    id: 'recall-anchor-context', kind: 'recall', difficulty: 'Applied',
    prompt: 'In a standalone workspace case session, what determines the productivity-pane information when several tabs are open?',
    answer: 'The productivity pane displays information for the first, or anchor, tab of the active case session. Opening a related record tab does not mean the pane has switched to that record context. Check the session anchor before interpreting guidance or troubleshooting apparently unrelated content.',
    checkpoints: ['Active case session.', 'First tab is the anchor.', 'Related visible tab does not redefine the anchor.'],
    tags: ['workspace', 'context'], sourceIds: ['productivity'], noteIds: ['workspace'],
  },
  {
    id: 'recall-profile-controls', kind: 'recall', difficulty: 'Applied',
    prompt: 'Why might a representative see no scripts in the productivity pane even though scripts exist?',
    answer: 'The pane and its controls are enabled through experience profiles. Check the representative profile and whether controls are configured for the relevant table. The out-of-box workspace requires a custom profile before scripts can be enabled; the pane can stay collapsed when no appropriate controls are configured.',
    checkpoints: ['Assigned experience profile.', 'Controls enabled for the table.', 'Custom profile for out-of-box script enablement.'],
    tags: ['profiles', 'scripts', 'troubleshooting'], sourceIds: ['productivity'], noteIds: ['workspace'],
  },
  {
    id: 'recall-script-macro', kind: 'recall', difficulty: 'Foundation',
    prompt: 'How do representative scripts differ from macros?',
    answer: 'Scripts guide the representative through customer-handling steps and company-endorsed information. A macro is a sequence of instructions that the system executes to perform a task. A script can include macros, but written guidance is not itself automation and automation does not remove the need for the correct work context.',
    checkpoints: ['Script: guided process.', 'Macro: executed system instructions.', 'They can work together.'],
    tags: ['scripts', 'macros', 'productivity'], sourceIds: ['productivity'], noteIds: ['workspace'],
  },
  {
    id: 'recall-quick-replies', kind: 'recall', difficulty: 'Foundation',
    prompt: 'What are personal quick replies, and how should a multilingual representative maintain them?',
    answer: 'They are representative-owned predefined messages for recurring questions, discoverable through tags. Representatives can create, edit, and delete the replies they own. Personal replies are not automatically localized in the app; create a separate reply record and choose the corresponding locale for each language.',
    checkpoints: ['Owned reusable messages.', 'Tags aid retrieval.', 'Separate locale-specific records.'],
    tags: ['quick-replies', 'localization'], sourceIds: ['quick-replies'], noteIds: ['workspace'],
  },
  {
    id: 'recall-knowledge-prerequisites', kind: 'recall', difficulty: 'Applied',
    prompt: 'What layers should an administrator check when standalone workspace knowledge search is unavailable to a custom-role representative?',
    answer: 'Check the documented search prerequisites: Dataverse search and the knowledge article search-field configuration, appropriate access to knowledge entities, and the experience-profile settings enabling the app side pane and knowledge search. Also check that the current table supports the knowledge pane. Do not treat this as only a missing article problem.',
    checkpoints: ['Search and searchable fields.', 'Knowledge-entity role access.', 'Experience profile and supported context.'],
    tags: ['knowledge', 'permissions', 'troubleshooting'], sourceIds: ['knowledge'], noteIds: ['knowledge'],
  },
  {
    id: 'recall-refine-knowledge', kind: 'recall', difficulty: 'Applied',
    prompt: 'How should a representative improve an irrelevant knowledge search result without assuming the first result is correct?',
    answer: 'Use keywords that describe the actual issue rather than relying solely on the default case-title search, inspect the returned article content and its status/visibility, and refine the search. As a recommended practice, confirm the article addresses the customer scenario before applying or sharing it; ranking alone does not establish correctness.',
    checkpoints: ['Refine issue-specific keywords.', 'Inspect article content and status.', 'Validate scenario fit.'],
    tags: ['knowledge', 'recommended-practice'], sourceIds: ['knowledge'], noteIds: ['knowledge'],
  },
  {
    id: 'recall-copilot-evidence', kind: 'recall', difficulty: 'Foundation',
    prompt: 'What should a representative do before sharing an Ask a question response from Copilot?',
    answer: 'Review and edit it for accuracy and appropriateness. Use its citations and Check sources to inspect the underlying knowledge or website evidence, ask a follow-up if needed, and adapt the answer to the customer. Microsoft explicitly describes generated content as a suggestion for which the representative is responsible.',
    checkpoints: ['Human review and editing.', 'Inspect source evidence.', 'Follow up when context is insufficient.'],
    tags: ['copilot', 'responsible-ai', 'citations'], sourceIds: ['ask'], noteIds: ['knowledge', 'copilot'],
  },
  {
    id: 'recall-conversation-summary', kind: 'recall', difficulty: 'Applied',
    prompt: 'For standalone Contact Center, what inputs and configuration support Copilot conversation summarization?',
    answer: 'The administrator must enable conversation summaries. Copilot can summarize chat and transcribed voice conversations. Depending on configuration, summaries can be generated on consultation, transfer, or conversation end, or requested for an ongoing conversation. A voice call without the required transcript is not equivalent to a transcribed conversation.',
    checkpoints: ['Administrator enablement.', 'Chat or transcribed voice.', 'Triggers depend on configuration.'],
    tags: ['copilot', 'summaries', 'handoff'], sourceIds: ['summaries'], noteIds: ['copilot'],
  },
  {
    id: 'recall-case-boundary', kind: 'recall', difficulty: 'Advanced',
    prompt: 'Why is it unsafe to promise every Customer Service case-related Copilot feature in standalone Contact Center?',
    answer: 'Copilot availability differs by application and deployment experience. The comparison matrix marks features such as inline case summaries and asking about case data as unavailable in standalone Contact Center. The conversation-summary Create case action is conditional on case management and administrator enablement. Confirm the exact product and feature rather than inferring parity from a broad article.',
    checkpoints: ['Use the per-experience availability matrix.', 'Case capabilities are not implied by conversation capabilities.', 'Create case is conditional.'],
    tags: ['copilot', 'availability', 'case-management'], sourceIds: ['availability', 'summaries', 'ask'], noteIds: ['copilot'],
  },
  {
    id: 'recall-retired-assistance', kind: 'recall', difficulty: 'Advanced',
    prompt: 'Which older assistance features should be excluded from a current representative enablement plan?',
    answer: 'Do not recommend the retired built-in case/knowledge suggestions in smart assist, old auto-summarization of ongoing conversations, or draft-a-chat-response preview. Use the current Copilot features appropriate to the deployment, including Copilot conversation summaries. Retirement of specific suggestions does not mean ordinary knowledge search or every custom smart-assist integration has been removed.',
    checkpoints: ['Specific retired features, not all knowledge functionality.', 'Current Copilot conversation summaries.', 'Check both product deprecation pages.'],
    tags: ['deprecations', 'copilot'], sourceIds: ['cs-deprecations', 'cc-deprecations', 'summaries'], noteIds: ['workspace', 'copilot'],
  },
  {
    id: 'mcq-session-context', kind: 'mcq', difficulty: 'Applied',
    prompt: 'A representative accepts an incoming conversation and then opens its customer record. What workspace organization is documented?',
    answer: 'The incoming conversation creates a session, and the customer record opens as a tab in that session. This preserves the relationship between the interaction and the related customer context.',
    checkpoints: ['New conversation session.', 'Customer record tab in the same session.'],
    tags: ['workspace', 'sessions'], sourceIds: ['workspace'], noteIds: ['workspace'],
    options: [
      { id: 'a', text: 'Both actions replace the Home session.', rationale: 'The workspace keeps conversation work in a separate session rather than replacing Home.' },
      { id: 'b', text: 'The customer record must always open in another browser window.', rationale: 'Related customer data can open inside the current session.' },
      { id: 'c', text: 'The conversation starts a session; the customer record opens in a tab there.', rationale: 'Correct: this is the documented session-and-tab pattern.' },
      { id: 'd', text: 'The conversation remains only a tab under whichever unrelated session was active.', rationale: 'Accepting a conversation starts a new session to preserve its own context.' },
    ], correctOptionId: 'c',
  },
  {
    id: 'mcq-missing-scripts', kind: 'mcq', difficulty: 'Applied',
    prompt: 'Scripts exist, but a representative using the default workspace profile cannot see them. What is the most relevant first configuration review?',
    answer: 'Review the assigned experience profile and custom-profile script enablement. The documentation requires a custom profile before enabling scripts in the out-of-box workspace; editing script wording does not expose the control.',
    checkpoints: ['Profile assignment.', 'Custom profile and script control.'],
    tags: ['scripts', 'profiles'], sourceIds: ['productivity'], noteIds: ['workspace'],
    options: [
      { id: 'a', text: 'Check the representative experience profile and script-control enablement.', rationale: 'Correct: the profile controls the productivity tools available to the user.' },
      { id: 'b', text: 'Change all script step text to the default language.', rationale: 'Script text does not resolve a missing profile control.' },
      { id: 'c', text: 'Increase the representative routing capacity.', rationale: 'Routing capacity is not the switch for productivity-pane scripts.' },
      { id: 'd', text: 'Republish the customer-facing chat widget.', rationale: 'Widget publishing does not configure representative workspace script availability.' },
    ], correctOptionId: 'a',
  },
  {
    id: 'mcq-productivity-tool', kind: 'mcq', difficulty: 'Foundation',
    prompt: 'A representative needs the system to execute a repeatable sequence of actions, not merely display guidance or insert message text. Which tool fits?',
    answer: 'A macro executes a set of system instructions. Scripts can guide the representative and contain macros, while quick replies insert reusable message text; these tools solve different productivity needs.',
    checkpoints: ['Macro executes actions.', 'Distinguish guidance from automation.'],
    tags: ['macros', 'productivity'], sourceIds: ['productivity', 'quick-replies'], noteIds: ['workspace'],
    options: [
      { id: 'a', text: 'A personal quick reply.', rationale: 'It provides predefined message text rather than an action sequence.' },
      { id: 'b', text: 'A knowledge article favorite.', rationale: 'A favorite aids retrieval, not task execution.' },
      { id: 'c', text: 'A text-only instruction step.', rationale: 'Instructions tell the representative what to do but do not themselves execute system actions.' },
      { id: 'd', text: 'A macro.', rationale: 'Correct: macros execute their configured sequence of instructions.' },
    ], correctOptionId: 'd',
  },
  {
    id: 'mcq-localized-replies', kind: 'mcq', difficulty: 'Applied',
    prompt: 'A personal quick reply written in English is needed in French. Which approach matches documented behavior?',
    answer: 'Create a separate French quick reply and set its locale accordingly. Personal quick replies are not automatically localized simply by changing the representative app language.',
    checkpoints: ['Separate record.', 'Appropriate locale and translated content.'],
    tags: ['quick-replies', 'localization'], sourceIds: ['quick-replies'], noteIds: ['workspace'],
    options: [
      { id: 'a', text: 'Change the app language and expect the existing reply text to translate.', rationale: 'The app does not automatically localize personal quick replies.' },
      { id: 'b', text: 'Create French content in a separate reply with the French locale.', rationale: 'Correct: the documented approach is a separate response record for each language.' },
      { id: 'c', text: 'Add a French tag to the English reply without changing its content.', rationale: 'Tags aid discovery; they do not translate message content.' },
      { id: 'd', text: 'Rename the reply to a French title and leave its body unchanged.', rationale: 'A translated title does not create localized response content.' },
    ], correctOptionId: 'b',
  },
  {
    id: 'mcq-copilot-citation', kind: 'mcq', difficulty: 'Applied',
    prompt: 'Copilot gives a confident answer with a source citation, but the customer situation is unusual. What should the representative do?',
    answer: 'Inspect the cited source, check the answer against the specific situation, and edit or ask a follow-up before sharing. A citation enables verification; it does not remove the representative responsibility for accuracy and appropriateness.',
    checkpoints: ['Inspect evidence.', 'Review scenario fit.', 'Edit before sharing.'],
    tags: ['copilot', 'responsible-ai'], sourceIds: ['ask'], noteIds: ['knowledge'],
    options: [
      { id: 'a', text: 'Check sources and review or refine the answer before sending.', rationale: 'Correct: the documentation requires human review of generated suggestions.' },
      { id: 'b', text: 'Send unchanged because any citation proves the whole answer.', rationale: 'A source link is not proof that the generated interpretation fits this situation.' },
      { id: 'c', text: 'Remove the citation and use the answer as approved policy.', rationale: 'Removing evidence does not validate the generated content.' },
      { id: 'd', text: 'Regenerate until the wording is confident enough, without opening sources.', rationale: 'Repeated generation is not a substitute for factual checking.' },
    ], correctOptionId: 'a',
  },
  {
    id: 'mcq-summary-prerequisite', kind: 'mcq', difficulty: 'Applied',
    prompt: 'A standalone Contact Center team wants Copilot summaries of voice conversations. Which prerequisite combination is supported by the use article?',
    answer: 'The administrator enables conversation summaries, and voice conversations are transcribed. Voice connectivity alone does not supply the text input described for summarization; trigger behavior also depends on configuration.',
    checkpoints: ['Summary enablement.', 'Transcribed voice input.'],
    tags: ['copilot', 'summaries', 'voice'], sourceIds: ['summaries', 'cs-deprecations'], noteIds: ['copilot'],
    options: [
      { id: 'a', text: 'A phone number alone, with no transcript or Copilot setup.', rationale: 'The article requires administrator enablement and describes transcribed voice conversations.' },
      { id: 'b', text: 'An old ongoing-conversation auto-summarization setting only.', rationale: 'That retired feature is not the current Copilot conversation-summary capability.' },
      { id: 'c', text: 'Administrator-enabled Copilot conversation summaries and transcribed voice.', rationale: 'Correct: this matches the documented inputs and enablement.' },
      { id: 'd', text: 'An enabled personal quick reply containing the call subject.', rationale: 'Quick replies do not generate a transcript or enable Copilot summaries.' },
    ], correctOptionId: 'c',
  },
  {
    id: 'mcq-product-parity', kind: 'mcq', difficulty: 'Advanced',
    prompt: 'A broad Copilot article mentions asking about case data. Can a project promise that capability for standalone Contact Center solely from that mention?',
    answer: 'No. Check the per-experience feature matrix, which marks case-data questions unavailable for standalone Contact Center. Resolve deployment-specific applicability rather than treating generic article wording as a product entitlement.',
    checkpoints: ['Per-feature availability.', 'No automatic Customer Service parity.'],
    tags: ['copilot', 'availability'], sourceIds: ['ask', 'availability'], noteIds: ['copilot'],
    options: [
      { id: 'a', text: 'Yes, every feature in a shared article is supported by every listed product.', rationale: 'Shared documentation can include app-specific or conditional features.' },
      { id: 'b', text: 'No; use the availability matrix and validate the actual deployment scope.', rationale: 'Correct: the matrix explicitly differentiates case-data features by experience.' },
      { id: 'c', text: 'Yes, because conversation summaries imply all case features.', rationale: 'Conversation and case capabilities are separate entries in the matrix.' },
      { id: 'd', text: 'Yes, assigning the Omnichannel Agent role enables every Copilot feature.', rationale: 'A role does not change product feature availability.' },
    ], correctOptionId: 'b',
  },
  {
    id: 'mcq-retired-suggestions', kind: 'mcq', difficulty: 'Advanced',
    prompt: 'An old workspace guide recommends built-in smart-assist case/knowledge suggestions. What is the sound October 2026 training response?',
    answer: 'Use the Customer Service deprecation notice to identify those suggestions as retired and teach supported Copilot features and knowledge search instead. Do not infer that every custom smart-assist component or knowledge search has been retired.',
    checkpoints: ['Retired built-in suggestions.', 'Supported Copilot/search alternatives.', 'Avoid overbroad retirement claims.'],
    tags: ['deprecations', 'knowledge', 'copilot'], sourceIds: ['cs-deprecations', 'knowledge', 'productivity'], noteIds: ['workspace', 'knowledge'],
    options: [
      { id: 'a', text: 'Teach the old suggestion settings because the page still exists.', rationale: 'A surviving article does not override an explicit deprecation notice.' },
      { id: 'b', text: 'Remove all knowledge search because every knowledge feature was retired.', rationale: 'The retirement is narrower than all knowledge retrieval.' },
      { id: 'c', text: 'Re-enable the retired suggestions by increasing representative permissions.', rationale: 'Additional permissions do not make this deprecated, unsupported feature a supported solution.' },
      { id: 'd', text: 'Teach supported Copilot and knowledge search, noting the specific retired suggestions.', rationale: 'Correct: this respects the deprecation without overstating its scope.' },
    ], correctOptionId: 'd',
  },
];

export const experience: { topic: Topic; cards: Card[]; notes: Note[]; sources: Source[] } = {
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