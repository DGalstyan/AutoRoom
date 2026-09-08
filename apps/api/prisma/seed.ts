import crypto from 'node:crypto';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import {
  CarCondition,
  CarOrigin,
  FaqTopic,
  ImageAlbum,
  Powertrain,
  Prisma,
  PrismaClient,
  SettingGroup,
  UserStatus,
  type PermissionAction,
} from '@prisma/client';
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

/**
 * Homepage "Շաբաթվա լավագույն առաջարկները" sample inventory. The four photos
 * (`public/images/home/featured-{1..4}.jpg`, real stock exported from Figma's
 * own mock) were already sitting in the web app unused — no `Car` row
 * pointed at them, so `FeaturedCars` rendered nothing in a fresh dev
 * environment. Wires them up as real, `featured: true` listings.
 *
 * `CHINA_CARS` similarly seeds the `/china` listing grid, which otherwise
 * has nothing to show in a fresh environment — reuses the two China-side
 * images that already exist (`direction-china.webp`,
 * `china/ecosystem-strip.jpg`) and the makes/models already referenced by
 * the Homepage `CustomerStoryWall` mock stories, for continuity. One car
 * (`byd-song-plus-promo`) carries `oldPrice`/`promoDeadline` so `CarCard`'s
 * "Ակցիա" countdown path renders too, not just the plain-condition path.
 *
 * TODO(client): this is sample inventory for local development, not real
 * stock — replace with the client's actual cars via the admin panel.
 */
const FEATURED_CARS = [
  {
    slug: 'mclaren-720s-orange',
    make: 'McLaren',
    model: '720S',
    year: 2019,
    price: 250_000,
    image: '/images/home/featured-1.jpg',
  },
  {
    slug: 'mclaren-720s-spider-red',
    make: 'McLaren',
    model: '720S Spider',
    year: 2020,
    price: 265_000,
    image: '/images/home/featured-2.jpg',
  },
  {
    slug: 'bmw-m4-competition',
    make: 'BMW',
    model: 'M4 Competition',
    year: 2022,
    price: 78_000,
    image: '/images/home/featured-3.jpg',
  },
  {
    slug: 'mclaren-720s-silver',
    make: 'McLaren',
    model: '720S',
    year: 2021,
    price: 258_000,
    image: '/images/home/featured-4.jpg',
  },
] as const;

const CHINA_CARS = [
  {
    slug: 'byd-seal-china',
    make: 'BYD',
    model: 'Seal',
    year: 2024,
    trim: 'Performance',
    price: 34_000,
    condition: CarCondition.IN_STOCK,
    image: '/images/home/direction-china.webp',
  },
  {
    slug: 'zeekr-001-china',
    make: 'Zeekr',
    model: '001',
    year: 2024,
    trim: null,
    price: 42_000,
    condition: CarCondition.ON_ORDER,
    image: '/images/china/ecosystem-strip.jpg',
  },
  {
    slug: 'byd-song-plus-promo',
    make: 'BYD',
    model: 'Song Plus',
    year: 2023,
    trim: null,
    price: 27_500,
    oldPrice: 31_000,
    promoDeadline: new Date('2026-12-31'),
    condition: CarCondition.IN_STOCK,
    image: '/images/home/direction-china.webp',
  },
] as const;

/**
 * Matched on `slug` (unique). Re-running keeps existing rows featured and
 * published rather than fighting an admin who has since edited them — only
 * a missing car or a missing primary photo gets created.
 */
