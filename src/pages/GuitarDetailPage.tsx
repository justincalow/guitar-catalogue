import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GuitarSilhouette } from '../components/GuitarSilhouette';
import {
  formatDate,
  formatMoney,
  formatYear,
  guitarTitle,
  typeLabel,
} from '../format';
import { useGuitars } from '../store';

export function GuitarDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ready, getById, deleteGuitar } = useGuitars();
  const [activePhoto, setActivePhoto] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!ready) return <p className="lede">Opening the catalogue…</p>;
  if (!id) return <Navigate to="/" replace />;

  const guitar = getById(id);
  if (!guitar) {
    return (
      <section className="missing">
        <h1>Guitar not found</h1>
        <p>It may have been removed from the catalogue.</p>
        <Link className="btn btn-primary" to="/">
          Back to the rack
        </Link>
      </section>
    );
  }

  const title = guitarTitle(guitar.make, guitar.model);
  const photos = guitar.photos;
  const photo = photos[Math.min(activePhoto, Math.max(photos.length - 1, 0))];
  const guitarId = guitar.id;

  async function onDelete() {
    setBusy(true);
    await deleteGuitar(guitarId);
    navigate('/');
  }

  return (
    <article className="detail">
      <Link className="crumb" to="/">
        ← The rack
      </Link>
      <div className="detail-hero">
        <div>
          <div className="hero-photo">
            {photo ? (
              <img src={photo} alt={title} />
            ) : (
              <div className="placeholder-photo">
                <GuitarSilhouette className="empty-art" />
              </div>
            )}
          </div>
          {photos.length > 1 ? (
            <div className="thumbs">
              {photos.map((src, index) => (
                <button
                  key={`${index}-${src.slice(0, 18)}`}
                  type="button"
                  aria-label={`Show photo ${index + 1}`}
                  aria-current={index === activePhoto}
                  onClick={() => setActivePhoto(index)}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="detail-head">
          <div className="eyebrow">{typeLabel(guitar.type)}</div>
          <h1 className="detail-title">{title}</h1>
          <p className="lede">{formatYear(guitar.year)}</p>
          <div className="detail-actions">
            <Link className="btn btn-primary" to={`/guitar/${guitar.id}/edit`}>
              Edit
            </Link>
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => setConfirming(true)}
            >
              Delete
            </button>
          </div>
          <dl className="specs">
            <div>
              <dt>Serial</dt>
              <dd>{guitar.serialNumber || '—'}</dd>
            </div>
            <div>
              <dt>Colour / finish</dt>
              <dd>{guitar.colour || '—'}</dd>
            </div>
            <div>
              <dt>Strings</dt>
              <dd>{guitar.strings}</dd>
            </div>
            <div>
              <dt>Pickups</dt>
              <dd>{guitar.pickupConfig || '—'}</dd>
            </div>
            <div>
              <dt>Purchased</dt>
              <dd>{formatDate(guitar.purchaseDate)}</dd>
            </div>
            <div>
              <dt>Purchase price</dt>
              <dd>{formatMoney(guitar.purchasePrice)}</dd>
            </div>
            <div>
              <dt>Estimated value</dt>
              <dd>{formatMoney(guitar.estimatedValue)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {guitar.conditionNotes ? (
        <section className="notes-block">
          <h2>Condition</h2>
          <p>{guitar.conditionNotes}</p>
        </section>
      ) : null}

      {guitar.notes ? (
        <section className="notes-block">
          <h2>Notes</h2>
          <p>{guitar.notes}</p>
        </section>
      ) : null}

      <ConfirmDialog
        open={confirming}
        title="Remove this guitar?"
        message={`“${title}” will be deleted from this catalogue. This cannot be undone.`}
        confirmLabel={busy ? 'Removing…' : 'Delete guitar'}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          if (!busy) void onDelete();
        }}
      />
    </article>
  );
}
