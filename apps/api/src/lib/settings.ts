import { SettingGroup } from '@prisma/client';
import { z } from 'zod';
import { prisma } from './prisma';

/**
 * The settings registry — `references/admin.md` A3.
 *
 * Every setting is declared once here with its group, its zod schema and its
 * defaults. That single declaration is what makes the rest work: writes are
 * validated against the schema rather than trusted, reads merge the stored row
 * over the defaults so a partially-written row can never surface an `undefined`
 * where a boolean was expected, and the admin UI can render a form from the
 * same source the server enforces.
 *
 * `isPublic` marks what `GET /settings/public` may expose. It is opt-in per
 * key, not opt-out, so a setting added later is private until someone decides
 * otherwise — the failure mode of the other default is leaking configuration.
 */

const hexColour = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex colour, e.g. #E4002B');

/** Empty strings from a form field mean "not set", not an invalid URL. */
const optionalUrl = z
  .union([z.string().url('Must be a full URL, e.g. https://example.com'), z.literal(''), z.null()])
  .transform((value) => (value === '' ? null : value))
  .nullable();

const optionalText = z
  .union([z.string().max(400), z.null()])
  .transform((value) => (value === '' ? null : value))
  .nullable();

const brandingIdentity = z.object({
  brandName: z.string().trim().min(1, 'Brand name is required').max(80),
  logoLightUrl: optionalUrl,
  logoDarkUrl: optionalUrl,
  faviconUrl: optionalUrl,
});

const brandingTheme = z.object({
  accent: hexColour,
  accentHover: hexColour,
  bg: hexColour,
  surface: hexColour,
  surfaceLight: hexColour,
  paper: hexColour,
  ink: hexColour,
  muted: hexColour,
  lineDark: hexColour,
  lineLight: hexColour,
  success: hexColour,
  warn: hexColour,
  info: hexColour,
});

const brandingTypography = z.object({
  display: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(80),
  /** Sora and Inter carry no Armenian glyphs; this is the fallback that does. */
  armenian: z.string().trim().min(1).max(80),
});

const contactsGeneral = z.object({
  phones: z.array(z.string().trim().min(1).max(40)).max(20),
  email: z
    .union([z.string().email(), z.literal(''), z.null()])
    .transform((v) => (v === '' ? null : v)),
  workingHours: optionalText,
});

const contactsSocial = z.object({
  facebook: optionalUrl,
  instagram: optionalUrl,
  tiktok: optionalUrl,
  linkedin: optionalUrl,
});

const contactsMessengers = z.object({
  whatsapp: optionalText,
  viber: optionalText,
  telegram: optionalText,
});

const financeCalculator = z.object({
  termMonths: z.number().int().min(1).max(120),
  nominalRate: z.number().min(0).max(100),
  effectiveRateMin: z.number().min(0).max(100),
  effectiveRateMax: z.number().min(0).max(100),
  minDownPaymentRatio: z.number().min(0).max(1),
  maxDownPaymentRatio: z.number().min(0).max(1),
  defaultDownPaymentRatio: z.number().min(0).max(1),
  usdToAmd: z.number().positive().max(100_000),
  disclaimer: optionalText,
});

const featureToggles = z.object({
  blog: z.boolean(),
  quiz: z.boolean(),
  registrationInviteOnly: z.boolean(),
  maintenanceMode: z.boolean(),
});

/** The site's full locale set — reused by anything that stores per-language
 * content (e.g. `Faq.question`/`answer`), not just this `LOCALIZATION` setting. */
export const SUPPORTED_LOCALES = ['hy', 'ru', 'en'] as const;

const localizationLocales = z
  .object({
    defaultLocale: z.enum(SUPPORTED_LOCALES),
    enabledLocales: z.array(z.enum(SUPPORTED_LOCALES)).min(1, 'Enable at least one language'),
  })
  // A default the site is not allowed to serve would render every page in a
  // language that is switched off.
  .refine((value) => value.enabledLocales.includes(value.defaultLocale), {
    message: 'The default language must be one of the enabled languages',
    path: ['defaultLocale'],
  });

