import type { Pack } from '../domain';
import { foundations } from './foundations';
import { setup } from './setup';
import { routing } from './routing';
import { voice } from './voice';
import { telephony } from './telephony';
import { digital } from './digital';
import { experience } from './experience';
import { operations } from './operations';
import { implementation } from './implementation';
import { createAb250Pack } from './ab250';
import { ab250PracticePack } from './ab250Practice';

const modules = [foundations, setup, routing, voice, telephony, digital, experience, operations, implementation];

/** Keep this ID stable: learner history is namespaced by pack ID, not title/version. */
const contactCenterPack: Pack = {
  id: 'd365-contact-center',
  title: 'Dynamics 365 Contact Center',
  description: 'Configuration, implementation, routing, digital channels, and Teams Phone telephony with Operator Connect.',
  version: '1.0.0',
  topics: modules.map(module => module.topic),
  cards: modules.flatMap(module => module.cards),
  notes: modules.flatMap(module => module.notes),
  // Do not deduplicate here: authoring mistakes must remain visible to validation.
  sources: modules.flatMap(module => module.sources),
};

export const packs: Pack[] = [contactCenterPack, createAb250Pack(contactCenterPack), ab250PracticePack];
