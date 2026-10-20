import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { KIND_OPTIONS, STATUS_OPTIONS, TYPE_OPTIONS, kindLabel } from '../format';
import { emptyDraft, type Guitar, type GuitarDraft, type GuitarType, type ItemKind, type ItemStatus } from '../types';
import { PhotoField } from './PhotoField';

const currentYear = new Date().getFullYear();

function fromGuitar(guitar: Guitar): GuitarDraft {
  return {
    name: guitar.name,
    make: guitar.make,
    model: guitar.model,
    year: guitar.year,
    serialNumber: guitar.serialNumber,
    itemKind: guitar.itemKind,
    type: guitar.type,
    colour: guitar.colour,
    strings: guitar.strings ?? 6,
    pickupConfig: guitar.pickupConfig,
    purchaseDate: guitar.purchaseDate,
    purchasePrice: guitar.purchasePrice,
    estimatedValue: guitar.estimatedValue,
    conditionNotes: guitar.conditionNotes,
    notes: guitar.notes,
    photos: guitar.photos,
    status: guitar.status,
    listPrice: guitar.listPrice,
    floorPrice: guitar.floorPrice,
    valueRange: guitar.valueRange,
    insuranceLow: guitar.insuranceLow,
    insuranceHigh: guitar.insuranceHigh,
    insuranceValue: guitar.insuranceValue,
    insuranceBasis: guitar.insuranceBasis,
    insuranceConfidence: guitar.insuranceConfidence,
    quantity: guitar.quantity,
    details: guitar.details,
    soldDate: guitar.soldDate,
    soldPrice: guitar.soldPrice,
  };
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

function priceIsNegative(value: number | null): boolean {
  return value !== null && value < 0;
}

interface GuitarFormProps {
  guitar?: Guitar;
  onSubmit: (draft: GuitarDraft) => Promise<void>;
  submitLabel: string;
}

export function GuitarForm({ guitar, onSubmit, submitLabel }: GuitarFormProps) {
  const [draft, setDraft] = useState<GuitarDraft>(guitar ? fromGuitar(guitar) : emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isAmp = draft.itemKind === 'amp';

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
    if (!isAmp && (draft.strings === null || draft.strings < 1 || draft.strings > 18)) {
      setError('Number of strings must be between 1 and 18.');
      return;
    }
    if (!Number.isInteger(draft.quantity) || draft.quantity < 0 || draft.quantity > 9999) {
      setError('Quantity must be a whole number from 0 to 9999.');
      return;
    }
    if (
      priceIsNegative(draft.purchasePrice) ||
      priceIsNegative(draft.estimatedValue) ||
      priceIsNegative(draft.listPrice) ||
      priceIsNegative(draft.floorPrice) ||
      priceIsNegative(draft.insuranceLow) ||
      priceIsNegative(draft.insuranceHigh) ||
      priceIsNegative(draft.soldPrice)
    ) {
      setError('Prices cannot be negative.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        ...draft,
        name: draft.name.trim(),
        make,
        model,
        serialNumber: draft.serialNumber.trim(),
        colour: draft.colour.trim(),
        pickupConfig: isAmp ? '' : draft.pickupConfig.trim(),
        strings: isAmp ? null : draft.strings,
        conditionNotes: draft.conditionNotes.trim(),
        notes: draft.notes.trim(),
        details: draft.details.trim(),
        valueRange: draft.valueRange.trim(),
        insuranceValue: draft.insuranceValue.trim(),
        insuranceBasis: draft.insuranceBasis.trim(),
        insuranceConfidence: draft.insuranceConfidence.trim(),
        soldDate: draft.status === 'sold' ? draft.soldDate : '',
        soldPrice: draft.status === 'sold' ? draft.soldPrice : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that item.');
      setSaving(false);
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <fieldset>
        <legend>Identity</legend>
        <div className="fields">
          <div className="field">
            <label htmlFor="itemKind">Kind</label>
            <select
              id="itemKind"
              name="itemKind"
              value={draft.itemKind}
              onChange={(e) => update('itemKind', e.target.value as ItemKind)}
            >
              {KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {kindLabel(option.value)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={draft.status}
              onChange={(e) => update('status', e.target.value as ItemStatus)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field field-span">
            <label htmlFor="name">Catalogue name</label>
            <textarea
              id="name"
              name="name"
              rows={2}
              value={draft.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Optional. Leave blank to use make and model. CSV import fills this from the Item column."
            />
          </div>
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
            <label htmlFor="quantity">Quantity</label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min={0}
              max={9999}
              step={1}
              value={draft.quantity}
              onChange={(e) => update('quantity', Number(e.target.value))}
            />
          </div>
          {isAmp ? null : (
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
          )}
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
              placeholder={isAmp ? 'Black tolex, wheat grille…' : 'Sunburst, Olympic White…'}
            />
          </div>
          {isAmp ? null : (
            <>
              <div className="field">
                <label htmlFor="strings">Number of strings</label>
                <input
                  id="strings"
                  name="strings"
                  type="number"
                  min={1}
                  max={18}
                  value={draft.strings ?? ''}
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
            </>
          )}
          <div className="field field-span">
            <label htmlFor="details">Details</label>
            <textarea
              id="details"
              name="details"
              value={draft.details}
              onChange={(e) => update('details', e.target.value)}
              placeholder={
                isAmp
                  ? 'Wattage, speakers, tubes, condition…'
                  : 'Finish, neck, hardware, and other specs…'
              }
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Asking price and insurance</legend>
        <p className="hint">All figures are CAD.</p>
        <div className="fields">
          <div className="field">
            <label htmlFor="listPrice">List price (CAD)</label>
            <input
              id="listPrice"
              name="listPrice"
              type="number"
              min={0}
              step="0.01"
              value={draft.listPrice ?? ''}
              onChange={(e) => update('listPrice', parseOptionalNumber(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="floorPrice">Floor price (CAD)</label>
            <input
              id="floorPrice"
              name="floorPrice"
              type="number"
              min={0}
              step="0.01"
              value={draft.floorPrice ?? ''}
              onChange={(e) => update('floorPrice', parseOptionalNumber(e.target.value))}
            />
          </div>
          <div className="field field-span">
            <label htmlFor="valueRange">Value range</label>
            <input
              id="valueRange"
              name="valueRange"
              value={draft.valueRange}
              onChange={(e) => update('valueRange', e.target.value)}
              placeholder="4500-5500 (insurance)"
            />
          </div>
          <div className="field">
            <label htmlFor="insuranceLow">Insurance low (CAD)</label>
            <input
              id="insuranceLow"
              name="insuranceLow"
              type="number"
              min={0}
              step="0.01"
              value={draft.insuranceLow ?? ''}
              onChange={(e) => update('insuranceLow', parseOptionalNumber(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="insuranceHigh">Insurance high (CAD)</label>
            <input
              id="insuranceHigh"
              name="insuranceHigh"
              type="number"
              min={0}
              step="0.01"
              value={draft.insuranceHigh ?? ''}
              onChange={(e) => update('insuranceHigh', parseOptionalNumber(e.target.value))}
            />
          </div>
          <div className="field field-span">
            <label htmlFor="insuranceValue">Insurance / replacement value</label>
            <input
              id="insuranceValue"
              name="insuranceValue"
              value={draft.insuranceValue}
              onChange={(e) => update('insuranceValue', e.target.value)}
              placeholder="9,000-14,000"
            />
          </div>
          <div className="field">
            <label htmlFor="insuranceConfidence">Insurance confidence</label>
            <input
              id="insuranceConfidence"
              name="insuranceConfidence"
              value={draft.insuranceConfidence}
              onChange={(e) => update('insuranceConfidence', e.target.value)}
              placeholder="Estimate, Sourced, Weak guess…"
            />
          </div>
          <div className="field field-span">
            <label htmlFor="insuranceBasis">Insurance basis</label>
            <textarea
              id="insuranceBasis"
              name="insuranceBasis"
              value={draft.insuranceBasis}
              onChange={(e) => update('insuranceBasis', e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      {draft.status === 'sold' ? (
        <fieldset>
          <legend>Sale</legend>
          <p className="hint">Kept on the record so a sale stays in the catalogue.</p>
          <div className="fields">
            <div className="field">
              <label htmlFor="soldDate">Sold date</label>
              <input
                id="soldDate"
                name="soldDate"
                type="date"
                value={draft.soldDate}
                onChange={(e) => update('soldDate', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="soldPrice">Sold price (CAD)</label>
              <input
                id="soldPrice"
                name="soldPrice"
                type="number"
                min={0}
                step="0.01"
                value={draft.soldPrice ?? ''}
                onChange={(e) => update('soldPrice', parseOptionalNumber(e.target.value))}
              />
            </div>
          </div>
        </fieldset>
      ) : null}

      <fieldset>
        <legend>Acquisition</legend>
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
            <label htmlFor="purchasePrice">Purchase price (CAD)</label>
            <input
              id="purchasePrice"
              name="purchasePrice"
              type="number"
              min={0}
              step="0.01"
              value={draft.purchasePrice ?? ''}
              onChange={(e) => update('purchasePrice', parseOptionalNumber(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="estimatedValue">Current estimated value (CAD)</label>
            <input
              id="estimatedValue"
              name="estimatedValue"
              type="number"
              min={0}
              step="0.01"
              value={draft.estimatedValue ?? ''}
              onChange={(e) => update('estimatedValue', parseOptionalNumber(e.target.value))}
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
              className="tall"
              value={draft.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Comps, links, and anything that does not fit a field. Links stay clickable on the detail page."
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Photos</legend>
        <p className="hint">Photos stay manual. CSV import does not attach pictures.</p>
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
