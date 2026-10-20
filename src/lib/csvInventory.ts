import { emptyDraft, type Guitar, type GuitarDraft, type GuitarType, type ItemKind, type ItemStatus } from '../types';
import { isGuitarType } from './mapGuitar';

const MULTI_WORD_BRANDS = ['oscar schmidt', 'cbs masterworks'];

export interface SkippedCsvRow {
  rowNumber: number;
  reason: string;
}

export interface CsvImportIssue {
  rowNumber: number;
  message: string;
}

export interface ParsedInventoryRow {
  rowNumber: number;
  draft: GuitarDraft;
}

export interface CsvImportResult {
  rows: ParsedInventoryRow[];
  skipped: SkippedCsvRow[];
  errors: CsvImportIssue[];
}

const HEADER_FIELDS = {
  item: 'item',
  category: 'category',
  details: 'details',
  qty: 'quantity',
  quantity: 'quantity',
  'list price cad': 'listPrice',
  'list price': 'listPrice',
  'floor price cad': 'floorPrice',
  'floor price': 'floorPrice',
  'value range cad': 'valueRange',
  'value range': 'valueRange',
  status: 'statusRaw',
  notes: 'notes',
  'status (normalized)': 'status',
  'insurance low cad': 'insuranceLow',
  'insurance low': 'insuranceLow',
  'insurance high cad': 'insuranceHigh',
  'insurance high': 'insuranceHigh',
  'insurance / replacement value cad': 'insuranceValue',
  'insurance / replacement value': 'insuranceValue',
  'insurance basis': 'insuranceBasis',
  'insurance confidence': 'insuranceConfidence',
  'sold date': 'soldDate',
  'sold price cad': 'soldPrice',
  'sold price': 'soldPrice',
  make: 'make',
  model: 'model',
  year: 'year',
  'serial number': 'serialNumber',
  serial: 'serialNumber',
  type: 'guitarType',
  colour: 'colour',
  color: 'colour',
  strings: 'strings',
  'pickup configuration': 'pickupConfig',
  pickups: 'pickupConfig',
  name: 'name',
  'purchase date': 'purchaseDate',
  'purchase price cad': 'purchasePrice',
  'purchase price': 'purchasePrice',
  'estimated value cad': 'estimatedValue',
  'estimated value': 'estimatedValue',
  'condition notes': 'conditionNotes',
} as const;

type CsvField = (typeof HEADER_FIELDS)[keyof typeof HEADER_FIELDS];

export function parseCsv(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (char === '\n') {
      row.push(field);
      field = '';
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      continue;
    }
    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  }
  return rows;
}

function headerKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isInsuranceTotal(item: string): boolean {
  return /^\s*insurance\s+total\b/i.test(item);
}

export function parseItemKind(category: string): ItemKind | null {
  const value = category.trim().toLowerCase();
  if (value === 'guitar' || value === 'guitars') return 'guitar';
  if (value === 'amp' || value === 'amps' || value === 'amplifier' || value === 'amplifiers') {
    return 'amp';
  }
  return null;
}

export function parseItemStatus(normalized: string, raw = ''): ItemStatus {
  const chosen = normalized.trim() || raw.trim();
  const value = chosen.toLowerCase();
  if (value === 'for sale' || value.startsWith('for sale')) return 'for_sale';
  if (value === 'sold' || value.startsWith('sold')) return 'sold';
  if (value === 'keeping' || value === 'keep' || value.startsWith('keep')) return 'keeping';
  if (value === 'tbd' || value.includes('tbd')) return 'tbd';
  return 'tbd';
}

export function parseMoneyCell(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/[$,\s]/g, '').replace(/cad/gi, '');
  if (!cleaned || !/^-?\d+(?:\.\d+)?$/.test(cleaned)) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

export function splitItemTitle(item: string): { year: number | null; make: string; model: string } {
  let text = item.trim().replace(/\s+/g, ' ');
  let year: number | null = null;

  const leadingYear = text.match(/^(?:18|19|20)\d{2}\b/);
  if (leadingYear) {
    year = Number(leadingYear[0]);
    text = text.slice(leadingYear[0].length).trim();
  }

  if (year === null) {
    const circa = text.match(/\bc\.?\s*((?:18|19|20)\d{2})\b(?!\s*[-–])/);
    if (circa) year = Number(circa[1]);
    const tilde = text.match(/\(~((?:18|19|20)\d{2})\)/);
    if (year === null && tilde) year = Number(tilde[1]);
  }

  if (year !== null && (year < 1800 || year > 2100)) year = null;

  const lower = text.toLowerCase();
  for (const brand of MULTI_WORD_BRANDS) {
    if (lower.startsWith(brand)) {
      const make = text.slice(0, brand.length).trim();
      const model = text.slice(brand.length).replace(/^[\s,:-]+/, '').trim();
      return { year, make, model: model || make };
    }
  }

  const words = text.split(' ').filter(Boolean);
  const make = words[0] ?? 'Unknown';
  const model = words.slice(1).join(' ').trim() || make;
  return { year, make, model };
}