async function seedCars() {
  for (const car of FEATURED_CARS) {
    const record = await prisma.car.upsert({
      where: { slug: car.slug },
      update: {},
      create: {
        slug: car.slug,
        make: car.make,
        model: car.model,
        year: car.year,
        origin: CarOrigin.USA,
        condition: CarCondition.IN_STOCK,
        powertrain: Powertrain.BENZIN,
        price: car.price,
        featured: true,
        publishedAt: new Date(),
      },
    });

    const existingImage = await prisma.carImage.findFirst({
      where: { carId: record.id, album: ImageAlbum.EXTERIOR },
    });
    if (!existingImage) {
      await prisma.carImage.create({
        data: { carId: record.id, album: ImageAlbum.EXTERIOR, url: car.image, position: 0 },
      });
    }
  }

  for (const car of CHINA_CARS) {
    const record = await prisma.car.upsert({
      where: { slug: car.slug },
      update: {},
      create: {
        slug: car.slug,
        make: car.make,
        model: car.model,
        year: car.year,
        trim: car.trim,
        origin: CarOrigin.CHINA,
        condition: car.condition,
        powertrain: Powertrain.EV,
        price: car.price,
        oldPrice: 'oldPrice' in car ? car.oldPrice : null,
        promoDeadline: 'promoDeadline' in car ? car.promoDeadline : null,
        featured: false,
        financingAvailable: true,
        publishedAt: new Date(),
      },
    });

    const existingImage = await prisma.carImage.findFirst({
      where: { carId: record.id, album: ImageAlbum.EXTERIOR },
    });
    if (!existingImage) {
      await prisma.carImage.create({
        data: { carId: record.id, album: ImageAlbum.EXTERIOR, url: car.image, position: 0 },
      });
    }
  }

  console.log(`  cars: ${FEATURED_CARS.length} featured, ${CHINA_CARS.length} China listing`);
}

// TODO(client): real names, titles and photos for the About page's "Մեր
// թիմը" grid — placeholder names/titles only, same convention as Figma's own
// mock content for this card (a stock photo + a plausible name). No photo is
// seeded (none exist yet); the admin panel's "missing photo" warning already
// flags this until a real one is uploaded.
const TEAM_MEMBERS = [
  { name: 'Դավիթ Պետրոսյան', title: 'CEO' },
  { name: 'Անի Սարգսյան', title: 'COO' },
  { name: 'Արամ Հակոբյան', title: 'Head of Logistics' },
  { name: 'Լիլիթ Ղազարյան', title: 'Customer Success' },
];

/**
 * FAQ, transcribed from `references/faq.md`.
 *
 * The ten China questions are seeded with `answer: null` because that is the
 * truth: the spec gives the questions verbatim and records that the content
 * team has not written the answers. They arrive as drafts, invisible to the
 * public site, and become visible the moment somebody writes an answer and
 * publishes — which is exactly the workflow the screen is for.
 *
 * The GENERAL set is answered in the spec and is seeded published.
 */
const FAQ_CHINA_QUESTIONS = [
  'Կարո՞ղ եմ պատվիրել կոնկրետ գույնով',
  'Լիցքավորիչը ներառվա՞ծ է մեքենայի հետ',
  'Գինը վերջնական է, թե կարող է փոխվել',
  'Կարո՞ղ եմ մեքենան գնել ապառիկով',
  'Որքա՞ն է տևում Չինաստանից ներմուծումը',
  'Երաշխիք կա՞',
  'Ինչ փաստաթղթեր են տրամադրվում',
  'Կարո՞ղ եմ պատվիրել կոնկրետ կոմպլեկտացիա',
  'Ինչպե՞ս է կազմակերպվում մաքսազերծումը',
  'Ի՞նչ է լինում, եթե ճանապարհին ուշացում է լինում',
];

