import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SettingKey, SettingRecord, SettingValues } from '@autoroom/api/client';
import { useAuth } from '@/auth/AuthProvider';
import { ApiError, errorMessage } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';

/** Every settings screen reads the same list; one query key keeps it to one request. */
export function useSettings() {
  const { api } = useAuth();
  return useQuery({ queryKey: ['settings'], queryFn: () => api.settings.list() });
}

/**
 * Edit state for one setting key.
 *
 * The form holds a draft rather than writing through on every keystroke, so a
 * half-typed hex colour never reaches the server and "unsaved changes" is a
 * real, visible state. `dirty` compares against the last saved value, so
 * typing a change and undoing it correctly disables Save again.
 *
 * Field errors come back from the API keyed by path; the server's validation is
 * the authority on what is acceptable, so the form surfaces those rather than
 * duplicating every rule client-side and risking the two disagreeing.
 */
export function useSettingSection<K extends SettingKey>(
  key: K,
  records: SettingRecord[] | undefined,
) {
  const { api } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const saved = useMemo(
    () => records?.find((record) => record.key === key)?.value as SettingValues[K] | undefined,
    [records, key],
  );

  const [draft, setDraft] = useState<SettingValues[K] | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Adopt the server's value on first load, and again after a save confirms.
  useEffect(() => {
    if (saved !== undefined) setDraft(saved);
  }, [saved]);

  const mutation = useMutation({
    mutationFn: (value: SettingValues[K]) => api.settings.update(key, value),
    onSuccess: () => {
      setFieldErrors({});
      toast('Saved.');
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error) => {
      setFieldErrors(extractFieldErrors(error));
      toast(errorMessage(error, 'Could not save.'), 'error');
    },
  });

  const dirty = useMemo(
    () => draft !== null && saved !== undefined && JSON.stringify(draft) !== JSON.stringify(saved),
    [draft, saved],
  );

  function patch(changes: Partial<SettingValues[K]>) {
    setDraft((current) => (current === null ? current : { ...current, ...changes }));
  }

  return {
    value: draft,
    setValue: setDraft,
    patch,
    dirty,
    saving: mutation.isPending,
    fieldErrors,
    save: () => draft !== null && mutation.mutate(draft),
    reset: () => {
      if (saved !== undefined) setDraft(saved);
      setFieldErrors({});
    },
  };
}

function extractFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  const details = error.details as { fields?: { path: string; message: string }[] } | undefined;
  if (!details?.fields) return {};
  return Object.fromEntries(details.fields.map((field) => [field.path, field.message]));
}
