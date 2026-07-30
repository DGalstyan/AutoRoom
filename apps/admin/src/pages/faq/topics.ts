import type { FaqTopic } from '@autoroom/api/client';

/**
 * The three FAQ sections, named as the site names them. `GENERAL` holds the
 * answered set that belongs to neither country page — payment stages, the
 * contract, where the branches are — which the homepage shows alongside both.
 */
export const TOPICS: { value: FaqTopic; label: string; hint: string }[] = [
  {
    value: 'CHINA',
    label: 'China',
    hint: 'Հաճախ տրվող հարցեր Չինաստանից մեքենա պատվիրելու մասին',
  },
  {
    value: 'USA',
    label: 'USA',
    hint: 'Հաճախ տրվող հարցեր ԱՄՆ-ից մեքենա պատվիրելու մասին',
  },
  {
    value: 'GENERAL',
    label: 'General',
    hint: 'Shown on the homepage alongside both country sections.',
  },
];

export const topicLabel = (topic: FaqTopic) =>
  TOPICS.find((entry) => entry.value === topic)?.label ?? topic;

export const topicHint = (topic: FaqTopic) =>
  TOPICS.find((entry) => entry.value === topic)?.hint ?? '';
