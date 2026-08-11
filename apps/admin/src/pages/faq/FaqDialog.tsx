import { useMemo, useState } from 'react';
import { z } from 'zod';
import type { Faq, FaqTopic, Locale } from '@autoroom/api/client';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { useZodForm } from '@/components/form/useZodForm';
import { TOPICS, topicHint } from '@/pages/faq/topics';

/** The site's languages, in the order the dialog offers them. Armenian is
 * required — it's the site's default and only guaranteed-enabled locale
 * (see the `LOCALIZATION` setting); Russian and English are translations. */
const LANGUAGES: { value: Locale; label: string; required?: boolean }[] = [
  { value: 'hy', label: 'Armenian', required: true },
  { value: 'ru', label: 'Russian' },
  { value: 'en', label: 'English' },
];

/**
 * The one rule that matters here — a question cannot publish without an
 * Armenian answer — written once, as a schema, rather than scattered across
 * `disabled` expressions. It is the same rule the API enforces, so the two
 * cannot drift, and it reports against the Armenian answer tab whichever side
 * catches it.
 */
const schema = z
  .object({
    topic: z.enum(['CHINA', 'USA', 'GENERAL']),
    question: z.object({
      hy: z.string().trim().min(1, 'An Armenian question is required').max(300),
      ru: z.string().trim().max(300),
      en: z.string().trim().max(300),
    }),
    answer: z.object({
      hy: z.string().trim().max(4000),
      ru: z.string().trim().max(4000),
      en: z.string().trim().max(4000),
    }),
    position: z.number().int().min(0).max(999),
    published: z.boolean(),
  })
  .refine((value) => !value.published || value.answer.hy.trim().length > 0, {
    message: 'Write an Armenian answer before publishing this question',
    path: ['answer', 'hy'],
  });

/** Undefined rather than `''`, so a language nobody has translated yet is
 * absent from the record instead of stored as an empty string. */
const trimOrUndefined = (value: string) => value.trim() || undefined;

/** Add or edit a question. The first form built on `useZodForm`. */
export function FaqDialog({
  item,
  defaultTopic,
  nextPosition,
  onClose,
  onDone,
}: {
  item?: Faq;
  defaultTopic: FaqTopic;
  nextPosition: number;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { api } = useAuth();
  const [language, setLanguage] = useState<Locale>('hy');

  const initialValues = useMemo(
    () => ({
      topic: (item?.topic ?? defaultTopic) as 'CHINA' | 'USA' | 'GENERAL',
      question: {
        hy: item?.question.hy ?? '',
        ru: item?.question.ru ?? '',
        en: item?.question.en ?? '',
      },
      answer: {
        hy: item?.answer?.hy ?? '',
        ru: item?.answer?.ru ?? '',
        en: item?.answer?.en ?? '',
      },
      position: item?.position ?? nextPosition,
      published: Boolean(item?.publishedAt),
    }),
    [item, defaultTopic, nextPosition],
  );

  const { values, setValue, errors, formError, submitting, handleSubmit } = useZodForm({
    schema,
    initialValues,
    onSubmit: async (parsed) => {
      const answer = {
        hy: trimOrUndefined(parsed.answer.hy),
        ru: trimOrUndefined(parsed.answer.ru),
        en: trimOrUndefined(parsed.answer.en),
      };
      const body = {
        topic: parsed.topic,
        question: {
          hy: parsed.question.hy,
          ru: trimOrUndefined(parsed.question.ru),
          en: trimOrUndefined(parsed.question.en),
        },
        // Empty in every language means "not written yet", which is a real
        // state here — not a blank string the site would render as an empty
        // accordion.
        answer: answer.hy || answer.ru || answer.en ? answer : null,
        position: parsed.position,
        published: parsed.published,
      };
      await (item ? api.faq.update(item.id, body) : api.faq.create(body));
      onDone(item ? 'Question saved.' : 'Question added.');
    },
  });

  const questionError = errors[`question.${language}`];
  const answerError = errors[`answer.${language}`];

  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{item ? 'Edit question' : 'Add question'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Section"
              value={values.topic}
              onChange={(event) => setValue('topic', event.target.value as typeof values.topic)}
              select
              fullWidth
              helperText={topicHint(values.topic)}
            >
              {TOPICS.map((entry) => (
                <MenuItem key={entry.value} value={entry.value}>
                  {entry.label}
                </MenuItem>
              ))}
            </TextField>

            <Tabs
              value={language}
              onChange={(_event, value: Locale) => setLanguage(value)}
              variant="fullWidth"
              sx={{ minHeight: 38 }}
            >
              {LANGUAGES.map((entry) => (
                <Tab
                  key={entry.value}
                  value={entry.value}
                  label={entry.required ? `${entry.label} *` : entry.label}
                  sx={{ minHeight: 38 }}
                />
              ))}
            </Tabs>

            <TextField
              label="Question"
              value={values.question[language]}
              onChange={(event) =>
                setValue('question', { ...values.question, [language]: event.target.value })
              }
              fullWidth
              error={Boolean(questionError)}
              helperText={
                questionError ??
                (language !== 'hy' ? 'Leave empty to keep this language untranslated.' : undefined)
              }
            />

            <TextField
              label="Answer"
              value={values.answer[language]}
              onChange={(event) =>
                setValue('answer', { ...values.answer, [language]: event.target.value })
              }
              multiline
              minRows={4}
              fullWidth
              error={Boolean(answerError)}
              helperText={
                answerError ??
                (language === 'hy'
                  ? 'Leave empty to keep this as a question awaiting an answer.'
                  : 'Leave empty to keep this language untranslated.')
              }
            />

            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <TextField
                label="Position"
                type="number"
                value={values.position}
                onChange={(event) =>
                  setValue('position', Math.max(0, Number(event.target.value) || 0))
                }
                sx={{ width: 140 }}
                slotProps={{ htmlInput: { min: 0, max: 999 } }}
                helperText="Lower shows first."
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={values.published}
                    onChange={(event) => setValue('published', event.target.checked)}
                  />
                }
                label="Published"
                sx={{ mt: -2 }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={submitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
