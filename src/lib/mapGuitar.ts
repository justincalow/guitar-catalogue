import {
  GUITAR_TYPES,
  isItemKind,
  isItemStatus,
  type Guitar,
  type GuitarDraft,
  type GuitarType,
  type ItemKind,
  type ItemStatus,
} from '../types';

export interface GuitarRow {
  id: string;
  user_id: string;
  name?: string | null;
  make: string;
  model: string;
  year: number | null;
  serial_number: string;
  item_kind?: string | null;
  type: string;
  colour: string;
  strings: number | null;
  pickup_config: string;
  purchase_date: string | null;
  purchase_price: number | string | null;
  estimated_value: number | string | null;
  condition_notes: string;
  notes: string;
  photos: string[] | null;
  status?: string | null;
  list_price?: number | string | null;
  floor_price?: number | string | null;
  value_range?: string | null;
  insurance_low?: number | string | null;
  insurance_high?: number | string | null;
  insurance_value?: string | null;
  insurance_basis?: string | null;
  insurance_confidence?: string | null;
  quantity?: number | null;
  details?: string | null;
  sold_date?: string | null;
  sold_price?: number | string | null;
  created_at: string;
  updated_at: string;
}

export type PhotoPlanItem =
  | { type: 'keep'; path: string }
  | { type: 'upload'; dataUrl: string };

export function isGuitarType(value: string): value is GuitarType {
  return (GUITAR_TYPES as readonly string[]).includes(value);
}

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function isDataUrl(value: string): boolean {
  return value.startsWith('data:');
}

function itemKindFromRow(value: string | null | undefined): ItemKind {
  if (value && isItemKind(value)) return value;
  return 'guitar';
}

function statusFromRow(value: string | null | undefined): ItemStatus {
  if (value && isItemStatus(value)) return value;
  return 'keeping';
}

export function mapGuitarRow(row: GuitarRow, signedUrls: string[]): Guitar {
  const itemKind = itemKindFromRow(row.item_kind);
  const strings =
    row.strings === null || row.strings === undefined
      ? itemKind === 'amp'
        ? null
        : 6
      : row.strings;
  return {
    id: row.id,
    name: row.name ?? '',
    make: row.make,
    model: row.model,
    year: row.year,
    serialNumber: row.serial_number ?? '',
    itemKind,
    type: isGuitarType(row.type) ? row.type : 'other',
    colour: row.colour ?? '',
    strings,
    pickupConfig: row.pickup_config ?? '',
    purchaseDate: row.purchase_date ?? '',
    purchasePrice: toNumber(row.purchase_price),
    estimatedValue: toNumber(row.estimated_value),
    conditionNotes: row.condition_notes ?? '',
    notes: row.notes ?? '',
    photos: signedUrls,
    photoPaths: row.photos ?? [],
    status: statusFromRow(row.status),
    listPrice: toNumber(row.list_price),
    floorPrice: toNumber(row.floor_price),
    valueRange: row.value_range ?? '',
    insuranceLow: toNumber(row.insurance_low),
    insuranceHigh: toNumber(row.insurance_high),
    insuranceValue: row.insurance_value ?? '',
    insuranceBasis: row.insurance_basis ?? '',
    insuranceConfidence: row.insurance_confidence ?? '',
    quantity: row.quantity ?? 1,
    details: row.details ?? '',
    soldDate: row.sold_date ?? '',
    soldPrice: toNumber(row.sold_price),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function draftToRow(
  draft: GuitarDraft,
  userId: string,
  id: string,
  photoPaths: string[],
): Omit<GuitarRow, 'created_at' | 'updated_at'> {
  const sold = draft.status === 'sold';
  const amp = draft.itemKind === 'amp';
  return {
    id,
    user_id: userId,
    name: draft.name.trim(),
    make: draft.make,
    model: draft.model,
    year: draft.year,
    serial_number: draft.serialNumber,
    item_kind: draft.itemKind,
    type: amp ? 'other' : draft.type,
    colour: draft.colour,
    strings: amp ? null : draft.strings,
    pickup_config: amp ? '' : draft.pickupConfig,
    purchase_date: draft.purchaseDate.trim() ? draft.purchaseDate : null,
    purchase_price: draft.purchasePrice,
    estimated_value: draft.estimatedValue,
    condition_notes: draft.conditionNotes,
    notes: draft.notes,
    photos: photoPaths,
    status: draft.status,
    list_price: draft.listPrice,
    floor_price: draft.floorPrice,
    value_range: draft.valueRange,
    insurance_low: draft.insuranceLow,
    insurance_high: draft.insuranceHigh,
    insurance_value: draft.insuranceValue,
    insurance_basis: draft.insuranceBasis,
    insurance_confidence: draft.insuranceConfidence,
    quantity: draft.quantity,
    details: draft.details,
    sold_date: sold && draft.soldDate.trim() ? draft.soldDate : null,
    sold_price: sold ? draft.soldPrice : null,
  };
}

export function classifyDraftPhotos(
  draftPhotos: string[],
  existing?: Pick<Guitar, 'photos' | 'photoPaths'>,
): PhotoPlanItem[] {
  return draftPhotos.map((photo) => {
    if (isDataUrl(photo)) return { type: 'upload', dataUrl: photo };
    // Match the signed URL, not the array position, so a reorder stays a keep.
    const index = existing?.photos.indexOf(photo) ?? -1;
    if (index >= 0 && existing) {
      return { type: 'keep', path: existing.photoPaths[index] };
    }
    if (photo && !photo.startsWith('http://') && !photo.startsWith('https://')) {
      return { type: 'keep', path: photo };
    }
    throw new Error('A photo could not be matched to storage. Try removing and adding it again.');
  });
}

/** Storage paths dropped from a plan. New uploads are not paths yet, so they are not kept. */
export function removedPhotoPaths(previous: string[], plan: PhotoPlanItem[]): string[] {
  const kept = new Set(plan.flatMap((item) => (item.type === 'keep' ? [item.path] : [])));
  return previous.filter((path) => !kept.has(path));
}
