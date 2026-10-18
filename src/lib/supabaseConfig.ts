export const SUPABASE_URL_VAR = 'VITE_SUPABASE_URL';
export const SUPABASE_ANON_KEY_VAR = 'VITE_SUPABASE_ANON_KEY';

export interface SupabaseConfigIssue {
  variable: typeof SUPABASE_URL_VAR | typeof SUPABASE_ANON_KEY_VAR;
  problem: 'missing' | 'malformed';
  message: string;
}

export type ResolvedSupabaseConfig =
  | { ok: true; url: string; anonKey: string }
  | { ok: false; issues: SupabaseConfigIssue[] };

/** Trim whitespace and drop trailing slashes. */
export function normalizeSupabaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}

function decodeJwtPayload(key: string): Record<string, unknown> | null {
  const parts = key.split('.');
  if (parts.length !== 3 || !parts[0].startsWith('eyJ')) return null;
  if (!parts.every((part) => part.length > 0 && /^[A-Za-z0-9_-]+$/.test(part))) return null;
  try {
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='));
    const payload = JSON.parse(json) as unknown;
    if (!payload || typeof payload !== 'object') return null;
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Classic Supabase anon key: a three-part JWT whose header is base64 JSON. */
export function isAnonJwt(key: string): boolean {
  const payload = decodeJwtPayload(key);
  if (!payload) return false;
  return payload.role !== 'service_role';
}

export function isSecretJwt(key: string): boolean {
  return decodeJwtPayload(key)?.role === 'service_role';
}

/** Newer Supabase client key. Secret keys (sb_secret_) are rejected separately. */
export function isPublishableKey(key: string): boolean {
  return /^sb_publishable_[A-Za-z0-9_-]{8,}$/.test(key);
}

export function resolveSupabaseConfig(env: {
  url?: string | null;
  anonKey?: string | null;
}): ResolvedSupabaseConfig {
  const issues: SupabaseConfigIssue[] = [];
  const rawUrl = env.url ?? '';
  const rawKey = env.anonKey ?? '';

  let url = '';
  if (!rawUrl.trim()) {
    issues.push({
      variable: SUPABASE_URL_VAR,
      problem: 'missing',
      message: `${SUPABASE_URL_VAR} is missing. Add it to .env.local and restart the dev server.`,
    });
  } else {
    const normalized = normalizeSupabaseUrl(rawUrl);
    let parsed: URL | null = null;
    try {
      parsed = new URL(normalized);
    } catch {
      parsed = null;
    }
    const path = parsed?.pathname ?? '';
    const hasExtra =
      parsed !== null &&
      (parsed.username !== '' ||
        parsed.password !== '' ||
        parsed.search !== '' ||
        parsed.hash !== '' ||
        (path !== '' && path !== '/'));
    if (!parsed || (parsed.protocol !== 'https:' && parsed.protocol !== 'http:')) {
      issues.push({
        variable: SUPABASE_URL_VAR,
        problem: 'malformed',
        message: `${SUPABASE_URL_VAR} is malformed. Use the project URL from Supabase, such as https://your-project-ref.supabase.co.`,
      });
    } else if (hasExtra) {
      issues.push({
        variable: SUPABASE_URL_VAR,
        problem: 'malformed',
        message: `${SUPABASE_URL_VAR} is malformed. Use only the origin (https://your-project-ref.supabase.co) with no path or query.`,
      });
    } else {
      url = parsed.origin;
    }
  }

  const anonKey = rawKey.trim();
  if (!anonKey) {
    issues.push({
      variable: SUPABASE_ANON_KEY_VAR,
      problem: 'missing',
      message: `${SUPABASE_ANON_KEY_VAR} is missing. Add the anon JWT or publishable key to .env.local and restart the dev server.`,
    });
  } else if (anonKey.startsWith('sb_secret_') || isSecretJwt(anonKey)) {
    issues.push({
      variable: SUPABASE_ANON_KEY_VAR,
      problem: 'malformed',
      message: `${SUPABASE_ANON_KEY_VAR} is malformed. That value is a secret key. Use the anon JWT (eyJ…) or a publishable key that starts with sb_publishable_.`,
    });
  } else if (!isAnonJwt(anonKey) && !isPublishableKey(anonKey)) {
    issues.push({
      variable: SUPABASE_ANON_KEY_VAR,
      problem: 'malformed',
      message: `${SUPABASE_ANON_KEY_VAR} is malformed. Use the anon JWT (eyJ…) or a publishable key that starts with sb_publishable_.`,
    });
  }

  if (issues.length > 0 || !url || !anonKey) {
    return { ok: false, issues };
  }
  return { ok: true, url, anonKey };
}
