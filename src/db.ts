import Dexie, { type EntityTable } from 'dexie';
import type { Guitar } from './types';

export const db = new Dexie('FretworkCatalogue') as Dexie & {
  guitars: EntityTable<Guitar, 'id'>;
};

db.version(1).stores({
  guitars: 'id, make, type, createdAt',
});
