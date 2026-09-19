import { Navigate, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { CollectionPage } from './pages/CollectionPage';
import { GuitarDetailPage } from './pages/GuitarDetailPage';
import { GuitarFormPage } from './pages/GuitarFormPage';
import { useGuitars } from './store';

export default function App() {
  const { error } = useGuitars();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      {error ? (
        <p className="banner" role="alert">
          The catalogue could not be opened on this device. Check that IndexedDB is
          allowed in the browser, then reload.
        </p>
      ) : null}
      <main id="main">
        <Routes>
          <Route path="/" element={<CollectionPage />} />
          <Route path="/new" element={<GuitarFormPage />} />
          <Route path="/guitar/:id" element={<GuitarDetailPage />} />
          <Route path="/guitar/:id/edit" element={<GuitarFormPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
