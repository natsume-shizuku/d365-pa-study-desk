import type { Card, Difficulty, Note, Pack, Topic } from '../domain';

const GUIDE_ID = 'ab250-study-guide';
const CERT_ID = 'ab250-certification';

const topics: Topic[] = [
  { id: 'ab250-deploy', title: 'Deploy Dynamics 365 Contact Center (15–20%)', description: 'Deployment modes, workspace configuration, connectors, ALM, environments, users, roles, and capacity profiles.' },
  { id: 'ab250-channels', title: 'Implement channels (30–35%)', description: 'Chat, digital, voice, channel features, proactive engagement, workforce management, and implementation design.' },
  { id: 'ab250-ai', title: 'Configure agents and AI capabilities (10–15%)', description: 'Copilot assistance, knowledge grounding, voice agents, orchestration, security, recording, transfers, and multilingual IVR.' },
  { id: 'ab250-routing', title: 'Configure work distribution (10–15%)', description: 'Queues, assignment, workstreams, classification, skills, intent, preferred representatives, records, and diagnostics.' },
  { id: 'ab250-representative', title: 'Configure the representative experience (15–20%)', description: 'Experience profiles, templates, inbox, productivity tools, scripts, macros, Teams collaboration, and knowledge.' },
  { id: 'ab250-analytics', title: 'Manage Contact Center analytics (10–15%)', description: 'Supervisor configuration, quality evaluation, operational actions, Power BI customization, diagnostics, and telemetry.' },
];

const topicMap: Record<string, string> = {
  'cc-foundations': 'ab250-deploy',
  'cc-setup': 'ab250-deploy',
  'cc-implementation': 'ab250-deploy',
  'cc-voice': 'ab250-channels',
  'cc-telephony': 'ab250-channels',
  'cc-digital': 'ab250-channels',
  'cc-routing': 'ab250-routing',
  'cc-experience': 'ab250-representative',
  'cc-operations': 'ab250-analytics',
};

