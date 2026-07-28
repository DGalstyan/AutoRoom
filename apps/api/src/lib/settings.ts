import { prisma } from './prisma';

/**
 * Reads for the grouped settings rows. A3 builds the full typed module with
 * validation, auditing and a cached public endpoint on top of this; A1 only
 * needs one flag, so this stays deliberately small rather than pre-building an
 * abstraction A3 would replace.
 */

export interface FeatureToggles {
  machinery: boolean;
  blog: boolean;
  quiz: boolean;
  registrationInviteOnly: boolean;
  maintenanceMode: boolean;
}

const FEATURE_DEFAULTS: FeatureToggles = {
  machinery: true,
  blog: true,
  quiz: true,
  registrationInviteOnly: false,
  maintenanceMode: false,
};

export async function getFeatureToggles(): Promise<FeatureToggles> {
  const row = await prisma.setting.findUnique({ where: { key: 'features.toggles' } });
  if (!row || typeof row.valueJson !== 'object' || row.valueJson === null) {
    return FEATURE_DEFAULTS;
  }
  // Defaults win over missing keys so a partially-written row cannot, say,
  // leave `registrationInviteOnly` undefined and read as "open registration".
  return { ...FEATURE_DEFAULTS, ...(row.valueJson as Partial<FeatureToggles>) };
}
