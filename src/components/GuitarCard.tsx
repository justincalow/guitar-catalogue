import { Link } from 'react-router-dom';
import { formatMoney, formatYear, itemTitle, kindLabel, statusLabel, typeLabel } from '../format';
import type { Guitar } from '../types';
import { AmpSilhouette } from './AmpSilhouette';
import { GuitarSilhouette } from './GuitarSilhouette';

function Placeholder({ guitar }: { guitar: Guitar }) {
  return (
    <div className="placeholder-photo">
      {guitar.itemKind === 'amp' ? <AmpSilhouette /> : <GuitarSilhouette className="empty-art" />}
    </div>
  );
}

export function GuitarCard({ guitar }: { guitar: Guitar }) {
  const photo = guitar.photos[0];
  const title = itemTitle(guitar);
  const badge =
    guitar.itemKind === 'guitar' ? typeLabel(guitar.type) : kindLabel(guitar.itemKind);

  return (
    <Link className="card" to={`/guitar/${guitar.id}`}>
      <div className="card-photo">
        {photo ? <img src={photo} alt="" /> : <Placeholder guitar={guitar} />}
      </div>
      <div className="card-body">
        <div className="eyebrow">{guitar.make || kindLabel(guitar.itemKind)}</div>
        <h2>{title}</h2>
        <div className="card-meta">
          <span>{formatYear(guitar.year)}</span>
          <span className="badge">{statusLabel(guitar.status)}</span>
        </div>
        <div className="card-meta">
          <span className="badge">{badge}</span>
          {guitar.listPrice !== null ? <span>{formatMoney(guitar.listPrice)}</span> : null}
        </div>
      </div>
    </Link>
  );
}

export function GuitarListRow({ guitar }: { guitar: Guitar }) {
  const photo = guitar.photos[0];
  const title = itemTitle(guitar);

  return (
    <Link className="list-row" to={`/guitar/${guitar.id}`}>
      <div className="list-thumb">
        {photo ? <img src={photo} alt="" /> : <Placeholder guitar={guitar} />}
      </div>
      <div className="list-copy">
        <h2>{title}</h2>
        <p>
          {kindLabel(guitar.itemKind)} · {formatYear(guitar.year)}
          {guitar.serialNumber ? ` · ${guitar.serialNumber}` : ''}
        </p>
      </div>
      <span className="badge">{statusLabel(guitar.status)}</span>
    </Link>
  );
}