const notes: Note[] = [
  {
    id: 'ab250-blueprint-deploy', topicId: 'ab250-deploy', title: 'AB-250 deployment blueprint',
    summary: 'Use the official skills list to connect deployment decisions with environment, user, and lifecycle responsibilities.',
    sections: [
      { heading: 'Implementation focus', bullets: ['Know the workspace and embedded deployment choices.', 'Review connectors, third-party CCaaS integration, journey simulation, proactive health investigation, and transformation tooling.'] },
      { heading: 'Operational focus', bullets: ['Understand Agent hub rollout, solutions, ALM, and omnichannel environment administration.', 'Practice user settings, account creation, security roles and personas, and capacity profiles.'] },
    ], tags: ['ab-250', 'exam-blueprint', 'deployment'], sourceIds: [GUIDE_ID],
  },
  {
    id: 'ab250-blueprint-channels', topicId: 'ab250-channels', title: 'AB-250 channels blueprint',
    summary: 'Channels carry the largest published weighting, spanning chat, messaging, voice, shared channel behavior, proactive outreach, and workforce management.',
    sections: [
      { heading: 'Channel implementation', bullets: ['Practice chat, record-based, digital, embedded widget, authentication, mobile messaging, custom messaging, translation, and customer settings.', 'Review voice provisioning, phone numbers, calling profiles, recording, transcription, translation, feedback, and CCaaS SDK scenarios.'] },
      { heading: 'Cross-channel design', bullets: ['Cover context, identification, conversation closure, consult and transfer, masking, presence, messages, timelines, attachments, and conversation management.', 'Include proactive campaigns, dialing modes, dashboards, forecasting, scheduling, WFM integration, setup design, AI practices, and total cost of ownership.'] },
    ], tags: ['ab-250', 'exam-blueprint', 'channels'], sourceIds: [GUIDE_ID],
  },
  {
    id: 'ab250-blueprint-ai', topicId: 'ab250-ai', title: 'AB-250 agents and AI blueprint',
    summary: 'This domain separates representative assistance from customer-facing voice agents and tests how AI is grounded, extended, secured, and evaluated.',
    sections: [
      { heading: 'Representative assistance', bullets: ['Review summaries, Ask a question, knowledge grounding, prompt plugins and tools, Copilot analytics, and smart assist bots.', 'Treat analytics as part of validating and improving an AI-assisted experience.'] },
      { heading: 'Voice agents', bullets: ['Compare generative and classic orchestration and understand variable handling in Copilot Studio.', 'Review voice security, compliant recording, SIP header transfers, Real-time Speech, DTMF, NLU, speech IVR, triggers, multilingual design, and implementation practices.'] },
    ], tags: ['ab-250', 'exam-blueprint', 'agents', 'ai'], sourceIds: [GUIDE_ID],
  },
  {
    id: 'ab250-blueprint-routing', topicId: 'ab250-routing', title: 'AB-250 work distribution blueprint',
    summary: 'The routing domain combines queue administration with basic and unified routing configuration and diagnostics.',
    sections: [
      { heading: 'Queues', bullets: ['Practice queue creation, prioritization, overflow, fallback, assignment methods, and operating hours.'] },
      { heading: 'Routing', bullets: ['Cover workstreams, context and Copilot Studio agent association, classification, engagement agents, skills, AI skills, intent, preferred representatives, records, and basic rule sets.', 'Use conversation diagnostics to investigate unified routing behavior.'] },
    ], tags: ['ab-250', 'exam-blueprint', 'routing'], sourceIds: [GUIDE_ID],
  },
  {
    id: 'ab250-blueprint-representative', topicId: 'ab250-representative', title: 'AB-250 representative experience blueprint',
    summary: 'This domain joins app-profile configuration, productivity extensions, collaboration, and knowledge administration.',
    sections: [
      { heading: 'Workspace configuration', bullets: ['Review experience profiles, application tabs, inbox views, sessions, and notification templates.', 'Practice productivity panels, scripts and slugs, macros, Teams collaboration, and the app profile and Omnichannel JavaScript APIs.'] },
      { heading: 'Knowledge', bullets: ['Cover internal and external search, knowledge-enabled tables, the Customer Knowledge Management agent, and portal integration.'] },
    ], tags: ['ab-250', 'exam-blueprint', 'representative-experience'], sourceIds: [GUIDE_ID],
  },
  {
    id: 'ab250-blueprint-analytics', topicId: 'ab250-analytics', title: 'AB-250 analytics blueprint',
    summary: 'Analytics objectives cover both the supervisor operating experience and extension of reports, diagnostics, and telemetry.',
    sections: [
      { heading: 'Supervisor experience', bullets: ['Review supervisor settings, Quality Evaluation agent configuration, analytics access, conversation actions, and the supervisor app.'] },
      { heading: 'Reporting and diagnostics', bullets: ['Practice KPI customization and embedding reports in Copilot Service workspace.', 'Understand Power BI and Power BI Desktop extension paths plus Application Insights conversation diagnostics, telemetry, and embedding.'] },
    ], tags: ['ab-250', 'exam-blueprint', 'analytics'], sourceIds: [GUIDE_ID],
  },
];

function recall(id: string, topicId: string, noteId: string, prompt: string, answer: string, checkpoints: string[], difficulty: Difficulty = 'Foundation'): Card {
  return { id, topicId, revision: 1, kind: 'recall', difficulty, prompt, answer, checkpoints, tags: ['ab-250', 'exam-blueprint'], sourceIds: [GUIDE_ID], noteIds: [noteId] };
}

function mcq(id: string, topicId: string, noteId: string, prompt: string, correct: number, choices: [string, string, string, string], rationales: [string, string, string, string], difficulty: Difficulty = 'Applied'): Card {
  const options = choices.map((text, index) => ({ id: `${id}-option-${index + 1}`, text, rationale: rationales[index] }));
  return { id, topicId, revision: 1, kind: 'mcq', difficulty, prompt, answer: choices[correct], checkpoints: [rationales[correct]], tags: ['ab-250', 'exam-blueprint'], sourceIds: [GUIDE_ID], noteIds: [noteId], options, correctOptionId: options[correct].id };
}