interface Definition<T extends z.ZodTypeAny> {
  group: SettingGroup;
  schema: T;
  defaults: z.input<T>;
  isPublic: boolean;
  label: string;
}

function define<T extends z.ZodTypeAny>(definition: Definition<T>) {
  return definition;
}

export const SETTINGS = {
  'branding.identity': define({
    group: SettingGroup.BRANDING,
    schema: brandingIdentity,
    isPublic: true,
    label: 'Brand identity',
    defaults: { brandName: 'AutoRoom', logoLightUrl: null, logoDarkUrl: null, faviconUrl: null },
  }),
  // Values sourced from the AutoRoom Figma file's "Foundation" canvas (Color
  // section: Primary Palette, Neutrals, Semantics) — not the earlier
  // placeholder palette. See apps/web's Tailwind config for the same source.
  'branding.theme': define({
    group: SettingGroup.BRANDING,
    schema: brandingTheme,
    isPublic: true,
    label: 'Theme colours',
    defaults: {
      accent: '#C8A24A',
      accentHover: '#A4853D',
      bg: '#0D0D0D',
      surface: '#3D3D3D',
      surfaceLight: '#F5F5F6',
      paper: '#FFFFFF',
      ink: '#0D0D0D',
      muted: '#666E73',
      lineDark: '#262626',
      lineLight: '#E7E7E9',
      success: '#3A9D75',
      warn: '#FF9E6D',
      info: '#4B7BEC',
    },
  }),
  'branding.typography': define({
    group: SettingGroup.BRANDING,
    schema: brandingTypography,
    isPublic: true,
    label: 'Typography',
    defaults: { display: 'Sora', body: 'Inter', armenian: 'Noto Sans Armenian' },
  }),
  'contacts.general': define({
    group: SettingGroup.CONTACTS,
    schema: contactsGeneral,
    isPublic: true,
    label: 'Contact details',
    defaults: { phones: [], email: null, workingHours: '10:00–22:00' },
  }),
  'contacts.social': define({
    group: SettingGroup.CONTACTS,
    schema: contactsSocial,
    isPublic: true,
    label: 'Social networks',
    defaults: { facebook: null, instagram: null, tiktok: null, linkedin: null },
  }),
  'contacts.messengers': define({
    group: SettingGroup.CONTACTS,
    schema: contactsMessengers,
    isPublic: true,
    label: 'Messengers',
    defaults: { whatsapp: null, viber: null, telegram: null },
  }),
  'finance.calculator': define({
    group: SettingGroup.FINANCE,
    schema: financeCalculator,
    isPublic: true,
    label: 'Loan calculator',
    defaults: {
      termMonths: 60,
      nominalRate: 15.9,
      effectiveRateMin: 17.11,
      effectiveRateMax: 17.19,
      minDownPaymentRatio: 0.1,
      maxDownPaymentRatio: 0.7,
      defaultDownPaymentRatio: 0.2,
      usdToAmd: 390,
      disclaimer: null,
    },
  }),
  'features.toggles': define({
    group: SettingGroup.FEATURES,
    schema: featureToggles,
    // Public: the site needs to know whether the quiz popup exists at all.
    isPublic: true,
    label: 'Feature toggles',
    defaults: {
      blog: true,
      quiz: true,
      registrationInviteOnly: false,
      maintenanceMode: false,
    },
  }),
  'localization.locales': define({
    group: SettingGroup.LOCALIZATION,
    schema: localizationLocales,
    isPublic: true,
    label: 'Languages',
    defaults: { defaultLocale: 'hy' as const, enabledLocales: ['hy' as const] },
  }),
};

export type SettingKey = keyof typeof SETTINGS;
export type SettingValue<K extends SettingKey> = z.output<(typeof SETTINGS)[K]['schema']>;

export const SETTING_KEYS = Object.keys(SETTINGS) as SettingKey[];

export function isSettingKey(key: string): key is SettingKey {
  return Object.prototype.hasOwnProperty.call(SETTINGS, key);
}

/**
 * Read one setting, defaults filling any gap.
 *
 * A stored row that no longer parses — schema tightened, row hand-edited — is
 * not fatal: the defaults are returned instead, because a settings row should
 * never be able to take the API down. It is logged so the drift is visible.
 */
