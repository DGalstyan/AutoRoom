'use client';

import { QuickChoice } from '@/components/ui/QuickChoice';
import { useMessages } from '@/components/shared/LocaleProvider';
import type { LeadBudget, LeadChannel, LeadFinancing, LeadTiming } from '@/lib/leads';

export const BUDGET_KEYS: LeadBudget[] = ['lt10k', '10-20k', '20-35k', '35k+'];
export const FINANCING_KEYS: LeadFinancing[] = ['need', 'no', 'unsure'];
export const TIMING_KEYS: LeadTiming[] = ['now', '1-3m', 'browsing'];
export const CHANNEL_KEYS: LeadChannel[] = ['call', 'whatsapp', 'viber', 'telegram'];

export interface QualificationValues {
  budget?: LeadBudget;
  financing?: LeadFinancing;
  timing?: LeadTiming;
  channel?: LeadChannel;
}

export type QualificationField = keyof QualificationValues;

const DEFAULT_FIELDS: QualificationField[] = ['budget', 'financing', 'timing', 'channel'];

/**
 * The four lead-qualification questions — budget, financing, timing, contact
 * channel — as one-tap chips (see `QuickChoice`), shared by every lead form
 * that asks them so the options, wording and payload values stay identical.
 * Each answer is optional and can be cleared by tapping it again.
 *
 * `fields` picks which to show (per-car popups skip timing); `labels`
 * overrides a question's heading when a form words it differently.
 */
export function LeadQualification({
  values,
  onChange,
  fields = DEFAULT_FIELDS,
  labels = {},
}: {
  values: QualificationValues;
  onChange: (patch: QualificationValues) => void;
  fields?: QualificationField[];
  labels?: Partial<Record<QualificationField, string>>;
}) {
  const t = useMessages().common.popup;
  const show = (field: QualificationField) => fields.includes(field);

  return (
    <>
      {show('budget') && (
        <QuickChoice
          label={labels.budget ?? t.budgetLabel}
          options={BUDGET_KEYS.map((key) => ({ key, label: t.budgetOptions[key] }))}
          value={values.budget}
          onChange={(budget) => onChange({ budget })}
        />
      )}
      {show('financing') && (
        <QuickChoice
          label={labels.financing ?? t.financingLabel}
          options={FINANCING_KEYS.map((key) => ({ key, label: t.financingOptions[key] }))}
          value={values.financing}
          onChange={(financing) => onChange({ financing })}
        />
      )}
      {show('timing') && (
        <QuickChoice
          label={labels.timing ?? t.timingLabel}
          options={TIMING_KEYS.map((key) => ({ key, label: t.timingOptions[key] }))}
          value={values.timing}
          onChange={(timing) => onChange({ timing })}
        />
      )}
      {show('channel') && (
        <QuickChoice
          label={labels.channel ?? t.channelLabel}
          options={CHANNEL_KEYS.map((key) => ({ key, label: t.channelOptions[key] }))}
          value={values.channel}
          onChange={(channel) => onChange({ channel })}
        />
      )}
    </>
  );
}
