import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './auth';
import { createGuitar, listGuitars, removeGuitar, saveGuitar } from './lib/catalogue';
import type { Guitar, GuitarDraft } from './types';

interface GuitarStore {
  guitars: Guitar[];
  ready: boolean;
  error: string | null;
  getById: (id: string) => Guitar | undefined;
  addGuitar: (draft: GuitarDraft) => Promise<Guitar>;
  updateGuitar: (id: string, draft: GuitarDraft) => Promise<Guitar>;
  deleteGuitar: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

const GuitarContext = createContext<GuitarStore | null>(null);

export function GuitarProvider({ children }: { children: ReactNode }) {
  const { user, ready: authReady, configured } = useAuth();
  const [guitars, setGuitars] = useState<Guitar[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!configured || !user) {
      setGuitars([]);
      setError(null);
      setReady(true);
      return;
    }
    setReady(false);
    try {
      const rows = await listGuitars();
      setGuitars(rows);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not open the catalogue.');
    } finally {
      setReady(true);
    }
  }, [configured, user]);

  useEffect(() => {
    if (!authReady) return;
    void reload();
  }, [authReady, reload]);

  const getById = useCallback(
    (id: string) => guitars.find((guitar) => guitar.id === id),
    [guitars],
  );

  const addGuitar = useCallback(
    async (draft: GuitarDraft) => {
      if (!user) throw new Error('Sign in to add a guitar.');
      const guitar = await createGuitar(user.id, draft);
      setGuitars((current) => [guitar, ...current.filter((row) => row.id !== guitar.id)]);
      return guitar;
    },
    [user],
  );

  const updateGuitar = useCallback(
    async (id: string, draft: GuitarDraft) => {
      if (!user) throw new Error('Sign in to update a guitar.');
      const existing = guitars.find((guitar) => guitar.id === id);
      if (!existing) throw new Error('That guitar is no longer in the catalogue.');
      const guitar = await saveGuitar(user.id, existing, draft);
      setGuitars((current) => current.map((row) => (row.id === id ? guitar : row)));
      return guitar;
    },
    [guitars, user],
  );

  const deleteGuitar = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Sign in to delete a guitar.');
      const existing = guitars.find((guitar) => guitar.id === id);
      if (!existing) throw new Error('That guitar is no longer in the catalogue.');
      await removeGuitar(existing);
      setGuitars((current) => current.filter((row) => row.id !== id));
    },
    [guitars, user],
  );

  const value = useMemo(
    () => ({
      guitars,
      ready: authReady && ready,
      error,
      getById,
      addGuitar,
      updateGuitar,
      deleteGuitar,
      reload,
    }),
    [guitars, authReady, ready, error, getById, addGuitar, updateGuitar, deleteGuitar, reload],
  );

  return <GuitarContext.Provider value={value}>{children}</GuitarContext.Provider>;
}

export function useGuitars(): GuitarStore {
  const ctx = useContext(GuitarContext);
  if (!ctx) throw new Error('useGuitars must be used within GuitarProvider');
  return ctx;
}
