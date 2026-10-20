import type { SupabaseConfigIssue } from '../lib/supabaseConfig';

export function SetupPage({ issues }: { issues: SupabaseConfigIssue[] }) {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>Supabase is not configured</h1>
        <p className="lede">
          Copy <code>.env.example</code> to <code>.env.local</code>, set the variables below, and
          restart the dev server. See the README for Vercel and SQL setup.
        </p>
        {issues.length > 0 ? (
          <ul className="config-issues">
            {issues.map((issue) => (
              <li key={`${issue.variable}-${issue.problem}`}>{issue.message}</li>
            ))}
          </ul>
        ) : (
          <p>
            <code>VITE_SUPABASE_URL</code> or <code>VITE_SUPABASE_ANON_KEY</code> is missing.
          </p>
        )}
      </div>
    </section>
  );
}
