import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { emptyDraft, type Guitar, type GuitarDraft } from '../types';
import { collectionTotals } from './totals';
import {
  inventoryToCsv,
  parseInventoryCsv,
  splitItemTitle,
} from './csvInventory';

const SAMPLE_CANDIDATES = [
  process.env.FRETWORK_SAMPLE_CSV,
  '/home/ubuntu/.cursor/projects/workspace/uploads/fretwork_import_guitars_amps_2a49.csv',
  '/home/ubuntu/.cursor/projects/workspace/uploads/fretwork_import_guitars_amps.csv',
].filter((path): path is string => Boolean(path));

function samplePath(): string | null {
  return SAMPLE_CANDIDATES.find((path) => existsSync(path)) ?? null;
}

function asGuitar(draft: GuitarDraft, index: number): Guitar {
  return {
    ...draft,
    id: String(index),
    photoPaths: [],
    createdAt: '',
    updatedAt: '',
  };
}

describe('parseInventoryCsv', () => {
  const csv = [
    'Item,Category,Details,Qty,List Price CAD,Floor Price CAD,Value Range CAD,Status,Notes,Status (normalized),Insurance Low CAD,Insurance High CAD,Insurance / Replacement Value CAD,Insurance Basis,Insurance Confidence',
    '"1961 Gibson ES-330TD",Guitars,"Sunburst, P-90s",1,,"",9000-14000,Keep,"Check https://example.com/bridge, please",Keeping,9000,"14,000","9,000-14,000",Appraisal,Sourced',
    'Washburn superstrat,Guitar,"HSS, trem",1,200,140,,For sale,"Line one',
    'line ""two""",For sale,200,250,200-250,Estimate,Estimate',
    'Fender Acoustasonic Junior,Amps,Solid-state,1,250,160,180-300,For sale (tested),Torn grille,Keeping,300,350,300-350,Keeping figure,Sourced',
    'INSURANCE TOTAL,Total,,3,450,,,,,11400',
    '',
  ].join('\n');

  it('maps columns, keeps links and quotes, and skips insurance totals', () => {
    const result = parseInventoryCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(3);
    expect(result.skipped.map((row) => row.reason)).toEqual(['Insurance total']);

    const [gibson, washburn, amp] = result.rows.map((row) => row.draft);
    expect(gibson.itemKind).toBe('guitar');
    expect(gibson.status).toBe('keeping');
    expect(gibson.year).toBe(1961);
    expect(gibson.make).toBe('Gibson');
    expect(gibson.model).toBe('ES-330TD');
    expect(gibson.listPrice).toBeNull();
    expect(gibson.insuranceHigh).toBe(14000);
    expect(gibson.insuranceValue).toBe('9,000-14,000');
    expect(gibson.notes).toContain('https://example.com/bridge, please');
    expect(gibson.type).toBe('electric');

    expect(washburn.itemKind).toBe('guitar');
    expect(washburn.notes).toBe('Line one\nline "two"');
    expect(washburn.listPrice).toBe(200);
    expect(washburn.type).toBe('electric');

    expect(amp.itemKind).toBe('amp');
    expect(amp.status).toBe('keeping');
    expect(amp.strings).toBeNull();
    expect(amp.pickupConfig).toBe('');
    expect(amp.type).toBe('other');
    expect(amp.listPrice).toBe(250);
  });

  it('round-trips an export, including a sold guitar and an amp', () => {
    const guitar: Guitar = {
      id: '1',
      ...emptyDraft,
      name: '1961 Gibson ES-330TD',
      make: 'Gibson',
      model: 'ES-330TD',
      year: 1961,
      itemKind: 'guitar',
      type: 'electric',
      status: 'sold',
      soldDate: '2024-06-01',
      soldPrice: 11000,
      listPrice: 9000,
      notes: 'See "https://example.com/a,b"',
      details: 'Sunburst',
      quantity: 1,
      insuranceLow: 9000,
      insuranceHigh: 14000,
      insuranceValue: '9,000-14,000',
      photoPaths: ['secret/not-exported.jpg'],
      photos: ['https://signed.example/secret.jpg'],
      createdAt: '',
      updatedAt: '',
    };
    const amp: Guitar = {
      id: '2',
      ...emptyDraft,
      name: 'Peavey ValveKing',
      make: 'Peavey',
      model: 'ValveKing',
      itemKind: 'amp',
      type: 'other',
      strings: null,
      status: 'for_sale',
      listPrice: 425,
      floorPrice: 300,
      quantity: 1,
      photoPaths: [],
      createdAt: '',
      updatedAt: '',
    };

    const again = parseInventoryCsv(inventoryToCsv([guitar, amp]));
    expect(again.errors).toEqual([]);
    expect(again.rows).toHaveLength(2);
    expect(again.rows[0].draft).toMatchObject({
      name: '1961 Gibson ES-330TD',
      make: 'Gibson',
      model: 'ES-330TD',
      year: 1961,
      itemKind: 'guitar',
      status: 'sold',
      soldDate: '2024-06-01',
      soldPrice: 11000,
      notes: 'See "https://example.com/a,b"',
      photos: [],
    });
    expect(again.rows[1].draft).toMatchObject({
      itemKind: 'amp',
      strings: null,
      pickupConfig: '',
      listPrice: 425,
      status: 'for_sale',
    });
  });
});

describe('splitItemTitle', () => {
  it('keeps a two-word brand and a leading year', () => {
    expect(splitItemTitle('Oscar Schmidt by Washburn OE30')).toMatchObject({
      make: 'Oscar Schmidt',
      model: 'by Washburn OE30',
    });
    expect(splitItemTitle('1979 Hagstrom Jimmy').year).toBe(1979);
  });
});

describe('sample inventory file', () => {
  const path = samplePath();

  it.skipIf(!path)('imports the owner sample without committing it', () => {
    const text = readFileSync(path as string, 'utf8');
    const result = parseInventoryCsv(text);
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(13);
    expect(result.rows.filter((row) => row.draft.itemKind === 'guitar')).toHaveLength(10);
    expect(result.rows.filter((row) => row.draft.itemKind === 'amp')).toHaveLength(3);
    expect(result.skipped).toEqual([]);

    const statuses = result.rows.map((row) => row.draft.status);
    expect(statuses.filter((status) => status === 'for_sale')).toHaveLength(6);
    expect(statuses.filter((status) => status === 'keeping')).toHaveLength(3);
    expect(statuses.filter((status) => status === 'tbd')).toHaveLength(4);

    const acoustasonic = result.rows.find((row) => /acoustasonic/i.test(row.draft.name));
    expect(acoustasonic?.draft.itemKind).toBe('amp');
    expect(acoustasonic?.draft.status).toBe('keeping');

    expect(result.rows.some((row) => row.draft.notes.includes('https://'))).toBe(true);
    expect(result.rows.every((row) => row.draft.photos.length === 0)).toBe(true);

    const withTotal = parseInventoryCsv(`${text}\nINSURANCE TOTAL,Total,,13\n`);
    expect(withTotal.rows).toHaveLength(13);
    expect(withTotal.skipped.map((row) => row.reason)).toContain('Insurance total');

    const totals = collectionTotals(result.rows.map((row, index) => asGuitar(row.draft, index)));
    expect(totals.count).toBe(13);
    expect(totals.insuranceValue).toBeGreaterThan(0);
    expect(totals.forSaleListValue).toBeGreaterThan(0);
  });
});
