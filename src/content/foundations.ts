import type { Card, Note, Source, Topic } from '../domain';

const topic: Topic = {
  id: 'cc-foundations',
  title: 'Contact Center foundations and product boundaries',
  description: 'Choose the representative experience, distinguish CRM and channel responsibilities, and validate availability and licensing without assuming feature parity.',
};
const sid = (n: number) => `${topic.id}-src-${String(n).padStart(2, '0')}`;
const nid = (n: number) => `${topic.id}-note-${String(n).padStart(2, '0')}`;
const cid = (n: number) => `${topic.id}-${String(n).padStart(3, '0')}`;
const source = (n: number, title: string, url: string): Source => ({
  id: sid(n), title, url, verified: '2026-10-09', publisher: 'Microsoft Learn',
});
// Numeric identifiers are permanent content identifiers, not display positions.
const sources: Source[] = [
  source(1, 'Dynamics 365 Contact Center overview', 'https://learn.microsoft.com/en-us/dynamics365/contact-center/implement/overview-contact-center'),
  source(2, 'Use Copilot Service workspace', 'https://learn.microsoft.com/en-us/dynamics365/contact-center/use/ccw-overview'),
  source(3, 'Set up the embedded experience in Salesforce', 'https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/set-up-embedded-experience'),
  source(4, 'System requirements for Dynamics 365 Contact Center', 'https://learn.microsoft.com/en-us/dynamics365/contact-center/implement/system-requirements-contact-center'),
  source(5, 'International availability of Dynamics 365 Contact Center', 'https://learn.microsoft.com/en-us/dynamics365/contact-center/implement/international-availability'),
  source(6, 'Compare Copilot feature availability', 'https://learn.microsoft.com/en-us/dynamics365/contact-center/use/copilot-feature-availability'),
  source(7, 'Provision channels in Dynamics 365 Contact Center', 'https://learn.microsoft.com/en-us/dynamics365/contact-center/implement/provision-channels'),
  source(8, 'Assign roles and enable users', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/implement/add-users-assign-roles'),
  source(9, 'Manage unified routing for Customer Service', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/provision-unified-routing'),
  source(10, 'Deprecations in Customer Service', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/implement/deprecations-customer-service'),
  source(11, 'Deprecations in Dynamics 365 Contact Center', 'https://learn.microsoft.com/en-us/dynamics365/contact-center/implement/deprecations-contact-center'),
  source(12, 'Dynamics 365 Contact Center documentation', 'https://learn.microsoft.com/en-us/dynamics365/contact-center/'),
];
type Choice = [text: string, rationale: string];
function recall(n: number, difficulty: Card['difficulty'], prompt: string, answer: string, checkpoints: string[], tags: string[], refs: number[], note: number): Card {
  return { id: cid(n), topicId: topic.id, revision: 1, kind: 'recall', difficulty, prompt, answer, checkpoints, tags, sourceIds: refs.map(sid), noteIds: [nid(note)] };
}
function mcq(n: number, difficulty: Card['difficulty'], prompt: string, choices: [Choice, Choice, Choice, Choice], correct: number, checkpoints: string[], tags: string[], refs: number[], note: number): Card {
  const options = choices.map(([text, rationale], i) => ({ id: `${cid(n)}-option-${i + 1}`, text, rationale }));
  return { id: cid(n), topicId: topic.id, revision: 1, kind: 'mcq', difficulty, prompt,
    answer: `${choices[correct][0]} ${choices[correct][1]}`, checkpoints, tags,
    sourceIds: refs.map(sid), noteIds: [nid(note)], options, correctOptionId: options[correct].id };
}

const notes: Note[] = [
  {
    id: nid(1), topicId: topic.id, title: 'Choose the desktop without conflating products',
    summary: 'Contact Center supplies engagement capabilities for the CRM of your choice; a shared brand does not make every Customer Service feature available in every experience.',
    sections: [
      { heading: 'Boundaries', bullets: [
        'Copilot Service workspace is a representative-facing, multisession desktop that connects to CRM context. The embedded conversation widget places representative chat and voice controls inside another CRM.',
        'Embedding the widget and connecting CRM data are separate implementation concerns. The Salesforce instructions include both the CTI setup and a CRM connection step.',
        'The unified-routing provisioning article explicitly limits its case information to Customer Service. Do not infer case-management entitlement from the presence of Contact Center routing.',
      ] },
      { heading: 'Checklist', bullets: [
        'Record the CRM of record, the representative desktop, the required channels, and the Copilot features separately.',
        'Compare each required Copilot feature across Customer Service, Contact Center standalone, and Contact Center embedded before committing to a design.',
        'Use Copilot Service admin center for channel configuration and Copilot Service workspace for representative work; validate both experiences with their intended users.',
      ] },
      { heading: 'Gotchas', bullets: [
        'Conversation summaries are listed across all three experiences; inline case summaries on cases are listed only for Customer Service.',
        'Email drafting in the Copilot help pane is not the same feature as email assist inside the email editor. Embedded supports the former, not the latter, in the checked comparison.',
        'A representative widget is not the customer-facing live chat widget. Plan and test the two surfaces separately.',
      ] },
    ], tags: ['product-boundaries', 'embedded', 'standalone', 'copilot'], sourceIds: [1, 2, 3, 6, 7, 9].map(sid),
  },
  {
    id: nid(2), topicId: topic.id, title: 'Readiness and commercial assumptions',
    summary: 'Treat channel availability, user licensing, browser readiness, and CRM prerequisites as independent checks.',
    sections: [
      { heading: 'Checklist', bullets: [
        'Confirm the Microsoft 365 tenant geography against the Contact Center channel-availability table; its geography column is not simply the Power Platform environment data-center location.',
        'Check digital, voice, and language support separately. Support for one channel or locale does not imply support for every speech or AI feature.',
        'Verify channel-user licensing against the current Dynamics 365 Licensing Guide linked from system requirements and provisioning. This note makes no SKU, bundled entitlement, or price claims.',
        'For embedded deployments, validate the host CRM system requirements in addition to Contact Center requirements. Review representative browsers separately from customer chat-widget browsers.',
      ] },
      { heading: 'Gotchas', bullets: [
        'Provisioning enables services, not a complete operational design. Channel instances, routing, and representative configuration still need implementation and testing.',
        'A trial can show already-enabled channels as grayed out. That is not proof that a production tenant has the same purchased rights.',
        'The system-requirements page still includes Azure Communication Services dependencies. It is not a reason to adopt a legacy standalone ACS telephony setup; validate the current voice architecture separately.',
      ] },
    ], tags: ['planning', 'licensing', 'availability', 'prerequisites'], sourceIds: [4, 5, 7].map(sid),
  },
  {
    id: nid(3), topicId: topic.id, title: 'Read current documentation critically',
    summary: 'Verification date: 2026-10-09. Follow applicability statements and deprecation notices, not old labels or a surviving hyperlink.',
    sections: [
      { heading: 'Checklist', bullets: [
        'Start at the Contact Center documentation hub. It intentionally links to shared Customer Service setup and administration articles.',
        'Check both product deprecation lists before adopting an older lab. Human agents are now called representatives, while Copilot Studio bots may be called AI agents; security-role labels can still use agent.',
        'Separate a deprecation announcement from support end and removal. For example, forecasting has an upcoming October 30, 2026 transition in the checked notice; that date is still future on October 9.',
      ] },
      { heading: 'Gotchas', bullets: [
        'Effort estimation was removed June 2, 2025. Legacy unified-routing diagnostics had a March 31, 2026 removal date. Neither is a current setup exercise.',
        'Use the newer Copilot Service admin center channel-provisioning experience, not the deprecated Omnichannel provisioning flow in Power Platform admin center.',
        'The Contact Center notice also deprecates ACS-based SMS and WhatsApp. This foundations topic does not teach their legacy provisioning or infer voice migration steps from those notices.',
      ] },
    ], tags: ['documentation', 'deprecations', 'terminology'], sourceIds: [8, 10, 11, 12].map(sid),
  },
];

const cards: Card[] = [
  recall(1, 'Foundation', 'What does Dynamics 365 Contact Center add when an organization retains its existing CRM?',
    'It supplies cloud-based engagement capabilities such as voice and digital conversations, self-service, unified routing, representative assistance, and operational insights. The product is designed for the CRM of the organization’s choice, rather than requiring every engagement to be a CRM replacement project.',
    ['Engagement capabilities', 'CRM choice is retained'], ['product-scope', 'crm'], [1], 1),
  recall(2, 'Foundation', 'Why does Copilot Service workspace separate customer sessions from tabs?',
    'Sessions keep simultaneous customer interactions organized without losing their context. Opening a customer record from an existing session adds a tab in that session; accepting an incoming conversation starts a new session. Tabs are supporting views, not automatically separate customer engagements.',
    ['Session holds interaction context', 'Related record can open as a tab'], ['workspace', 'sessions'], [2], 1),
  recall(3, 'Applied', 'A Salesforce embedded conversation widget renders successfully. Why is that not yet evidence that Copilot can use the CRM data?',
    'The embedded control and the CRM connection are separate setup concerns. The Salesforce procedure includes a further CRM connection step using the required sign-in URI and API version. Rendering chat or voice controls alone does not validate that data connection.',
    ['Widget rendering is not data integration', 'Validate the CRM connection'], ['embedded', 'crm-integration'], [3], 1),
  recall(4, 'Foundation', 'Why should a Contact Center plan not assume that every case feature in shared routing documentation belongs to standalone Contact Center?',
    'The shared unified-routing provisioning article explicitly says its case information applies only to Customer Service. Shared routing technology does not erase product-specific case capabilities or licensing boundaries; scope the Customer Service dependency separately.',
    ['Read applicability notes', 'Case information is scoped to Customer Service'], ['product-boundaries', 'cases'], [9], 1),
  recall(5, 'Applied', 'At what level must channel-use licensing be checked before onboarding representatives?',
    'System requirements specify licensing requirements for each channel user using voice, chat, and digital messaging. Check the current Licensing Guide for the intended users and channels; tenant provisioning or the appearance of an app is not proof of each user’s entitlement.',
    ['Each channel user', 'Current licensing guide, not inferred SKU rights'], ['licensing', 'planning'], [4, 7], 2),
  recall(6, 'Applied', 'Which geography does the Contact Center international-availability table explicitly describe?',
    'It describes the Microsoft 365 tenant’s geographic region, not simply the data center of the Power Platform environment or organization instance. Validate the tenant and the intended channel against that table instead of inferring availability solely from an environment address.',
    ['Microsoft 365 tenant geography', 'Not just environment data center'], ['availability', 'geography'], [5], 2),
  recall(7, 'Applied', 'Why is support for a language in digital messaging insufficient evidence for a voice design?',
    'The international-availability documentation lists digital and voice language support separately and links additional voice-enabled Copilot and AI-language requirements. Validate the actual voice and AI features, not only whether a language can appear in a chat interface.',
    ['Separate digital and voice support', 'Check feature-specific language requirements'], ['languages', 'availability'], [5], 2),
  recall(8, 'Foundation', 'Which two browser populations need separate readiness checks for live chat?',
    'Representatives use the supported Contact Center desktop browsers, while customers use the separately documented live chat widget browser matrix across devices. Validating the customer widget on a phone does not establish support for a representative’s desktop browser.',
    ['Representative desktop browsers', 'Customer-facing chat widget browsers'], ['browsers', 'planning'], [4], 2),
  recall(9, 'Foundation', 'What boundary separates channel provisioning from an operational contact center configuration?',
    'Provisioning enables the selected channel services in the environment. Workstreams, channel instances, and user setup are subsequent configuration concerns, as the provisioning article’s next steps make clear. A successful enablement is not an end-to-end routing acceptance test.',
    ['Enable service first', 'Configure and test workstreams and users next'], ['provisioning', 'planning'], [7], 2),
  recall(10, 'Foundation', 'How do the responsibilities of Copilot Service admin center and Copilot Service workspace differ?',
    'The admin center is where administrators provision and configure channels. Copilot Service workspace is the representative-facing app for customer sessions and CRM context. A representative workflow should be tested in the runtime app rather than inferred from an administrator’s successful configuration.',
    ['Admin center configures', 'Workspace handles representative interactions'], ['apps', 'responsibilities'], [2, 7], 1),
  recall(11, 'Foundation', 'In updated Contact Center documentation, how should you distinguish a representative from an AI agent?',
    'A representative is the human service user. A Copilot Studio bot may now be called a Copilot agent or AI agent. Some older labels remain, including Omnichannel agent security roles, so read the surrounding task before assuming that every agent reference means a human.',
    ['Representative means human', 'AI agent can mean Copilot Studio bot', 'Role names may retain agent'], ['terminology'], [8], 3),
  recall(12, 'Applied', 'Why must a migration plan track deprecation, support-end, and removal dates separately?',
    'Deprecation signals an intended transition and does not by itself mean immediate removal. The feature-specific notice governs support and removal. As of October 9, 2026, the forecasting notice points to October 30, 2026, whereas effort estimation’s June 2025 removal is already past.',
    ['Use feature-specific dates', 'Distinguish upcoming from completed removal'], ['deprecations', 'planning'], [10, 11], 3),
  mcq(13, 'Applied', 'A team wants representatives to handle voice and chat inside its existing non-Microsoft CRM web app. Which experience is designed for that requirement?', [
    ['The customer-facing live chat widget', 'Incorrect: that widget is the customer entry point, not the representative conversation surface inside a CRM.'],
    ['The embedded conversation widget', 'Correct: it places representative chat and voice conversations in a host web page or application supporting HTML and JavaScript.'],
    ['The channel-management page in Copilot Service admin center', 'Incorrect: that page provisions channels; it is not the embedded representative desktop.'],
    ['A standalone workspace session embedded by copying its browser URL', 'Incorrect: the documented integration uses the conversation widget URL and host CRM setup, not an arbitrary workspace session URL.'],
  ], 1, ['Use representative embedded experience', 'Host integration still needs setup'], ['embedded', 'architecture'], [3], 1),
  mcq(14, 'Applied', 'A requirement says “show the Copilot case summary inline on cases.” Which product column supports that exact feature in the checked comparison?', [
    ['Contact Center standalone only', 'Incorrect: the standalone column marks inline case summaries as unavailable.'],
    ['Contact Center embedded only', 'Incorrect: embedded non-Microsoft CRM case summarization is a different row; inline summaries on cases are marked unavailable here.'],
    ['All three experiences because each has conversation summaries', 'Incorrect: conversation summaries and inline case summaries are different capabilities.'],
    ['Dynamics 365 Customer Service', 'Correct: the comparison marks this specific inline case-summary feature Yes for Customer Service and No for both Contact Center experiences.'],
  ], 3, ['Match the exact feature row', 'Do not substitute conversation summaries'], ['copilot', 'product-boundaries'], [6], 1),
  mcq(15, 'Applied', 'An embedded CRM design requires Copilot email assist inside the email editor. Which assessment matches the checked feature matrix?', [
    ['Embedded supports help-pane email drafting, but not this email-editor assist feature', 'Correct: the comparison distinguishes the help pane from the editor and marks email-editor assist No for embedded.'],
    ['Every form of Copilot email drafting is unavailable in embedded', 'Incorrect: help-pane email drafting is listed as available.'],
    ['Email-editor assist is available wherever help-pane drafting is available', 'Incorrect: the matrix explicitly gives these features different availability.'],
    ['Email-editor assist is embedded-only', 'Incorrect: the matrix lists it for Customer Service and standalone, not embedded.'],
  ], 0, ['Help pane and editor are separate features'], ['copilot', 'email', 'embedded'], [6], 1),
  mcq(16, 'Foundation', 'Which Copilot capability is explicitly listed across Customer Service, Contact Center standalone, and Contact Center embedded?', [
    ['View custom record summaries', 'Incorrect: the comparison lists custom record summaries only for Customer Service.'],
    ['Copilot analytics', 'Incorrect: the embedded experience is marked No for Copilot analytics.'],
    ['Generate conversation summaries', 'Correct: all three product-experience columns are marked Yes for conversation summaries. Availability still requires the applicable configuration and prerequisites.'],
    ['Customize data used for case summaries', 'Incorrect: that case-specific feature is listed only for Customer Service.'],
  ], 2, ['Conversation summaries span all three', 'Availability is not automatic enablement'], ['copilot', 'feature-availability'], [6], 1),
  mcq(17, 'Applied', 'An old implementation guide starts by provisioning Omnichannel through the legacy Power Platform admin center flow. What should a new plan use instead?', [
    ['The same legacy flow because it appears in an older screenshot', 'Incorrect: the Customer Service deprecation notice explicitly retires that provisioning experience.'],
    ['The channel provisioning experience in Copilot Service admin center', 'Correct: the deprecation notice directs new provisioning to this experience; Power Platform admin center still has other administration responsibilities.'],
    ['Representative workspace personalization', 'Incorrect: runtime personalization does not provision channel services.'],
    ['A queue import as a replacement for provisioning', 'Incorrect: routing configuration cannot replace enabling the required channel services.'],
  ], 1, ['Use current channel provisioning', 'Do not retire all Power Platform administration by implication'], ['deprecations', 'administration'], [10, 7], 3),
  mcq(18, 'Foundation', 'The Contact Center hub links to a setup article under /customer-service/. What is the sound way to decide whether to use it?', [
    ['Reject it because the path is not /contact-center/', 'Incorrect: the Contact Center hub intentionally links shared setup documentation.'],
    ['Rewrite the URL to /contact-center/ and assume the contents are identical', 'Incorrect: guessed paths need not exist, and rewriting a URL does not establish applicability.'],
    ['Assume every feature on that page is licensed in standalone Contact Center', 'Incorrect: shared documentation can still contain product-specific scope and licensing conditions.'],
    ['Follow the hub link and read the page’s applicability and prerequisites', 'Correct: the official hub is a supported entry point into shared Customer Service documentation, but page-specific boundaries still matter.'],
  ], 3, ['Follow official links', 'Check page-level applicability'], ['documentation', 'product-boundaries'], [12, 9], 3),
  mcq(19, 'Applied', 'A stakeholder sees that a region supports Contact Center digital channels and concludes voice is supported there too. What is the appropriate planning response?', [
    ['Check the voice column independently before approving the voice design', 'Correct: the geographic table has separate digital and voice columns, including regions where the answers differ.'],
    ['Approve because tenant geography affects only chat', 'Incorrect: the table explicitly covers voice as well as digital availability.'],
    ['Approve if a representative has a supported browser', 'Incorrect: browser support does not establish service availability in a geography.'],
    ['Reject all channels in that region until voice is present', 'Incorrect: digital support can exist without voice support; assess each required channel separately.'],
  ], 0, ['Check channel-specific geography', 'Do not infer voice from digital'], ['availability', 'planning'], [5], 2),
  mcq(20, 'Advanced', 'On 2026-10-09, a checklist claims forecasting was already removed on 2026-10-30. Which correction is justified by the deprecation notice?', [
    ['Replace the date with the effort-estimation removal date', 'Incorrect: effort estimation is a different feature with a different retirement schedule.'],
    ['Delete the transition from the plan because a future date is irrelevant', 'Incorrect: upcoming removal is a reason to plan a replacement, not ignore it.'],
    ['Describe October 30 as the upcoming support-end/deprecation milestone, not a past removal', 'Correct: October 30 is later than the verification date. Preserve that temporal distinction and follow the notice’s workforce engagement management recommendation.'],
    ['Treat all forecasting capabilities, including the recommended replacement, as retired', 'Incorrect: the notice recommends workforce engagement management forecast scenarios; it does not retire every forecasting capability.'],
  ], 2, ['Compare notice date with verification date', 'Do not broaden the deprecated feature'], ['deprecations', 'content-freshness'], [10, 11], 3),
];

export const foundations: { topic: Topic; cards: Card[]; notes: Note[]; sources: Source[] } = { topic, cards, notes, sources };