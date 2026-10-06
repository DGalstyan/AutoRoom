import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { TEST_DATABASE_URL } from './config';
import { createCar, disconnect, resetData } from './helpers';

const run = promisify(execFile);
const apiRoot = path.resolve(__dirname, '..');

/** Runs the real cleanup script as a child process against the test database. */
async function script(args: string[], env: Record<string, string> = {}) {
  return run('npx', ['tsx', 'prisma/removeDemoVinLot.ts', ...args], {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL, ...env },
  });
}

describe('removeDemoVinLot script', () => {
  beforeEach(resetData);
  afterAll(disconnect);

  async function seed() {
    const demo = await createCar({ vin: '5YJ3E1EA*XF000000', lotNumber: 'IAAI-48213077' });
    const real = await createCar({ vin: 'LW433B1K5N1000001', lotNumber: '58392011' });
    const odd = await createCar({ vin: 'ABC123', lotNumber: null });
    return { demo, real, odd };
  }

  it('dry run lists what it would clear and changes nothing', async () => {
    const { demo } = await seed();
    const { stdout } = await script([]);
    expect(stdout).toContain('WOULD CLEAR (2)');
    expect(stdout).toContain('5YJ3E1EA*XF000000');
    expect(stdout).toContain('Dry run');
    const after = await prisma.car.findUniqueOrThrow({ where: { id: demo.id } });
    expect(after.vin).toBe('5YJ3E1EA*XF000000');
    expect(after.lotNumber).toBe('IAAI-48213077');
  }, 60_000);

  it('refuses --apply without the confirmation variable', async () => {
    const { demo } = await seed();
    await expect(script(['--apply'])).rejects.toThrow();
    const after = await prisma.car.findUniqueOrThrow({ where: { id: demo.id } });
    expect(after.vin).toBe('5YJ3E1EA*XF000000');
  }, 60_000);

  it('--apply clears only the demo values, keeps the cars, and audits each change', async () => {
    const { demo, real, odd } = await seed();
    await script(['--apply'], { CONFIRM_REMOVE_DEMO_VIN_LOT: 'yes' });

    const demoAfter = await prisma.car.findUniqueOrThrow({ where: { id: demo.id } });
    expect(demoAfter.vin).toBeNull();
    expect(demoAfter.lotNumber).toBeNull();

    const realAfter = await prisma.car.findUniqueOrThrow({ where: { id: real.id } });
    expect(realAfter.vin).toBe('LW433B1K5N1000001');
    expect(realAfter.lotNumber).toBe('58392011');

    // A merely odd VIN is a "suspect": reported, not cleared.
    const oddAfter = await prisma.car.findUniqueOrThrow({ where: { id: odd.id } });
    expect(oddAfter.vin).toBe('ABC123');

    expect(await prisma.car.count()).toBe(3);
    const audit = await prisma.auditLog.findMany({ where: { action: 'demo_vin_lot.cleared' } });
    expect(audit).toHaveLength(2);
    expect(audit.map((a) => (a.dataJson as { previous: string }).previous).sort()).toEqual([
      '5YJ3E1EA*XF000000',
      'IAAI-48213077',
    ]);
  }, 60_000);

  it('--include-suspect also clears odd-looking values; --car forces one car', async () => {
    const { odd, real } = await seed();
    await script(['--apply', '--include-suspect', `--car=${real.id}`], {
      CONFIRM_REMOVE_DEMO_VIN_LOT: 'yes',
    });
    expect((await prisma.car.findUniqueOrThrow({ where: { id: odd.id } })).vin).toBeNull();
    const realAfter = await prisma.car.findUniqueOrThrow({ where: { id: real.id } });
    expect(realAfter.vin).toBeNull();
    expect(realAfter.lotNumber).toBeNull();
  }, 60_000);

  it('also clears demo values copied onto leads', async () => {
    await prisma.lead.create({
      data: {
        name: 'Anna',
        phone: '+374 77 123456',
        carVin: '1FTFW1E5*NF000000',
        carLot: '58392011',
        sourcePage: '/',
        sourceCta: 'x',
        locale: 'hy',
        device: 'desktop',
      },
    });
    await script(['--apply'], { CONFIRM_REMOVE_DEMO_VIN_LOT: 'yes' });
    const lead = await prisma.lead.findFirstOrThrow();
    expect(lead.carVin).toBeNull();
    expect(lead.carLot).toBe('58392011');
  }, 60_000);
});
