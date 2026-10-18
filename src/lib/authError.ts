export function isNetworkFailure(err: unknown): boolean {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  const lower = raw.toLowerCase();
  return (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('load failed') ||
    lower.includes('fetch failed')
  );
}

export function authErrorMessage(err: unknown): string {
  if (isNetworkFailure(err)) {
    return 'Could not reach Supabase (Failed to fetch). Check .env.local — VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY — and restart the dev server.';
  }
  const raw = err instanceof Error ? err.message : 'Could not sign in.';
  const lower = raw.toLowerCase();
  if (lower.includes('email not confirmed')) {
    return 'Check your inbox to confirm this email, then sign in. Confirmation is required until you turn it off in Authentication → Providers → Email.';
  }
  if (lower.includes('rate limit')) {
    return 'Too many emails were sent just now. Wait a minute and try again.';
  }
  if (lower.includes('invalid login')) {
    return 'Email or password is incorrect.';
  }
  if (lower.includes('user already registered')) {
    return 'That email already has an account. Sign in, or use a magic link.';
  }
  return raw;
}
