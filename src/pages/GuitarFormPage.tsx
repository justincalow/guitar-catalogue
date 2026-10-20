import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { GuitarForm } from '../components/GuitarForm';
import { itemTitle } from '../format';
import { useGuitars } from '../store';
import type { GuitarDraft } from '../types';

export function GuitarFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ready, getById, addGuitar, updateGuitar } = useGuitars();
  const editing = Boolean(id);
  const guitar = id ? getById(id) : undefined;

  if (!ready) return <p className="lede">Opening the catalogue…</p>;
  if (editing && !guitar) return <Navigate to="/" replace />;

  async function save(draft: GuitarDraft) {
    if (editing && guitar) {
      await updateGuitar(guitar.id, draft);
      navigate(`/guitar/${guitar.id}`);
      return;
    }
    const created = await addGuitar(draft);
    navigate(`/guitar/${created.id}`);
  }

  return (
    <section className="form-page">
      <Link className="crumb" to={guitar ? `/guitar/${guitar.id}` : '/'}>
        ← {guitar ? itemTitle(guitar) : 'The rack'}
      </Link>
      <h1>{editing ? 'Edit item' : 'Add an item'}</h1>
      <p className="lede">
        {editing
          ? 'Update the record. Changes sync to your cloud catalogue.'
          : 'Log a guitar or an amp — specs, CAD values, and a photo or two. Mark it sold to keep the history.'}
      </p>
      <GuitarForm
        guitar={guitar}
        onSubmit={save}
        submitLabel={editing ? 'Save changes' : 'Add to catalogue'}
      />
    </section>
  );
}
