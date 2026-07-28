import crypto from 'node:crypto';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { PrismaClient, SettingGroup, UserStatus, type PermissionAction } from '@prisma/client';
import { ROLES, allPermissions, permissionsForRole } from '../src/rbac/permissions';

/**
 * Seed for A0. Idempotent — every write is an upsert, so running it against an
 * already-seeded database repairs drift instead of failing.
 *
 * Values are transcribed from the reference docs (`references/branches.md`,
 * `references/design-tokens.md`, `references/admin.md`), which stay the source
 * of truth until the admin panel takes over editing them. The public site's
 * `apps/web/data/*.ts` files hold the same values today; those disappear at E2
 * when the site starts reading from this API.
 */

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

/* ----------------------------- roles & permissions ----------------------------- */

async function seedRolesAndPermissions() {
  const permissions = allPermissions();

  for (const { resource, action } of permissions) {
    await prisma.permission.upsert({
      where: { resource_action: { resource, action: action as PermissionAction } },
      update: {},
      create: { resource, action: action as PermissionAction },
    });
  }

  const stored = await prisma.permission.findMany();
  const permissionId = new Map(stored.map((p) => [`${p.resource}:${p.action}`, p.id]));

  for (const definition of ROLES) {
    const role = await prisma.role.upsert({
      where: { key: definition.key },
      update: { name: definition.name, description: definition.description, isSystem: true },
      create: {
        key: definition.key,
        name: definition.name,
        description: definition.description,
        isSystem: true,
      },
    });

    const wanted = permissionsForRole(definition)
      .map(({ resource, action }) => permissionId.get(`${resource}:${action}`))
      .filter((id): id is string => Boolean(id));

    // Replace the role's grants wholesale so a permission removed from the
    // matrix is actually revoked, not just left behind.
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id, permissionId: { notIn: wanted } },
    });
    await prisma.rolePermission.createMany({
      data: wanted.map((id) => ({ roleId: role.id, permissionId: id })),
      skipDuplicates: true,
    });
  }

  console.log(`  roles: ${ROLES.length}, permissions: ${permissions.length}`);
}

/* --------------------------------- super admin --------------------------------- */

async function seedSuperAdmin() {
  const email = (process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@autoroom.am').toLowerCase();
  const name = process.env.SEED_SUPER_ADMIN_NAME ?? 'AutoRoom Admin';
  const configured = process.env.SEED_SUPER_ADMIN_PASSWORD?.trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`  super_admin: ${email} (already exists, password untouched)`);
    return;
  }

  // No hardcoded fallback: an unset password produces a strong random one that
  // is printed exactly once rather than committed to a public repo.
  const password = configured || crypto.randomBytes(15).toString('base64url');
  const role = await prisma.role.findUniqueOrThrow({ where: { key: 'super_admin' } });

  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      status: UserStatus.ACTIVE,
      roleId: role.id,
    },
  });

  console.log(`  super_admin: ${email}`);
  if (!configured) {
    console.log('');
    console.log('  ┌─────────────────────────────────────────────────────────────┐');
    console.log('  │ Generated super_admin password — shown once, not stored:    │');
    console.log(`  │   ${password.padEnd(58)}│`);
    console.log('  │ Set SEED_SUPER_ADMIN_PASSWORD in apps/api/.env to choose it.│');
    console.log('  └─────────────────────────────────────────────────────────────┘');
    console.log('');
  }
}

/* ---------------------------------- settings ----------------------------------- */

/** From references/branches.md — the one place addresses and phones are written. */
const BRANCHES = [
  {
    name: 'Մասնաճյուղ N1',
    city: 'Երևան',
    address: 'Սայաթ-Նովա 20',
    phone: '+374 94 077757',
    hours: '10:00–22:00',
  },
  {
    name: 'Մասնաճյուղ N2',
    city: 'Արմավիր',
    address: 'Հանրապետության 37/31',
    phone: '+374 77 838750',
    hours: '10:00–22:00',
  },
  {
    name: 'Մասնաճյուղ N3',
    city: 'Էջմիածին',
    address: 'Վազգեն Առաջին 5/53',
    phone: '+374 98 349400',
    hours: '10:00–22:00',
  },
  // TODO(client): references/branches.md notes a 4th pin (2nd Armavir point) on
  // the BranchMap that the company address list does not cover. Add it here once
  // its address and phone are confirmed.
];

const BANKS = [
  // TODO(client): logo assets, and the banks' actual auto-loan application URLs
  // — these are the partners' home domains, not verified deep links.
  { name: 'Ameriabank', loanUrl: 'https://ameriabank.am', inHouse: false },
  { name: 'Evoca', loanUrl: 'https://evoca.am', inHouse: false },
  { name: 'IDBank', loanUrl: 'https://idbank.am', inHouse: false },
  { name: 'AutoRoom', loanUrl: null, inHouse: true },
];

