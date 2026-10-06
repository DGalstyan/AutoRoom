import path from 'node:path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { classifyLot, classifyVin } from '../src/lib/demoVinLot';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

/**
 * Removes demo / placeholder VIN and auction-lot values from the database.
 *
 *   DRY RUN (default, changes nothing):
 *     npx tsx prisma/removeDemoVinLot.ts
 *   APPLY:
 *     CONFIRM_REMOVE_DEMO_VIN_LOT=yes npx tsx prisma/removeDemoVinLot.ts --apply
 *
 * What it does — and does not do:
 *  - Looks at `Car.vin` / `Car.lotNumber` and `Lead.carVin` / `Lead.carLot`.
 *  - Clears (sets to NULL) only values recognised as *definite* placeholders
 *    (see `src/lib/demoVinLot.ts`): the sample values the repo shipped with,
 *    masked VINs containing `*`, all-zero serials, "test"/"demo" words, …
 *  - Never deletes a car, order or lead — only blanks the VIN/lot field.
 *  - Values that merely look odd ("suspects", e.g. not 17 characters) are
 *    listed but left alone unless you pass `--include-suspect`.
 *  - Every cleared value is written to the audit log with its previous value,
 *    so the change is reversible by hand.
 *
 * Extra things to treat as demo (after reading a dry run):
 *   --vin=<VIN> --lot=<LOT>   (repeatable)
 *   --car=<carId>             clear VIN+lot on that car regardless of pattern
 */

interface Args {
  apply: boolean;
  includeSuspect: boolean;
  vins: string[];
  lots: string[];
  carIds: string[];
}

function parseArgs(argv: string[]): Args {
  const args: Args = { apply: false, includeSuspect: false, vins: [], lots: [], carIds: [] };
  for (const arg of argv) {
    if (arg === '--apply') args.apply = true;
    else if (arg === '--include-suspect') args.includeSuspect = true;
    else if (arg.startsWith('--vin=')) args.vins.push(arg.slice(6));
    else if (arg.startsWith('--lot=')) args.lots.push(arg.slice(6));
    else if (arg.startsWith('--car=')) args.carIds.push(arg.slice(6));
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

type Change = {
  table: 'cars' | 'leads';
  id: string;
  label: string;
  field: string;
  value: string;
  reason: string;
  kind: 'demo' | 'suspect' | 'forced';
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const changes: Change[] = [];

  const cars = await prisma.car.findMany({
    where: { OR: [{ vin: { not: null } }, { lotNumber: { not: null } }] },
    select: { id: true, slug: true, make: true, model: true, vin: true, lotNumber: true },
  });
  for (const car of cars) {
    const label = `${car.make} ${car.model} (${car.slug})`;
    const forced = args.carIds.includes(car.id);
    const vin = classifyVin(car.vin, args.vins);
    const lot = classifyLot(car.lotNumber, args.lots);
    if (car.vin && (forced || vin.kind !== 'ok')) {
      changes.push({
        table: 'cars',
        id: car.id,
        label,
        field: 'vin',
        value: car.vin,
        reason: forced ? 'forced by --car' : (vin.reason ?? ''),
        kind: forced ? 'forced' : (vin.kind as 'demo' | 'suspect'),
      });
    }
    if (car.lotNumber && (forced || lot.kind !== 'ok')) {
      changes.push({
        table: 'cars',
        id: car.id,
        label,
        field: 'lotNumber',
        value: car.lotNumber,
        reason: forced ? 'forced by --car' : (lot.reason ?? ''),
        kind: forced ? 'forced' : (lot.kind as 'demo' | 'suspect'),
      });
    }
  }

  const leads = await prisma.lead.findMany({
    where: { OR: [{ carVin: { not: null } }, { carLot: { not: null } }] },
    select: { id: true, name: true, carName: true, carVin: true, carLot: true },
  });
  for (const lead of leads) {
    const label = `lead ${lead.id} — ${lead.carName ?? ''}`.trim();
    const vin = classifyVin(lead.carVin, args.vins);
    const lot = classifyLot(lead.carLot, args.lots);
    if (lead.carVin && vin.kind !== 'ok')
      changes.push({
        table: 'leads',
        id: lead.id,
        label,
        field: 'carVin',
        value: lead.carVin,
        reason: vin.reason ?? '',
        kind: vin.kind as 'demo' | 'suspect',
      });
    if (lead.carLot && lot.kind !== 'ok')
      changes.push({
        table: 'leads',
        id: lead.id,
        label,
        field: 'carLot',
        value: lead.carLot,
        reason: lot.reason ?? '',
        kind: lot.kind as 'demo' | 'suspect',
      });
  }

  const willClear = changes.filter((c) => c.kind !== 'suspect' || args.includeSuspect);
  const skipped = changes.filter((c) => !willClear.includes(c));

  console.log(
    `Scanned ${cars.length} car(s) and ${leads.length} lead(s) that have a VIN or lot.\n`,
  );
  const print = (title: string, rows: Change[]) => {
    console.log(`${title} (${rows.length})`);
    for (const c of rows)
      console.log(`  [${c.kind}] ${c.table}.${c.field}  ${c.value}   ← ${c.label}   (${c.reason})`);
    console.log();
  };
  print(args.apply ? 'CLEARING' : 'WOULD CLEAR', willClear);
  if (skipped.length)
    print('SUSPECT — left alone (re-run with --include-suspect to clear)', skipped);

  if (!args.apply) {
    console.log(
      'Dry run — nothing was changed. Re-run with --apply (and CONFIRM_REMOVE_DEMO_VIN_LOT=yes) to clear the rows above.',
    );
    return;
  }
  if (process.env.CONFIRM_REMOVE_DEMO_VIN_LOT !== 'yes') {
    throw new Error('Refusing to apply: set CONFIRM_REMOVE_DEMO_VIN_LOT=yes.');
  }

  await prisma.$transaction(async (tx) => {
    for (const c of willClear) {
      if (c.table === 'cars') {
        await tx.car.update({ where: { id: c.id }, data: { [c.field]: null } });
      } else {
        await tx.lead.update({ where: { id: c.id }, data: { [c.field]: null } });
      }
      await tx.auditLog.create({
        data: {
          actorId: null,
          action: 'demo_vin_lot.cleared',
          resource: c.table,
          resourceId: c.id,
          dataJson: { field: c.field, previous: c.value, reason: c.reason },
        },
      });
    }
  });
  console.log(
    `Done — cleared ${willClear.length} value(s). Previous values are in the audit log (action "demo_vin_lot.cleared").`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
