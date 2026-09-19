import { Link } from 'react-router-dom';
import { GuitarSilhouette } from './GuitarSilhouette';

export function EmptyState() {
  return (
    <section className="empty-state">
      <GuitarSilhouette className="empty-art" />
      <h1>Nothing on the rack yet</h1>
      <p>
        Start a living catalogue of the instruments you own — make, model, serial,
        photos, and the notes that never quite fit on a spreadsheet.
      </p>
      <Link className="btn btn-primary" to="/new">
        Add your first guitar
      </Link>
    </section>
  );
}
