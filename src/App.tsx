import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { Header } from './components/Header';
import { AuthPage } from './pages/AuthPage';
import { CollectionPage } from './pages/CollectionPage';
import { GuitarDetailPage } from './pages/GuitarDetailPage';
import { GuitarFormPage } from './pages/GuitarFormPage';
import { SetupPage } from './pages/SetupPage';
import { useGuitars } from './store';

export default function App() {
  const { configured, ready: authReady, user } = useAuth();
  const { error } = useGuitars();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      {error ? (
        <p className="banner" role="alert">
          The catalogue could not be loaded. Check your connection and that the Supabase SQL
          migration has been applied, then reload.
        </p>
      ) : null}
      <main id="main">
        {!configured ? (
          <SetupPage />
        ) : !authReady ? (
          <p className="lede">Opening the catalogue…</p>
        ) : !user ? (
          <AuthPage />
        ) : (
          <Routes>
            <Route path="/" element={<CollectionPage />} />
            <Route path="/new" element={<GuitarFormPage />} />
            <Route path="/guitar/:id" element={<GuitarDetailPage />} />
            <Route path="/guitar/:id/edit" element={<GuitarFormPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
    </div>
  );
}
