import { useId, useState, type ChangeEvent } from 'react';
import { fileToStoredPhoto } from '../photos';

interface PhotoFieldProps {
  photos: string[];
  onChange: (photos: string[]) => void;
}

export function PhotoField({ photos, onChange }: PhotoFieldProps) {
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = '';
    if (!files.length) return;

    setBusy(true);
    setError(null);
    try {
      const next = [...photos];
      for (const file of files) {
        next.push(await fileToStoredPhoto(file));
      }
      onChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add that photo.');
    } finally {
      setBusy(false);
    }
  }

  function removeAt(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  // Index 0 is the main photo (rack thumbnail and the detail hero). Moving an
  // existing picture only changes array order; storage paths are matched by URL.
  function movePhoto(from: number, to: number) {
    if (from === to || to < 0 || to >= photos.length) return;
    const next = photos.slice();
    const [photo] = next.splice(from, 1);
    next.splice(to, 0, photo);
    onChange(next);
  }

  return (
    <div className="field file-input">
      <label htmlFor={inputId}>Photos</label>
      <p className="hint">
        Add one or more pictures. The first photo is the main image on the rack and the item
        page. Use the star to choose it, or the arrows to reorder. Pictures are stored privately
        with your catalogue and available on any device you sign in from.
      </p>
      {photos.length > 0 ? (
        <div className="photo-grid">
          {photos.map((photo, index) => {
            const main = index === 0;
            return (
              <div className="photo-tile" key={`${index}-${photo.slice(0, 24)}`}>
                <img src={photo} alt={`Photo ${index + 1}`} />
                {main ? <span className="photo-main-badge">Main</span> : null}
                <button
                  type="button"
                  className="photo-remove"
                  aria-label={`Remove photo ${index + 1}`}
                  onClick={() => removeAt(index)}
                >
                  ×
                </button>
                <div className="photo-tile-actions">
                  <button
                    type="button"
                    aria-label={`Move photo ${index + 1} left`}
                    disabled={index === 0}
                    onClick={() => movePhoto(index, index - 1)}
                  >
                    <span aria-hidden="true">‹</span>
                  </button>
                  <button
                    type="button"
                    aria-label={main ? 'Main photo' : `Set photo ${index + 1} as main`}
                    aria-pressed={main}
                    title={main ? 'Main photo' : 'Set as main'}
                    onClick={() => movePhoto(index, 0)}
                  >
                    <span aria-hidden="true">{main ? '★' : '☆'}</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Move photo ${index + 1} right`}
                    disabled={index === photos.length - 1}
                    onClick={() => movePhoto(index, index + 1)}
                  >
                    <span aria-hidden="true">›</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        onChange={onFiles}
        disabled={busy}
      />
      {busy ? <p className="hint">Preparing photos…</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
