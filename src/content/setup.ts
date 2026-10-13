import type { Card, Note, Source, Topic } from '../domain';

const topic: Topic = {
  id: 'cc-setup', title: 'Provisioning, security, and representative setup',
  description: 'Enable channels, separate licenses from privileges, configure real representative accounts, and verify embedded and restored environments.',
};
const sid = (n: number) => `${topic.id}-src-${String(n).padStart(2, '0')}`;
const nid = (n: number) => `${topic.id}-note-${String(n).padStart(2, '0')}`;
const cid = (n: number) => `${topic.id}-${String(n).padStart(3, '0')}`;
const source = (n: number, title: string, url: string): Source => ({ id: sid(n), title, url, verified: '2026-10-09', publisher: 'Microsoft Learn' });
const sources: Source[] = [
  source(1, 'Provision channels in Dynamics 365 Contact Center', 'https://learn.microsoft.com/en-us/dynamics365/contact-center/implement/provision-channels'),
  source(2, 'System requirements for Dynamics 365 Contact Center', 'https://learn.microsoft.com/en-us/dynamics365/contact-center/implement/system-requirements-contact-center'),
  source(3, 'Assign roles and enable users', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/implement/add-users-assign-roles'),
  source(4, 'Personas and privileges', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/implement/persona-privilege-mapping'),
  source(5, 'Manage personas and custom security roles in Customer Service', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/role-persona-mapping'),
  source(6, 'Use the enhanced experience to manage users', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/users-user-profiles'),
  source(7, 'Manage unified routing for Customer Service', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/provision-unified-routing'),
  source(8, 'Set up the embedded experience in Salesforce', 'https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/set-up-embedded-experience'),
  source(9, 'Set up the embedded experience in ServiceNow', 'https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/set-up-embedded-experience-servicenow'),
  source(10, 'Manage Dynamics 365 Contact Center environments', 'https://learn.microsoft.com/en-us/dynamics365/contact-center/implement/restore-environment'),
  source(11, 'Install the voice channel', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/voice-channel-install'),
  source(12, 'Set up skills, create a rating model, and assign representatives', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/setup-skills-assign-agents'),
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
    id: nid(1), topicId: topic.id, title: 'Provision deliberately and verify completion',
    summary: 'The channel checkbox is the start of provisioning, not proof of readiness. Use an authorized setup account and inspect completion or failure details.',
    sections: [
      { heading: 'Checklist', bullets: [
        'Confirm licensing and system requirements. Channel provisioning requires the Dynamics 365 System Administrator role on the root business unit.',
        'In Copilot Service admin center, open Customer support > Channels > Manage channels, select the required channels, and save.',
        'Provisioning runs in the background and can take several minutes. Refresh to confirm completion; select a failure message to inspect details rather than treating Save as success.',
        'For voice installation, follow channel provisioning, enable Add voice, accept the Voice and SMS Terms, and save. This is channel enablement, not a standalone ACS setup procedure.',
        'For Customer Service-only record routing, verify the separate unified-routing enablement prerequisites, including root-business-unit System Administrator, the documented administrator and CSR roles, and Read-Write CAL access.',
      ] },
      { heading: 'Gotchas', bullets: [
        'Disabled channel checkboxes can mean missing licenses. In a trial, already-enabled channels are also grayed out; establish which situation applies.',
        'Turning off all channels invalidates previous configurations for newly enabled channels; plan reconfiguration before making that change.',
        'Missing or outdated omnichannel solution messages during unified-routing enablement direct you to Microsoft Support. Rewriting routing rules does not install missing services.',
      ] },
    ], tags: ['provisioning', 'licensing', 'environment'], sourceIds: [1, 2, 7, 11].map(sid),
  },
  {
    id: nid(2), topicId: topic.id, title: 'Build a least-privilege access model',
    summary: 'Licensing, security roles, persona mapping, app access, and column security solve different problems.',
    sections: [
      { heading: 'Role checklist', bullets: [
        'Provide Basic User plus the task-appropriate Omnichannel role. Representatives need Omnichannel agent; supervisors need Omnichannel supervisor. Working with cases also requires Customer Service Representative.',
        'Do not assign Omnichannel API access to representative or supervisor users. Productivity and app-profile capabilities have their own documented roles.',
        'Use Microsoft Entra security-group-backed teams for group-managed role inheritance where appropriate. Roles used for role-to-persona mapping must instead be assigned directly to users.',
      ] },
      { heading: 'Custom-role checklist', bullets: [
        'Copy a suitable built-in role, retain the required prvAgent, prvSupervisor, or prvAdmin privilege, and review table access levels using the persona privilege reference.',
        'Map the custom role to the intended persona, grant the role access to the app, and separately enable required forms and dashboards. Mapping alone does not grant those surfaces.',
        'Review secure-column permissions for configuration secrets. A column security profile may need read, create, and update permissions for the task.',
      ] },
      { heading: 'Gotchas', bullets: [
        'The privilege reference includes tables that depend on the provisioned channels. Configure privileges for tables present in the environment; do not assume every listed entity exists.',
        'Custom plug-ins and workflows may need additional privileges. Test the real custom-role account instead of accepting a System Administrator-only success.',
        'Some role documentation still references older dashboards or channels. Use its security guidance without adopting obsolete feature setup paths.',
      ] },
    ], tags: ['security', 'roles', 'personas', 'least-privilege'], sourceIds: [3, 4, 5].map(sid),
  },
  {
    id: nid(3), topicId: topic.id, title: 'Make a representative operational, not merely licensed',
    summary: 'A usable account also needs routing attributes, resource configuration, supported browser behavior, and a tested workstation.',
    sections: [
      { heading: 'Checklist', bullets: [
        'Verify the representative’s roles, resource setup, queue membership, skills with proficiency, and capacity configuration.',
        'Classic skills setup explicitly creates a bookable resource. The new Skills hub does not require that separate manual step; do not create duplicate resources blindly.',
        'Create skills, queues, and capacity profiles before bulk assigning them in Enhanced user management. Assign a deliberate default presence for sign-in.',
        'Validate the supported browser, authentication cookies, microphone and speakers, and network bandwidth on the actual workstation.',
        'For a user calendar, confirm Universal Resource Scheduling availability and configure the bookable resource work hours; a saved schedule alone is not evidence that every assignment method checks it.',
      ] },
      { heading: 'Gotchas', bullets: [
        'The documented voice minimum is 4 Mbps upload and 8 Mbps download; the recommendation is 8 Mbps upload and 16 Mbps download. Treat these as readiness thresholds, not a call-quality guarantee.',
        'Third-party cookies are required for authentication and presence. A supported browser with restrictive cookie policy can still malfunction.',
        'Corporate URL filtering must allow the documented service endpoints and relevant geographic endpoints. Loading the app shell alone does not validate real-time connectivity.',
      ] },
    ], tags: ['representatives', 'readiness', 'resources', 'network'], sourceIds: [2, 3, 6, 12].map(sid),
  },
  {
    id: nid(4), topicId: topic.id, title: 'Embedded integration and environment recovery',
    summary: 'Host CRM setup and post-restore service enablement remain required even if configuration records exist.',
    sections: [
      { heading: 'Embedded checklist', bullets: [
        'Provision omnichannel capabilities and meet Contact Center plus host CRM requirements before embedding.',
        'Find the widget URL in Copilot Service admin center: open Your default contact center, then Conversation widget > Integration into third-party systems.',
        'For Salesforce, use a Salesforce System Administrator, update the call center definition CTI Adapter URL, import it, add call center users, and configure the Open CTI Softphone utility.',
        'For ServiceNow, use a ServiceNow System Administrator and install OpenFrame; create an OpenFrame configuration using the widget URL.',
      ] },
      { heading: 'Recovery checklist', bullets: [
        'After an environment reset, restore, or tenant-to-tenant migration, provision channels or enable unified routing again as appropriate.',
        'For a geographic move, review the new organization URL and re-embed the updated customer chat widget. Validate channel-specific post-move requirements separately.',
      ] },
      { heading: 'Gotchas', bullets: [
        'A Dynamics administrator role is not the same as a System Administrator account in Salesforce or ServiceNow.',
        'Restored records do not prove that external channel services are ready. Include provisioning and a real interaction test in the recovery acceptance checklist.',
        'Voice architecture and telephony migration are outside this setup topic; do not reuse legacy ACS webhook instructions without checking the current supported voice path.',
      ] },
    ], tags: ['embedded', 'salesforce', 'servicenow', 'recovery'], sourceIds: [8, 9, 10].map(sid),
  },
];

const cards: Card[] = [
  recall(1, 'Foundation', 'Which Dynamics security role and business-unit scope are prerequisites for the account provisioning Contact Center channels?',
    'The provisioning article requires the Dynamics 365 System Administrator role on the organization’s root business unit. Use that authorized setup account; an Omnichannel agent account or a role on an unrelated scope is not the documented provisioning prerequisite.',
    ['System Administrator', 'Root business unit'], ['provisioning', 'security'], [1], 1),
  recall(2, 'Applied', 'How should you investigate a grayed-out channel checkbox before changing security roles?',
    'Establish whether it is a production licensing restriction or a trial with channels already enabled. The provisioning page says missing channel licenses disable the corresponding checkboxes and that trial channels are grayed out because they are enabled out of the box. Do not assume one cause from the visual state alone.',
    ['Check licensing', 'Check whether trial channels are already enabled'], ['licensing', 'troubleshooting'], [1], 1),
  recall(3, 'Applied', 'After saving selected channels in Copilot Service admin center, what confirms that provisioning actually succeeded?',
    'Wait for the background setup to complete and refresh or revisit the page to verify the enabled channels appear. If setup fails, select the displayed error message for details. Saving the selection is not the same as completing the asynchronous provisioning operation.',
    ['Background operation', 'Verify completion', 'Inspect failure details'], ['provisioning', 'validation'], [1], 1),
  recall(4, 'Applied', 'What configuration risk must be planned before turning off every provisioned channel?',
    'The provisioning documentation warns that, after all channels are turned off, newly enabled channels need reconfiguration because previous configurations will not work. Treat this as a consequential service change, not a harmless toggle to troubleshoot one conversation.',
    ['All-channels-off warning', 'Reconfiguration is required'], ['provisioning', 'change-management'], [1], 1),
  recall(5, 'Applied', 'Presence fails even though a representative can open the app in a supported browser. Which browser policy is a documented dependency?',
    'Check whether third-party cookies are blocked. Contact Center uses them for authentication, and the system-requirements page specifically warns that blocking them can affect representative or supervisor presence. Verify policy in the actual browser mode rather than just the browser name.',
    ['Third-party cookies', 'Authentication and presence dependency'], ['browsers', 'presence', 'troubleshooting'], [2], 3),
  recall(6, 'Applied', 'What should a network-readiness review check when a corporate URL filter allows the Dynamics app but conversations fail?',
    'Review the full Contact Center allowlist, including real-time, authentication, and geographic service endpoints, not only the organization URL. The documentation also gives a separate customer chat-widget allowlist. App-shell access does not prove that conversation services are reachable.',
    ['Service endpoint allowlist', 'Geo endpoints', 'Customer and representative paths differ'], ['network', 'readiness'], [2], 3),
  recall(7, 'Foundation', 'What workstation and bandwidth requirements should be checked for a representative’s voice pilot?',
    'Provide a microphone and speakers and meet the documented minimum hardware requirement of 4 GB RAM. Voice/video bandwidth is at least 4 Mbps upload and 8 Mbps download, with 8 Mbps upload and 16 Mbps download recommended. Validate real call quality too; these figures alone are not a performance guarantee.',
    ['Microphone and speakers', 'Minimum 4 GB RAM', '4/8 Mbps minimum; 8/16 recommended'], ['voice', 'hardware', 'network'], [2], 3),
  recall(8, 'Foundation', 'Which role layers does the roles article identify for a human representative who also works with cases?',
    'Basic User is required for Contact Center users, Omnichannel agent enables representative tasks, and Customer Service Representative is required for case work. Add applicable productivity and app-profile roles for those features rather than assuming one representative role grants everything.',
    ['Basic User', 'Omnichannel agent', 'Customer Service Representative for cases'], ['roles', 'representatives'], [3], 2),
  recall(9, 'Foundation', 'Should Omnichannel API access be added to a supervisor or representative to fix ordinary application access?',
    'No. The roles article explicitly says not to assign Omnichannel API access to supervisor or representative users. Diagnose their task-specific roles, privileges, and app access instead of adding an inappropriate API role.',
    ['Do not assign API access role to these users', 'Use task-appropriate access'], ['security', 'roles'], [3], 2),
  recall(10, 'Advanced', 'What must be preserved and configured when replacing a built-in Omnichannel role with a custom persona-mapped role?',
    'Start from an appropriate built-in role, retain the necessary privileges and minimum access levels, and include prvAgent, prvSupervisor, or prvAdmin as appropriate. Map the custom role to the intended persona and assign that mapped role directly to the user. Persona mapping is not a substitute for the underlying privileges.',
    ['Copy suitable role and retain required privileges', 'Correct persona privilege', 'Direct assignment for mapped roles'], ['custom-roles', 'personas'], [5, 4], 2),
  recall(11, 'Applied', 'Why can a user with a correctly mapped custom persona still fail to open an app, form, or dashboard?',
    'Role-to-persona mapping does not automatically grant access to those surfaces. Enable the custom role for the application and for required forms and dashboards, in addition to its table privileges. Test with the actual user rather than a System Administrator account.',
    ['Separate application access', 'Separate forms and dashboards access'], ['app-access', 'custom-roles'], [5], 2),
  recall(12, 'Applied', 'How do bookable resources relate to representative setup, and what differs between classic skills setup and Skills hub?',
    'Unified routing uses bookable-resource configuration for representatives. Classic skills setup explicitly requires adding the user as a bookable resource. The Skills hub documentation says that separate manual creation task is not required in the new hub experience; verify the existing setup rather than creating duplicates.',
    ['Bookable resource supports routing', 'Manual creation differs by setup experience'], ['resources', 'representatives', 'skills'], [6, 12], 3),
  recall(13, 'Applied', 'Before bulk assigning queues, skills, or capacity profiles in Enhanced user management, what must already exist?',
    'The attributes being assigned must already be configured in the system. Create the relevant queues, skills and proficiency setup, and capacity profiles first, then select users and update their attributes. Bulk assignment is not a replacement for defining those routing objects.',
    ['Create attributes first', 'Then bulk associate them with users'], ['user-management', 'bulk-setup'], [6], 3),
  recall(14, 'Advanced', 'An administrator can open channel settings but cannot read or update a secured configuration secret. What security layer should be checked?',
    'Check column-level security. The roles article identifies secure attributes used by configuration features and instructs administrators to create or update a column security profile with the necessary read, create, or update permissions. Table access alone does not establish access to a secured column.',
    ['Column security profile', 'Task-specific read/create/update permissions'], ['column-security', 'configuration'], [3], 2),
  recall(15, 'Foundation', 'What does the voice-channel installation procedure require after entering the channel provisioning flow?',
    'Enable Add voice in the Voice section, select the Voice and SMS Terms checkbox, then save and close. Verify the applicable voice licensing first. This enables the channel; it does not itself configure numbers, a voice workstream, or a complete telephony integration.',
    ['Add voice', 'Voice and SMS Terms', 'Save; channel enablement is not full telephony setup'], ['voice', 'provisioning'], [11], 1),
  mcq(16, 'Advanced', 'A team uses Microsoft Entra group-backed teams for role inheritance and now wants a custom role to drive role-to-persona mapping. Which approach respects both documented mechanisms?', [
    ['Assign the persona-mapped role only to the team', 'Incorrect: the mapping documentation requires the mapped role to be assigned directly to users.'],
    ['Stop using Entra groups anywhere because inherited roles are unsupported', 'Incorrect: group-backed teams are explicitly supported for role-based access; the direct-assignment restriction is specific to persona mapping.'],
    ['Keep group-managed access where appropriate, but directly assign the role used for persona mapping', 'Correct: team inheritance and persona mapping have different requirements; the mapped role must be assigned directly.'],
    ['Replace the mapped role with Omnichannel API access', 'Incorrect: that role is not a persona-mapping workaround and must not be assigned to representative or supervisor users.'],
  ], 2, ['Group role inheritance is supported', 'Mapped roles require direct assignment'], ['security', 'entra', 'personas'], [3, 5], 2),
  mcq(17, 'Applied', 'A supervisor must monitor, assign, and transfer live conversations but should not be given administrator configuration privileges. Which role is intended for that task?', [
    ['Omnichannel supervisor', 'Correct: the roles table assigns monitoring, assignment, and transfer capabilities to the supervisor role. Retain other baseline roles required by the user.'],
    ['Productivity tools administrator', 'Incorrect: that role manages productivity tools and is not the documented supervisor conversation role.'],
    ['App Profile Manager Administrator', 'Incorrect: managing app profiles is different from supervising conversations.'],
    ['Omnichannel API access', 'Incorrect: the documentation explicitly excludes this role from supervisor and representative users.'],
  ], 0, ['Match privileges to supervisor tasks', 'Retain baseline access without blanket admin'], ['roles', 'supervision'], [3], 2),
  mcq(18, 'Applied', 'A representative should sign in with a deliberate starting status rather than the system’s unspecified-default behavior. Where is that preference configured?', [
    ['Only on the queue’s priority field', 'Incorrect: queue priority orders work; it is not the user’s sign-in presence.'],
    ['On the user’s default presence setting', 'Correct: user management defines Default Presence as the status the representative uses when signing in to Copilot Service workspace.'],
    ['By assigning a different proficiency rating', 'Incorrect: proficiency describes skill level, not initial presence.'],
    ['On the CRM connection’s authentication URI', 'Incorrect: the CRM connection does not define the representative’s default presence.'],
  ], 1, ['Default Presence is a user setting'], ['user-management', 'presence'], [6], 3),
  mcq(19, 'Applied', 'A Salesforce administrator is editing the call center definition’s CTI Adapter URL. Which value should be used?', [
    ['The customer chat-widget embed script', 'Incorrect: a customer-facing chat widget is not the representative embedded CTI adapter.'],
    ['The URL of the advanced queue form', 'Incorrect: a queue administration page is not a representative conversation widget.'],
    ['A record URL copied from a representative’s active session', 'Incorrect: the documented integration uses a configured widget URL, not a session-specific record address.'],
    ['The embedded widget URL from Your default contact center > Conversation widget', 'Correct: the Salesforce setup procedure obtains that URL under Integration into third-party systems and places it in the CTI Adapter URL.'],
  ], 3, ['Use documented embedded widget URL', 'Do not confuse customer and representative widgets'], ['salesforce', 'embedded'], [8], 4),
  mcq(20, 'Applied', 'Contact Center is provisioned and a ServiceNow System Administrator has the embedded widget URL. Which host component is also a documented prerequisite?', [
    ['Salesforce Open CTI Softphone', 'Incorrect: that is the Salesforce integration surface, not the ServiceNow prerequisite.'],
    ['A Dynamics Channel Integration Framework provider record instead of a ServiceNow plugin', 'Incorrect: the documented ServiceNow embedding procedure requires the host’s OpenFrame plugin; a Dynamics provider record is not a substitute.'],
    ['The ServiceNow OpenFrame plugin', 'Correct: the ServiceNow instructions require OpenFrame and then create an OpenFrame configuration using the widget URL.'],
    ['A Customer Service case-routing intake rule', 'Incorrect: case intake rules are not the host component that embeds the ServiceNow conversation widget.'],
  ], 2, ['Host-specific OpenFrame prerequisite'], ['servicenow', 'embedded'], [9], 4),
  mcq(21, 'Applied', 'A restored environment contains routing configuration records, but omnichannel service readiness is unverified. Which recovery step is explicitly required by the environment-management article?', [
    ['Provision channels or enable unified routing again, as applicable', 'Correct: this is required after reset, restore, or tenant-to-tenant migration before using omnichannel capabilities.'],
    ['Assume services are ready because the records exist', 'Incorrect: restoring records does not replace the article’s explicit re-enablement step.'],
    ['Assign System Administrator to every representative permanently', 'Incorrect: broad user privileges do not provision channel services.'],
    ['Change every queue to a default queue', 'Incorrect: replacing the queue strategy is not a documented substitute for post-restore service enablement.'],
  ], 0, ['Post-restore service enablement', 'Test beyond record existence'], ['recovery', 'environments'], [10], 4),
  mcq(22, 'Advanced', 'Unified-routing enablement in a Customer Service deployment reports that required omnichannel services are missing or need updating. What does the provisioning guidance direct the administrator to do?', [
    ['Recreate the target advanced queue and retry without resolving the service message', 'Incorrect: recreating a queue does not install or update the omnichannel services identified by the error.'],
    ['Contact Microsoft Support for the missing or outdated service prerequisites', 'Correct: both documented messages explicitly request Microsoft Support; also verify the enablement account’s prerequisite roles and Read-Write access.'],
    ['Create classification rules before enabling the service', 'Incorrect: classification configuration cannot supply a missing omnichannel solution.'],
    ['Ignore the error and treat the Unified routing toggle as enabled', 'Incorrect: the error indicates enablement prerequisites are not satisfied.'],
  ], 1, ['Resolve service prerequisites', 'Do not mask enablement failure with routing changes'], ['unified-routing', 'provisioning', 'troubleshooting'], [7], 1),
  mcq(23, 'Advanced', 'A custom representative role works for standard interactions, but a custom plug-in fails for that user. What does the persona-privilege guidance require?', [
    ['Assume persona mapping grants all plug-in permissions automatically', 'Incorrect: the privilege guidance explicitly requires checking permissions needed by custom plug-ins and workflows.'],
    ['Reprovision every channel before checking privileges', 'Incorrect: a user-specific custom operation failure warrants examining required privileges, not indiscriminate reprovisioning.'],
    ['Remove the plug-in’s business logic without investigating access', 'Incorrect: the documentation identifies required privileges as a configuration concern; it does not require abandoning the customization.'],
    ['Grant the required operation and table privileges at appropriate access levels, then retest as that user', 'Correct: custom plug-ins and workflows need their required privileges in addition to the base persona requirements.'],
  ], 3, ['Custom operations have privilege dependencies', 'Validate with custom-role user'], ['custom-roles', 'privileges', 'troubleshooting'], [4], 2),
  mcq(24, 'Applied', 'A licensed representative can open the app but has not been added to the intended queue or configured for its skills and capacity. What is the best next step?', [
    ['Finish representative routing-attribute setup and test assignment', 'Correct: user management includes queues, skills, proficiency, capacity, and resource setup. Application access alone does not complete assignment readiness.'],
    ['Purchase an unspecified additional license before checking configuration', 'Incorrect: the stated missing configuration is not evidence of a licensing shortfall.'],
    ['Rebuild the Salesforce host integration even though this user is using workspace', 'Incorrect: an unrelated host integration does not supply queue membership or capacity.'],
    ['Remove all required skills to make any user eligible', 'Incorrect: that weakens the service requirement instead of configuring the intended representative correctly.'],
  ], 0, ['Access is not assignment readiness', 'Configure queue, skill, and capacity associations'], ['representatives', 'readiness'], [6], 3),
  mcq(25, 'Applied', 'In classic user setup, an administrator wants to enter work hours for the representative’s bookable resource. Which prerequisite does the user-management article call out?', [
    ['A non-Microsoft CRM OpenFrame plugin', 'Incorrect: that is for an embedded host, not resource work-hour scheduling.'],
    ['A customer chat widget operating-hours record only', 'Incorrect: customer channel operating hours do not provide the resource scheduling capability.'],
    ['Universal Resource Scheduling must be available in the organization', 'Correct: the article requires this capability for bookable-resource work hours and describes its availability through supported Dynamics scheduling applications. Do not infer a SKU entitlement from that dependency.'],
    ['An operating-hours record on every queue as a substitute for resource scheduling', 'Incorrect: queue operating hours govern the queue; they do not supply the capability needed to maintain bookable-resource work hours.'],
  ], 2, ['Resource calendar prerequisite', 'Do not infer licensing entitlement'], ['resources', 'scheduling', 'prerequisites'], [6], 3),
];

export const setup: { topic: Topic; cards: Card[]; notes: Note[]; sources: Source[] } = { topic, cards, notes, sources };