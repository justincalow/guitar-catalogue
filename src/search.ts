import type { Guitar, GuitarType } from './types';

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
  },
): Guitar[] {
  const query = options.query?.trim().toLowerCase() ?? '';
  const type = options.type ?? 'all';
  const make = options.make?.trim().toLowerCase() ?? 'all';

  return guitars.filter((guitar) => {
    if (type !== 'all' && guitar.type !== type) return false;
    if (make !== 'all' && guitar.make.trim().toLowerCase() !== make) {
      return false;
    }
    if (!query) return true;

    const haystack = [
      guitar.make,
      guitar.model,
      guitar.serialNumber,
      guitar.notes,
      guitar.conditionNotes,
      guitar.colour,
      guitar.pickupConfig,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}
