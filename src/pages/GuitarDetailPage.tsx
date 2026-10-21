import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AmpSilhouette } from '../components/AmpSilhouette';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GuitarSilhouette } from '../components/GuitarSilhouette';
import { LinkedText } from '../components/LinkedText';
import { PhotoLightbox } from '../components/PhotoLightbox';
import {
  formatDate,
  formatMoney,
  formatYear,
  itemTitle,
  kindLabel,
  statusLabel,
  typeLabel,
} from '../format';
import { useGuitars } from '../store';

export function GuitarDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ready, getById, deleteGuitar } = useGuitars();
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!ready) return <p className="lede">Opening the catalogue…</p>;
  if (!id) return <Navigate to="/" replace />;

  const guitar = getById(id);
  if (!guitar) {
    return (
      <section className="missing">
        <h1>Item not found</h1>
        <p>It may have been removed from the catalogue.</p>
        <Link className="btn btn-primary" to="/">
          Back to the rack
        </Link>
      </section>
    );
  }

  const title = itemTitle(guitar);
  const photos = guitar.photos;
  const activeIndex = photos.length === 0 ? 0 : Math.min(activePhoto, photos.length - 1);
  const photo = photos[activeIndex];
  const guitarId = guitar.id;

  // A thumbnail click selects that photo as the hero and opens the lightbox on
  // it. Clicking the hero opens the lightbox on the current hero. Prev/next
  // and swipe inside the lightbox update the hero, so closing leaves the last
  // viewed photo on the page.
  function openLightbox(index: number) {
    setActivePhoto(index);
    setLightboxOpen(true);
  }
  const isAmp = guitar.itemKind === 'amp';
  const noun = isAmp ? 'amp' : 'guitar';

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
          {photo ? (
            <button
              type="button"
              className="hero-photo"
              aria-label={
                photos.length > 1
                  ? `View ${title} photo ${activeIndex + 1} of ${photos.length} full size`
                  : `View ${title} full size`
              }
              aria-haspopup="dialog"
              aria-expanded={lightboxOpen}
              onClick={() => openLightbox(activeIndex)}
            >
              <img src={photo} alt="" />
            </button>
          ) : (
            <div className="hero-photo">
              <div className="placeholder-photo">
                {isAmp ? (
                  <AmpSilhouette className="empty-art" />
                ) : (
                  <GuitarSilhouette className="empty-art" />
                )}
              </div>
            </div>
          )}
          {photos.length > 1 ? (
            <div className="thumbs">
              {photos.map((src, index) => (
                <button
                  key={`${index}-${src.slice(0, 18)}`}
                  type="button"
                  aria-label={`View photo ${index + 1} full size`}
                  aria-current={index === activeIndex}
                  aria-haspopup="dialog"
                  aria-expanded={lightboxOpen && index === activeIndex}
                  onClick={() => openLightbox(index)}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="detail-head">
          <div className="eyebrow">
            {kindLabel(guitar.itemKind)}
            {isAmp ? '' : ` · ${typeLabel(guitar.type)}`}
            {` · ${statusLabel(guitar.status)}`}
          </div>
          <h1 className="detail-title">{title}</h1>
          <p className="lede">{formatYear(guitar.year)}</p>
          <div className="detail-actions">
            <Link className="btn btn-primary" to={`/guitar/${guitar.id}/edit`}>
              Edit
            </Link>
            <button className="btn btn-danger" type="button" onClick={() => setConfirming(true)}>
              Delete
            </button>
          </div>
          <dl className="specs">
            <div>
              <dt>Make</dt>
              <dd>{guitar.make || '—'}</dd>
            </div>
            <div>
              <dt>Model</dt>
              <dd>{guitar.model || '—'}</dd>
            </div>
            <div>
              <dt>Serial</dt>
              <dd>{guitar.serialNumber || '—'}</dd>
            </div>
            <div>
              <dt>Quantity</dt>
              <dd>{guitar.quantity}</dd>
            </div>
            <div>
              <dt>Colour / finish</dt>
              <dd>{guitar.colour || '—'}</dd>
            </div>
            {isAmp ? null : (
              <>
                <div>
                  <dt>Strings</dt>
                  <dd>{guitar.strings ?? '—'}</dd>
                </div>
                <div>
                  <dt>Pickups</dt>
                  <dd>{guitar.pickupConfig || '—'}</dd>
                </div>
              </>
            )}
            <div>
              <dt>List price</dt>
              <dd>{formatMoney(guitar.listPrice)}</dd>
            </div>
            <div>
              <dt>Floor price</dt>
              <dd>{formatMoney(guitar.floorPrice)}</dd>
            </div>
            <div>
              <dt>Value range</dt>
              <dd>{guitar.valueRange || '—'}</dd>
            </div>
            <div>
              <dt>Insurance low</dt>
              <dd>{formatMoney(guitar.insuranceLow)}</dd>
            </div>
            <div>
              <dt>Insurance high</dt>
              <dd>{formatMoney(guitar.insuranceHigh)}</dd>
            </div>
            <div>
              <dt>Insurance / replacement</dt>
              <dd>{guitar.insuranceValue || '—'}</dd>
            </div>
            <div>
              <dt>Insurance confidence</dt>
              <dd>{guitar.insuranceConfidence || '—'}</dd>
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
            {guitar.status === 'sold' ? (
              <>
                <div>
                  <dt>Sold</dt>
                  <dd>{formatDate(guitar.soldDate)}</dd>
                </div>
                <div>
                  <dt>Sold price</dt>
                  <dd>{formatMoney(guitar.soldPrice)}</dd>
                </div>
              </>
            ) : null}
          </dl>
        </div>
      </div>

      {guitar.details ? (
        <section className="notes-block">
          <h2>Details</h2>
          <LinkedText text={guitar.details} />
        </section>
      ) : null}

      {guitar.insuranceBasis ? (
        <section className="notes-block">
          <h2>Insurance basis</h2>
          <LinkedText text={guitar.insuranceBasis} />
        </section>
      ) : null}

      {guitar.conditionNotes ? (
        <section className="notes-block">
          <h2>Condition</h2>
          <LinkedText text={guitar.conditionNotes} />
        </section>
      ) : null}

      {guitar.notes ? (
        <section className="notes-block">
          <h2>Notes</h2>
          <LinkedText text={guitar.notes} />
        </section>
      ) : null}

      {lightboxOpen && photo ? (
        <PhotoLightbox
          photos={photos}
          index={activeIndex}
          label={title}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setActivePhoto}
        />
      ) : null}

      <ConfirmDialog
        open={confirming}
        title={`Remove this ${noun}?`}
        message={`“${title}” will be deleted from your catalogue on every device. This cannot be undone.`}
        confirmLabel={busy ? 'Removing…' : `Delete ${noun}`}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          if (!busy) void onDelete();
        }}
      />
    </article>
  );
}
