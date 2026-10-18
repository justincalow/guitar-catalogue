import { describe, expect, it } from 'vitest';
import { emptyDraft, type Guitar } from '../types';
import { collectionTotals } from './totals';

function item(overrides: Partial<Guitar>): Guitar {
  return {
    id: '1',
    ...emptyDraft,
    make: 'Fender',
    model: 'Strat',
    photoPaths: [],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('collectionTotals', () => {
  it('sums insurance high and for-sale list price, times quantity, in the current view', () => {
    const totals = collectionTotals([
      item({
        id: 'sale',
        status: 'for_sale',
        listPrice: 200,
        quantity: 2,
        insuranceHigh: 250,
        insuranceLow: 200,
      }),
      item({
        id: 'keep',
        status: 'keeping',
        listPrice: 9000,
        insuranceLow: 100,
        insuranceHigh: null,
        quantity: 1,
      }),
      item({ id: 'text', status: 'tbd', insuranceValue: '40-60', quantity: 1 }),
    ]);
    expect(totals.insuranceValue).toBe(250 * 2 + 100 + 40);
    expect(totals.forSaleListValue).toBe(400);
    expect(totals.count).toBe(3);
  });
});
