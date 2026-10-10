import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CTA_KINDS, LEAD_CTAS, QUIZ_CTA_IDS } from '@/lib/cta';
import hy from '@/messages/hy.json';
import en from '@/messages/en.json';
import ru from '@/messages/ru.json';

const ROOT = join(__dirname, '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (name === 'node_modules' || name === '.next') return [];
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

const SOURCES = ['app', 'components'].flatMap((d) => sourceFiles(join(ROOT, d)));

/** `sourceCta: 'id'` literals, and `open('id')` for the partner booking popup. */
function usedIds(): Map<string, string[]> {
  const used = new Map<string, string[]>();
  for (const file of SOURCES) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/sourceCta: '([a-z0-9-]+)'/g)) {
      used.set(m[1]!, [...(used.get(m[1]!) ?? []), file]);
    }
    for (const m of text.matchAll(/\bopen\('([a-z0-9-]+)'\)/g)) {
      used.set(m[1]!, [...(used.get(m[1]!) ?? []), file]);
    }
  }
  return used;
}

function lookup(tree: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], tree);
}

describe('CTA registry', () => {
  it('every sourceCta used in the code is registered', () => {
    const unknown = [...usedIds().keys()].filter((id) => !(id in LEAD_CTAS));
    expect(unknown).toEqual([]);
  });

  it('every registered CTA is used somewhere (no orphans)', () => {
    const used = usedIds();
    expect(Object.keys(LEAD_CTAS).filter((id) => !used.has(id))).toEqual([]);
  });

  it('the Quiz opens only from the allowed places, and those open nothing else', () => {
    const quizIds = Object.entries(LEAD_CTAS)
      .filter(([, widget]) => widget === 'quiz')
      .map(([id]) => id)
      .sort();
    expect(quizIds).toEqual([...QUIZ_CTA_IDS].sort());
  });

  it('a CTA that opens the quiz calls openQuiz, and the others never do', () => {
    for (const [id, files] of usedIds()) {
      const widget = LEAD_CTAS[id as keyof typeof LEAD_CTAS];
      for (const file of files) {
        const text = readFileSync(file, 'utf8');
        const callsQuiz = new RegExp(`openQuiz\\(\\{\\s*sourceCta: '${id}'`).test(text);
        expect(callsQuiz, `${id} in ${file}`).toBe(widget === 'quiz');
      }
    }
  });

  it('every CTA kind has a label in all three languages', () => {
    for (const [kind, { labelKey }] of Object.entries(CTA_KINDS)) {
      for (const [locale, tree] of Object.entries({ hy, en, ru })) {
        const value = lookup(tree, labelKey);
        expect(
          typeof value === 'string' && value.length > 0,
          `${kind} (${locale}) → ${labelKey}`,
        ).toBe(true);
      }
    }
  });

  it('call, map and view labels are three different words in every language', () => {
    for (const tree of [hy, en, ru]) {
      const labels = (['call', 'map', 'view'] as const).map((k) =>
        lookup(tree, CTA_KINDS[k].labelKey),
      );
      expect(new Set(labels).size).toBe(3);
    }
  });
});