export function inferGuitarType(name: string, details: string): GuitarType {
  const text = `${name} ${details}`.toLowerCase();
  if (/\bbass\b/.test(text)) return 'bass';
  if (/classical|nylon-string|nylon string/.test(text)) return 'classical';
  if (/acoustic|dreadnought|jumbo|archtop|f-hole|round-shoulder/.test(text)) return 'acoustic';
  if (/electric|semi-hollow|superstrat|stratocaster|telecaster|\bp-90|humbucker|filter'?tron/.test(text)) {
    return 'electric';
  }
  return 'other';
}

function escapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function moneyOut(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '';
  return String(value);
}

function cell(row: string[], index: number | undefined): string {
  if (index === undefined || index < 0) return '';
  return row[index] ?? '';
}

export function parseInventoryCsv(text: string): CsvImportResult {
  const table = parseCsv(text);
  if (table.length === 0) {
    return {
      rows: [],
      skipped: [],
      errors: [{ rowNumber: 1, message: 'The CSV is empty.' }],
    };
  }

  const header = table[0].map(headerKey);
  const columns = new Map<CsvField, number>();
  header.forEach((name, index) => {
    const field = HEADER_FIELDS[name as keyof typeof HEADER_FIELDS];
    if (field && !columns.has(field)) columns.set(field, index);
  });

  if (!columns.has('item') && !columns.has('name')) {
    return {
      rows: [],
      skipped: [],
      errors: [{ rowNumber: 1, message: 'The CSV needs an Item column.' }],
    };
  }

  const rows: ParsedInventoryRow[] = [];
  const skipped: SkippedCsvRow[] = [];
  const errors: CsvImportIssue[] = [];

  for (let i = 1; i < table.length; i++) {
    const source = table[i];
    const rowNumber = i + 1;
    const item = cell(source, columns.get('item')).trim() || cell(source, columns.get('name')).trim();
    if (!item) {
      skipped.push({ rowNumber, reason: 'Blank item' });
      continue;
    }
    if (isInsuranceTotal(item)) {
      skipped.push({ rowNumber, reason: 'Insurance total' });
      continue;
    }

    const category = cell(source, columns.get('category'));
    const kind = parseItemKind(category);
    if (!kind) {
      errors.push({
        rowNumber,
        message: `Row ${rowNumber} (“${item.slice(0, 80)}”) has an unknown category “${category.trim() || 'blank'}”. Use Guitars or Amps.`,
      });
      continue;
    }

    const split = splitItemTitle(item);
    const makeCell = cell(source, columns.get('make')).trim();
    const modelCell = cell(source, columns.get('model')).trim();
    const yearCell = cell(source, columns.get('year')).trim();
    const parsedYear = yearCell ? Number(yearCell) : split.year;
    const year =
      parsedYear !== null && Number.isInteger(parsedYear) && parsedYear >= 1800 && parsedYear <= 2100
        ? parsedYear
        : null;

    const listPrice = parseMoneyCell(cell(source, columns.get('listPrice')));
    const floorPrice = parseMoneyCell(cell(source, columns.get('floorPrice')));
    const insuranceLow = parseMoneyCell(cell(source, columns.get('insuranceLow')));
    const insuranceHigh = parseMoneyCell(cell(source, columns.get('insuranceHigh')));
    const soldPrice = parseMoneyCell(cell(source, columns.get('soldPrice')));
    const purchasePrice = parseMoneyCell(cell(source, columns.get('purchasePrice')));
    const estimatedValue = parseMoneyCell(cell(source, columns.get('estimatedValue')));

    const prices = [
      ['List price', listPrice],
      ['Floor price', floorPrice],
      ['Insurance low', insuranceLow],
      ['Insurance high', insuranceHigh],
      ['Sold price', soldPrice],
    ] as const;
    const negative = prices.find((entry) => entry[1] !== null && entry[1] < 0);
    if (negative) {
      errors.push({ rowNumber, message: `Row ${rowNumber}: ${negative[0]} cannot be negative.` });
      continue;
    }

    const qtyRaw = cell(source, columns.get('quantity')).trim();
    let quantity = 1;
    if (qtyRaw) {
      const qty = Number(qtyRaw.replace(/,/g, ''));
      if (!Number.isInteger(qty) || qty < 0 || qty > 9999) {
        errors.push({
          rowNumber,
          message: `Row ${rowNumber}: quantity “${qtyRaw}” must be a whole number from 0 to 9999.`,
        });
        continue;
      }
      quantity = qty;
    }

    const status = parseItemStatus(
      cell(source, columns.get('status')),
      cell(source, columns.get('statusRaw')),
    );
    const typeCell = cell(source, columns.get('guitarType')).trim().toLowerCase();
    const guitarType: GuitarType =
      kind === 'amp'
        ? 'other'
        : isGuitarType(typeCell)
          ? typeCell
          : inferGuitarType(item, cell(source, columns.get('details')));

    const stringsRaw = cell(source, columns.get('strings')).trim();
    let strings: number | null = kind === 'amp' ? null : 6;
    if (kind === 'guitar' && stringsRaw) {
      const parsed = Number(stringsRaw);
      strings = Number.isInteger(parsed) ? parsed : 6;
    }

    const draft: GuitarDraft = {
      ...emptyDraft,
      name: item,
      make: makeCell || split.make,
      model: modelCell || split.model,
      year,
      serialNumber: cell(source, columns.get('serialNumber')).trim(),
      itemKind: kind,
      type: guitarType,
      colour: cell(source, columns.get('colour')).trim(),
      strings,
      pickupConfig: kind === 'amp' ? '' : cell(source, columns.get('pickupConfig')).trim(),
      details: cell(source, columns.get('details')).trim(),
      notes: cell(source, columns.get('notes')).trim(),
      quantity,
      status,
      listPrice,
      floorPrice,
      valueRange: cell(source, columns.get('valueRange')).trim(),
      insuranceLow,
      insuranceHigh,
      insuranceValue: cell(source, columns.get('insuranceValue')).trim(),
      insuranceBasis: cell(source, columns.get('insuranceBasis')).trim(),
      insuranceConfidence: cell(source, columns.get('insuranceConfidence')).trim(),
      soldDate: status === 'sold' ? cell(source, columns.get('soldDate')).trim() : '',
      soldPrice: status === 'sold' ? soldPrice : null,
      purchaseDate: cell(source, columns.get('purchaseDate')).trim(),
      purchasePrice,
      estimatedValue,
      conditionNotes: cell(source, columns.get('conditionNotes')).trim(),
      photos: [],
    };
    rows.push({ rowNumber, draft });
  }

  return { rows, skipped, errors };
}

