import type { Guitar } from '../types';
import { db } from '../db';

const IMPORT_FLAG = 'fretwork.localImportDone';

export function localImportAlreadyDone(): boolean {
  try {
    return localStorage.getItem(IMPORT_FLAG) === '1';
  } catch {
    return false;
  }
}

export function markLocalImportDone(): void {
  try {
    localStorage.setItem(IMPORT_FLAG, '1');
  } catch {
    // Ignore quota / private-mode failures; the user can dismiss again.
  }
}

export async function readLocalGuitars(): Promise<Guitar[]> {
  try {
    const rows = await db.guitars.toArray();
    return rows.map((row) => ({
      ...row,
      photoPaths: row.photoPaths ?? [],
    }));
  } catch {
    return [];
  }
}

export async function clearLocalGuitars(): Promise<void> {
  try {
    await db.guitars.clear();
  } catch {
    // Local copy can remain; cloud is already the source of truth.
  }
}
