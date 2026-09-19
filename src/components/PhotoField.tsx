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

  return (
    <div className="field file-input">
      <label htmlFor={inputId}>Photos</label>
      <p className="hint">
        Add one or more pictures. They stay on this device with the rest of the
        catalogue.
      </p>
      {photos.length > 0 ? (
        <div className="photo-grid">
          {photos.map((photo, index) => (
            <div className="photo-tile" key={`${index}-${photo.slice(0, 24)}`}>
              <img src={photo} alt={`Guitar photo ${index + 1}`} />
              <button
                type="button"
                aria-label={`Remove photo ${index + 1}`}
                onClick={() => removeAt(index)}
              >
                ×
              </button>
            </div>
          ))}
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
