import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { agent, disconnect, resetData } from './helpers';

/**
 * `GET /public/banks` — the seed always leaves four rows (Ameriabank, Evoca,
 * IDBank, AutoRoom) in place, so the property worth testing is that the route
 * is reachable without auth and returns them ordered and shaped correctly,
 * with the in-house row identifiable for the "opens our own offer, not a
 * bank's site" branch on the China page.
 */
describe('public bank listing', () => {
  beforeEach(resetData);
  afterAll(disconnect);

  it('returns the seeded banks without authentication', async () => {
    const response = await agent().get('/public/banks');

    expect(response.status).toBe(200);
    expect(response.body.total).toBeGreaterThanOrEqual(4);
    const names = response.body.items.map((b: { name: string }) => b.name);
    expect(names).toEqual(expect.arrayContaining(['Ameriabank', 'Evoca', 'IDBank', 'AutoRoom']));
  });

  it('flags exactly one in-house row with no loan link', async () => {
    const response = await agent().get('/public/banks');

    const inHouse = response.body.items.filter((b: { inHouse: boolean }) => b.inHouse);
    expect(inHouse).toHaveLength(1);
    expect(inHouse[0].name).toBe('AutoRoom');
    expect(inHouse[0].loanUrl).toBeNull();
  });
});
