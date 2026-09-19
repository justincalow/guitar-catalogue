import { Link } from 'react-router-dom';
import { pluralize } from '../format';
import { useGuitars } from '../store';

export function Header() {
  const { guitars, ready } = useGuitars();

  return (
    <header className="site-header">
      <Link className="brand" to="/">
        <span className="brand-mark">Fretwork</span>
        <span className="brand-tag">Personal guitar catalogue</span>
      </Link>
      <div className="header-actions">
        {ready ? (
          <span className="count-pill">{pluralize(guitars.length, 'guitar')}</span>
        ) : null}
        <Link className="btn btn-primary" to="/new">
          Add guitar
        </Link>
      </div>
    </header>
  );
}
