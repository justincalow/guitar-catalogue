export const GUITAR_TYPES = [
  'electric',
  'acoustic',
  'classical',
  'bass',
  'other',
] as const;

export type GuitarType = (typeof GUITAR_TYPES)[number];

export const ITEM_KINDS = ['guitar', 'amp'] as const;

export type ItemKind = (typeof ITEM_KINDS)[number];

export const ITEM_STATUSES = ['for_sale', 'keeping', 'tbd', 'sold'] as const;

export type ItemStatus = (typeof ITEM_STATUSES)[number];

export interface Guitar {
  id: string;
  /** Catalogue title. CSV import stores the Item column here. */
  name: string;
  make: string;
  model: string;
  year: number | null;
  serialNumber: string;
  /** Guitar or amp. Guitar-only specs stay empty for amps. */
  itemKind: ItemKind;
  type: GuitarType;
  colour: string;
  /** Null for amps. */
  strings: number | null;
  pickupConfig: string;
  purchaseDate: string;
  purchasePrice: number | null;
  estimatedValue: number | null;
  conditionNotes: string;
  notes: string;
  photos: string[];
  /** Storage object paths; empty for unsaved local drafts / IndexedDB imports. */
  photoPaths: string[];
  status: ItemStatus;
  listPrice: number | null;
  floorPrice: number | null;
  valueRange: string;
  insuranceLow: number | null;
  insuranceHigh: number | null;
  /** Free-text replacement figure, often a range such as 9,000-14,000. */
  insuranceValue: string;
  insuranceBasis: string;
  insuranceConfidence: string;
  quantity: number;
  details: string;
  soldDate: string;
  soldPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export type GuitarDraft = Omit<Guitar, 'id' | 'createdAt' | 'updatedAt' | 'photoPaths'>;

export function isItemKind(value: string): value is ItemKind {
  return (ITEM_KINDS as readonly string[]).includes(value);
}

export function isItemStatus(value: string): value is ItemStatus {
  return (ITEM_STATUSES as readonly string[]).includes(value);
}

export const emptyDraft: GuitarDraft = {
  name: '',
  make: '',
  model: '',
  year: null,
  serialNumber: '',
  itemKind: 'guitar',
  type: 'electric',
  colour: '',
  strings: 6,
  pickupConfig: '',
  purchaseDate: '',
  purchasePrice: null,
  estimatedValue: null,
  conditionNotes: '',
  notes: '',
  photos: [],
  status: 'keeping',
  listPrice: null,
  floorPrice: null,
  valueRange: '',
  insuranceLow: null,
  insuranceHigh: null,
  insuranceValue: '',
  insuranceBasis: '',
  insuranceConfidence: '',
  quantity: 1,
  details: '',
  soldDate: '',
  soldPrice: null,
};
