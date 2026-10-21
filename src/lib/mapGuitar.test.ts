import { describe, expect, it } from 'vitest';
import { emptyDraft } from '../types';
import {
  classifyDraftPhotos,
  draftToRow,
  mapGuitarRow,
  removedPhotoPaths,
  toNumber,
} from './mapGuitar';
import type { GuitarRow } from './mapGuitar';

const row: GuitarRow = {
  id: 'g1',
  user_id: 'u1',
  make: 'Fender',
  model: 'Stratocaster',
  year: 1962,
  serial_number: 'ABC123',
  type: 'electric',
  colour: 'Sunburst',
  strings: 6,
  pickup_config: 'SSS',
  purchase_date: '2020-01-15',
  purchase_price: '1200.50',
  estimated_value: 2400,
  condition_notes: 'Light checking',
  notes: 'Maple neck',
  photos: ['u1/g1/a.jpg'],
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-02T00:00:00.000Z',
};

describe('mapGuitarRow', () => {
  it('maps snake_case rows onto the app model', () => {
    const guitar = mapGuitarRow(row, ['https://signed/a.jpg']);
    expect(guitar).toMatchObject({
      id: 'g1',
      make: 'Fender',
      serialNumber: 'ABC123',
      pickupConfig: 'SSS',
      purchaseDate: '2020-01-15',
      purchasePrice: 1200.5,
      estimatedValue: 2400,
      photos: ['https://signed/a.jpg'],
      photoPaths: ['u1/g1/a.jpg'],
    });
  });

  it('falls back unknown types to other', () => {
    expect(mapGuitarRow({ ...row, type: 'lap-steel' }, []).type).toBe('other');
  });

  it('maps inventory columns and defaults a legacy row to a kept guitar', () => {
    expect(mapGuitarRow(row, []).status).toBe('keeping');
    expect(mapGuitarRow(row, []).itemKind).toBe('guitar');
    const amp = mapGuitarRow(
      {
        ...row,
        item_kind: 'amp',
        status: 'for_sale',
        strings: null,
        list_price: '250',
        floor_price: 160,
        insurance_low: '300',
        insurance_high: 350,
        insurance_value: '300-350',
        quantity: 1,
        details: 'Works well',
        name: 'Fender Acoustasonic Junior',
      },
      [],
    );
    expect(amp).toMatchObject({
      itemKind: 'amp',
      status: 'for_sale',
      strings: null,
      listPrice: 250,
      floorPrice: 160,
      insuranceLow: 300,
      insuranceHigh: 350,
      insuranceValue: '300-350',
      name: 'Fender Acoustasonic Junior',
      details: 'Works well',
    });
  });
});

describe('draftToRow', () => {
  it('stores empty purchase dates as null and clears sale fields unless sold', () => {
    const payload = draftToRow(
      {
        ...emptyDraft,
        make: 'Gibson',
        model: 'Les Paul',
        year: 1959,
        type: 'electric',
        colour: 'Burst',
        pickupConfig: 'HH',
        status: 'for_sale',
        soldDate: '2024-01-01',
        soldPrice: 1000,
        listPrice: 1200,
      },
      'u1',
      'g2',
      [],
    );
    expect(payload.purchase_date).toBeNull();
    expect(payload.user_id).toBe('u1');
    expect(payload.sold_date).toBeNull();
    expect(payload.sold_price).toBeNull();
    expect(payload.list_price).toBe(1200);
    expect(payload.status).toBe('for_sale');
  });

  it('drops guitar-only specs for an amp and keeps a sale', () => {
    const payload = draftToRow(
      {
        ...emptyDraft,
        make: 'Fender',
        model: 'Twin',
        itemKind: 'amp',
        type: 'electric',
        strings: 6,
        pickupConfig: 'SSS',
        status: 'sold',
        soldDate: '2024-05-01',
        soldPrice: 800,
      },
      'u1',
      'a1',
      [],
    );
    expect(payload.item_kind).toBe('amp');
    expect(payload.strings).toBeNull();
    expect(payload.pickup_config).toBe('');
    expect(payload.type).toBe('other');
    expect(payload.sold_date).toBe('2024-05-01');
    expect(payload.sold_price).toBe(800);
  });
});

describe('classifyDraftPhotos', () => {
  it('keeps existing signed URLs as storage paths and uploads data URLs', () => {
    const plan = classifyDraftPhotos(
      ['https://signed/a.jpg', 'data:image/jpeg;base64,abc'],
      {
        photos: ['https://signed/a.jpg'],
        photoPaths: ['u1/g1/a.jpg'],
      },
    );
    expect(plan).toEqual([
      { type: 'keep', path: 'u1/g1/a.jpg' },
      { type: 'upload', dataUrl: 'data:image/jpeg;base64,abc' },
    ]);
  });

  it('reorders existing photos into kept paths without uploads or deletions', () => {
    const existing = {
      photos: ['https://signed/a.jpg', 'https://signed/b.jpg', 'https://signed/c.jpg'],
      photoPaths: ['u1/g1/a.jpg', 'u1/g1/b.jpg', 'u1/g1/c.jpg'],
    };
    const plan = classifyDraftPhotos(
      ['https://signed/c.jpg', 'https://signed/a.jpg', 'https://signed/b.jpg'],
      existing,
    );

    expect(plan).toEqual([
      { type: 'keep', path: 'u1/g1/c.jpg' },
      { type: 'keep', path: 'u1/g1/a.jpg' },
      { type: 'keep', path: 'u1/g1/b.jpg' },
    ]);
    expect(plan.some((item) => item.type === 'upload')).toBe(false);
    expect(removedPhotoPaths(existing.photoPaths, plan)).toEqual([]);
  });
});

describe('toNumber', () => {
  it('coerces numeric strings and empty values', () => {
    expect(toNumber('12.5')).toBe(12.5);
    expect(toNumber('')).toBeNull();
    expect(toNumber(null)).toBeNull();
  });
});