const SETTINGS: { key: string; group: SettingGroup; value: unknown }[] = [
  {
    key: 'branding.identity',
    group: SettingGroup.BRANDING,
    value: {
      brandName: 'AutoRoom',
      // TODO(client): brand assets pending.
      logoLightUrl: null,
      logoDarkUrl: null,
      faviconUrl: null,
    },
  },
  {
    key: 'branding.theme',
    group: SettingGroup.BRANDING,
    // Mirrors references/design-tokens.md. Once A6 can edit these they override
    // the compiled Tailwind theme at runtime, which is what makes the site
    // white-labelable.
    value: {
      accent: '#E4002B',
      accentHover: '#B80022',
      bg: '#0B0B0F',
      surface: '#14141A',
      surfaceLight: '#F6F7F9',
      paper: '#FFFFFF',
      ink: '#0B0B0F',
      muted: '#8A8F98',
      lineDark: '#26262E',
      lineLight: '#E6E8EC',
      success: '#1FA971',
      warn: '#E6A100',
      info: '#2F6BFF',
    },
  },
  {
    key: 'branding.typography',
    group: SettingGroup.BRANDING,
    value: {
      display: 'Sora',
      body: 'Inter',
      // Sora and Inter carry no Armenian glyphs; this is the fallback that does.
      armenian: 'Noto Sans Armenian',
    },
  },
  {
    key: 'contacts.general',
    group: SettingGroup.CONTACTS,
    value: {
      phones: BRANCHES.map((branch) => branch.phone),
      // TODO(client): public email address.
      email: null,
      workingHours: '10:00–22:00',
    },
  },
  {
    key: 'contacts.social',
    group: SettingGroup.CONTACTS,
    // The About page specifies these four networks; URLs pending.
    value: { facebook: null, instagram: null, tiktok: null, linkedin: null },
  },
  {
    key: 'contacts.messengers',
    group: SettingGroup.CONTACTS,
    value: { whatsapp: null, viber: null, telegram: null },
  },
  {
    key: 'finance.calculator',
    group: SettingGroup.FINANCE,
    value: {
      termMonths: 60,
      nominalRate: 15.9,
      effectiveRateMin: 17.11,
      effectiveRateMax: 17.19,
      minDownPaymentRatio: 0.1,
      maxDownPaymentRatio: 0.7,
      defaultDownPaymentRatio: 0.2,
      // TODO(client): confirm the rate to quote at, or wire a daily source.
      usdToAmd: 390,
      disclaimer:
        'Տոկոսադրույքի մեջ ներառված է ԿԱՍԿՈ ապահովագրությունը։ Հաշվարկը մոտավոր է և վերջնական չէ։',
    },
  },
  {
    key: 'features.toggles',
    group: SettingGroup.FEATURES,
    value: {
      machinery: true,
      blog: true,
      quiz: true,
      registrationInviteOnly: false,
      maintenanceMode: false,
    },
  },
  {
    key: 'localization.locales',
    group: SettingGroup.LOCALIZATION,
    value: { defaultLocale: 'hy', enabledLocales: ['hy'] },
  },
];

async function seedSettings() {
  for (const setting of SETTINGS) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      // Never clobber a value an admin has since edited; the seed only fills gaps.
      update: { group: setting.group },
      create: {
        key: setting.key,
        group: setting.group,
        valueJson: setting.value as never,
      },
    });
  }
  console.log(`  settings: ${SETTINGS.length}`);
}

async function seedBranchesAndBanks() {
  for (const [index, branch] of BRANCHES.entries()) {
    const existing = await prisma.branch.findFirst({ where: { name: branch.name } });
    if (existing) {
      await prisma.branch.update({
        where: { id: existing.id },
        data: { ...branch, position: index },
      });
    } else {
      await prisma.branch.create({ data: { ...branch, position: index } });
    }
  }

  for (const [index, bank] of BANKS.entries()) {
    await prisma.bank.upsert({
      where: { name: bank.name },
      update: { loanUrl: bank.loanUrl, inHouse: bank.inHouse, position: index },
      create: { ...bank, position: index },
    });
  }

  console.log(`  branches: ${BRANCHES.length}, banks: ${BANKS.length}`);
}

/* ------------------------------------ main ------------------------------------- */

async function main() {
  console.log('Seeding AutoRoom database…');
  await seedRolesAndPermissions();
  await seedSuperAdmin();
  await seedSettings();
  await seedBranchesAndBanks();

  await prisma.auditLog.create({
    data: {
      action: 'system.seed',
      resource: 'system',
      dataJson: { roles: ROLES.length, settings: SETTINGS.length },
    },
  });

  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