export async function getSetting<K extends SettingKey>(key: K): Promise<SettingValue<K>> {
  const definition = SETTINGS[key];
  const row = await prisma.setting.findUnique({ where: { key } });

  const merged =
    row && typeof row.valueJson === 'object' && row.valueJson !== null
      ? { ...(definition.defaults as object), ...(row.valueJson as object) }
      : definition.defaults;

  const parsed = definition.schema.safeParse(merged);
  if (!parsed.success) {
    console.warn(`[settings] stored value for "${key}" is invalid; falling back to defaults`);
    return definition.schema.parse(definition.defaults) as SettingValue<K>;
  }
  return parsed.data as SettingValue<K>;
}

export interface SettingRecord {
  key: SettingKey;
  group: SettingGroup;
  label: string;
  isPublic: boolean;
  value: unknown;
  updatedAt: string | null;
  updatedBy: { id: string; name: string } | null;
}

/** Every setting, in registry order, for the admin's settings screens. */
export async function getAllSettings(): Promise<SettingRecord[]> {
  const rows = await prisma.setting.findMany({
    include: { updatedBy: { select: { id: true, name: true } } },
  });
  const byKey = new Map(rows.map((row) => [row.key, row]));

  return SETTING_KEYS.map((key) => {
    const definition = SETTINGS[key];
    const row = byKey.get(key);
    const merged =
      row && typeof row.valueJson === 'object' && row.valueJson !== null
        ? { ...(definition.defaults as object), ...(row.valueJson as object) }
        : definition.defaults;
    const parsed = definition.schema.safeParse(merged);

    return {
      key,
      group: definition.group,
      label: definition.label,
      isPublic: definition.isPublic,
      value: parsed.success ? parsed.data : definition.schema.parse(definition.defaults),
      updatedAt: row?.updatedAt.toISOString() ?? null,
      updatedBy: row?.updatedBy ?? null,
    };
  });
}

/**
 * Validate and persist one setting, recording who changed it and what moved.
 *
 * Throws `z.ZodError` on invalid input — the route turns that into a 400 with
 * per-field messages, so the form can point at the field that is wrong.
 */
export async function writeSetting(key: SettingKey, value: unknown, actorId?: string) {
  const definition = SETTINGS[key];
  const parsed = definition.schema.parse(value);
  const previous = await getSetting(key);

  await prisma.setting.upsert({
    where: { key },
    update: { valueJson: parsed as never, updatedById: actorId ?? null },
    create: {
      key,
      group: definition.group,
      valueJson: parsed as never,
      updatedById: actorId ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action: 'setting.update',
      resource: 'settings',
      resourceId: key,
      dataJson: { key, from: previous as never, to: parsed as never },
    },
  });

  invalidatePublicSettings();
  return parsed;
}

/* ------------------------------ public payload ------------------------------ */

export type PublicSettings = Record<string, unknown>;

/**
 * Cached because every page of the public site reads it, and it changes only
 * when someone saves in the admin. The write path clears it, so the TTL is a
 * backstop for changes made outside this process (a second instance, a manual
 * database edit) rather than the primary mechanism.
 */
const PUBLIC_TTL_MS = 60_000;
let publicCache: { value: PublicSettings; expiresAt: number } | null = null;

export function invalidatePublicSettings() {
  publicCache = null;
}

export async function getPublicSettings(): Promise<PublicSettings> {
  if (publicCache && publicCache.expiresAt > Date.now()) return publicCache.value;

  const entries = await Promise.all(
    SETTING_KEYS.filter((key) => SETTINGS[key].isPublic).map(
      async (key) => [key, await getSetting(key)] as const,
    ),
  );

  const value = Object.fromEntries(entries);
  publicCache = { value, expiresAt: Date.now() + PUBLIC_TTL_MS };
  return value;
}

/* -------------------------------- convenience ------------------------------- */

export type FeatureToggles = SettingValue<'features.toggles'>;

/** Used by `/auth/register` to decide whether open sign-up is allowed. */
export function getFeatureToggles(): Promise<FeatureToggles> {
  return getSetting('features.toggles');
}
