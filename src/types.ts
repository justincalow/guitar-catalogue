export const GUITAR_TYPES = [
  'electric',
  'acoustic',
  'classical',
  'bass',
  'other',
] as const;

export type GuitarType = (typeof GUITAR_TYPES)[number];

export interface Guitar {
  id: string;
  make: string;
  model: string;
  year: number | null;
  serialNumber: string;
  type: GuitarType;
  colour: string;
  strings: number;
  pickupConfig: string;
  purchaseDate: string;
  purchasePrice: number | null;
  estimatedValue: number | null;
  conditionNotes: string;
  notes: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export type GuitarDraft = Omit<Guitar, 'id' | 'createdAt' | 'updatedAt'>;
