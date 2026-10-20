import { Link } from 'react-router-dom';
import { GuitarSilhouette } from './GuitarSilhouette';

export function EmptyState() {
  return (
    <section className="empty-state">
      <GuitarSilhouette className="empty-art" />
      <h1>Nothing on the rack yet</h1>
      <p>
        Start a living catalogue of the guitars and amps you own — or import a CSV of the
        current inventory. Photos are added on each item.
      </p>
      <Link className="btn btn-primary" to="/new">
        Add your first item
      </Link>
    </section>
  );
}
