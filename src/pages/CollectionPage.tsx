import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { TYPE_OPTIONS } from '../format';
import { filterGuitars, uniqueMakes } from '../search';
import { useGuitars } from '../store';
import type { GuitarType } from '../types';
import { EmptyState } from '../components/EmptyState';
import { GuitarCard, GuitarListRow } from '../components/GuitarCard';

const TYPE_FILTERS: Array<{ value: 'all' | GuitarType; label: string }> = [
  { value: 'all', label: 'All types' },
  ...TYPE_OPTIONS,
];

export function CollectionPage() {
  const { guitars, ready } = useGuitars();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const type = (params.get('type') as GuitarType | 'all' | null) ?? 'all';
  const make = params.get('make') ?? 'all';
  const view = params.get('view') === 'list' ? 'list' : 'grid';

  const makes = useMemo(() => uniqueMakes(guitars), [guitars]);
  const visible = useMemo(
    () => filterGuitars(guitars, { query, type, make }),
    [guitars, query, type, make],
  );

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  if (!ready) {
    return <p className="lede">Opening the catalogue…</p>;
  }

  if (guitars.length === 0) {
    return <EmptyState />;
  }

  const filteredEmpty = visible.length === 0;

  return (
    <section>
      <div className="toolbar">
        <div>
          <h1 className="page-title">The rack</h1>
          <p className="lede">Browse, search, and keep every instrument in one place.</p>
        </div>
        <div className="search-row">
          <input
            className="search-field"
            type="search"
            value={query}
            onChange={(e) => setParam('q', e.target.value)}
            placeholder="Search make, model, serial, notes…"
            aria-label="Search guitars"
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
        <div className="filter-row">
          <div className="chip-row" role="group" aria-label="Filter by type">
            {TYPE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className="chip"
                aria-pressed={type === filter.value}
                onClick={() => setParam('type', filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
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
          <h2 className="page-title">No matching guitars</h2>
          <p>Try another make, type, or search term.</p>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => setParams({}, { replace: true })}
          >
            Clear filters
          </button>
        </section>
      ) : view === 'list' ? (
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

      <p className="hint" style={{ marginTop: '1.5rem' }}>
        <Link to="/new">Add another guitar</Link>
      </p>
    </section>
  );
}
