export function SetupPage() {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>Supabase is not configured</h1>
        <p className="lede">
          Copy <code>.env.example</code> to <code>.env.local</code> and set{' '}
          <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, then restart the
          dev server. See the README for Vercel and SQL setup.
        </p>
      </div>
    </section>
  );
}
