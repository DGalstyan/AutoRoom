import { useMemo, useState } from 'react';
import { z } from 'zod';
import type { BlogPost, Locale } from '@autoroom/api/client';
import {
  Alert,
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import { useAuth } from '@/auth/AuthProvider';
import { useZodForm } from '@/components/form/useZodForm';
import { UploadField } from '@/components/UploadField';

const LANGUAGES: { value: Locale; label: string; required?: boolean }[] = [
  { value: 'hy', label: 'Armenian', required: true },
  { value: 'ru', label: 'Russian' },
  { value: 'en', label: 'English' },
];

/** The rule that matters — nothing publishes without Armenian text — written once; the API enforces the same. */
const schema = z
  .object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2, 'Give the article a URL')
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lower-case letters, digits and hyphens only'),
    title: z.object({
      hy: z.string().trim().min(1, 'An Armenian title is required').max(160),
      ru: z.string().trim().max(160),
      en: z.string().trim().max(160),
    }),
    excerpt: z.object({
      hy: z.string().trim().max(400),
      ru: z.string().trim().max(400),
      en: z.string().trim().max(400),
    }),
    body: z.object({
      hy: z.string().trim().max(20000),
      ru: z.string().trim().max(20000),
      en: z.string().trim().max(20000),
    }),
    coverUrl: z.string(),
    published: z.boolean(),
  })
  .refine((value) => !value.published || value.body.hy.trim().length > 0, {
    message: 'Write the Armenian article text before publishing',
    path: ['body', 'hy'],
  });

const clean = (value: string) => value.trim() || undefined;

/** Turn a title into a URL — only Latin letters survive, so Armenian titles ask for a hand-typed slug. */
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function BlogDialog({
  post,
  onClose,
  onDone,
}: {
  post?: BlogPost;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { api } = useAuth();
  const [language, setLanguage] = useState<Locale>('hy');
  const [slugTouched, setSlugTouched] = useState(Boolean(post));

  const initialValues = useMemo(
    () => ({
      slug: post?.slug ?? '',
      title: { hy: post?.title.hy ?? '', ru: post?.title.ru ?? '', en: post?.title.en ?? '' },
      excerpt: {
        hy: post?.excerpt?.hy ?? '',
        ru: post?.excerpt?.ru ?? '',
        en: post?.excerpt?.en ?? '',
      },
      body: { hy: post?.body.hy ?? '', ru: post?.body.ru ?? '', en: post?.body.en ?? '' },
      coverUrl: post?.coverUrl ?? '',
      published: Boolean(post?.publishedAt),
    }),
    [post],
  );

  const { values, setValue, errors, formError, submitting, handleSubmit } = useZodForm({
    schema,
    initialValues,
    onSubmit: async (parsed) => {
      const excerpt = {
        hy: clean(parsed.excerpt.hy),
        ru: clean(parsed.excerpt.ru),
        en: clean(parsed.excerpt.en),
      };
      const body = {
        slug: parsed.slug,
        title: { hy: parsed.title.hy, ru: clean(parsed.title.ru), en: clean(parsed.title.en) },
        excerpt: excerpt.hy || excerpt.ru || excerpt.en ? excerpt : null,
        body: { hy: clean(parsed.body.hy), ru: clean(parsed.body.ru), en: clean(parsed.body.en) },
        coverUrl: parsed.coverUrl || null,
        published: parsed.published,
      };
      await (post ? api.blog.update(post.id, body) : api.blog.create(body));
      onDone(post ? 'Article saved.' : 'Article added.');
    },
  });

  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{post ? 'Edit article' : 'Add article'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

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
              label="Title"
              value={values.title[language]}
              onChange={(event) => {
                setValue('title', { ...values.title, [language]: event.target.value });
                // A Latin title proposes its own URL until someone edits the URL by hand.
                if (language === 'en' && !slugTouched && !values.slug) {
                  setValue('slug', slugify(event.target.value));
                }
              }}
              fullWidth
              error={Boolean(errors[`title.${language}`])}
              helperText={
                errors[`title.${language}`] ??
                (language !== 'hy' ? 'Leave empty to keep this language untranslated.' : undefined)
              }
            />

            <TextField
              label="Summary (shown on the list)"
              value={values.excerpt[language]}
              onChange={(event) =>
                setValue('excerpt', { ...values.excerpt, [language]: event.target.value })
              }
              multiline
              minRows={2}
              fullWidth
              error={Boolean(errors[`excerpt.${language}`])}
              helperText={errors[`excerpt.${language}`] ?? 'One or two sentences. Optional.'}
            />

            <TextField
              label="Article text"
              value={values.body[language]}
              onChange={(event) =>
                setValue('body', { ...values.body, [language]: event.target.value })
              }
              multiline
              minRows={10}
              fullWidth
              error={Boolean(errors[`body.${language}`])}
              helperText={
                errors[`body.${language}`] ?? 'Plain text. Leave a blank line between paragraphs.'
              }
            />

            <TextField
              label="Page URL"
              value={values.slug}
              onChange={(event) => {
                setSlugTouched(true);
                setValue('slug', event.target.value.toLowerCase());
              }}
              fullWidth
              error={Boolean(errors.slug)}
              helperText={errors.slug ?? `autoroom.am/blog/${values.slug || 'your-article'}`}
            />

            <UploadField
              label="Cover image"
              accept="image/*"
              value={values.coverUrl || null}
              onChange={(url) => setValue('coverUrl', url ?? '')}
              helperText="Landscape, ideally 16:9. Optional."
              disabled={submitting}
              preview={(url) => (
                <Avatar src={url} alt="" variant="rounded" sx={{ width: 160, height: 90 }} />
              )}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={values.published}
                  onChange={(event) => setValue('published', event.target.checked)}
                />
              }
              label="Published"
            />
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
