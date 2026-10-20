import type { Guitar, GuitarType, ItemKind, ItemStatus } from './types';

export function uniqueMakes(guitars: Guitar[]): string[] {
  const set = new Set<string>();
  for (const guitar of guitars) {
    const make = guitar.make.trim();
    if (make) set.add(make);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function filterGuitars(
  guitars: Guitar[],
  options: {
    query?: string;
    type?: GuitarType | 'all';
    make?: string;
    kind?: ItemKind | 'all';
    status?: ItemStatus | 'all';
  },
): Guitar[] {
  const query = options.query?.trim().toLowerCase() ?? '';
  const type = options.type ?? 'all';
  const make = options.make?.trim().toLowerCase() ?? 'all';
  const kind = options.kind ?? 'all';
  const status = options.status ?? 'all';

  return guitars.filter((guitar) => {
    if (kind !== 'all' && guitar.itemKind !== kind) return false;
    if (status !== 'all' && guitar.status !== status) return false;
    if (kind !== 'amp' && type !== 'all' && guitar.type !== type) return false;
    if (make !== 'all' && guitar.make.trim().toLowerCase() !== make) {
      return false;
    }
    if (!query) return true;

    const haystack = [
      guitar.name,
      guitar.make,
      guitar.model,
      guitar.serialNumber,
      guitar.notes,
      guitar.conditionNotes,
      guitar.details,
      guitar.colour,
      guitar.pickupConfig,
      guitar.valueRange,
      guitar.insuranceBasis,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}
