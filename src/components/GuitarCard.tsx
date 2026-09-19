import { Link } from 'react-router-dom';
import { formatYear, guitarTitle, typeLabel } from '../format';
import type { Guitar } from '../types';
import { GuitarSilhouette } from './GuitarSilhouette';

export function GuitarCard({ guitar }: { guitar: Guitar }) {
  const photo = guitar.photos[0];
  const title = guitarTitle(guitar.make, guitar.model);

  return (
    <Link className="card" to={`/guitar/${guitar.id}`}>
      <div className="card-photo">
        {photo ? (
          <img src={photo} alt="" />
        ) : (
          <div className="placeholder-photo">
            <GuitarSilhouette className="empty-art" />
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="eyebrow">{guitar.make || 'Unknown make'}</div>
        <h2>{guitar.model || title}</h2>
        <div className="card-meta">
          <span>{formatYear(guitar.year)}</span>
          <span className="badge">{typeLabel(guitar.type)}</span>
        </div>
      </div>
    </Link>
  );
}

export function GuitarListRow({ guitar }: { guitar: Guitar }) {
  const photo = guitar.photos[0];
  const title = guitarTitle(guitar.make, guitar.model);

  return (
    <Link className="list-row" to={`/guitar/${guitar.id}`}>
      <div className="list-thumb">
        {photo ? (
          <img src={photo} alt="" />
        ) : (
          <div className="placeholder-photo">
            <GuitarSilhouette />
          </div>
        )}
      </div>
      <div className="list-copy">
        <h2>{title}</h2>
        <p>
          {formatYear(guitar.year)}
          {guitar.serialNumber ? ` · ${guitar.serialNumber}` : ''}
        </p>
      </div>
      <span className="badge">{typeLabel(guitar.type)}</span>
    </Link>
  );
}
