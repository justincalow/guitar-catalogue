import { describe, expect, it } from 'vitest';
import { filterGuitars, uniqueMakes } from './search';
import type { Guitar } from './types';

function guitar(overrides: Partial<Guitar>): Guitar {
  return {
    id: '1',
    make: 'Fender',
    model: 'Stratocaster',
    year: 1962,
    serialNumber: 'ABC123',
    type: 'electric',
    colour: 'Sunburst',
    strings: 6,
    pickupConfig: 'SSS',
    purchaseDate: '',
    purchasePrice: null,
    estimatedValue: null,
    conditionNotes: 'Light checking',
    notes: 'Maple neck',
    photos: [],
    photoPaths: [],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('filterGuitars', () => {
  const collection = [
    guitar({ id: '1' }),
    guitar({
      id: '2',
      make: 'Martin',
      model: 'D-28',
      type: 'acoustic',
      serialNumber: 'M9988',
      notes: 'Sitka top',
      colour: 'Natural',
      pickupConfig: '',
    }),
    guitar({
      id: '3',
      make: 'Fender',
      model: 'Precision Bass',
      type: 'bass',
      serialNumber: 'B440',
      notes: 'Alder body',
    }),
  ];

  it('returns all guitars with empty filters', () => {
    expect(filterGuitars(collection, {})).toHaveLength(3);
  });

  it('filters by type', () => {
    expect(filterGuitars(collection, { type: 'acoustic' }).map((g) => g.id)).toEqual([
      '2',
    ]);
  });

  it('filters by make, case-insensitively', () => {
    expect(filterGuitars(collection, { make: 'fender' })).toHaveLength(2);
  });

  it('matches free text across make, model, serial, and notes', () => {
    expect(filterGuitars(collection, { query: 'sitka' }).map((g) => g.id)).toEqual([
      '2',
    ]);
    expect(filterGuitars(collection, { query: 'abc123' }).map((g) => g.id)).toEqual([
      '1',
    ]);
    expect(filterGuitars(collection, { query: 'precision' }).map((g) => g.id)).toEqual([
      '3',
    ]);
  });

  it('combines type and query', () => {
    expect(
      filterGuitars(collection, { type: 'electric', query: 'fender' }).map((g) => g.id),
    ).toEqual(['1']);
  });
});

describe('uniqueMakes', () => {
  it('returns sorted unique makes', () => {
    expect(
      uniqueMakes([
        guitar({ make: 'Gibson' }),
        guitar({ make: 'Fender' }),
        guitar({ make: 'Gibson' }),
      ]),
    ).toEqual(['Fender', 'Gibson']);
  });
});
