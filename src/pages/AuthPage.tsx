import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth';

type Mode = 'signin' | 'signup';

export function AuthPage() {
  const { signIn, signUp, sendMagicLink } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const trimmedEmail = email.trim();

  async function handlePassword(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!trimmedEmail) {
      setError('Enter your email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(trimmedEmail, password);
      } else {
        const { needsConfirmation } = await signUp(trimmedEmail, password);
        if (needsConfirmation) {
          setNotice('Check your email to confirm the account, then sign in.');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  async function handleMagicLink() {
    setError(null);
    setNotice(null);
    if (!trimmedEmail) {
      setError('Enter your email address to receive a magic link.');
      return;
    }
    setBusy(true);
    try {
      await sendMagicLink(trimmedEmail);
      setNotice('Magic link sent. Open it on this device to sign in.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send a magic link.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Welcome</p>
        <h1>Open the rack</h1>
        <p className="lede">
          Sign in to browse and update your guitar catalogue from any device.
        </p>

        <div className="chip-row auth-modes" role="group" aria-label="Account">
          <button
            type="button"
            className="chip"
            aria-pressed={mode === 'signin'}
            onClick={() => setMode('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={mode === 'signup'}
            onClick={() => setMode('signup')}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handlePassword}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="notice" role="status">
              {notice}
            </p>
          ) : null}
          <div className="form-actions auth-actions">
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              disabled={busy}
              onClick={() => void handleMagicLink()}
            >
              Email me a magic link
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
