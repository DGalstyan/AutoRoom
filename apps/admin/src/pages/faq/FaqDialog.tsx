import { useMemo } from 'react';
import { z } from 'zod';
import type { Faq, FaqTopic } from '@autoroom/api/client';
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
  TextField,
} from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { useZodForm } from '@/components/form/useZodForm';
import { TOPICS, topicHint } from '@/pages/faq/topics';

/**
 * The one rule that matters here — a question cannot publish without an answer
 * — written once, as a schema, rather than scattered across `disabled`
 * expressions. It is the same rule the API enforces, so the two cannot drift,
 * and it reports against the answer field whichever side catches it.
 */
const schema = z
  .object({
    topic: z.enum(['CHINA', 'USA', 'GENERAL']),
    question: z.string().trim().min(1, 'A question is required').max(300),
    answer: z.string().trim().max(4000),
    position: z.number().int().min(0).max(999),
    published: z.boolean(),
  })
  .refine((value) => !value.published || value.answer.length > 0, {
    message: 'Write an answer before publishing this question',
    path: ['answer'],
  });

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

  const initialValues = useMemo(
    () => ({
      topic: (item?.topic ?? defaultTopic) as 'CHINA' | 'USA' | 'GENERAL',
      question: item?.question ?? '',
      answer: item?.answer ?? '',
      position: item?.position ?? nextPosition,
      published: Boolean(item?.publishedAt),
    }),
    [item, defaultTopic, nextPosition],
  );

  const { values, setValue, field, formError, submitting, handleSubmit } = useZodForm({
    schema,
    initialValues,
    onSubmit: async (parsed) => {
      const body = {
        topic: parsed.topic,
        question: parsed.question,
        // Empty means "not written yet", which is a real state here — not a
        // blank string the site would render as an empty accordion.
        answer: parsed.answer || null,
        position: parsed.position,
        published: parsed.published,
      };
      await (item ? api.faq.update(item.id, body) : api.faq.create(body));
      onDone(item ? 'Question saved.' : 'Question added.');
    },
  });

  const answerField = field('answer');

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

            <TextField
              label="Question"
              value={values.question}
              onChange={(event) => setValue('question', event.target.value)}
              fullWidth
              {...field('question')}
            />

            <TextField
              label="Answer"
              value={values.answer}
              onChange={(event) => setValue('answer', event.target.value)}
              multiline
              minRows={4}
              fullWidth
              error={answerField.error}
              helperText={
                answerField.helperText ??
                'Leave empty to keep this as a question awaiting an answer.'
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
