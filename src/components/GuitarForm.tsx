import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { TYPE_OPTIONS } from '../format';
import type { Guitar, GuitarDraft, GuitarType } from '../types';
import { PhotoField } from './PhotoField';

const currentYear = new Date().getFullYear();

export const emptyDraft: GuitarDraft = {
  make: '',
  model: '',
  year: null,
  serialNumber: '',
  type: 'electric',
  colour: '',
  strings: 6,
  pickupConfig: '',
  purchaseDate: '',
  purchasePrice: null,
  estimatedValue: null,
  conditionNotes: '',
  notes: '',
  photos: [],
};

function fromGuitar(guitar: Guitar): GuitarDraft {
  return {
    make: guitar.make,
    model: guitar.model,
    year: guitar.year,
    serialNumber: guitar.serialNumber,
    type: guitar.type,
    colour: guitar.colour,
    strings: guitar.strings,
    pickupConfig: guitar.pickupConfig,
    purchaseDate: guitar.purchaseDate,
    purchasePrice: guitar.purchasePrice,
    estimatedValue: guitar.estimatedValue,
    conditionNotes: guitar.conditionNotes,
    notes: guitar.notes,
    photos: guitar.photos,
  };
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

interface GuitarFormProps {
  guitar?: Guitar;
  onSubmit: (draft: GuitarDraft) => Promise<void>;
  submitLabel: string;
}

export function GuitarForm({ guitar, onSubmit, submitLabel }: GuitarFormProps) {
  const [draft, setDraft] = useState<GuitarDraft>(
    guitar ? fromGuitar(guitar) : emptyDraft,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof GuitarDraft>(key: K, value: GuitarDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const make = draft.make.trim();
    const model = draft.model.trim();
    if (!make || !model) {
      setError('Make and model are required.');
      return;
    }
    if (draft.year !== null && (draft.year < 1800 || draft.year > currentYear + 1)) {
      setError(`Year must be between 1800 and ${currentYear + 1}.`);
      return;
    }
    if (draft.strings < 1 || draft.strings > 18) {
      setError('Number of strings must be between 1 and 18.');
      return;
    }
    if (
      (draft.purchasePrice !== null && draft.purchasePrice < 0) ||
      (draft.estimatedValue !== null && draft.estimatedValue < 0)
    ) {
      setError('Prices cannot be negative.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        ...draft,
        make,
        model,
        serialNumber: draft.serialNumber.trim(),
        colour: draft.colour.trim(),
        pickupConfig: draft.pickupConfig.trim(),
        conditionNotes: draft.conditionNotes.trim(),
        notes: draft.notes.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that guitar.');
      setSaving(false);
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <fieldset>
        <legend>Identity</legend>
        <div className="fields">
          <div className="field">
            <label htmlFor="make">Make</label>
            <input
              id="make"
              name="make"
              required
              autoComplete="off"
              value={draft.make}
              onChange={(e) => update('make', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="model">Model</label>
            <input
              id="model"
              name="model"
              required
              autoComplete="off"
              value={draft.model}
              onChange={(e) => update('model', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="year">Year</label>
            <input
              id="year"
              name="year"
              type="number"
              inputMode="numeric"
              min={1800}
              max={currentYear + 1}
              placeholder="1962"
              value={draft.year ?? ''}
              onChange={(e) => update('year', parseOptionalNumber(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="serialNumber">Serial number</label>
            <input
              id="serialNumber"
              name="serialNumber"
              autoComplete="off"
              value={draft.serialNumber}
              onChange={(e) => update('serialNumber', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={draft.type}
              onChange={(e) => update('type', e.target.value as GuitarType)}
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Specifications</legend>
        <div className="fields">
          <div className="field">
            <label htmlFor="colour">Colour / finish</label>
            <input
              id="colour"
              name="colour"
              value={draft.colour}
              onChange={(e) => update('colour', e.target.value)}
              placeholder="Sunburst, Olympic White…"
            />
          </div>
          <div className="field">
            <label htmlFor="strings">Number of strings</label>
            <input
              id="strings"
              name="strings"
              type="number"
              min={1}
              max={18}
              value={draft.strings}
              onChange={(e) => update('strings', Number(e.target.value) || 0)}
            />
          </div>
          <div className="field field-span">
            <label htmlFor="pickupConfig">Pickup configuration</label>
            <input
              id="pickupConfig"
              name="pickupConfig"
              value={draft.pickupConfig}
              onChange={(e) => update('pickupConfig', e.target.value)}
              placeholder="SSS, HSS, HH, P-90… (optional)"
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Acquisition & value</legend>
        <div className="fields">
          <div className="field">
            <label htmlFor="purchaseDate">Purchase date</label>
            <input
              id="purchaseDate"
              name="purchaseDate"
              type="date"
              value={draft.purchaseDate}
              onChange={(e) => update('purchaseDate', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="purchasePrice">Purchase price (£)</label>
            <input
              id="purchasePrice"
              name="purchasePrice"
              type="number"
              min={0}
              step="0.01"
              value={draft.purchasePrice ?? ''}
              onChange={(e) =>
                update('purchasePrice', parseOptionalNumber(e.target.value))
              }
            />
          </div>
          <div className="field">
            <label htmlFor="estimatedValue">Current estimated value (£)</label>
            <input
              id="estimatedValue"
              name="estimatedValue"
              type="number"
              min={0}
              step="0.01"
              value={draft.estimatedValue ?? ''}
              onChange={(e) =>
                update('estimatedValue', parseOptionalNumber(e.target.value))
              }
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Notes</legend>
        <div className="fields">
          <div className="field field-span">
            <label htmlFor="conditionNotes">Condition notes</label>
            <textarea
              id="conditionNotes"
              name="conditionNotes"
              value={draft.conditionNotes}
              onChange={(e) => update('conditionNotes', e.target.value)}
            />
          </div>
          <div className="field field-span">
            <label htmlFor="notes">General notes</label>
            <textarea
              id="notes"
              name="notes"
              value={draft.notes}
              onChange={(e) => update('notes', e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Photos</legend>
        <PhotoField photos={draft.photos} onChange={(photos) => update('photos', photos)} />
      </fieldset>

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="form-actions">
        <Link className="btn btn-ghost" to={guitar ? `/guitar/${guitar.id}` : '/'}>
          Cancel
        </Link>
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
