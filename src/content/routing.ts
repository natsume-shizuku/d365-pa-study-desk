import type { Card, Note, Source, Topic } from '../domain';

const topic: Topic = {
  id: 'cc-routing', title: 'Workstreams and unified routing',
  description: 'Trace classification, queue selection, and assignment; design skills, presence, capacity, schedules, and overflow with explicit operational safeguards.',
};
const sid = (n: number) => `${topic.id}-src-${String(n).padStart(2, '0')}`;
const nid = (n: number) => `${topic.id}-note-${String(n).padStart(2, '0')}`;
const cid = (n: number) => `${topic.id}-${String(n).padStart(3, '0')}`;
const source = (n: number, title: string, url: string): Source => ({ id: sid(n), title, url, verified: '2026-10-09', publisher: 'Microsoft Learn' });
const sources: Source[] = [
  source(1, 'Create and manage workstreams', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-workstreams'),
  source(2, 'Configure work classification rulesets for unified routing', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-work-classification'),
  source(3, 'Configure route-to-queues rules for a workstream', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-route-to-queue-rules'),
  source(4, 'Create and manage queues for unified routing', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/queues-omnichannel'),
  source(5, 'Assignment methods in unified routing', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/assignment-methods'),
  source(6, 'Understand how skill match algorithm works in unified routing', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/set-up-skill-based-routing'),
  source(7, 'Set up skills, create a rating model, and assign representatives', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/setup-skills-assign-agents'),
  source(8, 'Use the enhanced experience to manage users', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/users-user-profiles'),
  source(9, 'Configure and manage custom presence', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/presence-custom-presence'),
  source(10, 'Create and manage capacity profiles', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/capacity-profiles'),
  source(11, 'Manage overflow of work items in queues', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/manage-overflow'),
  source(12, 'Create and manage operating hours', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-operating-hours'),
  source(13, 'Deprecations in Customer Service', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/implement/deprecations-customer-service'),
  source(14, 'Configure conversation diagnostics', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-conversation-diagnostics'),
  source(15, 'Use best practices to set up unified routing in Customer Service', 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/unified-routing-best-practices'),
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
    id: nid(1), topicId: topic.id, title: 'Build the routing pipeline in order',
    summary: 'Classification enriches work, route-to-queue chooses its destination, and assignment selects a representative. Troubleshoot those decisions separately.',
    sections: [
      { heading: 'Configuration checklist', bullets: [
        'Choose a Messaging, Record, or Voice workstream. Multiple channels of the same type can share its routing and distribution settings; do not combine unrelated channel types indiscriminately.',
        'Choose Push or Pick at creation; the workstream distribution mode cannot subsequently be edited. Voice workstreams use Push.',
        'Create optional classification rulesets for attributes, skills, and capacity profiles, followed by the workstream’s single route-to-queue ruleset.',
        'Order classification rules carefully: the first matching rule in a ruleset produces its outputs, then evaluation moves to the next ruleset. Later rulesets can consume earlier outputs.',
        'Set up matching-type advanced queues, assignment methods, members, and an explicitly staffed fallback queue.',
      ] },
      { heading: 'Queue-selection decisions', bullets: [
        'Hit-all evaluates matching routes and queue overflow; when multiple matched queues are not overflowing, the first listed match wins. Hit-first stops at the first matching rule regardless of that queue’s overflow state.',
        'Percentage allocation can list up to five queues with allocations totaling 100. Runtime proportions are not guaranteed to be exact in a small sample, and overflow can affect the final destination.',
        'Put reusable static tests, such as a VIP classification, in classification rather than repeating costly conditions during every prioritization cycle.',
      ] },
      { heading: 'Gotchas', bullets: [
        'A successful route-to-queue result is not proof of representative assignment. An item can wait because no representative satisfies the assignment criteria.',
        'Older route-to-queue articles still link to legacy diagnostics. Use the current diagnostics guidance in the troubleshooting note, not those surviving links.',
      ] },
    ], tags: ['workstreams', 'classification', 'route-to-queue'], sourceIds: [1, 2, 3, 4, 5, 13, 15].map(sid),
  },
  {
    id: nid(2), topicId: topic.id, title: 'Queues, ordering, and assignment are different controls',
    summary: 'Advanced queues define the work pool and assignment strategy. Queue priority, item priority, and representative ranking answer different questions.',
    sections: [
      { heading: 'Checklist', bullets: [
        'Create advanced queues by channel type and add the intended users. A chat can route or transfer to a messaging queue, not a record or voice queue.',
        'Use lower numeric queue priorities for higher priority across queues. Within a queue, default ordering is FIFO unless custom prioritization changes it.',
        'Use prioritization rules to order work items and assignment rules to select and rank eligible representatives. Do not edit a route-to-queue rule to solve every assignment problem.',
        'Prefer a built-in assignment method when it meets the requirement. Highest capacity, advanced round robin, and least active have different ranking behavior.',
      ] },
      { heading: 'Assignment details', bullets: [
        'With exact matching, highest capacity ranks eligible representatives by available capacity. With closest matching, skill closeness takes precedence; capacity and allowed presence still gate eligibility.',
        'Advanced round robin maintains ordering per queue. Membership in several queues can produce successive assignments from different queues without violating that rule.',
        'Least active is for voice and messaging, not records. Concurrent conversation workload and last capacity-release time inform the documented examples; it is not a count of lifetime resolved cases.',
        'Custom assignment requires explicit presence and skill criteria and explicit unit-capacity checks. Matching capacity profiles are checked implicitly. Workstream defaults do not supply all custom rule conditions.',
      ] },
      { heading: 'Gotchas', bullets: [
        'Fallback routing for classification errors, route errors, or no matching route bypasses that fallback queue’s overflow settings. Staff it and monitor why items arrive there.',
        'Default system queues are not a substitute for a designed advanced-queue strategy. Microsoft recommends creating advanced queues; newly created fallback queues need members.',
        'For asynchronous conversations, FIFO uses last interaction time; for routed records, it uses routing time. Do not assume every queue orders by original record creation time.',
      ] },
    ], tags: ['advanced-queues', 'assignment', 'prioritization', 'fallback'], sourceIds: [1, 3, 4, 5, 6].map(sid),
  },
  {
    id: nid(3), topicId: topic.id, title: 'Skills and proficiency without accidental underqualification',
    summary: 'A representative skill and a work-item requirement are two sides of the match. Configure both, using consistent rating models.',
    sections: [
      { heading: 'Checklist', bullets: [
        'Define a skill type, such as Language, create skills, and configure proficiency scales with named rating levels.',
        'Assign skills and proficiency to representatives. Separately attach required skills and proficiency to incoming work using classification rules.',
        'Use the same rating model for a given skill on the work item and representative. Do not attach the same skill twice with different rating models.',
        'Choose Exact Match for an all-required-skills threshold or Closest Match when the business accepts qualification trade-offs for faster assignment.',
      ] },
      { heading: 'Matching rules', bullets: [
        'Exact Match accepts proficiency greater than or equal to the requirement, not only equal values. If nobody has all required skills at the required level, work remains unassigned.',
        'Closest Match orders candidates by closeness and can ultimately assign to someone with none of the required skills. It is not a compliance guardrail.',
        'For custom assignment, explicitly author skill conditions or ordering; the workstream’s default skill algorithm applies to built-in methods, not automatically to custom methods.',
      ] },
      { heading: 'Gotchas', bullets: [
        'A deactivated user skill is not considered for matching work that requires it. Displaying an old skill association is not enough to establish eligibility.',
        'On reroute, newly classified skills append to existing work-item skills. Inspect the accumulated requirements instead of assuming the old ones were replaced.',
        'Changing a rating model does not rewrite skill ratings already attached to ongoing conversations or open work items; plan and test that change against existing work.',
      ] },
    ], tags: ['skills', 'proficiency', 'classification'], sourceIds: [2, 5, 6, 7, 8].map(sid),
  },
  {
    id: nid(4), topicId: topic.id, title: 'Presence and capacity are independent eligibility gates',
    summary: 'Available-looking presence does not create capacity. Capacity values do not replace skill requirements or allowed presence checks.',
    sections: [
      { heading: 'Checklist', bullets: [
        'Choose capacity units or capacity profiles consistently; Microsoft recommends not mixing both models in an organization.',
        'With units, align the representative’s budget with the workstream’s cost per item. With profiles, associate representatives and work items with matching profiles.',
        'If classification appends a profile to the default workstream profile, a representative needs available capacity in both; assignment consumes both.',
        'Map custom presence text to the correct base status. Workstream Allowed Presences uses base statuses, not arbitrary custom labels.',
        'Configure wrap-up blocking deliberately and test when capacity is released. Always block, Don’t block, and Custom time produce different behavior.',
      ] },
      { heading: 'Profiles and reset behavior', bullets: [
        'Assignment blocking stops further automatic work, including work using other capacity, when the blocking profile’s limit is reached; the presence becomes Busy-DND.',
        'Immediate and End of day reset modes represent different consumption lifetimes. Changing reset frequency requires recreating the profile.',
        'End of day profiles do not reset merely because a workstream’s custom wrap-up timer expires. Design the two settings together.',
      ] },
      { heading: 'Gotchas', bullets: [
        'Manual pickup or forced assignment can exceed configured capacity and display a negative remaining value. Do not assume automatic matching ignored its rules.',
        'For routed activities such as email, capacity is not automatically released like a resolved case. Review queue-item deactivation or Worked By handling; clearing Worked By can trigger reassignment.',
        'Representative affinity has special reassignment behavior. Test returning-conversation paths separately before treating every assignment as a new ordinary eligibility check.',
      ] },
    ], tags: ['presence', 'capacity', 'wrap-up'], sourceIds: [1, 8, 9, 10].map(sid),
  },
  {
    id: nid(5), topicId: topic.id, title: 'Operating hours and overflow need explicit actions',
    summary: 'Queue hours, channel hours, and representative calendars are distinct. A closed queue is not necessarily a rejected customer interaction.',
    sections: [
      { heading: 'Schedule checklist', bullets: [
        'Create an operating-hours record with the intended recurrence, time zone, and holidays; supported time zones account for daylight saving time.',
        'Attach schedules to the intended queue or channel setting. Without a queue schedule, the queue is considered available around the clock.',
        'Adding queue hours creates an Out of operation hours condition whose default action is Assign to queue anyway. Change the action if that is not the after-hours policy.',
        'If representatives must be on shift, use their resource calendars and a custom assignment rule with Calendar Schedule: Is working. Queue hours are not representative-calendar checks.',
      ] },
      { heading: 'Overflow checklist', bullets: [
        'Before queueing, choose supported conditions such as queue item count, out of operating hours, or voice average wait time. After queueing, use Waiting time in queue exceeds for actual waiting work.',
        'Select actions supported by the channel. External-number transfer, voicemail, and direct callback are voice-specific; do not assume they exist for record queues.',
        'Prequeue checks run once at the routing boundary and do not cascade on an overflow transfer. In-queue wait overflow can be evaluated again in a receiving queue.',
        'When multiple prequeue conditions are true, the operating-hours action takes precedence over the other conditions.',
      ] },
      { heading: 'Gotchas', bullets: [
        'An AI-agent workstream checks prequeue overflow after escalation to a representative, not before the AI agent handles the interaction.',
        'Workstream channel operating hours do not control queue overflow settings. Test both the customer entry surface and the target queue.',
        'Calendar work hours cannot be migrated with ordinary Calendar entity export/import; the operating-hours article requires setting them up manually.',
        'A voice item transferred into a queue by a representative/supervisor or by overflow has restricted in-queue overflow actions: transfer to an external number or another queue.',
      ] },
    ], tags: ['operating-hours', 'overflow', 'calendars'], sourceIds: [4, 5, 11, 12].map(sid),
  },
  {
    id: nid(6), topicId: topic.id, title: 'Diagnose waiting work with current evidence',
    summary: 'Verification date: 2026-10-09. Locate the failing stage and inspect actual eligibility; do not enable removed diagnostic or effort-estimation features.',
    sections: [
      { heading: 'Investigation checklist', bullets: [
        'Confirm the workstream, classification outputs, selected queue, and whether the item is in fallback because of errors or no matching rule.',
        'For a waiting item, check queue membership, active skills and ratings, allowed base presence, remaining capacity, custom rule conditions, and representative calendars where configured.',
        'Check decline history and manual assignment before blaming ranking. Reaching the configured decline limit stops automatic offers of that particular item to that representative, not all future work.',
        'Use classification to compute stable attributes once and simplify repeated prioritization checks. For persistent backlogs, review staffing and bounded overflow or relaxation rules.',
      ] },
      { heading: 'Current diagnostics checklist', bullets: [
        'Use conversation diagnostics in Azure Application Insights. The configuration article requires a Managed environment, suitable Azure setup permissions, Power Platform administrator or System Administrator for export, and read access for querying.',
        'Budget for Azure Monitor ingestion; check cloud restrictions. The article says export is not available in sovereign clouds such as GCC, GCC High, and DoD.',
        'Configure the environment’s data export and inspect lifecycle telemetry in Application Insights. Keep conversation identity consistent when correlating classification, routing, and assignment evidence.',
      ] },
      { heading: 'Gotchas', bullets: [
        'Effort estimation was removed June 2, 2025. Legacy unified-routing diagnostics had a March 31, 2026 removal date. Do not follow stale links that still describe enabling them.',
        'Historical analytics dashboards specifically for unified routing are also retired; that does not mean all Contact Center analytics are retired.',
        'Dynamic prioritization and some conversation-orchestration examples are marked preview in current articles. They are not required assumptions for this topic’s scored routing behavior.',
      ] },
    ], tags: ['troubleshooting', 'diagnostics', 'deprecations'], sourceIds: [4, 5, 8, 10, 13, 14, 15].map(sid),
  },
];

const cards: Card[] = [
  recall(1, 'Foundation', 'What does a workstream contain, and when can multiple channel instances share it?',
    'A workstream is the container for enriching, routing, and assigning incoming work. Multiple channels of the same type, such as multiple chat channels, can share a workstream and inherit its routing and distribution settings. The top-level workstream types are Messaging, Record, and Voice.',
    ['Container for enrichment and routing', 'Shared settings for channels of the same type', 'Messaging, Record, Voice'], ['workstreams', 'design'], [1], 1),
  recall(2, 'Foundation', 'What is the workstream creation-time distinction between Push and Pick, and what restriction applies to voice?',
    'Push automatically routes work to representatives with a notification; Pick requires representatives to explicitly pick work. The work distribution mode cannot be edited after workstream creation, and voice workstreams support Push only. Choose the mode before building dependent configuration.',
    ['Automatic offer versus explicit pickup', 'Mode is immutable after creation', 'Voice uses Push'], ['workstreams', 'distribution'], [1], 1),
  recall(3, 'Foundation', 'Distinguish classification, route-to-queue, and assignment using a Spanish billing conversation.',
    'Classification can label it as billing and attach Spanish proficiency requirements. Route-to-queue chooses the appropriate billing queue using its conditions. The queue’s assignment method then chooses an eligible representative. Identifying a queue does not by itself identify the person who will handle the conversation.',
    ['Enrich work', 'Choose queue', 'Choose eligible representative'], ['classification', 'route-to-queue', 'assignment'], [2, 3, 5], 1),
  recall(4, 'Applied', 'Within a logical classification ruleset, what happens after the first rule whose condition matches?',
    'That rule’s outputs are applied and evaluation moves to the next classification ruleset, if present. Rule items and rulesets are evaluated in their configured order. Do not expect later rules in the same ruleset to add more outputs after an earlier match.',
    ['First matching rule produces outputs', 'Continue with next ruleset'], ['classification', 'rule-order'], [2], 1),
  recall(5, 'Applied', 'Can a later classification ruleset test a priority value set by an earlier ruleset? Explain the design consequence.',
    'Yes. Output values from an earlier classification ruleset are available to later rulesets. For example, an early rule can label priority High and a later ruleset can derive another attribute from it. Order the dependent rulesets deliberately so the value exists before it is tested.',
    ['Earlier outputs feed later rulesets', 'Order dependencies deliberately'], ['classification', 'dependencies'], [2], 1),
  recall(6, 'Foundation', 'How many route-to-queue rulesets can a workstream have, and what happens if no rule matches?',
    'A workstream has one route-to-queue ruleset. It runs after classification and can contain multiple ordered rules. If no route is defined or no rule matches, the incoming work item goes to the workstream’s fallback queue rather than directly to an arbitrary representative.',
    ['One route-to-queue ruleset', 'Multiple rules possible', 'No match uses fallback'], ['route-to-queue', 'fallback'], [3], 1),
  recall(7, 'Advanced', 'For ordinary route-to-queue rules, how do Hit-all and Hit-first differ when more than one rule matches?',
    'Hit-all evaluates matching rules and the corresponding queues’ overflow handling; when several matching queues are not overflowing, the first listed matching queue is selected. Hit-first stops at the first matching rule and honors it regardless of that queue’s overflow state. Rule order therefore remains important under both policies.',
    ['Hit-all considers overflow across matches', 'Hit-first stops at first match', 'Order matters'], ['route-to-queue', 'hit-policy', 'overflow'], [3], 1),
  recall(8, 'Foundation', 'Why might a voice queue be absent when configuring a live-chat route or transfer?',
    'Queues are typed as Messaging, Record, or Voice, and route/transfer targets are constrained by the work’s channel type. Live chat needs a messaging queue. A voice queue is not an interchangeable destination merely because it contains the same representatives.',
    ['Queue type must match work', 'Same members do not override type'], ['advanced-queues', 'channels'], [4], 2),
  recall(9, 'Applied', 'What special protection does a staffed fallback queue provide, and which settings are bypassed on fallback routing?',
    'It receives work when classification fails, route-to-queue processing fails, or no route matches. In those fallback scenarios, overflow settings on the fallback queue are overridden. Add members and an appropriate assignment strategy so the safety net does not become an unattended backlog.',
    ['Errors or no match', 'Fallback overflow bypass', 'Staff the queue'], ['fallback', 'operations'], [4], 2),
  recall(10, 'Foundation', 'For a representative belonging to several queues, what does a smaller Queue priority number mean?',
    'It means higher priority across queues: work from priority 1 is considered ahead of priority 2. This is separate from item prioritization within a queue and from the rules that choose among representatives. Raising a numeric value does not raise that queue’s priority.',
    ['Smaller number means higher priority', 'Across-queue ordering differs from item ordering'], ['queue-priority', 'assignment'], [4, 5], 2),
  recall(11, 'Foundation', 'Does Exact Match require identical proficiency values, or can a representative exceed the required level?',
    'A representative can exceed it. Exact Match requires all required skills with proficiency greater than or equal to the required ratings. If nobody has all required skills at sufficient proficiency, the item remains unassigned in the queue; the algorithm does not automatically relax to a partial match.',
    ['All required skills', 'Proficiency greater than or equal', 'No match means wait'], ['skills', 'exact-match'], [6], 3),
  recall(12, 'Applied', 'What service-quality trade-off must be accepted before using Closest Match?',
    'Closest Match prioritizes finding a nearby skill fit rather than waiting indefinitely for exact qualification. If nobody has the required skills, it can assign a representative with none of them. Do not use it as proof that mandatory language, certification, or specialist requirements will always be met.',
    ['Ranks closeness', 'May select a representative with no required skills', 'Not a mandatory-qualification guard'], ['skills', 'closest-match'], [6], 3),
  recall(13, 'Applied', 'Why must a skill requirement and the representative’s rating for that same skill use a consistent rating model?',
    'The classification documentation warns that different rating models for the same skill on the conversation and representative can make assignment behave unexpectedly. Use the same model for that skill and do not attach it twice with different models. The same numeric value on incompatible scales is not a reliable match.',
    ['Same skill, consistent rating model', 'Avoid duplicate skill with different models'], ['skills', 'rating-models'], [2], 3),
  recall(14, 'Applied', 'What are the two sides of skill-based routing that must be configured after creating skill types and proficiency scales?',
    'Assign skills and proficiency to representatives, and separately attach required skills and proficiency to incoming work through classification. A representative’s skill record alone does not label conversations, and a labeled conversation alone does not create a qualified representative.',
    ['Representative skills and ratings', 'Work-item requirements via classification'], ['skills', 'configuration'], [6, 7], 3),
  recall(15, 'Applied', 'A unit-based workstream consumes 5 units per conversation. What representative capacity supports three concurrent conversations from it, assuming no other work consumes units?',
    'Set a 15-unit capacity budget: three conversations multiplied by five units each. Capacity is an arbitrary configured scale, so use the workstream’s cost rather than treating the numeric budget as a direct conversation count. Other work and eligibility conditions can reduce what is actually assigned.',
    ['3 × 5 = 15 units', 'Budget is not always conversation count'], ['capacity', 'units'], [8], 4),
  recall(16, 'Advanced', 'A workstream attaches a Total profile and classification appends a Specialist profile. Does a representative need capacity in one or both?',
    'Both. Appending a profile does not replace the default workstream profile. Unified routing selects a representative with available capacity in every required profile and consumes capacity from both when the work is assigned. This can enforce a total limit alongside a category-specific limit.',
    ['Profiles are cumulative', 'Available capacity in all required profiles', 'Consume both'], ['capacity-profiles', 'classification'], [10], 4),
  recall(17, 'Applied', 'What does Assignment blocking on a capacity profile do when its work-item limit is reached?',
    'It prevents further automatic work assignment even when other profiles or capacity units have capacity, and sets presence to Busy-DND. This can reserve a representative’s attention for a channel such as voice. It is broader than stopping additional items from just the exhausted profile.',
    ['Blocks other automatic work too', 'Busy-DND at the limit'], ['capacity-profiles', 'assignment-blocking'], [10], 4),
  recall(18, 'Applied', 'How do Immediate and End of day capacity-profile reset modes differ, and can the reset frequency be edited later?',
    'Immediate supports releasing consumption as work is completed; End of day resets after the representative’s shift even if conversations remain open, so those open conversations do not count against the next shift’s limit. To change reset frequency, recreate the profile. End of day is a daily workload policy, not merely a concurrent-session limit.',
    ['Completion-oriented versus shift reset', 'Open work can persist across daily reset', 'Recreate to change frequency'], ['capacity-profiles', 'reset'], [10], 4),
  recall(19, 'Applied', 'A custom presence says “Ready for work” but is mapped to Offline. Which value governs ordinary workstream eligibility?',
    'The mapped base status governs it, so it is treated as Offline. Allowed Presences in a workstream selects base statuses, not the custom display text. Align custom labels with their base status; a reassuring label does not make a representative available.',
    ['Base status determines eligibility', 'Display text is not an eligibility rule'], ['presence', 'custom-presence'], [9], 4),
  recall(20, 'Advanced', 'How do the workstream wrap-up capacity options differ, and what is the End of day profile exception?',
    'Always block retains consumption until conversation closure; Don’t block releases it on entry to Wrap-up; Custom time releases it after the configured duration and resets presence. However, an End of day capacity profile does not reset just because the custom wrap-up duration elapsed. Test the workstream and profile together.',
    ['Always block / Don’t block / Custom time', 'End of day profile exception'], ['wrap-up', 'capacity'], [1], 4),
  recall(21, 'Advanced', 'With the Highest capacity assignment method, how does switching from Exact Match to Closest Match change representative ordering?',
    'Exact Match filters for required skills, allowed presence, and capacity, then orders eligible representatives by available capacity. Closest Match still filters presence and capacity, but ranks by skill closeness instead of letting spare capacity dominate. When skill scores tie, the selected assignment method supplies the subsequent ranking.',
    ['Eligibility filters still apply', 'Closest skill rank precedes spare capacity'], ['assignment', 'highest-capacity', 'skills'], [5, 6], 2),
  recall(22, 'Applied', 'Why can advanced round robin assign two successive items to the same representative when they belong to two queues?',
    'Round-robin ordering is maintained separately for each queue, not as one global turn across the organization. A representative may be next in both queues and receive back-to-back or concurrent items if eligible. That alone is not evidence that round robin failed.',
    ['Queue-local ordering', 'Cross-queue successive assignments are possible'], ['assignment', 'round-robin'], [5], 2),
  recall(23, 'Advanced', 'When creating custom assignment rules, which workstream eligibility defaults must not be assumed to apply automatically?',
    'Explicitly configure the needed presence and skill criteria and unit-based capacity conditions. The workstream defaults do not automatically supply these conditions to custom assignment. Capacity-profile matching is an important exception: required profiles are checked implicitly by the system.',
    ['Explicit presence and skills', 'Explicit unit-based capacity', 'Implicit capacity-profile checks'], ['custom-assignment', 'eligibility'], [5, 6, 10], 2),
  recall(24, 'Applied', 'For which queue types is Least active intended, and why is “fewest lifetime cases resolved” the wrong interpretation?',
    'Least active is available for voice and messaging queues, not record queues. Its documented behavior considers concurrent conversation workload and capacity-release timing, including wrap-up effects. It does not rank representatives by their historical total of resolved cases.',
    ['Voice and messaging only', 'Current workload and capacity-release timing'], ['assignment', 'least-active'], [5], 2),
  mcq(25, 'Applied', 'The same expensive, static VIP test runs in every prioritization cycle. What does Microsoft recommend to reduce repeated evaluation?', [
    ['Compute a VIP attribute in classification and use that value in routing and prioritization', 'Correct: classification can evaluate stable conditions once, avoiding repeated complex conditions during iterative assignment cycles.'],
    ['Move the test into each representative notification template', 'Incorrect: notification templates present offers; they are not the recommended stage for deriving reusable routing attributes.'],
    ['Add a second route-to-queue ruleset to repeat the test', 'Incorrect: a workstream supports one route-to-queue ruleset, and repetition would not solve the stated cost.'],
    ['Replace every skill requirement with the VIP flag', 'Incorrect: customer priority and representative qualification are different concerns; simplifying the test does not justify discarding skills.'],
  ], 0, ['Compute stable classification once', 'Reuse output in repeated stages'], ['classification', 'performance'], [15], 1),
  mcq(26, 'Applied', 'Urgent cases already reach the correct record queue, but should precede ordinary cases within that queue. Which control directly addresses this?', [
    ['Increase the priority of the existing queue relative to all other queues', 'Incorrect: this changes cross-queue ordering, not the urgent-versus-ordinary order within the same queue.'],
    ['Switch representative ranking from highest capacity to round robin', 'Incorrect: ranking representatives does not define which urgent work items precede ordinary ones.'],
    ['Configure a prioritization ruleset in a custom assignment method', 'Correct: prioritization rules create ordered work-item buckets within a queue, while assignment rules choose representatives.'],
    ['Change only the route-to-queue condition to select the same queue again', 'Incorrect: queue selection already succeeds; selecting the same destination does not establish within-queue ordering.'],
  ], 2, ['Prioritization orders work', 'Assignment selects representatives'], ['prioritization', 'records'], [5], 2),
  mcq(27, 'Applied', 'A representative’s profile still shows a Spanish skill association, but that user skill was deactivated. What should you expect for work requiring it?', [
    ['The historic association continues to qualify the user indefinitely', 'Incorrect: the enhanced user-management documentation explicitly excludes deactivated skills from applicable assignment matching.'],
    ['The deactivated skill does not qualify the representative for that requirement', 'Correct: users with a deactivated skill are not considered on the basis of that skill when a work item requires it. Verify active status as well as the displayed association.'],
    ['The representative is deleted from all queues', 'Incorrect: skill activation and queue membership are separately managed attributes.'],
    ['The work item’s Spanish requirement is automatically removed', 'Incorrect: disabling a user skill does not rewrite the incoming work item’s classification.'],
  ], 1, ['Skill must be active', 'Queue membership is separate'], ['skills', 'troubleshooting'], [8], 3),
  mcq(28, 'Applied', 'Exact Match requires Spanish 3 and Product 2. All candidates otherwise meet queue, presence, and capacity requirements and use the same rating models. Who qualifies?', [
    ['Alex: Spanish 2, Product 5', 'Incorrect: Product proficiency cannot compensate for Spanish below the required level.'],
    ['Blair: Spanish 4, no Product skill', 'Incorrect: Exact Match requires every required skill, not just a strong language match.'],
    ['Casey: Spanish 3, Product 1', 'Incorrect: Casey meets Spanish but not the required Product proficiency.'],
    ['Devon: Spanish 4, Product 3', 'Correct: both ratings meet or exceed the required thresholds; Exact Match does not mean identical ratings.'],
  ], 3, ['Evaluate each required skill', 'Exceeding proficiency is permitted'], ['exact-match', 'proficiency'], [6], 3),
  mcq(29, 'Advanced', 'A rerouted conversation acquires a Product skill but unexpectedly still requires its earlier Language skill. Which documented behavior explains this?', [
    ['Rerouting always deletes all prior skills, so this cannot be routing behavior', 'Incorrect: classification documentation says new skills append when work is rerouted.'],
    ['New skills are appended to the existing work-item skills on reroute', 'Correct: inspect accumulated requirements; do not assume the new classification replaces every prior skill.'],
    ['The receiving queue automatically copies every member’s skills onto the conversation', 'Incorrect: representative skill associations are used for matching; they are not the documented source of the retained work-item requirement.'],
    ['The selected assignment method replaces all classification outputs on every cycle', 'Incorrect: assignment selects a representative; it does not explain the documented append behavior during rerouting.'],
  ], 1, ['Reroute appends skills', 'Inspect accumulated requirements'], ['classification', 'rerouting', 'skills'], [2], 3),
  mcq(30, 'Advanced', 'A queue has business hours, but the design also requires automated assignment only when each representative is on their own shift. What implements that requirement?', [
    ['Configure representative calendars and use Calendar Schedule: Is working in custom assignment', 'Correct: default strategies do not check representative operating hours; the custom calendar condition evaluates the representative’s schedule, not queue hours.'],
    ['Set queue hours and assume all built-in methods inherit every representative calendar', 'Incorrect: the assignment documentation explicitly distinguishes these schedules and default-method behavior.'],
    ['Use Highest capacity without any calendar condition', 'Incorrect: available capacity alone does not establish that the representative is on shift.'],
    ['Add a channel operating-hours schedule and omit representative calendars', 'Incorrect: channel availability does not enforce each representative’s individual shift during assignment.'],
  ], 0, ['Representative calendar is separate', 'Use custom Is working condition'], ['calendars', 'custom-assignment'], [5], 5),
  mcq(31, 'Foundation', 'No operating-hours record has been assigned to an advanced queue. How is its schedule treated?', [
    ['The queue is unavailable until a calendar is assigned', 'Incorrect: the queue documentation states that no configured hours means round-the-clock availability.'],
    ['It inherits the sign-in hours of its first member', 'Incorrect: member sign-in does not define the queue’s operating-hours record.'],
    ['It automatically closes on weekends in the administrator’s time zone', 'Incorrect: that schedule is not inferred from the administrator.'],
    ['The queue is considered available around the clock', 'Correct: attach an operating-hours record and configure the intended overflow action if it should behave differently.'],
  ], 3, ['No queue schedule means 24/7'], ['operating-hours', 'advanced-queues'], [4, 12], 5),
  mcq(32, 'Applied', 'A support calendar must handle a public holiday and daylight-saving changes correctly. Which setup matches the operating-hours guidance?', [
    ['Use a fixed UTC schedule year-round and assume local daylight-saving changes are inferred', 'Incorrect: select the appropriate schedule time zone to have its applicable daylight-saving changes accounted for.'],
    ['Mark each representative Away on the holiday but leave the customer-facing schedule unchanged', 'Incorrect: presence changes do not configure the operating-hours calendar or its holiday exception.'],
    ['Choose the applicable time zone for recurring work hours and add a Holiday entry', 'Correct: the schedule supports time zones with daylight-saving adjustment and explicit holiday dates or ranges.'],
    ['Assume national holidays are inferred from the channel language', 'Incorrect: the documented procedure explicitly defines holiday entries; channel language is not a holiday calendar.'],
  ], 2, ['Time zone on schedule', 'Explicit holiday entry'], ['operating-hours', 'holidays'], [12], 5),
  mcq(33, 'Applied', 'A caller has already entered a queue and has waited longer than the permitted duration. Which overflow condition targets that actual queued wait?', [
    ['Average wait time before queueing', 'Incorrect: that prequeue voice condition uses predicted average wait for an incoming item, not elapsed waiting for this queued caller.'],
    ['Work item limit exceeds before queueing', 'Incorrect: item count is a prequeue volume condition, not this caller’s elapsed wait.'],
    ['Waiting time in queue exceeds, under When work items are queued', 'Correct: in-queue overflow handles customers already waiting beyond the configured threshold.'],
    ['The queue’s service-level metric threshold without an overflow rule', 'Incorrect: a reporting threshold is not the in-queue overflow condition that triggers an action for an elapsed wait.'],
  ], 2, ['Actual queued wait versus predicted prequeue wait'], ['overflow', 'wait-time'], [11, 4], 5),
  mcq(34, 'Applied', 'An administrator attaches operating hours to a queue and expects after-hours contacts to be rejected automatically. Why might they still enter the queue?', [
    ['Queue operating hours can never be used for overflow', 'Incorrect: Out of operation hours is a supported prequeue overflow condition.'],
    ['Queue hours only change reporting labels and cannot affect incoming work', 'Incorrect: the configured out-of-hours overflow action can change the handling of incoming work.'],
    ['After-hours actions are automatically inherited from any other queue with the same members', 'Incorrect: shared membership does not copy overflow actions; configure the action on the intended queue.'],
    ['The default out-of-hours action is Assign to queue anyway', 'Correct: adding a schedule creates that default action. Change it to the supported after-hours action required by the service policy.'],
  ], 3, ['Schedule does not imply rejection', 'Configure explicit overflow action'], ['overflow', 'after-hours'], [11], 5),
  mcq(35, 'Advanced', 'Prequeue overflow transfers an item from queue A to queue B. Should B’s prequeue check immediately cascade in the same way?', [
    ['No; prequeue overflow is checked once, although later in-queue wait handling is separate', 'Correct: overflow transfer does not trigger another prequeue overflow check. In-queue waiting conditions have their own evaluation behavior.'],
    ['Yes; prequeue checks necessarily repeat until a queue with no rules is found', 'Incorrect: the overflow documentation explicitly prevents further prequeue checks on that transfer.'],
    ['Yes, if B has an out-of-hours condition, because it overrides the once-only rule', 'Incorrect: operating-hours precedence determines which action wins during a check; it does not cause a second prequeue check after overflow transfer.'],
    ['Yes, whenever B has no eligible representative, even without in-queue handling', 'Incorrect: lack of an eligible representative does not by itself turn this prequeue transfer into a cascading prequeue evaluation.'],
  ], 0, ['Prequeue check is once-only', 'Do not conflate with in-queue overflow'], ['overflow', 'transfers'], [11], 5),
  mcq(36, 'Applied', 'A route-to-queue rule allocates 60% and 40% across two vendors. Which statement is correct?', [
    ['Every consecutive batch of ten contacts must split exactly six and four', 'Incorrect: runtime percentages can deviate, especially in small samples.'],
    ['Allocations must total 100, and overflow can affect the final selected queue', 'Correct: the rule supports up to five queues with a total of 100; percentage selection is still subject to routing and overflow evaluation.'],
    ['Adding a third vendor lets the total exceed 100', 'Incorrect: the total must remain 100 when allocations are updated.'],
    ['Percentage allocation chooses the individual representative directly', 'Incorrect: it selects among queues; representative assignment remains a separate stage.'],
  ], 1, ['Total allocation 100', 'Queue allocation not agent assignment', 'No exact small-sample guarantee'], ['route-to-queue', 'percentage-allocation'], [3], 1),
  mcq(37, 'Applied', 'A representative’s remaining capacity is negative after a supervisor forcibly assigns another conversation. What is the most accurate interpretation?', [
    ['A negative value proves a custom assignment rule omitted its unit-capacity condition', 'Incorrect: that can merit investigation in other circumstances, but the stated forced assignment has its own documented over-capacity behavior.'],
    ['Every negative value proves corrupt storage', 'Incorrect: negative capacity is a documented result of manual pickup or forced assignment beyond the configured limit.'],
    ['Manual assignment is always blocked at zero, so the displayed item cannot belong to this representative', 'Incorrect: supervisor override and manual pickup can exceed the configured capacity; zero is not a universal manual-assignment barrier.'],
    ['Manual or forced assignment can exceed configured capacity and produce this display', 'Correct: the capacity documentation explicitly allows this outcome. Investigate assignment history before claiming automatic eligibility checks failed.'],
  ], 3, ['Manual override differs from automatic matching', 'Negative capacity is documented'], ['capacity', 'manual-assignment', 'troubleshooting'], [10], 4),
  mcq(38, 'Advanced', 'A voice item overflows into another queue. If the receiving queue’s in-queue wait condition later triggers, which actions are documented for this transferred-in voice item?', [
    ['Every voice overflow action, without restriction', 'Incorrect: the documentation restricts in-queue actions when voice work arrives through representative/supervisor transfer or overflow.'],
    ['Transfer to a different queue or to an external number', 'Correct: those are the supported actions documented for this transferred-in voice scenario. In-queue conditions can be checked again in the receiving queue.'],
    ['Only direct callback and voicemail', 'Incorrect: those are not the two permitted actions listed for this transferred-in scenario.'],
    ['No further in-queue evaluation is possible', 'Incorrect: the once-only rule concerns prequeue checks; in-queue waiting overflow can occur again in another queue.'],
  ], 1, ['Transferred-in voice action restriction', 'In-queue overflow can recur'], ['overflow', 'voice', 'transfers'], [11], 5),
  mcq(39, 'Advanced', 'On 2026-10-09, a new routing investigation needs lifecycle telemetry. Which documented approach should replace legacy unified-routing diagnostics?', [
    ['Enable the old routing diagnostics feature because links still exist', 'Incorrect: its removal date was March 31, 2026; surviving cross-links do not make it a current setup path.'],
    ['Train the retired effort-estimation model to generate routing traces', 'Incorrect: effort estimation was removed in June 2025 and is not the replacement telemetry system.'],
    ['Configure conversation diagnostics in Azure Application Insights after checking its prerequisites', 'Correct: this is the documented replacement. Check Managed environment status, permissions, cloud restrictions, and ingestion costs before enabling export.'],
    ['Use the retired unified-routing historical dashboards as the new diagnostics service', 'Incorrect: those specific dashboards are also retired and are not the replacement export mechanism.'],
  ], 2, ['Use current conversation diagnostics', 'Check prerequisites and costs'], ['diagnostics', 'deprecations'], [13, 14], 6),
  mcq(40, 'Advanced', 'A representative reaches the configured decline limit for one conversation. Which consequence is documented?', [
    ['Automatic assignment stops offering that particular work item to that representative; manual pickup remains possible', 'Correct: both rejection and timeout count as declines. The documented default is three, configurable from one to five; reaching the limit is item-specific, not a global ban on new work.'],
    ['The representative is excluded from all automatic assignment until an administrator resets their account', 'Incorrect: this limit is specific to the declined work item, not a general account-level suspension.'],
    ['The conversation is automatically closed as soon as one representative reaches the limit', 'Incorrect: the system attempts other eligible representatives, and the item can remain queued.'],
    ['All future work from that customer is permanently blocked for that representative', 'Incorrect: the restriction applies to the declined work item, not all future customer interactions.'],
  ], 0, ['Rejection and timeout count', 'Item-specific automatic-offer limit', 'Manual pickup still possible'], ['assignment', 'declines', 'troubleshooting'], [5], 6),
];

export const routing: { topic: Topic; cards: Card[]; notes: Note[]; sources: Source[] } = { topic, cards, notes, sources };