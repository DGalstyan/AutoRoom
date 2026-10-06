import { describe, expect, it } from 'vitest';
import { MOCK_CARS } from '@/lib/data/mockCars';

describe('sample cars', () => {
  it('carry no demo VIN or auction lot (they must never reach visitors)', () => {
    for (const car of MOCK_CARS) {
      expect(car.vin ?? null, `${car.slug} VIN`).toBeNull();
      expect(car.lotNumber ?? null, `${car.slug} lot`).toBeNull();
    }
  });
});
