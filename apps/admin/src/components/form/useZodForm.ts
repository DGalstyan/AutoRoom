import { useCallback, useState } from 'react';
import type { z } from 'zod';
import { ApiError, errorMessage } from '@/lib/api';

/** `{ fieldName: 'message' }`, keyed by the dotted path zod reports. */
export type FieldErrors = Record<string, string>;

/**
 * A form backed by the same kind of zod schema the API validates with.
 *
 * Two things make this worth having over `useState` per field. Validation is
 * declared once as a schema instead of scattered across `disabled={...}`
 * expressions, so what "valid" means is in one readable place. And a 400 from
 * the server lands on the field that caused it: the API reports failures as
 * `{ path, message }[]`, which maps straight onto field errors, so a rule only
 * the server knows about — a duplicate slug, a capacity below what is booked —
 * is shown against the input rather than as a banner the user must interpret.
 *
 * Validation runs on submit, not on keystroke. Marking a field invalid while
 * someone is still typing the valid value is noise, and it is the reason forms
 * feel like they are arguing with you.
 */
export function useZodForm<Schema extends z.ZodType>({
  schema,
  initialValues,
  onSubmit,
}: {
  schema: Schema;
  initialValues: z.input<Schema>;
  /** Receives the parsed value — coerced and defaulted by the schema. */
  onSubmit: (values: z.output<Schema>) => Promise<unknown>;
}) {
  type Values = z.input<Schema>;

  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Clears that field's error: the reason it was wrong may no longer apply. */
  const setValue = useCallback(<K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (event?: { preventDefault: () => void }) => {
      event?.preventDefault();
      setFormError(null);

      const parsed = schema.safeParse(values);
      if (!parsed.success) {
        setErrors(toFieldErrors(parsed.error.issues));
        return;
      }

      setSubmitting(true);
      try {
        await onSubmit(parsed.data as z.output<Schema>);
        setErrors({});
      } catch (caught) {
        const fields = serverFieldErrors(caught);
        // A validation failure the schema did not catch belongs on its field.
        // Anything else — a conflict, a 500, a dead network — has no field to
        // sit on and becomes the form-level message.
        if (Object.keys(fields).length > 0) setErrors(fields);
        else setFormError(errorMessage(caught));
      } finally {
        setSubmitting(false);
      }
    },
    [schema, values, onSubmit],
  );

  return {
    values,
    setValue,
    setValues,
    errors,
    formError,
    submitting,
    handleSubmit,
    /** Props for a MUI field: `<TextField {...field('name')} />`. */
    field: (name: keyof Values & string) => ({
      error: Boolean(errors[name]),
      helperText: errors[name],
    }),
  };
}

function toFieldErrors(issues: readonly { path: PropertyKey[]; message: string }[]): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.');
    // First message per field wins — a stack of three rules on one input is a
    // wall of red that says less than the first line did.
    if (key && !(key in result)) result[key] = issue.message;
  }
  return result;
}

/** Pulls `{ path, message }[]` out of a 400 the API rejected. */
function serverFieldErrors(caught: unknown): FieldErrors {
  if (!(caught instanceof ApiError) || caught.code !== 'VALIDATION_ERROR') return {};

  const details = caught.details;
  if (!Array.isArray(details)) return {};

  const result: FieldErrors = {};
  for (const entry of details) {
    if (
      entry &&
      typeof entry === 'object' &&
      'path' in entry &&
      'message' in entry &&
      typeof entry.path === 'string' &&
      typeof entry.message === 'string' &&
      entry.path &&
      !(entry.path in result)
    ) {
      result[entry.path] = entry.message;
    }
  }
  return result;
}
