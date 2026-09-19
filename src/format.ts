import { GUITAR_TYPES, type GuitarType } from './types';

const TYPE_LABELS: Record<GuitarType, string> = {
  electric: 'Electric',
  acoustic: 'Acoustic',
  classical: 'Classical',
  bass: 'Bass',
  other: 'Other',
};

export function typeLabel(type: GuitarType): string {
  return TYPE_LABELS[type];
}

export const TYPE_OPTIONS = GUITAR_TYPES.map((value) => ({
  value,
  label: TYPE_LABELS[value],
}));

export function formatYear(year: number | null): string {
  return year ? String(year) : 'Year unknown';
}

export function formatMoney(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function guitarTitle(make: string, model: string): string {
  return `${make.trim()} ${model.trim()}`.trim() || 'Untitled guitar';
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