const EXPORT_HEADERS = [
  'Item',
  'Category',
  'Details',
  'Qty',
  'List Price CAD',
  'Floor Price CAD',
  'Value Range CAD',
  'Status',
  'Notes',
  'Status (normalized)',
  'Insurance Low CAD',
  'Insurance High CAD',
  'Insurance / Replacement Value CAD',
  'Insurance Basis',
  'Insurance Confidence',
  'Sold Date',
  'Sold Price CAD',
  'Make',
  'Model',
  'Year',
  'Serial Number',
  'Type',
  'Colour',
  'Strings',
  'Pickup Configuration',
  'Purchase Date',
  'Purchase Price CAD',
  'Estimated Value CAD',
  'Condition Notes',
] as const;

function statusLabelForExport(status: ItemStatus): string {
  switch (status) {
    case 'for_sale':
      return 'For sale';
    case 'keeping':
      return 'Keeping';
    case 'tbd':
      return 'TBD';
    case 'sold':
      return 'Sold';
  }
}

export function itemExportName(item: Pick<Guitar, 'name' | 'make' | 'model' | 'year'>): string {
  if (item.name.trim()) return item.name.trim();
  const titled = `${item.make.trim()} ${item.model.trim()}`.trim();
  if (item.year && titled) return `${item.year} ${titled}`;
  return titled;
}

export function inventoryToCsv(items: readonly Guitar[]): string {
  const lines = [EXPORT_HEADERS.join(',')];
  for (const item of items) {
    const cells = [
      itemExportName(item),
      item.itemKind === 'amp' ? 'Amps' : 'Guitars',
      item.details,
      String(item.quantity),
      moneyOut(item.listPrice),
      moneyOut(item.floorPrice),
      item.valueRange,
      statusLabelForExport(item.status),
      item.notes,
      statusLabelForExport(item.status),
      moneyOut(item.insuranceLow),
      moneyOut(item.insuranceHigh),
      item.insuranceValue,
      item.insuranceBasis,
      item.insuranceConfidence,
      item.status === 'sold' ? item.soldDate : '',
      item.status === 'sold' ? moneyOut(item.soldPrice) : '',
      item.make,
      item.model,
      item.year === null ? '' : String(item.year),
      item.serialNumber,
      item.itemKind === 'amp' ? '' : item.type,
      item.colour,
      item.strings === null ? '' : String(item.strings),
      item.itemKind === 'amp' ? '' : item.pickupConfig,
      item.purchaseDate,
      moneyOut(item.purchasePrice),
      moneyOut(item.estimatedValue),
      item.conditionNotes,
    ];
    lines.push(cells.map((value) => escapeCell(value)).join(','));
  }
  return `${lines.join('\n')}\n`;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
