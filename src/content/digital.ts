import type { Card, Note, Source, Topic } from '../domain';

const topic: Topic = {
  id: 'cc-digital', title: 'Digital channels and authenticated chat',
  description: 'Live chat, supported SMS and WhatsApp integrations, identity, and channel validation. Reviewed 2026-10-09.',
};
const sourceId = (key: string) => `${topic.id}-source-${key}`;
const noteId = (key: string) => `${topic.id}-note-${key}`;
const sources: Source[] = [
  { id: sourceId('twilio'), title: 'Configure an SMS channel for Twilio', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-sms-channel-twilio', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('infobip'), title: 'Configure an SMS channel for Infobip', url: 'https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/configure-sms-channel-infobip', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('whatsapp'), title: 'Configure a WhatsApp channel through Twilio', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-whatsapp-channel', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('widget'), title: 'Configure a chat widget', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/add-chat-widget', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('survey'), title: 'Configure a preconversation survey', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-pre-chat-survey', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('auth'), title: 'Configure authentication settings', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-chat-auth-settings', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('token'), title: 'Send authentication token', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/develop/send-auth-token-starting-chat', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('cc-deprecations'), title: 'Deprecations in Dynamics 365 Contact Center', url: 'https://learn.microsoft.com/en-us/dynamics365/contact-center/implement/deprecations-contact-center', verified: '2026-10-09', publisher: 'Microsoft Learn' },
  { id: sourceId('cs-deprecations'), title: 'Deprecations in Customer Service', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/implement/deprecations-customer-service', verified: '2026-10-09', publisher: 'Microsoft Learn' },
];
const notes: Note[] = [
  {
    id: noteId('sms'), topicId: topic.id, title: 'SMS: provider connection is only one layer',
    summary: 'For new SMS deployments, use the documented Twilio or Infobip integration. A working provider account does not prove that inbound callbacks, workstream routing, or delivery to the customer work.',
    sections: [
      { heading: 'Checklist', bullets: ['Provision the chosen channel; obtain a provider account, number, and the secure-column permissions needed for setup.', 'Twilio uses Account SID and Auth Token; connect its number to the Dynamics-generated inbound URL.', 'Infobip uses API Base URL and API key. Its application ID must match the Dynamics organization ID; align the number, subscription filter, notification profile, and HMAC secret.', 'Configure workstream routing and distribution, then test inbound delivery and a representative reply. Configure consent and opt-out handling with the provider.'] },
      { heading: 'Gotchas', bullets: ['The D365 Twilio SMS integration documentation specifies US phone numbers only; do not infer D365 support from Twilio global coverage.', 'Existing ACS SMS has a transition period, but it is not the new-deployment recommendation. Telesign is removed.', 'Credential validation alone does not test the callback path. Do not expose provider secrets in tickets or study examples.'] },
    ],
    tags: ['sms', 'providers', 'consent'], sourceIds: ['twilio', 'infobip', 'cc-deprecations', 'cs-deprecations'].map(sourceId),
  },
  {
    id: noteId('whatsapp'), topicId: topic.id, title: 'WhatsApp through Twilio: templates and identity',
    summary: 'Treat provider connectivity, WhatsApp messaging policy, and customer identification as separate concerns. Twilio is the documented recommendation for new WhatsApp deployments.',
    sections: [
      { heading: 'Checklist', bullets: ['Provision channels and connect the Twilio number to a WhatsApp Business Profile; configure the account, callback, workstream, and routing.', 'Within 24 hours of the latest customer message, session replies can be free-form. Outside that window, use an approved template until the customer responds.', 'Create templates with Twilio Content Template Builder and configure Content Template SID in Dynamics; obtain language-specific approval.', 'Test identity and routing with Business-Scoped User ID-only customers as well as phone-number customers.'] },
      { heading: 'Gotchas', bullets: ['A representative reply is not a substitute for a new customer message when assessing the reply window.', 'WhatsApp username rollout means a phone number might not be supplied. Provide fallback routing and update integrations and AI-agent context logic.', 'Provider rollout timing and account behavior need validation. ACS WhatsApp is deprecated, not the target for new setup; Apple Messages for Business is also no longer a new-channel recommendation.'] },
    ],
    tags: ['whatsapp', 'templates', 'identity'], sourceIds: ['whatsapp', 'cc-deprecations'].map(sourceId),
  },
  {
    id: noteId('chat-auth'), topicId: topic.id, title: 'Live chat: presentation, context, and identity',
    summary: 'A widget presents the conversation, a workstream handles routing, and authentication validates signed-in identity. A preconversation answer is context, not proof of identity.',
    sections: [
      { heading: 'Checklist', bullets: ['Configure the widget and its workstream, domain visibility, operating hours, and required customer features.', 'Create an authentication settings record and attach it to the chat channel instance; persistent chat requires authentication settings.', 'For a custom site, generate a signed JWT on the server, publish only the public validation key, and supply the token through the configured client function.', 'Include iss, iat, exp, and sub. Pass serialized lwicontexts whose keys match workstream context variables; test valid, expired, and invalid tokens.'] },
      { heading: 'Gotchas', bullets: ['Survey-required validation does not authenticate the person. Do not treat a typed email address as a verified account identity.', 'Use the JWT authentication flow, not the retired setContextProvider approach for authenticated chat. For SDK integration, register the token provider after lcw:ready.', 'Some authentication documentation still lists Apple Messages for Business. The deprecation notices govern current channel selection.', 'Modern widget testing can retain an existing workstream; shared behavior settings are not a completely isolated second configuration.'] },
    ],
    tags: ['chat', 'authentication', 'jwt'], sourceIds: ['widget', 'survey', 'auth', 'token', 'cs-deprecations', 'cc-deprecations'].map(sourceId),
  },
];

// Local authoring keys are expanded below into globally namespaced IDs, including option IDs.
const drafts: Omit<Card, 'topicId' | 'revision'>[] = [
  {
    id: 'recall-new-providers', kind: 'recall', difficulty: 'Foundation',
    prompt: 'Which provider integrations should a new Contact Center SMS and WhatsApp design evaluate as of 2026-10-09?',
    answer: 'Use SMS through Twilio or Infobip, and WhatsApp through Twilio. The Contact Center deprecation notice directs new deployments away from ACS SMS and WhatsApp; existing ACS channels have a transition period, which is not a recommendation for new architecture.',
    checkpoints: ['SMS: Twilio or Infobip.', 'WhatsApp: Twilio.', 'Separate existing-service transition from new design.'],
    tags: ['providers', 'deprecations'], sourceIds: ['cc-deprecations'], noteIds: ['sms', 'whatsapp'],
  },
  {
    id: 'recall-twilio-prerequisites', kind: 'recall', difficulty: 'Foundation',
    prompt: 'What must be ready before configuring SMS through Twilio in Dynamics?',
    answer: 'Provision SMS for Twilio in the service administration experience, have a Twilio subscription and phone number, and obtain the required secure-column permissions. Configure the messaging account with Account SID and Auth Token. The D365 integration documentation specifies US phone numbers only; wider Twilio availability does not extend this documented scope.',
    checkpoints: ['Channel provisioned and provider number available.', 'Account SID, Auth Token, and secure-column permissions.', 'D365-specific US-number restriction.'],
    tags: ['sms', 'twilio', 'prerequisites'], sourceIds: ['twilio'], noteIds: ['sms'],
  },
  {
    id: 'recall-sms-message-path', kind: 'recall', difficulty: 'Applied',
    prompt: 'Trace an incoming Twilio SMS and the representative reply. Why is credential validation insufficient?',
    answer: 'The customer message reaches Twilio, which forwards it to the Dynamics callback URL. Dynamics associates it with a conversation and routes it. A representative reply travels from Dynamics to Twilio and then to the customer. Validating Account SID and Auth Token checks credentials, not all callbacks, routing, or final delivery.',
    checkpoints: ['Inbound: customer → Twilio → callback → conversation/routing.', 'Reply: Dynamics → Twilio → customer.', 'Test both directions, not credentials alone.'],
    tags: ['sms', 'callbacks', 'troubleshooting'], sourceIds: ['twilio'], noteIds: ['sms'],
  },
  {
    id: 'recall-infobip-binding', kind: 'recall', difficulty: 'Applied',
    prompt: 'What identifier and connection details bind the Infobip SMS setup to the Dynamics organization?',
    answer: 'Use the Dynamics organization ID as the Infobip Application ID, not the environment ID, tenant ID, or Entra application ID. Configure the API Base URL and API key in the messaging account, and associate the number and subscription application filter with that same application. The documented key needs the message:send scope.',
    checkpoints: ['Organization ID is the application binding.', 'API Base URL and scoped API key.', 'Number and subscription reference the same application.'],
    tags: ['sms', 'infobip', 'identity'], sourceIds: ['infobip'], noteIds: ['sms'],
  },
  {
    id: 'recall-infobip-webhook', kind: 'recall', difficulty: 'Advanced',
    prompt: 'What Infobip inbound configuration should be checked when a provisioned number receives messages but Dynamics does not?',
    answer: 'Check the notification profile callback URL and HMAC authentication using the same API key as the Dynamics messaging account. Verify the SMS subscription includes inbound and delivery events, its application filter matches the number application, and the number uses Apply subscription for inbound forwarding. This tests the provider-to-Dynamics path before changing routing.',
    checkpoints: ['Callback and matching HMAC secret.', 'Inbound/delivery subscription and application match.', 'Apply subscription forwarding action.'],
    tags: ['sms', 'infobip', 'diagnostics'], sourceIds: ['infobip'], noteIds: ['sms'],
  },
  {
    id: 'recall-sms-consent', kind: 'recall', difficulty: 'Foundation',
    prompt: 'Where must SMS opt-out and consent handling be configured for Twilio and Infobip?',
    answer: 'Configure consent settings directly with the SMS provider so it handles opt-out commands properly. A Dynamics workstream or a chat-survey consent checkbox is not a replacement for provider-side SMS consent configuration. As a recommended acceptance practice, test opt-out behavior end to end.',
    checkpoints: ['Provider-side consent settings.', 'Do not substitute chat consent.', 'Validate opt-out behavior.'],
    tags: ['sms', 'consent', 'recommended-practice'], sourceIds: ['twilio', 'infobip'], noteIds: ['sms'],
  },
  {
    id: 'recall-whatsapp-window', kind: 'recall', difficulty: 'Foundation',
    prompt: 'How does the WhatsApp 24-hour rule affect representative responses?',
    answer: 'Within 24 hours of the most recent customer message, the representative can send session replies without a template. Once that window has elapsed, the representative must use a predefined WhatsApp-approved template until the customer responds. This is a messaging-policy window, not a Dynamics queue or workstream timeout.',
    checkpoints: ['Anchor the window to the latest customer message.', 'Outside window: approved template.', 'Not a queue timeout.'],
    tags: ['whatsapp', 'templates'], sourceIds: ['whatsapp'], noteIds: ['whatsapp'],
  },
  {
    id: 'recall-whatsapp-template', kind: 'recall', difficulty: 'Applied',
    prompt: 'What is the current template setup pattern for WhatsApp through Twilio?',
    answer: 'Create the content template in Twilio Content Template Builder and obtain WhatsApp approval, including approval for each language used. Add it to the Dynamics WhatsApp configuration with its Content Template SID, language, and approved text. Do not build a new integration around the deprecated Template Name-based console/API workflow.',
    checkpoints: ['Twilio Content Template Builder.', 'WhatsApp approval per language.', 'Content Template SID in Dynamics.'],
    tags: ['whatsapp', 'templates', 'deprecations'], sourceIds: ['whatsapp'], noteIds: ['whatsapp'],
  },
  {
    id: 'recall-whatsapp-identity', kind: 'recall', difficulty: 'Advanced',
    prompt: 'Why should WhatsApp routing not require every customer to provide a phone-number identifier?',
    answer: 'The documented WhatsApp username and Business-Scoped User ID rollout can produce conversations without a phone number. Phone-pattern rules and integrations that assume msdyn_CustomerPhoneNumber is always present need fallback behavior and support for the business-scoped identifier. Validate actual provider rollout behavior rather than assuming every account changes simultaneously.',
    checkpoints: ['Business-Scoped User ID can replace the supplied number.', 'Fallback routing and identity-aware integrations.', 'Provider rollout must be validated.'],
    tags: ['whatsapp', 'identity', 'routing'], sourceIds: ['whatsapp'], noteIds: ['whatsapp'],
  },
  {
    id: 'recall-chat-layers', kind: 'recall', difficulty: 'Foundation',
    prompt: 'How do a chat widget, its workstream, and a preconversation survey contribute different things?',
    answer: 'The widget is the customer-facing interface and contains channel behaviors and user features. Its workstream defines how conversations are routed to queues. A preconversation survey collects answers before the conversation and creates corresponding context variables in the workstream. Survey answers provide context, not authenticated identity.',
    checkpoints: ['Widget: interface and channel behavior.', 'Workstream: routing.', 'Survey: customer-supplied context.'],
    tags: ['chat', 'workstreams', 'survey'], sourceIds: ['widget', 'survey', 'auth'], noteIds: ['chat-auth'],
  },
  {
    id: 'recall-jwt-auth', kind: 'recall', difficulty: 'Applied',
    prompt: 'Describe the trust flow for authenticated chat on a custom website.',
    answer: 'The website authentication service issues a signed JWT for the signed-in user, preferably on the server. The configured client function supplies it to chat; the service validates it using the published public key. Attach the authentication settings record to the channel instance. Minimum documented claims are iss, iat, exp, and sub; the contact/account GUID in sub is recommended for record identification.',
    checkpoints: ['Signed server-issued token; private key stays private.', 'Public validation key and channel authentication setting.', 'iss, iat, exp, sub; distinguish identity from record linking.'],
    tags: ['chat', 'authentication', 'jwt'], sourceIds: ['auth'], noteIds: ['chat-auth'],
  },
  {
    id: 'recall-auth-context', kind: 'recall', difficulty: 'Advanced',
    prompt: 'How should authenticated chat transmit custom routing context and initialize its SDK token provider?',
    answer: 'Include serialized custom context in the JWT lwicontexts claim, with primitive values and keys matching the associated workstream context variables. In a custom SDK integration, wait for lcw:ready before registering setAuthTokenProvider and starting chat. The old setContextProvider method is not supported for authenticated chat; invalid or expired tokens generate an error event.',
    checkpoints: ['Serialized lwicontexts with matching keys.', 'Register token provider after lcw:ready.', 'Do not use retired authenticated setContextProvider.'],
    tags: ['chat', 'jwt', 'context'], sourceIds: ['auth', 'token', 'cs-deprecations'], noteIds: ['chat-auth'],
  },
  {
    id: 'mcq-provider-choice', kind: 'mcq', difficulty: 'Applied',
    prompt: 'A greenfield project needs supported SMS options and WhatsApp. Which shortlist matches the October 2026 Contact Center guidance?',
    answer: 'SMS through Twilio or Infobip and WhatsApp through Twilio matches the new-deployment guidance. Historical configuration articles do not override channel deprecation notices.',
    checkpoints: ['Choose current provider guidance.', 'Distinguish SMS providers from WhatsApp providers.'],
    tags: ['providers', 'deprecations'], sourceIds: ['cc-deprecations', 'cs-deprecations'], noteIds: ['sms', 'whatsapp'],
    options: [
      { id: 'a', text: 'SMS through Twilio or Infobip; WhatsApp through Twilio.', rationale: 'Correct: these are the documented new-deployment choices.' },
      { id: 'b', text: 'SMS through ACS; WhatsApp through ACS for all new tenants.', rationale: 'Both ACS channel integrations are deprecated and are not the new-deployment recommendation.' },
      { id: 'c', text: 'SMS through Telesign; WhatsApp through Twilio.', rationale: 'The WhatsApp choice is current, but the Telesign SMS channel has been removed.' },
      { id: 'd', text: 'SMS through Twilio; WhatsApp through Infobip using the SMS account.', rationale: 'The cited Infobip integration is SMS, not a documented D365 WhatsApp channel via that SMS account.' },
    ], correctOptionId: 'a',
  },
  {
    id: 'mcq-twilio-inbound', kind: 'mcq', difficulty: 'Applied',
    prompt: 'Twilio credentials validate, but incoming SMS never creates a Dynamics conversation. Which check most directly tests the missing integration path?',
    answer: 'Verify that the Twilio support number forwards messages to the Dynamics-generated inbound URL. A credential check does not establish inbound forwarding; investigate routing after establishing that messages reach Dynamics.',
    checkpoints: ['Check number callback binding.', 'Separate transport from routing.'],
    tags: ['twilio', 'troubleshooting'], sourceIds: ['twilio'], noteIds: ['sms'],
    options: [
      { id: 'a', text: 'Change representative capacity before checking message arrival.', rationale: 'Capacity affects assignment, not the missing provider callback path.' },
      { id: 'b', text: 'Verify the Dynamics inbound URL configured on the Twilio number.', rationale: 'Correct: Twilio pushes incoming SMS through this callback.' },
      { id: 'c', text: 'Republish the website chat widget.', rationale: 'The live chat widget is not the transport for Twilio SMS.' },
      { id: 'd', text: 'Change the default language of the SMS workstream.', rationale: 'Language does not fix a missing or wrong inbound URL.' },
    ], correctOptionId: 'b',
  },
  {
    id: 'mcq-infobip-id', kind: 'mcq', difficulty: 'Applied',
    prompt: 'Which value must be used as the Infobip Application ID in the documented SMS integration?',
    answer: 'Use the Dynamics organization ID. The number assignment and subscription application filter must refer to the corresponding Infobip application; other platform identifiers are not interchangeable.',
    checkpoints: ['Organization ID.', 'Consistent application binding.'],
    tags: ['infobip', 'identity'], sourceIds: ['infobip'], noteIds: ['sms'],
    options: [
      { id: 'a', text: 'Microsoft Entra tenant ID.', rationale: 'This identifies the directory, not the Dynamics organization required here.' },
      { id: 'b', text: 'Power Platform environment ID.', rationale: 'The documentation explicitly distinguishes this from the required organization ID.' },
      { id: 'c', text: 'Dynamics organization ID.', rationale: 'Correct: the Infobip application is bound to this organization identifier.' },
      { id: 'd', text: 'Microsoft Entra application client ID.', rationale: 'An app registration identifier is not the required Infobip application binding.' },
    ], correctOptionId: 'c',
  },
  {
    id: 'mcq-whatsapp-expired-window', kind: 'mcq', difficulty: 'Applied',
    prompt: 'A customer last messaged on WhatsApp 30 hours ago and has not replied since. What can the representative send now?',
    answer: 'Use a configured WhatsApp-approved template. Free-form session replies are outside the 24-hour window; a new customer response is needed to resume that session-message pattern.',
    checkpoints: ['Window expired.', 'Approved template rather than free-form reply.'],
    tags: ['whatsapp', 'templates'], sourceIds: ['whatsapp'], noteIds: ['whatsapp'],
    options: [
      { id: 'a', text: 'Any quick reply because it is stored in Dynamics.', rationale: 'A stored quick reply is not necessarily a WhatsApp-approved template.' },
      { id: 'b', text: 'A free-form response after moving the conversation to another queue.', rationale: 'Queue changes do not reset WhatsApp policy windows.' },
      { id: 'c', text: 'A free-form response after reopening the workspace session.', rationale: 'Workspace session state does not change the time of the last customer message.' },
      { id: 'd', text: 'A configured WhatsApp-approved template.', rationale: 'Correct: this is the documented path outside the customer-message window.' },
    ], correctOptionId: 'd',
  },
  {
    id: 'mcq-identity-fallback', kind: 'mcq', difficulty: 'Advanced',
    prompt: 'A WhatsApp country-code phone rule misses username-based customers. Which design change addresses the documented identity change?',
    answer: 'Support Business-Scoped User ID-only conversations in routing, integration, and AI-agent context logic, including a fallback route. Do not require a phone number that the provider might no longer send.',
    checkpoints: ['Handle missing number.', 'Use business-scoped identity and fallback.'],
    tags: ['whatsapp', 'identity', 'routing'], sourceIds: ['whatsapp'], noteIds: ['whatsapp'],
    options: [
      { id: 'a', text: 'Retry the same phone-number condition more frequently.', rationale: 'Retries do not supply a missing phone-number identifier.' },
      { id: 'b', text: 'Add fallback routing and support Business-Scoped User ID in integrations.', rationale: 'Correct: Microsoft explicitly recommends reviewing these phone-dependent assumptions.' },
      { id: 'c', text: 'Treat the WhatsApp display name as a verified unique contact key.', rationale: 'Display names are not a reliable replacement for the documented scoped identifier.' },
      { id: 'd', text: 'Assign every unidentified conversation to the last phone-linked contact.', rationale: 'This risks incorrect customer association and does not implement the identity change.' },
    ], correctOptionId: 'b',
  },
  {
    id: 'mcq-survey-trust', kind: 'mcq', difficulty: 'Applied',
    prompt: 'A customer types a VIP email address into a required preconversation survey. What can safely be concluded?',
    answer: 'The customer supplied an answer to a required question, not proof that they own that identity. Use the authenticated-chat JWT flow to validate a signed-in user before trusting identity-dependent treatment.',
    checkpoints: ['Required input is not authentication.', 'Use authenticated identity for trust decisions.'],
    tags: ['chat', 'authentication', 'survey'], sourceIds: ['survey', 'auth'], noteIds: ['chat-auth'],
    options: [
      { id: 'a', text: 'The field is populated, but ownership of the identity is unverified.', rationale: 'Correct: survey validation and signed-in authentication solve different problems.' },
      { id: 'b', text: 'Required input proves the customer owns that mailbox.', rationale: 'Making a field required does not verify ownership.' },
      { id: 'c', text: 'Matching a contact automatically makes the conversation authenticated.', rationale: 'Record matching based on supplied context is not the signed-token authentication flow.' },
      { id: 'd', text: 'A survey consent checkbox authenticates the contact.', rationale: 'Consent and identity verification are separate concerns.' },
    ], correctOptionId: 'a',
  },
  {
    id: 'mcq-auth-context-repair', kind: 'mcq', difficulty: 'Advanced',
    prompt: 'Signed-in chat uses setContextProvider to supply VIP routing context. What is the supported correction?',
    answer: 'Put serialized context in lwicontexts within the signed JWT and match its keys to workstream variables. For custom widget SDK initialization, register setAuthTokenProvider after lcw:ready. Do not revive the unsupported authenticated setContextProvider pattern.',
    checkpoints: ['Signed JWT context.', 'Matching workstream keys.', 'Supported token-provider initialization.'],
    tags: ['chat', 'jwt', 'deprecations'], sourceIds: ['auth', 'token', 'cs-deprecations'], noteIds: ['chat-auth'],
    options: [
      { id: 'a', text: 'Disable signature validation but keep the same context provider.', rationale: 'This removes the trust boundary instead of adopting the supported flow.' },
      { id: 'b', text: 'Move the private signing key into widget JavaScript.', rationale: 'The private key must not be distributed to customers; token generation belongs on the trusted server.' },
      { id: 'c', text: 'Use unsigned query-string values as authenticated VIP claims.', rationale: 'Customer-controlled URL values are not signed authentication context.' },
      { id: 'd', text: 'Send lwicontexts in the JWT and initialize the supported token provider.', rationale: 'Correct: this follows the current authenticated-chat integration guidance.' },
    ], correctOptionId: 'd',
  },
  {
    id: 'mcq-widget-rollout', kind: 'mcq', difficulty: 'Applied',
    prompt: 'A team wants to try the modern chat widget without rebuilding its working classic chat workstream. Which approach is documented?',
    answer: 'Add the modern widget to the existing chat channel and test with its version-specific testing script before switching the active version used by the general script. Review shared behavior and user-feature settings because they are not wholly isolated per version.',
    checkpoints: ['Preserve the workstream.', 'Test the specific widget version.', 'Review shared settings before activation.'],
    tags: ['chat', 'rollout'], sourceIds: ['widget'], noteIds: ['chat-auth'],
    options: [
      { id: 'a', text: 'Delete the workstream and rebuild every rule first.', rationale: 'The modern widget can be added to the existing chat channel.' },
      { id: 'b', text: 'Assume adding the modern widget creates isolated copies of all behaviors.', rationale: 'Some behavior and user-feature settings are shared between versions.' },
      { id: 'c', text: 'Add the modern version, test its specific script, then switch the active version.', rationale: 'Correct: the documented transition preserves existing workstream configuration.' },
      { id: 'd', text: 'Switch the active version first because versions cannot be tested independently.', rationale: 'Version-specific testing scripts support testing before general activation.' },
    ], correctOptionId: 'c',
  },
];

export const digital: { topic: Topic; cards: Card[]; notes: Note[]; sources: Source[] } = {
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