const blueprintCards: Card[] = [
  recall('ab250-deploy-001', 'ab250-deploy', 'ab250-blueprint-deploy', 'What three responsibility groups anchor the AB-250 deployment domain?', 'Implementation, deployment lifecycle, and user administration.', ['Implementation includes workspace modes, connectors, simulation, health investigation, and transformation.', 'Deployment includes Agent hub, solutions, ALM, and omnichannel environment management.', 'User administration includes settings, accounts, roles, personas, and capacity profiles.']),
  mcq('ab250-deploy-002', 'ab250-deploy', 'ab250-blueprint-deploy', 'A team is planning repeatable promotion of Contact Center configuration between environments. Which AB-250 deployment objective is the closest match?', 1, ['Configure a proactive outbound dashboard', 'Configure solutions and application lifecycle management', 'Configure preferred representative routing', 'Customize a real-time analytics report'], ['Outbound dashboards belong to channel implementation.', 'Solutions and ALM govern repeatable deployment and promotion.', 'Preferred representative routing belongs to work distribution.', 'Report customization belongs to analytics.']),
  recall('ab250-channels-001', 'ab250-channels', 'ab250-blueprint-channels', 'Why should channel study receive the largest share of an AB-250 study plan?', 'Microsoft assigns Implement channels 30–35%, the largest published domain weighting.', ['The domain includes chat and digital channels.', 'It includes voice provisioning and management.', 'It also includes shared channel features, proactive engagement, and workforce management.']),
  mcq('ab250-channels-002', 'ab250-channels', 'ab250-blueprint-channels', 'Which capability is explicitly grouped under channel features in the AB-250 guide?', 2, ['Create custom security roles', 'Configure the Quality Evaluation agent', 'Configure proactive outbound campaigns and dialing methods', 'Create experience profiles'], ['Security roles belong to deployment and user management.', 'Quality Evaluation belongs to analytics and supervisor experience.', 'Proactive campaigns, triggers, dialing, and dashboards are channel features.', 'Experience profiles belong to representative experience.']),
  recall('ab250-ai-001', 'ab250-ai', 'ab250-blueprint-ai', 'What are the two major parts of the AB-250 agents and AI domain?', 'Agent-assist capabilities in Dynamics 365 Contact Center and voice agents.', ['Agent assist covers Copilot guidance, grounding, extension, analytics, and smart assist.', 'Voice agents cover orchestration, security, recording, transfers, speech and keypad interaction, triggers, and multilingual design.']),
  mcq('ab250-ai-002', 'ab250-ai', 'ab250-blueprint-ai', 'A solution architect needs to extend Copilot assistance with custom actions. Which objective is directly relevant?', 1, ['Configure queue overflow', 'Extend Copilot with prompt plugins and tools', 'Create notification templates', 'Embed a Power BI report'], ['Overflow is work distribution.', 'Prompt plugins and tools are listed under agent-assist capabilities.', 'Notification templates belong to representative experience.', 'Power BI embedding belongs to analytics.']),
  recall('ab250-ai-003', 'ab250-ai', 'ab250-blueprint-ai', 'Which interaction modes should you compare when designing an AB-250 voice-agent IVR?', 'DTMF keypad input, natural language understanding, and speech-based IVR, using generative AI or classic orchestration as appropriate.', ['Variables and triggers are configured in Copilot Studio.', 'Security, compliant recording, SIP header transfers, and multilingual behavior are part of the design.', 'The guide also names the Real-time Speech agent.'], 'Applied'),
  mcq('ab250-ai-004', 'ab250-ai', 'ab250-blueprint-ai', 'A voice agent must preserve compliance while handing a call to another endpoint. Which pair of objectives should be reviewed together?', 3, ['Knowledge search and queue prioritization', 'Forecasting and operating hours', 'Inbox views and KPI customization', 'Compliant call recording and SIP header transfers'], ['These belong to different non-voice domains.', 'These are workforce and routing concerns.', 'These are representative and analytics concerns.', 'Both capabilities are named voice-agent objectives and can affect a compliant transfer design.'], 'Advanced'),
  recall('ab250-routing-001', 'ab250-routing', 'ab250-blueprint-routing', 'What is the AB-250 distinction between queue configuration and routing configuration?', 'Queues define destinations and operational behavior; routing determines how work is classified, matched, assigned, and diagnosed.', ['Queue topics include priority, overflow, fallback, assignment methods, and hours.', 'Routing topics include workstreams, classification, skills, intent, preferred representatives, records, and diagnostics.']),
  mcq('ab250-routing-002', 'ab250-routing', 'ab250-blueprint-routing', 'A conversation reaches the wrong representative despite apparently correct queue membership. Which listed objective supports investigation?', 0, ['Diagnose unified routing with conversation diagnostics', 'Customize KPIs with the embedded Power BI editor', 'Configure a chat widget', 'Manage Agent hub rollout'], ['Conversation diagnostics is the routing-focused investigation objective.', 'KPI customization is analytics.', 'Chat widgets are channels.', 'Agent hub rollout is deployment.']),
  recall('ab250-representative-001', 'ab250-representative', 'ab250-blueprint-representative', 'What three areas make up the AB-250 representative-experience domain?', 'Experience profiles, productivity tools, and knowledge management.', ['Profiles include tab, inbox, session, and notification templates.', 'Productivity includes panels, scripts, macros, Teams, and extension APIs.', 'Knowledge includes internal and external sources, tables, agents, and portals.']),
  mcq('ab250-representative-002', 'ab250-representative', 'ab250-blueprint-representative', 'A team wants reusable guided steps with dynamic placeholders for representatives. Which objective is the closest match?', 2, ['Configure intent-based routing', 'Configure conversation diagnostics', 'Configure scripts, including slugs', 'Configure compliant recording'], ['Intent routing is work distribution.', 'Diagnostics is routing or analytics depending on the scenario.', 'Scripts and slugs are representative productivity tools.', 'Compliant recording is a voice-agent concern.']),
  recall('ab250-analytics-001', 'ab250-analytics', 'ab250-blueprint-analytics', 'What two perspectives should an AB-250 analytics study plan cover?', 'The supervisor operating experience and customization or extension of analytics, reporting, diagnostics, and telemetry.', ['Supervisor objectives include settings, quality evaluation, access, actions, and the app.', 'Extension objectives include Power BI, Application Insights, diagnostics, and telemetry.']),
  mcq('ab250-analytics-002', 'ab250-analytics', 'ab250-blueprint-analytics', 'Which tool is explicitly associated with conversation diagnostics and telemetry in the AB-250 analytics domain?', 3, ['Agent hub', 'Messaging SDK', 'App profile manager', 'Application Insights'], ['Agent hub is used for agent rollout.', 'Messaging SDK supports mobile channel experiences.', 'App profile manager extends the representative experience.', 'Application Insights is named for conversation diagnostics and telemetry.']),
];

export function createAb250Pack(base: Pack): Pack {
  const mappedCards = base.cards.map(card => ({ ...card, topicId: topicMap[card.topicId] }));
  const mappedNotes = base.notes.map(note => ({ ...note, topicId: topicMap[note.topicId] }));
  return {
    id: 'ab-250-contact-center-ai-engineer',
    title: 'AB-250: Contact Center AI Engineer',
    description: 'Certification-focused study aligned to Microsoft’s six AB-250 skills-measured domains, with sourced implementation practice and exam-blueprint review.',
    version: '1.0.0',
    topics,
    cards: [...mappedCards, ...blueprintCards],
    notes: [...mappedNotes, ...notes],
    sources: [...base.sources,
      { id: GUIDE_ID, title: 'Study guide for Exam AB-250: Transforming Contact Center Experiences with AI in Dynamics 365', url: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-250', verified: '2026-10-13', publisher: 'Microsoft Learn' },
      { id: CERT_ID, title: 'Microsoft Certified: Dynamics 365 Contact Center AI Engineer Associate', url: 'https://learn.microsoft.com/en-us/credentials/certifications/d365-contact-center-ai-engineer-associate/', verified: '2026-10-13', publisher: 'Microsoft Learn' },
    ],
  };
}