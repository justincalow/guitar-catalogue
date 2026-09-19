import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { GuitarForm } from '../components/GuitarForm';
import { guitarTitle } from '../format';
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
        ← {guitar ? guitarTitle(guitar.make, guitar.model) : 'The rack'}
      </Link>
      <h1>{editing ? 'Edit guitar' : 'Add a guitar'}</h1>
      <p className="lede">
        {editing
          ? 'Update the record. Changes sync to your cloud catalogue.'
          : 'Log the instrument as you would in a workshop book — specs, value, and a photo or two.'}
      </p>
      <GuitarForm
        guitar={guitar}
        onSubmit={save}
        submitLabel={editing ? 'Save changes' : 'Add to catalogue'}
      />
    </section>
  );
}
