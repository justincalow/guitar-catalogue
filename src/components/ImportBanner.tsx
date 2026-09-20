import { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { importGuitar } from '../lib/catalogue';
import {
  clearLocalGuitars,
  localImportAlreadyDone,
  markLocalImportDone,
  readLocalGuitars,
} from '../lib/localImport';
import { useGuitars } from '../store';
import type { Guitar } from '../types';

export function ImportBanner() {
  const { user } = useAuth();
  const { reload } = useGuitars();
  const [local, setLocal] = useState<Guitar[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(localImportAlreadyDone);

  useEffect(() => {
    if (!user || dismissed) return;
    let cancelled = false;
    readLocalGuitars().then((rows) => {
      if (!cancelled) setLocal(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [user, dismissed]);

  if (!user || dismissed || !local || local.length === 0) return null;

  const rows = local;
  const account = user;

  async function onImport() {
    setBusy(true);
    setError(null);
    try {
      for (const guitar of rows) {
        await importGuitar(account.id, guitar);
      }
      await clearLocalGuitars();
      markLocalImportDone();
      setDismissed(true);
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not import the local catalogue.');
    } finally {
      setBusy(false);
    }
  }

  function onSkip() {
    markLocalImportDone();
    setDismissed(true);
  }

  return (
    <aside className="import-banner" aria-live="polite">
      <div>
        <p className="import-title">Local catalogue found</p>
        <p>
          This browser still has {rows.length} guitar{rows.length === 1 ? '' : 's'} stored in
          IndexedDB. Import them into your cloud rack once, then they will follow you across
          devices.
        </p>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <div className="import-actions">
        <button className="btn btn-ghost" type="button" disabled={busy} onClick={onSkip}>
          Skip
        </button>
        <button className="btn btn-primary" type="button" disabled={busy} onClick={() => void onImport()}>
          {busy ? 'Importing…' : 'Import local guitars'}
        </button>
      </div>
    </aside>
  );
}
