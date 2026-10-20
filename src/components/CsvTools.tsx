import { useState } from 'react';
import { useAuth } from '../auth';
import { kindLabel, statusLabel } from '../format';
import { importInventory } from '../lib/catalogue';
import {
  downloadCsv,
  inventoryToCsv,
  parseInventoryCsv,
  type CsvImportResult,
} from '../lib/csvInventory';
import { useGuitars } from '../store';

const PREVIEW_LIMIT = 8;

export function CsvTools() {
  const { user } = useAuth();
  const { guitars, reload } = useGuitars();
  const [parsed, setParsed] = useState<CsvImportResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function onFile(file: File | undefined) {
    setError(null);
    setNotice(null);
    setParsed(null);
    setFileName(file?.name ?? '');
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setParsed(parseInventoryCsv(text));
    };
    reader.onerror = () => setError('Could not read that file.');
    reader.readAsText(file);
  }

  async function onImport() {
    if (!user || !parsed || parsed.rows.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const count = await importInventory(
        user.id,
        parsed.rows.map((row) => row.draft),
      );
      const leftOut = parsed.errors.length;
      setNotice(
        `Imported ${count} item${count === 1 ? '' : 's'} into your account.${
          leftOut ? ` ${leftOut} row${leftOut === 1 ? '' : 's'} with errors were not imported.` : ''
        } Photos are not included — add those on each item.`,
      );
      setParsed(null);
      setFileName('');
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not import the CSV.');
      await reload();
    } finally {
      setBusy(false);
    }
  }

  function onExport() {
    downloadCsv('fretwork-inventory.csv', inventoryToCsv(guitars));
  }

  const guitarCount = parsed?.rows.filter((row) => row.draft.itemKind === 'guitar').length ?? 0;
  const ampCount = parsed?.rows.filter((row) => row.draft.itemKind === 'amp').length ?? 0;

  return (
    <section className="csv-tools">
      <div className="csv-actions">
        <label className="btn btn-ghost file-btn">
          Import CSV
          <input
            type="file"
            accept=".csv,text/csv"
            aria-label="Import CSV"
            onChange={(event) => {
              onFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </label>
        <button className="btn btn-ghost" type="button" onClick={onExport}>
          Export CSV
        </button>
      </div>
      <p className="hint">
        Import adds rows to this account. Insurance total rows are skipped. Export downloads the
        whole collection as a backup. Photos stay manual.
      </p>
      {notice ? (
        <p className="notice" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {parsed ? (
        <div className="import-preview">
          <p className="import-title">{fileName || 'CSV preview'}</p>
          <p>
            {parsed.rows.length} item{parsed.rows.length === 1 ? '' : 's'} ready
            {parsed.rows.length > 0 ? ` (${guitarCount} guitars, ${ampCount} amps)` : ''}.
            {parsed.skipped.length > 0
              ? ` Skipped ${parsed.skipped.length} row${parsed.skipped.length === 1 ? '' : 's'} (${skippedSummary(parsed)}).`
              : ''}
          </p>
          {parsed.errors.length > 0 ? (
            <ul className="import-errors">
              {parsed.errors.map((issue) => (
                <li key={`${issue.rowNumber}-${issue.message}`}>{issue.message}</li>
              ))}
            </ul>
          ) : null}
          {parsed.rows.length > 0 ? (
            <div className="preview-scroll">
              <table className="preview-table">
                <caption className="sr-only">Rows that will be imported</caption>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Kind</th>
                    <th>Status</th>
                    <th>Qty</th>
                    <th>List</th>
                    <th>Insurance high</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, PREVIEW_LIMIT).map((row) => (
                    <tr key={row.rowNumber}>
                      <td className="preview-item">{row.draft.name || row.draft.model}</td>
                      <td>{kindLabel(row.draft.itemKind)}</td>
                      <td>{statusLabel(row.draft.status)}</td>
                      <td>{row.draft.quantity}</td>
                      <td>{row.draft.listPrice ?? '—'}</td>
                      <td>{row.draft.insuranceHigh ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.rows.length > PREVIEW_LIMIT ? (
                <p className="hint">And {parsed.rows.length - PREVIEW_LIMIT} more.</p>
              ) : null}
            </div>
          ) : null}
          <div className="import-actions">
            <button className="btn btn-ghost" type="button" disabled={busy} onClick={() => setParsed(null)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={busy || parsed.rows.length === 0}
              onClick={() => void onImport()}
            >
              {busy ? 'Importing…' : `Import ${parsed.rows.length} item${parsed.rows.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function skippedSummary(parsed: CsvImportResult): string {
  const totals = parsed.skipped.filter((row) => row.reason === 'Insurance total').length;
  const blanks = parsed.skipped.filter((row) => row.reason === 'Blank item').length;
  const parts: string[] = [];
  if (totals) parts.push(`${totals} insurance total`);
  if (blanks) parts.push(`${blanks} blank`);
  return parts.join(', ') || 'other';
}
