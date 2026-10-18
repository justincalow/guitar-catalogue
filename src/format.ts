import {
  GUITAR_TYPES,
  ITEM_KINDS,
  ITEM_STATUSES,
  type GuitarType,
  type ItemKind,
  type ItemStatus,
} from './types';

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

const KIND_LABELS: Record<ItemKind, string> = {
  guitar: 'Guitar',
  amp: 'Amp',
};

const STATUS_LABELS: Record<ItemStatus, string> = {
  for_sale: 'For sale',
  keeping: 'Keeping',
  tbd: 'TBD',
  sold: 'Sold',
};

export function kindLabel(kind: ItemKind): string {
  return KIND_LABELS[kind];
}

export function statusLabel(status: ItemStatus): string {
  return STATUS_LABELS[status];
}

export const KIND_OPTIONS = ITEM_KINDS.map((value) => ({
  value,
  label: value === 'guitar' ? 'Guitars' : 'Amps',
}));

export const STATUS_OPTIONS = ITEM_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));

export function formatYear(year: number | null): string {
  return year ? String(year) : 'Year unknown';
}

export function formatMoney(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '—';
  const whole = Number.isInteger(value);
  const formatted = new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(value);
  return `CAD ${formatted}`;
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

export function itemTitle(item: { name?: string; make: string; model: string }): string {
  const name = item.name?.trim();
  if (name) return name;
  return `${item.make.trim()} ${item.model.trim()}`.trim() || 'Untitled item';
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function collectionLabel(items: { itemKind: ItemKind }[]): string {
  const guitarCount = items.filter((item) => item.itemKind !== 'amp').length;
  const ampCount = items.filter((item) => item.itemKind === 'amp').length;
  if (ampCount === 0) return pluralize(guitarCount, 'guitar');
  if (guitarCount === 0) return pluralize(ampCount, 'amp');
  return `${pluralize(guitarCount, 'guitar')} · ${pluralize(ampCount, 'amp')}`;
}
