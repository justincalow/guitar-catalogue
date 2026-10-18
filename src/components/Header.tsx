import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { collectionLabel } from '../format';
import { useGuitars } from '../store';

export function Header() {
  const { user, signOut, configured, ready: authReady } = useAuth();
  const { guitars, ready } = useGuitars();

  return (
    <header className="site-header">
      <Link className="brand" to="/">
        <span className="brand-mark">Fretwork</span>
        <span className="brand-tag">Guitars and amps</span>
      </Link>
      <div className="header-actions">
        {user && ready ? (
          <span className="count-pill">{collectionLabel(guitars)}</span>
        ) : null}
        {user ? (
          <>
            <span className="user-email" title={user.email ?? undefined}>
              {user.email}
            </span>
            <button className="btn btn-ghost" type="button" onClick={() => void signOut()}>
              Sign out
            </button>
            <Link className="btn btn-primary" to="/new">
              Add item
            </Link>
          </>
        ) : configured && authReady ? (
          <span className="count-pill">Sign in to continue</span>
        ) : null}
      </div>
    </header>
  );
}
