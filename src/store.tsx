import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { db } from './db';
import type { Guitar, GuitarDraft } from './types';

interface GuitarStore {
  guitars: Guitar[];
  ready: boolean;
  error: string | null;
  getById: (id: string) => Guitar | undefined;
  addGuitar: (draft: GuitarDraft) => Promise<Guitar>;
  updateGuitar: (id: string, draft: GuitarDraft) => Promise<Guitar>;
  deleteGuitar: (id: string) => Promise<void>;
}

const GuitarContext = createContext<GuitarStore | null>(null);

async function loadAll(): Promise<Guitar[]> {
  return db.guitars.orderBy('createdAt').reverse().toArray();
}

export function GuitarProvider({ children }: { children: ReactNode }) {
  const [guitars, setGuitars] = useState<Guitar[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadAll()
      .then((rows) => {
        if (!cancelled) {
          setGuitars(rows);
          setReady(true);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not open the local catalogue.');
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const getById = useCallback(
    (id: string) => guitars.find((guitar) => guitar.id === id),
    [guitars],
  );

  const addGuitar = useCallback(async (draft: GuitarDraft) => {
    const now = new Date().toISOString();
    const guitar: Guitar = {
      ...draft,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await db.guitars.add(guitar);
    setGuitars(await loadAll());
    return guitar;
  }, []);

  const updateGuitar = useCallback(async (id: string, draft: GuitarDraft) => {
    const existing = await db.guitars.get(id);
    if (!existing) throw new Error('That guitar is no longer in the catalogue.');
    const guitar: Guitar = {
      ...existing,
      ...draft,
      id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await db.guitars.put(guitar);
    setGuitars(await loadAll());
    return guitar;
  }, []);

  const deleteGuitar = useCallback(async (id: string) => {
    await db.guitars.delete(id);
    setGuitars(await loadAll());
  }, []);

  const value = useMemo(
    () => ({
      guitars,
      ready,
      error,
      getById,
      addGuitar,
      updateGuitar,
      deleteGuitar,
    }),
    [guitars, ready, error, getById, addGuitar, updateGuitar, deleteGuitar],
  );

  return <GuitarContext.Provider value={value}>{children}</GuitarContext.Provider>;
}

export function useGuitars(): GuitarStore {
  const ctx = useContext(GuitarContext);
  if (!ctx) throw new Error('useGuitars must be used within GuitarProvider');
  return ctx;
}
