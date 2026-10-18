import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CsvTools } from '../components/CsvTools';
import { EmptyState } from '../components/EmptyState';
import { GuitarCard, GuitarListRow } from '../components/GuitarCard';
import { ImportBanner } from '../components/ImportBanner';
import { KIND_OPTIONS, STATUS_OPTIONS, TYPE_OPTIONS, formatMoney, pluralize } from '../format';
import { collectionTotals } from '../lib/totals';
import { filterGuitars, uniqueMakes } from '../search';
import { useGuitars } from '../store';
import type { GuitarType, ItemKind, ItemStatus } from '../types';

const TYPE_FILTERS: Array<{ value: 'all' | GuitarType; label: string }> = [
  { value: 'all', label: 'All types' },
  ...TYPE_OPTIONS,
];

const KIND_FILTERS: Array<{ value: 'all' | ItemKind; label: string }> = [
  { value: 'all', label: 'All kinds' },
  ...KIND_OPTIONS,
];

const STATUS_FILTERS: Array<{ value: 'all' | ItemStatus; label: string }> = [
  { value: 'all', label: 'All statuses' },
  ...STATUS_OPTIONS,
];

function asKind(value: string | null): ItemKind | 'all' {
  if (value === 'guitar' || value === 'amp') return value;
  return 'all';
}

function asStatus(value: string | null): ItemStatus | 'all' {
  if (value === 'for_sale' || value === 'keeping' || value === 'tbd' || value === 'sold') {
    return value;
  }
  return 'all';
}

export function CollectionPage() {
  const { guitars, ready } = useGuitars();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const type = (params.get('type') as GuitarType | 'all' | null) ?? 'all';
  const make = params.get('make') ?? 'all';
  const kind = asKind(params.get('kind'));
  const status = asStatus(params.get('status'));
  const view = params.get('view') === 'list' ? 'list' : 'grid';

  const makes = useMemo(() => uniqueMakes(guitars), [guitars]);
  const visible = useMemo(
    () => filterGuitars(guitars, { query, type, make, kind, status }),
    [guitars, query, type, make, kind, status],
  );
  const totals = useMemo(() => collectionTotals(visible), [visible]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    if (key === 'kind' && value === 'amp') next.delete('type');
    setParams(next, { replace: true });
  }

  if (!ready) {
    return <p className="lede">Opening the catalogue…</p>;
  }

  if (guitars.length === 0) {
    return (
      <>
        <ImportBanner />
        <CsvTools />
        <EmptyState />
      </>
    );
  }

  const filteredEmpty = visible.length === 0;

  return (
    <section>
      <ImportBanner />
      <CsvTools />
      <div className="toolbar">
        <div>
          <h1 className="page-title">The rack</h1>
          <p className="lede">Guitars and amps, with asking prices and insurance figures in CAD.</p>
        </div>
        <div className="search-row">
          <input
            className="search-field"
            type="search"
            value={query}
            onChange={(e) => setParam('q', e.target.value)}
            placeholder="Search make, model, serial, notes…"
            aria-label="Search the catalogue"
          />
          <select
            className="select-field"
            value={make}
            onChange={(e) => setParam('make', e.target.value)}
            aria-label="Filter by make"
          >
            <option value="all">All makes</option>
            {makes.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <FilterChips
          label="Filter by kind"
          filters={KIND_FILTERS}
          current={kind}
          onChange={(value) => setParam('kind', value)}
        />
        <FilterChips
          label="Filter by status"
          filters={STATUS_FILTERS}
          current={status}
          onChange={(value) => setParam('status', value)}
        />
        <div className="filter-row">
          {kind === 'amp' ? null : (
            <FilterChips
              label="Filter by type"
              filters={TYPE_FILTERS}
              current={type}
              onChange={(value) => setParam('type', value)}
            />
          )}
          <div className="view-toggle" role="group" aria-label="Layout">
            <button
              type="button"
              className="icon-btn"
              aria-pressed={view === 'grid'}
              aria-label="Grid view"
              onClick={() => setParam('view', 'grid')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" />
                <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" />
                <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" />
                <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" />
              </svg>
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-pressed={view === 'list'}
              aria-label="List view"
              onClick={() => setParam('view', 'list')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <rect x="1" y="2" width="14" height="2.4" rx="1" fill="currentColor" />
                <rect x="1" y="6.8" width="14" height="2.4" rx="1" fill="currentColor" />
                <rect x="1" y="11.6" width="14" height="2.4" rx="1" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {filteredEmpty ? (
        <section className="empty-state">
          <h2 className="page-title">No matching items</h2>
          <p>Try another kind, status, make, or search term.</p>
          <button className="btn btn-ghost" type="button" onClick={() => setParams({}, { replace: true })}>
            Clear filters
          </button>
        </section>
      ) : (
        <>
          <div className="totals-bar" aria-live="polite">
            <span>{pluralize(totals.count, 'item')} in this view</span>
            <span>
              Insurance value <strong>{formatMoney(totals.insuranceValue)}</strong>
            </span>
            <span>
              For-sale list value <strong>{formatMoney(totals.forSaleListValue)}</strong>
            </span>
          </div>
          <p className="hint totals-hint">
            Insurance value sums the high figure (or the low figure when high is blank) times
            quantity. For-sale list value sums list price times quantity for items marked For sale.
          </p>
          {view === 'list' ? (
            <div className="list">
              {visible.map((guitar) => (
                <GuitarListRow key={guitar.id} guitar={guitar} />
              ))}
            </div>
          ) : (
            <div className="grid">
              {visible.map((guitar) => (
                <GuitarCard key={guitar.id} guitar={guitar} />
              ))}
            </div>
          )}
        </>
      )}

      <p className="hint" style={{ marginTop: '1.5rem' }}>
        <Link to="/new">Add another item</Link>
      </p>
    </section>
  );
}

function FilterChips<T extends string>({
  label,
  filters,
  current,
  onChange,
}: {
  label: string;
  filters: Array<{ value: T; label: string }>;
  current: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="chip-row" role="group" aria-label={label}>
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          className="chip"
          aria-pressed={current === filter.value}
          onClick={() => onChange(filter.value)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
