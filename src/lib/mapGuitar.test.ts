import { describe, expect, it } from 'vitest';
import { classifyDraftPhotos, draftToRow, mapGuitarRow, toNumber } from './mapGuitar';
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
});

describe('draftToRow', () => {
  it('stores empty purchase dates as null', () => {
    const payload = draftToRow(
      {
        make: 'Gibson',
        model: 'Les Paul',
        year: 1959,
        serialNumber: '',
        type: 'electric',
        colour: 'Burst',
        strings: 6,
        pickupConfig: 'HH',
        purchaseDate: '',
        purchasePrice: null,
        estimatedValue: null,
        conditionNotes: '',
        notes: '',
        photos: [],
      },
      'u1',
      'g2',
      [],
    );
    expect(payload.purchase_date).toBeNull();
    expect(payload.user_id).toBe('u1');
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
});

describe('toNumber', () => {
  it('coerces numeric strings and empty values', () => {
    expect(toNumber('12.5')).toBe(12.5);
    expect(toNumber('')).toBeNull();
    expect(toNumber(null)).toBeNull();
  });
});
