import { GUITAR_TYPES, type Guitar, type GuitarDraft, type GuitarType } from '../types';

export interface GuitarRow {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number | null;
  serial_number: string;
  type: string;
  colour: string;
  strings: number;
  pickup_config: string;
  purchase_date: string | null;
  purchase_price: number | string | null;
  estimated_value: number | string | null;
  condition_notes: string;
  notes: string;
  photos: string[] | null;
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

export function mapGuitarRow(row: GuitarRow, signedUrls: string[]): Guitar {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    year: row.year,
    serialNumber: row.serial_number ?? '',
    type: isGuitarType(row.type) ? row.type : 'other',
    colour: row.colour ?? '',
    strings: row.strings ?? 6,
    pickupConfig: row.pickup_config ?? '',
    purchaseDate: row.purchase_date ?? '',
    purchasePrice: toNumber(row.purchase_price),
    estimatedValue: toNumber(row.estimated_value),
    conditionNotes: row.condition_notes ?? '',
    notes: row.notes ?? '',
    photos: signedUrls,
    photoPaths: row.photos ?? [],
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
  return {
    id,
    user_id: userId,
    make: draft.make,
    model: draft.model,
    year: draft.year,
    serial_number: draft.serialNumber,
    type: draft.type,
    colour: draft.colour,
    strings: draft.strings,
    pickup_config: draft.pickupConfig,
    purchase_date: draft.purchaseDate.trim() ? draft.purchaseDate : null,
    purchase_price: draft.purchasePrice,
    estimated_value: draft.estimatedValue,
    condition_notes: draft.conditionNotes,
    notes: draft.notes,
    photos: photoPaths,
  };
}

export function classifyDraftPhotos(
  draftPhotos: string[],
  existing?: Pick<Guitar, 'photos' | 'photoPaths'>,
): PhotoPlanItem[] {
  return draftPhotos.map((photo) => {
    if (isDataUrl(photo)) return { type: 'upload', dataUrl: photo };
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