const FAQ_GENERAL: { question: string; answer: string }[] = [
  {
    question: 'Որքա՞ն ժամանակում կժամանի մեքենան, եթե պատվիրեմ Չինաստանից։',
    answer:
      'Մեքենայի ժամկետը կախված է տեղափոխման եղանակից․ ավտոկուզով տեղափոխման դեպքում ժամկետը սովորաբար ավելի արագ է լինում, իսկ էվակուատորով՝ ըստ երթուղու և կազմակերպման պայմանների։ Վերջնական ժամկետը հաստատվում է պատվերի և տեղափոխման տարբերակի ընտրությունից հետո: Սովորաբար տևում է մոտ 1 ամիս:',
  },
  {
    question: 'Ինչպե՞ս է կատարվում վճարումը։',
    answer:
      'Վճարումը սովորաբար կատարվում է փուլերով՝ ըստ ծառայության ընթացքի և պայմանավորված կարգի։ Մեքենայի ներմուծման վճարման փուլերն են՝\nՓՈՒԼ 1 - Նախնական՝ ձեռքբերման գումար (արժեքի մոտ 60%-ի չափով)\nՓՈՒԼ 2 - Տեղափոխման վճար + ընկերության ծառայության գումար\nՓՈՒԼ 3 - Մաքսազերծման վճար',
  },
  {
    question: 'Ինչպե՞ս է կնքվում պայմանագիրը՝ ֆիրմայի և անհատի դեպքում։',
    answer:
      'Պայմանագիրը կարող է կնքվել թե՛ իրավաբանական անձի, թե՛ անհատի հետ՝ համապատասխան տվյալների և փաստաթղթերի հիման վրա։ Պայմանագրի ձևաչափը ընտրվում է հաճախորդի իրավական կարգավիճակից ելնելով:',
  },
  {
    question: 'Ինչպե՞ս է ձևավորվում գինը։',
    answer:
      'Գինը հաշվարկվում է՝ կախված մեքենայի մոդելից, ձեռքբերման երկրից, տեղափոխման եղանակից և լրացուցիչ ծառայություններից։ Մոտավոր վերջնական արժեքը կարող ես նախապես հաշվարկել կայքի մաքսազերծման հաշվիչի միջոցով, իսկ ճշգրիտ առաջարկը մեր մասնագետը կտրամադրի անհատապես՝ բոլոր ծախսերը ներառելով:',
  },
  {
    question: 'Արդյո՞ք մեքենայի վերանորոգումը ներառված է գնի մեջ։',
    answer:
      'Վերանորոգումը սովորաբար չի ներառվում հիմնական արժեքի մեջ, եթե դա առանձին չի համաձայնեցվել։ AutoRoom-ը կարող է առաջարկել վերանորոգման կամ նախապատրաստման ծառայություններ՝ ըստ անհրաժեշտության:',
  },
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

/**
 * Matched on name, same as branches — there is no unique constraint on
 * `TeamMember.name` (two people can share one), but this seed list only
 * ever contains one of each, so `findFirst` is enough to keep re-running
 * idempotent without clobbering a photo an admin has since uploaded.
 */
async function seedTeam() {
  for (const [index, member] of TEAM_MEMBERS.entries()) {
    const existing = await prisma.teamMember.findFirst({ where: { name: member.name } });
    if (existing) {
      await prisma.teamMember.update({ where: { id: existing.id }, data: { position: index } });
    } else {
      await prisma.teamMember.create({ data: { ...member, position: index } });
    }
  }

  console.log(`  team: ${TEAM_MEMBERS.length}`);
}

/**
 * Matched on the question text, since that is what identifies an entry before
 * it has an id anywhere. Existing rows keep their answer and publish state —
 * re-running the seed must never unpublish something an editor wrote.
 */
async function seedFaq() {
  const entries = [
    ...FAQ_CHINA_QUESTIONS.map((question, index) => ({
      topic: FaqTopic.CHINA,
      question,
      answer: null as string | null,
      position: index,
      publish: false,
    })),
    ...FAQ_GENERAL.map((entry, index) => ({
      topic: FaqTopic.GENERAL,
      question: entry.question,
      answer: entry.answer as string | null,
      position: index,
      publish: true,
    })),
  ];

  for (const entry of entries) {
    // Every row's `question` is `{ hy, ru?, en? }` (see the `Faq` model doc);
    // the seed only ever writes Armenian, so matching on `hy` is matching on
    // the question this list gives.
    const existing = await prisma.faq.findFirst({
      where: { topic: entry.topic, question: { path: ['hy'], equals: entry.question } },
    });

    if (existing) {
      await prisma.faq.update({
        where: { id: existing.id },
        data: { position: entry.position },
      });
      continue;
    }

    await prisma.faq.create({
      data: {
        topic: entry.topic,
        question: { hy: entry.question },
        answer: entry.answer ? { hy: entry.answer } : Prisma.DbNull,
        position: entry.position,
        publishedAt: entry.publish && entry.answer ? new Date() : null,
      },
    });
  }

  const drafts = await prisma.faq.count({ where: { publishedAt: null } });
  console.log(`  faq: ${entries.length} (${drafts} awaiting an answer)`);
}

/* ------------------------------------ main ------------------------------------- */

async function main() {
  console.log('Seeding AutoRoom database…');
  await seedRolesAndPermissions();
  await seedSuperAdmin();
  await seedSettings();
  await seedBranchesAndBanks();
  await seedCars();
  await seedTeam();
  await seedFaq();

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
